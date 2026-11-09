"""Read-only live smoke. Disposable browser; no native run created or imported."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
import hashlib,json,time
BASE='https://kterminal.site'
GAME='https://ninja-ops-guy.github.io/techops-hero/'
OUT=Path('public-proof');OUT.mkdir(exist_ok=True)
report={'status':'RUNNING','files':[],'passed':[],'page_errors':[],'scope':'Read-only public media, fresh story UI and game readiness. No owner/browser/player saves.'}
try:
    for filename in ['index.html','player.mjs','presentation.mjs','presentation.css','presentation-base.css','linked-app.mjs','linked.mjs','engine.mjs','campaigns.mjs','origin-routes.mjs','linked.css','styles.css']:
        expected=(Path('public/see-world')/filename).read_bytes()
        url=BASE+'/see-world/'+filename
        for attempt in range(12):
            with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=30) as response:actual=response.read()
            if actual==expected:break
            time.sleep(5)
        assert actual==expected,filename+' does not match this deployment'
        with urlopen(Request(GAME+'see-world/'+filename,headers={'Cache-Control':'no-cache'}),timeout=30) as response:native_copy=response.read()
        assert native_copy==expected,filename+' native reader copy does not match paired deployment'
        report['files'].append({'path':filename,'sha256':hashlib.sha256(actual).hexdigest(),'matched':True,'native_matched':True})
    with sync_playwright() as pw:
        b=pw.chromium.launch(headless=True);c=b.new_context(viewport={'width':390,'height':844})
        def safe(route):
            request=route.request
            if urlsplit(request.url).netloc in ['ninja-ops-guy.github.io','kterminal.site'] and request.method in ['GET','HEAD']:route.continue_()
            else:route.abort()
        c.route('**/*',safe)
        def page(label):
            p=c.new_page();p.on('pageerror',lambda e:report['page_errors'].append(label+': '+str(e)));return p
        p=page('hub');p.goto(BASE+'/#/links');p.locator('.media-hub').wait_for()
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
        expect(p.locator('a[href="'+GAME+'"]')).to_have_count(1)
        game=page('game');game.goto(p.locator('a[href="'+GAME+'"]').get_attribute('href'))
        expect(game.locator('#btn-start')).to_be_enabled(timeout=120000)
        assert urlsplit(game.url).netloc=='ninja-ops-guy.github.io'
        assert game.evaluate('Object.keys(localStorage).length')==0
        game.close()
        report['passed'].append('Actual main-game destination loads and becomes ready without creating a save')
        p.screenshot(path=str(OUT/'live-media-mobile.png'),full_page=True)
        report['passed'].append('Public media hub and main-game route at 390px')
        p.locator('a[href="#/see-world"]').click();f=p.frame_locator('iframe[title="See World — interactive stories"]')
        expect(f.get_by_role('link',name='Open connected See World',exact=True)).to_be_visible()
        f.get_by_role('link',name='Open connected See World',exact=True).click()
        p.wait_for_url(GAME+'see-world/index.html')
        expect(p.locator('.journey-strip')).to_be_visible()
        expect(p.get_by_role('button',name='Locked in this playthrough',exact=True)).to_have_count(4)
        report['passed'].append('React route reaches top-level same-origin reader and spoiler-safe onboarding')
        p.get_by_role('button',name='How to play',exact=True).click();expect(p.locator('#player-help')).to_be_visible()
        p.get_by_role('button',name='Close guide',exact=True).click();expect(p.locator('#player-help')).not_to_be_visible()
        report['passed'].append('Live help opens and closes')
        p.screenshot(path=str(OUT/'live-story-mobile.png'),full_page=True)
        assert p.evaluate('Object.keys(localStorage).length')==0
        legacy=page('legacy');legacy.goto('https://ninja-ops-guy.github.io/theemrld-portfolio/see-world/index.html')
        expect(legacy.get_by_role('link',name='Open connected See World',exact=True)).to_be_visible()
        assert urlsplit(legacy.url).netloc=='kterminal.site'
        shortcut=page('shortcut');shortcut.goto(BASE+'/techops-hero/');shortcut.wait_for_url(GAME)
        report['passed'].append('Legacy story bookmark preserves origin choice; custom game shortcut reaches game origin')
        assert not report['page_errors'],report['page_errors']
        report['passed'].append('No progress writes or captured JavaScript page errors')
        b.close()
    report['status']='PASS'
except Exception as error:
    report['status']='FAIL';report['error']=str(error);raise
finally:
    (OUT/'live-presentation-receipt.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
