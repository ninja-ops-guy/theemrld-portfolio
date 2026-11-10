"""Read-only live smoke. Disposable browser; no native run created or imported."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
import hashlib,json,time,os,mimetypes
BASE='https://kterminal.site'
GAME='https://ninja-ops-guy.github.io/techops-hero/'
LEGACY='https://ninja-ops-guy.github.io/theemrld-portfolio/'
CANDIDATE=Path(os.environ['SMOKE_CANDIDATE_DIST']).resolve() if os.environ.get('SMOKE_CANDIDATE_DIST') else None
OUT=Path('public-proof');OUT.mkdir(exist_ok=True)
report={'status':'RUNNING','files':[],'passed':[],'page_errors':[],'candidate':bool(CANDIDATE),'scope':'Navigation and current reader UI only. Split-origin linked saves remain unresolved. Disposable browser; no game run created/imported.'}
try:
    for filename in ['index.html','player.mjs','presentation.mjs','presentation.css','presentation-base.css','linked-app.mjs','linked.mjs','engine.mjs','campaigns.mjs']:
        expected=(Path('public/see-world')/filename).read_bytes()
        url=BASE+'/see-world/'+filename
        for attempt in range(12):
            if CANDIDATE:actual=(CANDIDATE/'see-world'/filename).read_bytes()
            else:
                with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=30) as response:actual=response.read()
            if actual==expected:break
            time.sleep(5)
        assert actual==expected,filename+' does not match this deployment'
        report['files'].append({'path':filename,'sha256':hashlib.sha256(actual).hexdigest(),'matched':True})
    provenance=json.loads(Path('scripts/see-world-native-provenance.json').read_text())
    report['native_provenance']={'reference_commit':provenance['native_commit'],'files':[],'scope':provenance['note']}
    for filename,digest in provenance['files'].items():
        with urlopen(Request(GAME+'see-world/'+filename,headers={'Cache-Control':'no-cache'}),timeout=30) as response:content=response.read()
        actual=hashlib.sha256(content).hexdigest()
        assert actual==digest,'Native reader changed: '+filename
        report['native_provenance']['files'].append({'path':filename,'sha256':actual,'matched':True})
    with sync_playwright() as pw:
        b=pw.chromium.launch(headless=True);c=b.new_context(viewport={'width':390,'height':844})
        def safe(route):
            request=route.request
            parsed=urlsplit(request.url)
            if parsed.scheme!='https' or parsed.netloc not in ['ninja-ops-guy.github.io','kterminal.site'] or request.method not in ['GET','HEAD']:
                route.abort();return
            if CANDIDATE and parsed.netloc=='kterminal.site':
                target=(CANDIDATE/parsed.path.lstrip('/')).resolve()
                if target.is_dir():target=target/'index.html'
                assert target.is_relative_to(CANDIDATE),'Candidate path escape'
                if not target.is_file():route.fulfill(status=404,body='Candidate file not found');return
                kind=mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
                if target.suffix=='.mjs':kind='text/javascript'
                route.fulfill(status=200,body=target.read_bytes(),content_type=kind);return
            route.continue_()
        c.route('**/*',safe)
        def page(label):
            q=c.new_page();q.on('pageerror',lambda e:report['page_errors'].append(label+': '+str(e)));return q
        p=page('hub')
        p.goto(BASE+'/#/links');p.locator('.media-hub').wait_for()
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
        expect(p.locator('a[href="'+GAME+'"]')).to_have_count(1)
        game=page('game');game.goto(p.locator('a[href="'+GAME+'"]').get_attribute('href'))
        game.wait_for_function('window.__productionTitleReadiness?.ready===true',timeout=120000)
        expect(game.locator('#btn-start')).to_be_enabled()
        assert game.url==GAME
        # Aggregate classification only in this disposable context: no storage names or values exported.
        report['native_title_storage_categories']=game.evaluate("""() => {
            const groups = {
                settings: ['techops_settings'],
                audio_preference: ['techops_hero_day_audio_v1'],
                character_choice: ['techops_char'],
                primary_progress: ['techops_save','techops_day_checkpoint_v1','techops_nightcrawler_session_v1','techops_good_dogs_session_v1'],
                campaign_progress: ['techops_hero_campaign_v1']
            };
            const keys = Object.keys(localStorage);
            const known = new Set(Object.values(groups).flat());
            const linked = k => k.startsWith('techops:linked:');
            return {
                ...Object.fromEntries(Object.entries(groups).map(([category, names]) => [category, names.some(k => keys.includes(k))])),
                linked_progress_present: keys.some(linked),
                unknown_count: keys.filter(k => !known.has(k) && !linked(k)).length,
                startup_setter_name_present: keys.includes('setItem'),
                startup_getter_name_present: keys.includes('getItem'),
                storage_setter_remains_callable: typeof localStorage.setItem === 'function',
                storage_getter_remains_callable: typeof localStorage.getItem === 'function',
                total_count: keys.length
            };
        }""")
        assert game.evaluate("Object.keys(localStorage).every(k=>k==='techops_settings')"),'Native title wrote a non-preference key'
        game.close()
        report['passed'].append('Actual game link reaches ready original-origin game; only documented techops_settings startup preference allowed')
        shortcut=page('shortcut');shortcut.goto(BASE+'/techops-hero/?routing-check=1#routing-check')
        shortcut.wait_for_url(GAME+'?routing-check=1#routing-check')
        shortcut.wait_for_function('window.__productionTitleReadiness?.ready===true',timeout=120000)
        assert shortcut.evaluate("Object.keys(localStorage).every(k=>k==='techops_settings')"),'Native shortcut wrote a non-preference key'
        shortcut.close()
        legacy=page('legacy');legacy.goto(LEGACY+'#/links');legacy.locator('.media-hub').wait_for()
        assert legacy.url==BASE+'/#/links'
        assert legacy.evaluate('Object.keys(localStorage).length')==0
        legacy.close()
        report['passed'].append('Legacy hub redirect and custom game bookmark preserve intended navigation')
        p.screenshot(path=str(OUT/'live-media-mobile.png'),full_page=True)
        report['passed'].append('Public media hub and main-game route at 390px')
        p.locator('a[href="#/see-world"]').click();f=p.frame_locator('iframe[title="See World — interactive stories"]')
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
        b.close()
    report['status']='PASS'
except Exception as error:
    report['status']='FAIL';report['error']=str(error);raise
finally:
    (OUT/'live-presentation-receipt.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))

