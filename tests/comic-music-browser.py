"""Exercise the comic reader and player bridge with a controlled SoundCloud Widget.

Run against an already running local build or Vite instance:
    python tests/comic-music-browser.py --base-url http://localhost:3000

Requires Python Playwright and Chromium. Use --executable-path for a local
Chromium binary. The iPhone viewport uses Chromium touch emulation.
"""

import argparse
import base64
from urllib.parse import urljoin

from playwright.sync_api import TimeoutError, expect, sync_playwright


PIXEL = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/"
    "x8AAwMCAO9zHk0AAAAASUVORK5CYII="
)
PLAYER_FRAME = 'iframe.k-session-frame'
SOUNDCLOUD_FRAME = 'iframe[title^="SoundCloud player"]'
WIDGET_FIXTURE = """
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.data?.type === 'k-world:state') {
    window.__readerMusic = event.data;
  }
});

if (window !== window.top && location.pathname.endsWith('/k-world/index.html')) {
  window.__soundCloudLoads = [];
  let url = '';
  let paused = true;
  let currentPosition = 0;
  const handlers = new Map();
  const emit = (name, detail) => handlers.get(name)?.forEach(fn => fn(detail));
  const play = () => {
    if (window.__blockSoundCloud) return;
    paused = false;
    emit('PLAY');
  };
  const widget = {
    bind(name, callback) {
      if (!handlers.has(name)) handlers.set(name, []);
      handlers.get(name).push(callback);
      if (name === 'READY') setTimeout(() => emit(name), 0);
    },
    unbind(name) { handlers.delete(name); },
    getSounds(callback) { callback([]); },
    load(track, options) {
      url = track;
      currentPosition = 0;
      paused = true;
      window.__soundCloudLoads.push({ url, autoplay: options.auto_play });
      options.callback();
      if (options.auto_play) setTimeout(play, 0);
    },
    play,
    pause() { paused = true; emit('PAUSE'); },
    getDuration(callback) { callback(120000); },
    getPosition(callback) { callback(currentPosition); },
    getCurrentSound(callback) { callback({ permalink_url: url, duration: 120000 }); },
    isPaused(callback) { callback(paused); },
    setVolume() {},
  };
  window.__setSoundCloudProgress = position => {
    currentPosition = position;
    emit('PLAY_PROGRESS', { currentPosition });
  };
  window.SC = {
    Widget: Object.assign(() => widget, {
      Events: Object.fromEntries(
        ['READY', 'PLAY', 'PLAY_PROGRESS', 'PAUSE', 'ERROR', 'FINISH'].map(name => [name, name]),
      ),
    }),
  };
}
"""


def open_reader(context, base_url, number, block_playback=False):
    page = context.new_page()
    page.add_init_script(
        f"window.__blockSoundCloud = {str(block_playback).lower()};\n{WIDGET_FIXTURE}"
    )
    # Give the reader a valid page image without depending on external artwork.
    page.route(
        "https://raw.githubusercontent.com/**",
        lambda route: route.fulfill(status=200, content_type="image/png", body=PIXEL),
    )
    page.route("https://w.soundcloud.com/player/**", lambda route: route.fulfill(body=""))
    page.goto(urljoin(base_url, f"#/comic?edition=g&page={number}"), wait_until="domcontentloaded")
    expect(page.get_by_role("combobox", name="Jump to page")).to_have_value(str(number))
    return page, page.get_by_role("region", name="Comic soundtrack")


def expect_music(page, title, guided=True, status="playing", position=None):
    try:
        page.wait_for_function(
            """({ title, guided, status, position }) => {
              const state = window.__readerMusic;
              return state && state.guided === guided
                && (state.audio.current?.title ?? null) === (title ?? null)
                && state.audio.status === status
                && (position == null || state.audio.position === position);
            }""",
            arg=dict(title=title, guided=guided, status=status, position=position),
            timeout=10000,
        )
    except TimeoutError as error:
        state = page.evaluate("window.__readerMusic")
        raise AssertionError(
            f"Expected {title!r}, Guided={guided}, {status}, {position}: {state}"
        ) from error


def next_page(page, number, touch):
    button = page.get_by_role("button", name="Next page")
    if touch:
        button.tap()
    else:
        button.click()
    expect(page.get_by_role("combobox", name="Jump to page")).to_have_value(str(number))


def jump_to(page, number):
    page.get_by_role("combobox", name="Jump to page").select_option(str(number))


