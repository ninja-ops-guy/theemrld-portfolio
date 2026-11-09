"""Synthetic origin migration in isolated contexts. No public-site requests or real saves."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
import json, mimetypes
ROOT=Path('dist').resolve()
OUT=Path('domain-proof');OUT.mkdir(exist_ok=True)
KEY='techops-hero:revision-f:waldo-continuity:page'
OLD='https://ninja-ops-guy.github.io'
NEW='https://kterminal.site'
report={'passed':[],'errors':[],'scope':'Synthetic data; candidate files intercepted at production origin names. Not live deployment or real saved-state recovery.'}

def route_request(route):
    u=urlsplit(route.request.url)
    if u.netloc=='ninja-ops-guy.github.io' and u.path.startswith('/techops-hero/recover-settings/'):
        name=u.path.removeprefix('/techops-hero/recover-settings/') or 'index.html'
        path=ROOT/'recover'/('legacy-export.html' if name=='index.html' else name)
    elif u.netloc=='kterminal.site':
        path=ROOT/(u.path.lstrip('/') or 'index.html')
        if path.is_dir():path=path/'index.html'
    else:route.abort();return
    if ROOT not in path.resolve().parents or not path.is_file():route.fulfill(status=404,body='Not found');return
    content_type='text/javascript' if path.suffix in ('.js','.mjs') else mimetypes.guess_type(path)[0] or 'application/octet-stream'
    route.fulfill(path=str(path),content_type=content_type)

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
    context.route('**/*',route_request)
    p=context.new_page();p.on('pageerror',lambda e:report['errors'].append(str(e)))
    p.goto(OLD+'/techops-hero/recover-settings/')
    fixture={KEY:'92','k-world:background:v1':'true','techops_save':'synthetic-native-save','see-world:progress':'synthetic-story-save','other-site-secret':'must-not-transfer'}
    p.evaluate('(data)=>{for(const [k,v] of Object.entries(data))localStorage.setItem(k,v)}',fixture)
    with p.expect_download() as d:p.get_by_role('button',name='Export old settings').click()
    export=OUT/'settings.json';d.value.save_as(export)
    payload=json.loads(export.read_text());assert payload['entries']=={KEY:'92','k-world:background:v1':'true'}
    assert p.evaluate('Object.fromEntries(Object.entries(localStorage))')==fixture
    report['passed'].append('Original-origin export only contains allowed settings; source data unchanged')
    p.goto(NEW+'/recover/')
    p.evaluate('(key)=>localStorage.setItem(key,"10")',KEY)
    p.locator('#import-file').set_input_files(export)
    expect(p.get_by_text('Revision F bookmark — already exists; select to replace')).to_be_visible()
    assert not p.locator(f'input[value="{KEY}"]').is_checked()
    p.get_by_role('button',name='Import selected settings').click()
    expect(p.locator('#recovery-status')).to_contain_text('Imported 1 settings')
    assert p.evaluate('(key)=>localStorage.getItem(key)',KEY)=='10'
    assert p.evaluate('localStorage.getItem("k-world:background:v1")')=='true'
    assert p.evaluate('localStorage.getItem("techops_save")') is None
    report['passed'].append('Default import keeps newer conflicting bookmark and excludes game data')
    p.get_by_role('button',name='Undo last import').click()
    assert p.evaluate('localStorage.getItem("k-world:background:v1")') is None
    p.locator('#import-file').set_input_files([]);p.locator('#import-file').set_input_files(export)
    p.locator(f'input[value="{KEY}"]').check()
    p.get_by_role('button',name='Import selected settings').click()
    assert p.evaluate('(key)=>localStorage.getItem(key)',KEY)=='92'
    p.get_by_role('button',name='Undo last import').click()
    assert p.evaluate('(key)=>localStorage.getItem(key)',KEY)=='10'
    report['passed'].append('Explicit conflict replacement and undo restore original bookmark bytes')
    invalid=OUT/'invalid.json';invalid.write_text(json.dumps({**payload,'entries':{'techops_save':'unrelated run'}}))
    before=p.evaluate('Object.fromEntries(Object.entries(localStorage))')
    p.locator('#import-file').set_input_files(invalid)
    expect(p.locator('#recovery-status')).to_contain_text('Unsupported or invalid setting')
    assert p.evaluate('Object.fromEntries(Object.entries(localStorage))')==before
    report['passed'].append('Foreign save keys fail before writes')
    p.screenshot(path=str(OUT/'recovery-mobile.png'),full_page=True)
    for path in ['/about/','/music/','/comic/','/portfolio/','/privacy/','/404.html']:
        p.goto(NEW+path);expect(p.get_by_role('heading',level=1)).to_be_visible()
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not p.locator('script[src*="googlesyndication"]').count()
    report['passed'].append('Static information and recovery pages fit a 390px viewport')
    p.goto(NEW+'/')
    expect(p).to_have_url(NEW+'/#/terminal')
    expect(p).to_have_title('K Terminal — Music, Comics & Worlds')
    assert p.locator('meta[property="og:url"]').get_attribute('content')==NEW+'/'
    assert not p.locator('script[src*="googlesyndication"]').count()
    report['passed'].append('Custom-domain root opens terminal with creative metadata and no ad loader')
    p.goto(NEW+'/#/comic')
    expect(p.get_by_role('button',name='Guided · not configured')).to_be_disabled()
    p.get_by_role('button',name='Comment',exact=True).click()
    expect(p.get_by_role('link',name='Open @defied_stars ↗')).to_be_visible()
    report['passed'].append('Empty guided mode is explicit and Instagram feedback alternative is visible')
    assert not report['errors'],report['errors']
    p.screenshot(path=str(OUT/'feedback-mobile.png'),full_page=True)
    browser.close()
report['status']='PASS';(OUT/'receipt.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
