"""Public-surface tests against a built portfolio plus the released native game.
No owner storage. Later-story prerequisites are explicitly constructed through the
native API. This is presentation/interaction coverage, not a full campaign run.
"""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json, os, traceback
BASE=os.environ.get('PRESENTATION_BASE','http://127.0.0.1:8765').rstrip('/')
ENGINE=os.environ.get('PRESENTATION_ENGINE','chromium')
OUT=Path(os.environ.get('PRESENTATION_OUTPUT','qa/presentation'));OUT.mkdir(parents=True,exist_ok=True)
SITE=BASE+'/'
STORY=SITE+'see-world/index.html'
report={'engine':ENGINE,'passed':[],'failures':[],'page_errors':[],'scope':'Built UI, declared native prerequisites, real UI interactions. No story or save-authority changes.'}
contexts=[]
def passed(name): report['passed'].append(name);print('PASS',name,flush=True)
def no_overflow(p): assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(p.viewport_size,p.evaluate('document.documentElement.scrollWidth'))
def ctx(browser,**kw):
    c=browser.new_context(**kw);contexts.append(c)
    c.route('https://**/*',lambda r:r.abort())
    return c

def page(c,label):
    p=c.new_page();p.on('pageerror',lambda e:report['page_errors'].append({'page':label,'error':str(e)}));return p

def test(name,fn):
    try:fn();passed(name)
    except Exception as e:report['failures'].append({'name':name,'error':str(e),'traceback':traceback.format_exc()});print('FAIL',name,str(e),flush=True)