def widget_progress(page, position):
    page.locator(PLAYER_FRAME).evaluate(
        "(frame, position) => frame.contentWindow.__setSoundCloudProgress(position)", position
    )


def check_escape_and_quiet(context, base_url, touch):
    page, music = open_reader(context, base_url, 52)
    try:
        music.get_by_role("button", name="Guided off", exact=True).click()
        expect_music(page, None, status="idle")
        for number, title in (
            (53, "Function 2"),
            (54, "Time Crumbles"),
            (55, "Time Crumbles"),
            (56, "RIDE OR DIE"),
            (57, "Somewhere Deep Down Below"),
        ):
            next_page(page, number, touch)
            expect_music(page, title, position=750 if number == 55 else None)
            if number == 54:
                widget_progress(page, 750)
                expect_music(page, title, position=750)
        loads = page.locator(PLAYER_FRAME).evaluate(
            "frame => frame.contentWindow.__soundCloudLoads"
        )
        assert [item["url"].rsplit("/", 1)[-1] for item in loads] == [
            "function-2",
            "time-crumbles-wav",
            "ride-or-die",
            "somewhere-deep-down-below",
        ], loads
        assert all(item["autoplay"] for item in loads), loads

        for number in range(58, 62):
            next_page(page, number, touch)
        expect(music.locator("summary")).to_contain_text("30-second minimum")
        widget_progress(page, 29999)
        expect_music(page, "Somewhere Deep Down Below", position=29999)
        widget_progress(page, 30000)
        expect_music(page, "Technical Decimal")

        jump_to(page, 135)
        expect_music(page, "The Tape Ran Out")
        next_page(page, 136, touch)
        expect_music(page, None, status="idle")
        music.locator("summary").click()
        expect(music.get_by_role("region", name="Optional tracks for this scene")).to_have_count(0)
        next_page(page, 137, touch)
        expect_music(page, "The Mercy I Buried")
    finally:
        page.close()


def check_manual_and_guided(context, base_url, touch):
    page, music = open_reader(context, base_url, 49)
    try:
        music.get_by_role("button", name="Guided off", exact=True).click()
        expect_music(page, "Down there again")
        music.locator("summary").click()
        music.get_by_role("button", name="Play Hot sauce", exact=True).click()
        expect_music(page, "Hot sauce", guided=False)
        for number in range(50, 55):
            next_page(page, number, touch)
        expect_music(page, "Hot sauce", guided=False)
        expect(music.get_by_role("button", name="Play Hot sauce")).to_have_count(0)
        music.get_by_role("button", name="Guided off", exact=True).click()
        expect_music(page, "Time Crumbles")

        jump_to(page, 121)
        music.get_by_role("button", name="Play Maybe", exact=True).click()
        expect_music(page, "Maybe", guided=False)
        jump_to(page, 136)
        expect_music(page, "Maybe", guided=False)
        music.get_by_role("button", name="Guided off", exact=True).click()
        expect_music(page, None, status="idle")
    finally:
        page.close()


def check_blocked_autoplay(context, base_url):
    page, music = open_reader(context, base_url, 49, block_playback=True)
    try:
        music.locator("summary").click()
        music.get_by_role("button", name="Play Hot sauce", exact=True).click()
        expect_music(page, "Hot sauce", guided=False, status="paused")
        assert not page.evaluate("window.__readerMusic.audio.pausedByUser")
        recovery = music.get_by_role("button", name="Play in SoundCloud", exact=True)
        recovery.wait_for(state="visible", timeout=5000)
        recovery.click()
        player = page.frame_locator(PLAYER_FRAME)
        expect(player.get_by_role("button", name="Close SoundCloud player")).to_be_visible()
        expect(player.locator(SOUNDCLOUD_FRAME)).to_have_count(1)
    finally:
        page.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://localhost:3000/")
    parser.add_argument("--executable-path")
    args = parser.parse_args()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=args.executable_path)
        iphone = dict(playwright.devices["iPhone 13"])
        iphone.pop("default_browser_type")
        for name, options in (("desktop", {}), ("iPhone 13 touch emulation", iphone)):
            context = browser.new_context(**options)
            try:
                touch = options.get("has_touch", False)
                check_escape_and_quiet(context, args.base_url, touch)
                check_manual_and_guided(context, args.base_url, touch)
                check_blocked_autoplay(context, args.base_url)
                print(f"PASS: {name} reader and controlled SoundCloud widget")
            finally:
                context.close()
        browser.close()


if __name__ == "__main__":
    main()
