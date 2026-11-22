"""Bounded real SoundCloud telemetry probe; never substitutes for audible/device QA.

The provider API and audio are not mocked. Only comic artwork is stubbed so a
media-host outage cannot hide the provider result. No provider credentials are used.
"""
import argparse
import hashlib
import json
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ART = b'<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="3240"><rect width="2160" height="3240" fill="#556"/></svg>'
OBSERVE = """window.addEventListener('message', event => {
  const frame = document.querySelector('iframe.k-session-frame');
  if (event.origin === location.origin && event.source === frame?.contentWindow
      && event.data?.type === 'k-world:state') {
    window.__providerProbeState = event.data;
  }
});"""
SAMPLE = """async () => {
  const frame = document.querySelector('iframe.k-session-frame');
  const world = frame?.contentWindow;
  const iframe = world?.document.querySelector('iframe[title^="SoundCloud player"]');
  if (!world?.SC?.Widget || !iframe) throw Error('Real provider widget is unavailable');
  const widget = world.SC.Widget(iframe);
  const read = method => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error(method + ' timed out')), 5000);
    widget[method](value => { clearTimeout(timer); resolve(value); });
  });
  const [sound, position, paused] = await Promise.all([
    read('getCurrentSound'), read('getPosition'), read('isPaused')
  ]);
  const state = window.__providerProbeState;
  return { soundId: sound?.id, providerTitle: sound?.title,
    providerUrl: sound?.permalink_url, position, paused,
    appTitle: state?.audio?.current?.title, appStatus: state?.audio?.status,
    generation: state?.audio?.trackGeneration,
    appPosition: state?.audio?.position,
    nativeFullscreen: Boolean(document.fullscreenElement),
    sharedFrameCount: document.querySelectorAll('iframe.k-session-frame').length,
    providerFrameCount: world.document.querySelectorAll('iframe[title^="SoundCloud player"]').length
  };
}"""


def app_state(page):
    return page.evaluate("window.__providerProbeState || null")


def await_playing(page, timeout=30000):
    page.wait_for_function("""() => {
      const s = window.__providerProbeState;
      return s?.audio?.current?.title === 'Time Crumbles'
        && s.audio.status === 'playing' && s.audio.position > 1000;
    }""", timeout=timeout)


def ensure_started(page):
    # Use the product's normal direct-tap recovery when browser autoplay is denied.
    page.wait_for_function("""() => ['playing', 'paused', 'error'].includes(
      window.__providerProbeState?.audio?.status)""", timeout=35000)
    state = app_state(page)
    if state['audio']['status'] == 'paused':
        page.get_by_role('button', name='Play in SoundCloud', exact=True).click()
        world = page.frame_locator('iframe.k-session-frame')
        provider = world.frame_locator('iframe[title^="SoundCloud player"]')
        play = provider.get_by_role('button', name=re.compile(r'^play(?:$|\s)', re.I))
        play.first.click(timeout=15000)
        await_playing(page)
        world.get_by_role('button', name='Close SoundCloud player', exact=True).click()
    else:
        await_playing(page)


def continuity(previous, current):
    assert current['soundId'] == previous['soundId'], (previous, current)
    assert current['generation'] == previous['generation'], (previous, current)
    assert current['position'] >= previous['position'] - 150, (previous, current)
    assert current['sharedFrameCount'] == current['providerFrameCount'] == 1, current
    assert current['appTitle'] == 'Time Crumbles', current
    assert current['providerNavigations'] == previous['providerNavigations'], (previous, current)


