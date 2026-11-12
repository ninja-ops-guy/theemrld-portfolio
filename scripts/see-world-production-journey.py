"""Disposable same-origin production journey.

Native prerequisites through Act 4 are canonical fixtures. Start/Continue, story
choices, Night Walker launch, keyboard traversal, objectives, completion receipts,
and reload persistence use the real packaged UI and saves. This is not a complete
main-campaign playthrough, combat qualification, or physical-device certification.
"""
from pathlib import Path
from urllib.parse import urlsplit
import json
import os
import traceback
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('LINKED_BASE_URL', 'https://kterminal.site').rstrip('/')
OUT = Path(os.environ.get('LINKED_QA_DIR', 'qa/production-linked'))
OUT.mkdir(parents=True, exist_ok=True)
NATIVE = BASE + '/techops-hero/'
SEE = BASE + '/see-world/'
REPORT = {
    'status': 'RUNNING',
    'base': BASE,
    'passed': [],
    'errors': [],
    'page_errors': [],
    'scope': 'Disposable browser; canonical Act 4 prerequisite fixtures, real linked UI/save/launch/objective/completion/reload loop.',
    'notQualified': ['Uninterrupted main-campaign playthrough', 'Combat', 'Physical iPhone/Android devices'],
}


def passed(name):
    REPORT['passed'].append(name)
    print('PASS', name, flush=True)


def snapshot(page):
    handle = page.wait_for_function(
        '(()=>{try{return TechOpsLinked.context()}catch{return null}})()', timeout=15000
    )
    return handle.json_value()


def start(page):
    page.wait_for_function(
        'window.TechOpsLinked && window.__productionTitleReadiness?.ready===true', timeout=45000
    )
    fresh = page.evaluate('''Object.keys(localStorage).filter(key=>
      ['techops_save','techops_hero_campaign_v1'].includes(key) ||
      key.startsWith('techops:linked:') || key.startsWith('see-world')
    )''')
    assert fresh == [], f'Fresh origin unexpectedly inherited story progress: {fresh}'
    passed('Fresh custom-origin storage starts without imported native or story progress')
    page.locator('#btn-start').click()
    page.locator('#dlg-options button').filter(has_text='Standard').first.click()
    page.wait_for_function('window.S && localStorage.getItem("techops_save")', timeout=15000)
    page.evaluate('''async()=>{
      closeDlg();
      const c=TechOpsCampaign.load(localStorage);
      TechOpsCampaign.save(c,localStorage);
      if(!save())throw Error(__techopsSaveError);
      await new Promise(r=>setTimeout(r,60));
      await TechOpsLinked.publish();
    }''')
    page.wait_for_function(
        'window.TechOpsLinked && (()=>{try{return !!TechOpsLinked.context()}catch{return false}})()',
        timeout=15000,
    )