with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch(headless=True)
    report['browser_version']=browser.version
    c=ctx(browser,viewport={'width':1440,'height':1000})
    hub=page(c,'media-hub')
    def media():
        hub.goto(SITE+'#/links');hub.locator('.media-hub').wait_for()
        expect(hub.locator('h1')).to_contain_text('Stories.')
        expected=['#/comic','https://ninja-ops-guy.github.io/techops-hero/','#/see-world','#/k/gallery','#/terminal','https://soundcloud.com/raikouno/tracks','https://www.instagram.com/mikesninja/','https://www.instagram.com/kind.dread/','https://www.instagram.com/defied_stars/']
        for href in expected:expect(hub.locator('.media-hub a[href="'+href+'"]')).to_have_count(1)
        text=hub.locator('.media-hub').inner_text()
        for obsolete in ['profile unverified','matching TechOps Hero build','Playable story draft']:assert obsolete not in text
        assert hub.evaluate('Object.keys(localStorage).length')==0
        for width in [320,390,768,1280,1440]:
            hub.set_viewport_size({'width':width,'height':1000});no_overflow(hub)
            for element in hub.locator('a,button').all():
                if element.is_visible():assert element.bounding_box()['height']>=44
        hub.screenshot(path=str(OUT/'media-desktop.png'),full_page=True)
        hub.set_viewport_size({'width':390,'height':844});hub.screenshot(path=str(OUT/'media-mobile.png'),full_page=True)
    test('media hub: nine exact destinations, public copy, no save writes, five responsive widths and 44px targets',media)
    def copy():
        hub.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw new Error("denied")}}})')
        hub.get_by_role('button',name='Copy this hub’s link',exact=True).click()
        expect(hub.get_by_label('Media hub address',exact=True)).to_have_value(SITE+'#/links')
        assert hub.evaluate('document.activeElement.tagName')=='INPUT'
        hub.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{window.__copied=text}}})')
        hub.get_by_role('button',name='Copy this hub’s link',exact=True).click()
        expect(hub.get_by_role('button',name='Link copied',exact=True)).to_be_visible()
        assert hub.evaluate('window.__copied')==SITE+'#/links'
    test('copy-link success and permission-denied selectable fallback',copy)
    def host():
        hub.locator('a[href="#/see-world"]').click()
        frame=hub.frame_locator('iframe[title="See World — interactive stories"]')
        expect(frame.locator('.hero h1')).to_contain_text('Every choice.')
        expect(frame.get_by_role('button',name='Locked in this playthrough',exact=True)).to_have_count(4)
    test('actual React media-to-story route and accessible frame title',host)
    view=page(c,'story-reader')
    def welcome():
        for actor in ['iona','felicia','k','waldo']:
            view.goto(STORY+'#'+actor);view.locator('.journey-strip').wait_for()
            expect(view.get_by_role('button',name='Locked in this playthrough',exact=True)).to_have_count(4)
            text=view.locator('#content').inner_text()
            for secret in ['The Name I Keep','The World He Left Running','No One Left Behind','A Signal Is Not a Confession']:assert secret not in text
        for width in [320,390,768,1280,1440]:
            view.set_viewport_size({'width':width,'height':1000});no_overflow(view)
        view.screenshot(path=str(OUT/'welcome-desktop.png'),full_page=True)
        view.set_viewport_size({'width':390,'height':844});view.screenshot(path=str(OUT/'welcome-mobile.png'),full_page=True)
    test('fresh onboarding and direct links remain spoiler-safe at five widths',welcome)
    def guide():
        opener=view.get_by_role('button',name='How to play',exact=True);opener.click()
        expect(view.get_by_role('dialog',name='Three steps. One story.',exact=True)).to_be_visible()
        expect(view.get_by_text('Do not start a new game or clear browser data',exact=False)).to_be_visible()
        for _ in range(10):
            view.keyboard.press('Tab');assert view.evaluate('!!document.activeElement.closest("#player-help")')
        view.screenshot(path=str(OUT/'guide-mobile.png'),full_page=True)
        view.keyboard.press('Escape');expect(view.locator('#player-help')).not_to_be_visible()
        expect(opener).to_be_focused()
        view.locator('.save-tools summary').click();expect(view.get_by_role('button',name='Export progress',exact=True)).to_be_disabled()
    test('keyboard-trapped guide, Escape focus return, explicit save safety and disabled exports before linking',guide)
    def storage_denied():
        d=ctx(browser,viewport={'width':390,'height':844})
        d.add_init_script('Object.defineProperty(window,"localStorage",{configurable:true,get(){throw new DOMException("denied","SecurityError")}})')
        p=page(d,'storage-denied');p.goto(STORY);p.locator('.journey-strip').wait_for()
        expect(p.locator('#storage-status')).to_contain_text('storage is unavailable')
        expect(p.get_by_role('button',name='Try storage again',exact=True)).to_be_visible()
        p.get_by_role('button',name='How to play',exact=True).click();expect(p.locator('#player-help')).to_be_visible();no_overflow(p)
    test('blocked storage retains recovery, public access and working help',storage_denied)
    def failure():
        d=ctx(browser);d.route('**/see-world/linked-app.mjs',lambda r:r.abort())
        p=page(d,'load-failure');p.goto(STORY)
        expect(p.get_by_role('heading',name='The story reader could not open.',exact=True)).to_be_visible()
        expect(p.get_by_role('button',name='Try again',exact=True)).to_be_visible()
        assert p.evaluate('Object.keys(localStorage).length')==0
        p.screenshot(path=str(OUT/'reader-load-recovery.png'),full_page=True)
    test('blocked reader module shows safe retry and navigation without touching saves',failure)
    def enhancement_failure():
        d=ctx(browser);d.route('**/see-world/presentation.mjs',lambda r:r.abort())
        p=page(d,'enhancement-failure');p.goto(STORY)
        expect(p.get_by_role('button',name='Locked in this playthrough',exact=True)).to_have_count(4)
        assert p.locator('h1').inner_text()!='The story reader could not open.'
    test('cosmetic-module failure leaves the original working reader available',enhancement_failure)
    def connected_reader():
        d=ctx(browser,viewport={'width':1440,'height':1000});n=page(d,'native-fixture')
        n.goto(BASE+'/techops-hero/',wait_until='domcontentloaded')
        n.wait_for_function('window.TechOpsLinked&&window.__productionTitleReadiness?.ready',timeout=30000)
        n.locator('#btn-start').click();n.locator('#dlg-options button').filter(has_text='Standard').first.click()
        n.wait_for_function('window.S&&localStorage.getItem("techops_save")',timeout=10000)
        n.evaluate('''async()=>{closeDlg();S.paused=true;const C=TechOpsCampaign,T=TechOpsStory,s=C.load(localStorage);for(const a of T.ACTS){T.completeAct(s,a.id);if(a.id==='act_3')break;}C.save(s,localStorage);save();await TechOpsLinked.publish();}''')
        n.wait_for_function('(()=>{try{return TechOpsLinked.context().milestones.violinist}catch{return false}})()')
        p=page(d,'connected-reader');p.add_init_script('window.__uiWrites=[];const setter=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.__uiWrites.push(k);return setter.call(this,k,v)}')
        p.goto(STORY+'#felicia');p.locator('.story').wait_for();expect(p.locator('#reader-tools')).to_be_visible()
        p.get_by_role('button',name='Larger text',exact=True).click()
        expect(p.get_by_role('button',name='Larger text',exact=True)).to_have_attribute('aria-pressed','true')
        assert p.locator('.story-text p').first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=23
        p.get_by_role('button',name='Focus reading',exact=True).click();expect(p.locator('.sidebar')).to_be_hidden()
        p.reload();expect(p.get_by_role('button',name='Larger text',exact=True)).to_have_attribute('aria-pressed','true');expect(p.locator('.sidebar')).to_be_hidden()
        p.get_by_role('button',name='Focus reading',exact=True).click();expect(p.locator('.sidebar')).to_be_visible()
        assert all(k=='see-world:reader-ui:v1' for k in p.evaluate('window.__uiWrites'))
        p.screenshot(path=str(OUT/'reader-desktop.png'),full_page=True)
        p.locator('[data-choice="capture-baseline"]').click();expect(p.locator('#scene-title')).to_have_text('The missing interval')
        p.locator('.journal summary').click();p.locator('.journal').evaluate('e=>e.dataset.retained="yes"')
        p.set_viewport_size({'width':390,'height':600});p.evaluate('scrollTo(0,450)')
        n.evaluate('async()=>{save();await TechOpsLinked.publish()}');p.wait_for_timeout(1000)
        assert p.evaluate('scrollY')>300;assert p.locator('.journal').get_attribute('open') is not None
        assert p.locator('.journal').get_attribute('data-retained')=='yes'
        for width in [320,390,768]:
            p.set_viewport_size({'width':width,'height':844});no_overflow(p)
            for b in p.locator('button[data-choice]').all():assert b.bounding_box()['height']>=44
        p.set_viewport_size({'width':390,'height':844});p.evaluate('scrollTo(0,0)');p.screenshot(path=str(OUT/'reader-mobile.png'),full_page=True)
        p.emulate_media(reduced_motion='reduce')
        assert p.locator('.choice').first.evaluate('e=>getComputedStyle(e).transitionDuration')=='0s'
    test('connected reader: isolated persistent preferences, real choice, large-type mobile, unchanged-scroll journal and reduced motion',connected_reader)
    report['status']='PASS' if not report['failures'] and not report['page_errors'] else 'FAIL'
    (OUT/'presentation-receipt.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2),flush=True)
    for c in contexts:c.close()
    browser.close()
    assert report['status']=='PASS',report
