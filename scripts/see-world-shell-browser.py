"""Real navigation and fresh-run test; no story milestone fixtures."""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import os,json,traceback
root=os.environ.get('LINKED_BASE_URL','http://127.0.0.1:8765').rstrip('/')
out=Path(os.environ.get('LINKED_QA_DIR','qa/see-world-linked'));out.mkdir(parents=True,exist_ok=True)
report={'status':'RUNNING','steps':[],'page_errors':[],'fixture_scope':'No seeded story progression. CLOCK IN and navigation use actual UI.'}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1280,'height':900})
    context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(root) else r.abort())
    page=context.new_page();page.on('pageerror',lambda e:report['page_errors'].append(str(e)))
    try:
        page.goto(root+'/theemrld-portfolio/#/see-world')
        frame=page.frame_locator('iframe[title^="See World —"]')
        expect(frame.locator('main')).to_contain_text('FOLLOW THE STORY.')
        frame.locator('a.native-link').first.click()
        page.wait_for_url(root+'/techops-hero/',timeout=30000)
        page.wait_for_function('window.__productionBootstrapReady && window.TechOpsUniverse && window.TechOpsProductionTitleExperience?.state().ready',timeout=60000)
        report['steps'].append('Portfolio-hosted link leaves the iframe and opens TechOps Hero at top level')
        page.locator('#btn-start').click()
        for text in ['Standard','Clock in']:
            page.locator('#dlg-options button').filter(has_text=text).first.click()
        page.wait_for_function("window.S && !S.inDialog && TechOpsUniverseCore.readSource(localStorage).status==='ready'",timeout=30000)
        page.locator('#btn-universe').click()
        page.locator('#dlg-options button').filter(has_text='Open See World').click()
        page.wait_for_url(root+'/theemrld-portfolio/#/see-world',timeout=30000)
        frame=page.frame_locator('iframe[title^="See World —"]')
        expect(frame.locator('main')).to_contain_text('FOLLOW THE STORY.')
        assert page.locator('iframe[title^="See World —"]').count()==1
        report['steps'].append('Native successful save returns to the real React See World route with one shell')
        page.screenshot(path=str(out/'linked-portfolio-shell.png'),full_page=True)
        frame.locator('a.native-link').first.click()
        page.wait_for_url(root+'/techops-hero/',timeout=30000)
        assert page.locator('iframe[title^="See World —"]').count()==0
        report['steps'].append('Second cross-game trip does not nest another portfolio or leave a second game host')
        assert not report['page_errors'],report['page_errors']
        report['status']='PASS'
    except Exception as e:
        report.update(status='FAIL',error=str(e),traceback=traceback.format_exc())
        try:page.screenshot(path=str(out/'shell-navigation-failure.png'),full_page=True)
        except Exception:pass
    finally:
        (out/'shell-navigation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));browser.close()
if report['status']!='PASS':raise SystemExit(1)
