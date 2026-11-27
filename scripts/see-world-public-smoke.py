"""Read-only live smoke. Disposable browser; no native run created or imported."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
import hashlib,json,time
BASE='https://kterminal.site'
GAME='https://ninja-ops-guy.github.io/techops-hero/'
OUT=Path('public-proof');OUT.mkdir(exist_ok=True)
report={'status':'RUNNING','files':[],'passed':[],'page_errors':[],'scope':'Read-only public media and fresh story UI. No owner/browser/player saves.'}
try:
    for filename in ['index.html','player.mjs','presentation.mjs','presentation.css','presentation-base.css','linked-app.mjs','linked.mjs','engine.mjs','campaigns.mjs','fonts/share-tech-mono.ttf']:
        expected=(Path('public/see-world')/filename).read_bytes()
        url=BASE+'/see-world/'+filename
        for attempt in range(12):
            with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=30) as response:actual=response.read()
            if actual==expected:break
            time.sleep(5)
        assert actual==expected,filename+' does not match this deployment'
        report['files'].append({'path':filename,'sha256':hashlib.sha256(actual).hexdigest(),'matched':True})
    with urlopen(Request(BASE+'/techops-hero/',headers={'Cache-Control':'no-cache'}),timeout=30) as response:
        native=response.read()
        assert response.status==200 and b'id="btn-start"' in native,'Same-origin TechOps Hero is unavailable'
    report['passed'].append('Same-origin TechOps Hero route returns the playable title')
    with sync_playwright() as pw:
        b=pw.chromium.launch(headless=True);c=b.new_context(viewport={'width':390,'height':844})
        def safe(route):
            request=route.request
            parsed=urlsplit(request.url)
            if parsed.scheme=='https' and parsed.netloc in ['kterminal.site','ninja-ops-guy.github.io'] and request.method in ['GET','HEAD']:route.continue_()
            else:route.abort()
        c.route('**/*',safe)
        p=c.new_page();p.on('pageerror',lambda e:report['page_errors'].append(str(e)))
        p.goto(BASE+'/#/links');p.locator('.media-hub').wait_for()
        assert p.url==BASE+'/#/links'
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
        expect(p.locator('a[href="/techops-hero/"]')).to_have_count(1)
        original=p.get_by_role('link',name='Continue your original game save',exact=True)
        expect(original).to_have_attribute('href',GAME)
        original_url=original.get_attribute('href')
        p.screenshot(path=str(OUT/'live-media-mobile.png'),full_page=True)
        report['passed'].append('Public media hub and main-game route at 390px')
        p.locator('a[href="#/see-world"]').click();f=p.frame_locator('iframe[title="See World — interactive stories"]')
        expect(p).to_have_url(BASE+'/#/see-world')
        expect(f.locator('.journey-strip')).to_be_visible()
        expect(f.get_by_role('button',name='Locked in this playthrough',exact=True)).to_have_count(4)
        report['passed'].append('Built React route reaches updated spoiler-safe story onboarding')
        f.get_by_role('button',name='How to play',exact=True).click();expect(f.locator('#player-help')).to_be_visible()
        f.get_by_role('button',name='Close guide',exact=True).click();expect(f.locator('#player-help')).not_to_be_visible()
        report['passed'].append('Live help opens and closes')
        p.screenshot(path=str(OUT/'live-story-mobile.png'),full_page=True)
        assert p.evaluate('Object.keys(localStorage).length')==0
        assert f.locator('html').evaluate('()=>Object.keys(localStorage).length')==0
        assert not report['page_errors'],report['page_errors']
        report['passed'].append('No progress writes or captured JavaScript page errors')
        # Keep original-origin title startup isolated from the fresh reader checks.
        original_context=b.new_context(viewport={'width':390,'height':844})
        original_context.route('**/*',safe)
        game=original_context.new_page()
        game.on('pageerror',lambda e:report['page_errors'].append('original game: '+str(e)))
        game.goto(original_url)
        game.wait_for_function('window.__productionTitleReadiness?.ready===true',timeout=120000)
        expect(game.locator('#btn-start')).to_be_enabled()
        assert game.url==GAME
        # PR #79's documented native startup baseline; every save/unknown key fails.
        assert game.evaluate("Object.keys(localStorage).every(k=>['techops_settings','setItem','getItem'].includes(k)) && typeof localStorage.setItem==='function' && typeof localStorage.getItem==='function'"),'Original title has unexpected storage or non-callable storage API'
        assert not report['page_errors'],report['page_errors']
        original_context.close()
        report['passed'].append('Original-game save link reaches ready github.io title without starting or importing a run')
        b.close()
    report['status']='PASS'
except Exception as error:
    report['status']='FAIL';report['error']=str(error);raise
finally:
    (OUT/'live-presentation-receipt.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