def exercise(browser, options, name, native, base_url, output):
    context = browser.new_context(**options)
    context.add_init_script(OBSERVE)
    if not native:
        context.add_init_script("Object.defineProperty(Element.prototype, 'requestFullscreen', {value:undefined, configurable:true})")
    page = context.new_page()
    page.set_default_timeout(15000)
    record = {'case': name, 'mode': 'native' if native else 'viewport fallback', 'samples': [], 'providerRequests': []}
    def request(request):
        parsed = urlsplit(request.url)
        if parsed.hostname and (parsed.hostname.endswith('soundcloud.com') or parsed.hostname.endswith('sndcdn.com')):
            record['providerRequests'].append({'host': parsed.hostname, 'path': parsed.path, 'type': request.resource_type})
    page.on('request', request)
    page.route('**/techops-comic-volumes/**', lambda route: route.fulfill(content_type='image/svg+xml', body=ART))
    page.route('https://raw.githubusercontent.com/**/pages/**', lambda route: route.fulfill(content_type='image/svg+xml', body=ART))
    def sample(label):
        value = page.evaluate(SAMPLE)
        value['providerNavigations'] = sum(request['type'] == 'document'
            and request['host'] == 'w.soundcloud.com'
            and request['path'].startswith('/player/')
            for request in record['providerRequests'])
        record['samples'].append({'step': label, **value})
        return value
    try:
        page.goto(urljoin(base_url, '#/comic?edition=g&page=54'), wait_until='domcontentloaded')
        expect(page.get_by_label('Jump to page')).to_have_value('54')
        page.get_by_role('button', name='Guided off', exact=True).click()
        ensure_started(page)
        before = sample('before fullscreen')
        assert before['soundId'] and not before['paused'], before
        page.evaluate("window.__probeOriginalFrame = document.querySelector('iframe.k-session-frame')")
        page.get_by_role('button', name='Full screen', exact=True).click()
        expect(page.get_by_role('dialog', name='Full-screen comic reader')).to_be_visible()
        page.wait_for_function('(native) => Boolean(document.fullscreenElement) === native', arg=native)
        inside = sample('entered fullscreen')
        continuity(before, inside)
        page.get_by_role('button', name='Next page', exact=True).click()
        expect(page.get_by_label('Jump to page')).to_have_value('55')
        immediate = sample('immediately after page 55')
        continuity(inside, immediate)
        page.wait_for_function('(position) => window.__providerProbeState?.audio?.position > position + 1000', arg=inside['position'], timeout=15000)
        turned = sample('same cue page 55')
        continuity(inside, turned)
        assert not turned['paused'], turned
        assert page.evaluate("window.__probeOriginalFrame === document.querySelector('iframe.k-session-frame')")
        controls = page.get_by_role('group', name='Fullscreen soundtrack')
        controls.get_by_role('button', name='Pause soundtrack', exact=True).click()
        page.wait_for_function("window.__providerProbeState?.audio?.status === 'paused'")
        pause_deadline = time.monotonic() + 5
        while not page.evaluate(SAMPLE)['paused'] and time.monotonic() < pause_deadline:
            page.wait_for_timeout(100)
        paused = sample('paused')
        continuity(turned, paused)
        assert paused['paused'], paused
        page.wait_for_timeout(1000)
        held = sample('pause held')
        assert abs(held['position'] - paused['position']) < 250, (paused, held)
        controls.get_by_role('button', name='Resume soundtrack', exact=True).click()
        page.wait_for_function('(position) => window.__providerProbeState?.audio?.status === "playing" && window.__providerProbeState.audio.position > position + 750', arg=held['position'], timeout=15000)
        resumed = sample('resumed')
        continuity(held, resumed)
        page.get_by_role('button', name='Exit full screen', exact=True).click()
        expect(page.get_by_role('dialog', name='Full-screen comic reader')).to_have_count(0)
        page.wait_for_function('!document.fullscreenElement')
        page.wait_for_function('(position) => window.__providerProbeState?.audio?.position > position + 750', arg=resumed['position'], timeout=15000)
        after = sample('after fullscreen')
        continuity(resumed, after)
        assert not after['paused'], after
        assert page.evaluate("window.__probeOriginalFrame === document.querySelector('iframe.k-session-frame')")
        record['status'] = 'passed'
    except Exception as error:
        record['status'] = 'failed'
        record['error'] = str(error)
        record['appState'] = app_state(page)
        try:
            record['providerAtFailure'] = page.evaluate(SAMPLE)
        except Exception as sampling_error:
            record['providerSamplingError'] = str(sampling_error)
        page.screenshot(path=str(output / f'{name}-failure.png'), full_page=True)
    finally:
        context.close()
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:4173/')
    parser.add_argument('--output', default='qa/comic-provider-probe')
    args = parser.parse_args()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    receipt = {'observedAt': datetime.now(timezone.utc).isoformat(),
        'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
        'tree': subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], text=True).strip(),
        'scope': 'Real provider telemetry in hosted Chromium; no audible or physical-device claim',
        'providerMocked': False, 'artworkStubbed': True, 'cases': [],
        'sourceSha256': {path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in [
            'tests/comic-provider-probe.py', 'src/pages/LatestComicReader.tsx',
            'src/components/ComicMusicBar.tsx', 'src/sections/AsciiCityWorld.tsx',
            'public/k-world/audio.js', 'public/k-world/guided-cues.json']}}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        receipt['browserVersion'] = browser.version
        iphone = dict(playwright.devices['iPhone 13'])
        iphone.pop('default_browser_type')
        for name, options, native in [('desktop-native', {'viewport': {'width': 1366, 'height': 900}}, True),
                                      ('touch-fallback', iphone, False)]:
            receipt['cases'].append(exercise(browser, options, name, native, args.base_url, output))
            (output / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
        browser.close()
    for case in receipt['cases']:
        print(f"{case['status'].upper()}: {case['case']} actual SoundCloud telemetry")
        if case.get('error'):
            print(case['error'])
    raise SystemExit(0 if all(case['status'] == 'passed' for case in receipt['cases']) else 1)


if __name__ == '__main__':
    main()