def advance(page, target):
    result = page.evaluate('''async target=>{
      const C=TechOpsCampaign,T=TechOpsStory,s=C.load(localStorage);
      for(const a of T.ACTS){
        if(!s.story?.completedActs?.includes(a.id)){
          if(a.id==='act_4')s.story.facts.trust_investigation_reported=true;
          T.completeAct(s,a.id);
        }
        if(a.id===target)break;
      }
      if(!C.save(s,localStorage))throw Error('Native campaign save failed');
      await new Promise(r=>setTimeout(r,60));
      await TechOpsLinked.publish();
      return TechOpsLinked.context();
    }''', target)
    assert result['milestones']
    return result


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    origin = urlsplit(BASE).netloc
    REPORT['failed_requests'] = []
    REPORT['blocked_external_requests'] = []

    def same_origin(route):
        request = route.request
        if urlsplit(request.url).netloc == origin:
            route.continue_()
        else:
            REPORT['blocked_external_requests'].append(request.url)
            route.abort()

    context.route('**/*', same_origin)
    native = context.new_page()
    see = context.new_page()
    for label, page in [('native', native), ('see', see)]:
        page.on('pageerror', lambda error, label=label: REPORT['page_errors'].append({'page': label, 'error': str(error)}))
        page.on('requestfailed', lambda request, label=label: REPORT['failed_requests'].append({
            'page': label, 'url': request.url, 'error': request.failure,
        }) if urlsplit(request.url).netloc == origin else None)
        page.on('response', lambda response, label=label: REPORT['failed_requests'].append({
            'page': label, 'url': response.url, 'status': response.status,
        }) if response.status >= 400 else None)

    try:
        response = native.goto(NATIVE, wait_until='domcontentloaded')
        assert response and response.status == 200, 'Same-origin TechOps Hero route is not available'
        start(native)
        run_id = snapshot(native)['runId']
        assert snapshot(native)['milestones']['violinist'] is False
        passed('Start creates a real same-origin main-story save and playthrough identity')

        advance(native, 'act_3')
        see.goto(SEE, wait_until='domcontentloaded')
        see.locator('.hero').wait_for()
        see.get_by_role('button', name='Continue this perspective', exact=True).click()
        for choice in ['capture-baseline', 'independent-clock', 'wait-sweep', 'bench-test']:
            see.locator('[data-choice="' + choice + '"]').click()
        expect(see.locator('[data-choice="external-stop"]')).to_be_disabled()
        passed('Earned perspective unlocks and early choices persist while the later native gate stays closed')

        advance(native, 'act_4')
        expect(see.locator('[data-choice="external-stop"]')).to_be_enabled()
        see.locator('[data-choice="external-stop"]').click()
        see.locator('[data-choice="share-packet"]').click()
        expect(see.get_by_role('heading', name='EARNED IN NIGHT WALKER', exact=True)).to_be_visible()
        before = native.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)')
        passed('Real story choices earn the Night Walker return section')

        native.evaluate('()=>{closeDlg();S.inDialog=false;S.inBattle=false;S.paused=false;enterNight();}')
        native.locator('#see-world-linked-button').click()
        native.get_by_role('button', name='Enter: Signal / Independent Check', exact=True).click()
        native.wait_for_function('TechOpsLinked.mission()?.id==="signal-check"')
        native.evaluate('NM.enemies=[];NM.hp=10000;S.inDialog=false;S.paused=false')
        assert snapshot(native)['runId'] == run_id
        answers = ['Record the quiet baseline', 'Preserve the disagreement', 'Let another operator enforce the stop']
        for index, answer in enumerate(answers):
            target = [420, 820, 1220][index]
            native.keyboard.down('ArrowRight')
            try:
                native.wait_for_function('(target)=>NM.x+NM.w/2>=target-60', arg=target, timeout=15000)
            finally:
                native.keyboard.up('ArrowRight')
            expect(native.get_by_role('button', name='Inspect objective', exact=True)).to_be_enabled(timeout=5000)
            native.get_by_role('button', name='Inspect objective', exact=True).click()
            native.get_by_role('button', name=answer, exact=True).click()
        expect(native.get_by_role('heading', name='SECTION COMPLETE', exact=True)).to_be_visible()
        after = native.evaluate('JSON.stringify(TechOpsCampaign.load(localStorage).story)')
        assert before == after, 'The side operation changed main-story completion'
        native.screenshot(path=str(OUT / 'night-walker-complete.png'), full_page=True)
        passed('Night Walker launches and all three keyboard objectives complete without stamping main-story acts')

        see.reload()
        expect(see.get_by_text('Completed in Night Walker.', exact=True)).to_be_visible()
        see.screenshot(path=str(OUT / 'see-world-return-complete.png'), full_page=True)
        passed('See World receives the completion receipt and preserves it across reload')

        native.get_by_role('button', name='Return to Night Walker', exact=True).click()
        native.reload(wait_until='domcontentloaded')
        native.wait_for_function(
            'window.TechOpsLinked && window.__productionTitleReadiness?.ready===true', timeout=45000
        )
        native.locator('#btn-continue').click()
        native.wait_for_function(
            '(()=>{try{return !!TechOpsLinked.context()}catch{return false}})()', timeout=15000
        )
        assert snapshot(native)['runId'] == run_id
        native.locator('#see-world-linked-button').click()
        expect(native.get_by_role('button', name='Completed: Signal / Independent Check', exact=True)).to_be_visible()
        storage = native.evaluate('''()=>({
          profile:!!localStorage.getItem('techops_save'),
          campaign:!!localStorage.getItem('techops_hero_campaign_v1'),
          linked:Object.keys(localStorage).filter(k=>k.startsWith('techops:linked:')).length
        })''')
        assert storage['profile'] and storage['campaign'] and storage['linked'] > 0, storage
        REPORT['storage'] = storage
        passed('Continue preserves run identity, native saves, and Night Walker completion after a full reload')

        with native.expect_popup() as popup_info:
            native.get_by_role('link', name='Continue in See World ↗', exact=True).click()
        nested = popup_info.value
        nested.on('pageerror', lambda error: REPORT['page_errors'].append({'page': 'nested', 'error': str(error)}))
        nested.wait_for_function('document.querySelector(".hero") !== null')
        assert nested.url.startswith(BASE + '/techops-hero/see-world/'), nested.url
        expect(nested.get_by_text('Completed in Night Walker.', exact=True)).to_be_visible()
        nested.screenshot(path=str(OUT / 'nested-reader-complete.png'), full_page=True)
        passed('The native journal opens the packaged nested reader with the same completion receipt')

        assert all(urlsplit(url).hostname != 'ninja-ops-guy.github.io' for url in REPORT['blocked_external_requests'])
        assert not REPORT['failed_requests'], REPORT['failed_requests']
        assert not REPORT['page_errors'], REPORT['page_errors']
        REPORT['status'] = 'PASS'
    except Exception as error:
        REPORT['status'] = 'FAIL'
        REPORT['errors'].append(str(error))
        REPORT['traceback'] = traceback.format_exc()
        for label, page in [('native', native), ('see', see)]:
            try:
                page.screenshot(path=str(OUT / ('failure-' + label + '.png')), full_page=True)
                REPORT[label + '_url'] = page.url
                REPORT[label + '_body'] = page.locator('body').inner_text()[-12000:]
                if label == 'native':
                    REPORT['native_diagnostics'] = page.evaluate('''()=>({
                      linked:window.TechOpsLinked?.health(),
                      saveCore:!!window.TechOpsLinkedSaveCore,
                      coreError:window.__seeWorldLinkedCoreError,
                      loadError:window.__seeWorldLinkedLoadError,
                      titleReadiness:window.__productionTitleReadiness,
                      campaign:!!window.TechOpsCampaign,
                      newState:typeof window.newState,
                      state:!!window.S,
                      saveError:window.__techopsSaveError,
                      identity:window.S?.meta?.seeWorldLink,
                      source:localStorage.getItem('techops:linked:native:v1')
                    })''')
            except Exception:
                pass
        raise
    finally:
        (OUT / 'production-journey-receipt.json').write_text(json.dumps(REPORT, indent=2))
        print(json.dumps(REPORT, indent=2), flush=True)
        browser.close()
