from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json, os
out=Path(os.environ.get('SEE_WORLD_QA_DIR', 'qa/see-world')); out.mkdir(parents=True, exist_ok=True)
base=os.environ.get('SEE_WORLD_BASE_URL', 'http://127.0.0.1:8765/see-world/index.html')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1050},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base)
    page.locator('.hero h1').wait_for()
    page.screenshot(path=str(out/'see-world-desktop.png'),full_page=True)
    page.get_by_role('button',name='Begin campaign →').first.click()
    page.get_by_role('heading',name='The empty mic',exact=True).wait_for()
    for choice in ['check-record','delegate','intercept','send-help','corridor','rescue-lift','sidestep','open-cells','recover-ledger','record-director','leave-recording','verify-count']:
        page.locator(f'[data-choice="{choice}"]').click()
    page.get_by_role('heading',name='What survives?',exact=True).wait_for()
    page.screenshot(path=str(out/'see-world-iona-decision.png'),full_page=True)
    page.locator('[data-choice="burn"]').click()
    assert page.get_by_role('dialog').is_visible()
    page.get_by_role('button',name='Keep playing',exact=True).click()
    assert page.get_by_role('heading',name='What survives?',exact=True).is_visible()
    page.locator('[data-choice="burn"]').click()
    page.get_by_role('button',name='Confirm',exact=True).click()
    page.locator('[data-choice="burn-family"]').click()
    page.get_by_role('heading',name='The count survives the fire',exact=True).wait_for()
    state=page.evaluate("localStorage.getItem('see-world:campaigns:v1')")
    page.reload()
    page.get_by_role('heading',name='The count survives the fire',exact=True).wait_for()
    assert state==page.evaluate("localStorage.getItem('see-world:campaigns:v1')")
    page.get_by_role('button',name='Open collection',exact=True).click()
    assert page.get_by_role('heading',name='The human count',exact=True).is_visible()
    # Other character campaigns: take a legal route to each ending through the actual UI.
    outcomes={}
    for cid in ['felicia','k','waldo']:
        page.goto(base+'#'+cid)
        page.reload()
        page.locator('#scene-title').wait_for()
        for step in range(40):
            options=page.locator('button[data-choice]:enabled')
            if not options.count():break
            options.first.click()
            if page.get_by_role('dialog').is_visible():page.get_by_role('button',name='Confirm',exact=True).click()
        outcomes[cid]=page.locator('#scene-title').inner_text()
        assert page.get_by_role('button',name='Open collection',exact=True).is_visible()
    page.get_by_role('button',name='Open collection',exact=True).click()
    assert page.get_by_role('heading',name='Four witnesses',exact=True).is_visible()
    # Mobile keyboard/touch-size/overflow, including long Iona decisions.
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    mobile.on('pageerror',lambda e:errors.append(str(e)))
    mobile.goto(base)
    mobile.locator('.hero h1').wait_for()
    mobile.screenshot(path=str(out/'see-world-mobile.png'),full_page=True)
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
    mobile.get_by_role('button',name='Begin campaign →').first.click()
    mobile.screenshot(path=str(out/'see-world-iona-mobile.png'),full_page=True)
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
    for box in mobile.locator('button[data-choice]').all():assert box.bounding_box()['height']>=44
    # Protected damaged save: no silent replacement when selecting a campaign.
    mobile.evaluate("localStorage.setItem('see-world:campaigns:v1','{bad')")
    mobile.reload()
    expect(mobile.locator('#storage-status')).to_contain_text('NOT been overwritten')
    mobile.locator('button[data-choice]').first.click()
    assert mobile.evaluate("localStorage.getItem('see-world:campaigns:v1')")=='{bad'
    # Invalid import must not mutate existing state.
    page.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"schema":999}'})
    expect(page.locator('#storage-status')).to_contain_text('Import refused')
    # Same-origin embedded world bridge fixture, not a renderer qualification.
    page.route('**/k-world/index.html?*',lambda route:route.fulfill(content_type='text/html',body='<!doctype html><title>World fixture</title><script>window.events=[];addEventListener("message",e=>events.push(e.data));</script>'))
    page.get_by_role('button',name='Explore 3D',exact=True).click()
    frame=page.frame_locator('#world-stage iframe')
    page.locator('#world-stage iframe').wait_for()
    page.wait_for_timeout(200)
    fid=page.locator('#world-stage iframe').get_attribute('src')
    page.get_by_role('button',name='Return to story',exact=True).click()
    page.get_by_role('button',name='Explore 3D',exact=True).click()
    assert page.locator('#world-stage iframe').count()==1
    assert page.locator('#world-stage iframe').get_attribute('src')==fid
    assert not errors,errors
    report={'browser':'Chromium','desktop':[1440,1050],'mobile':[390,844],'passed':['desktop campaign hub','Iona full burn route','irreversible decision cancel/confirm','reload retains ending','collection reward','Felicia UI playthrough','K UI playthrough','Waldo UI playthrough','all-four bonus dossier','mobile hub/scene no horizontal overflow','choices >=44px','corrupt save preserved','invalid import rejected','single persistent optional world iframe with fixture'],'ending_titles':outcomes,'page_errors':errors,'limitations':['Existing WebGL renderer and SoundCloud playback not exercised; bridge used a fixture.','Static narrative smoke only; full React/Vite build is a separate workflow.']}
    (out/'see-world-browser-results.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
    browser.close()
