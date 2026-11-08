"""Run the isolated combined-candidate browser review; no production saves.
Stage scripts/ascended-review outside dist. Fixtures use the pinned released native
save contract; this is not an unassisted campaign or physical-device certification.
"""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('LINKED_BASE_URL','http://127.0.0.1:8765').rstrip('/')
out=Path(os.environ.get('ASCENDED_QA_DIR','qa/ascended'));out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce',has_touch=True)
    context.route('https://**/*',lambda r:r.abort())
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/ascended-review/index.html')
    page.get_by_role('button',name='Run portal integration checks').click()
    page.wait_for_function('document.querySelector("#results").textContent.includes("movement")',timeout=60000)
    # Real input supplements harness events, including browsers that clear
    # synthetic held keys when focus moves between the review and scene frame.
    page.frame_locator('#world').locator('#scene').click()
    page.keyboard.down('w')
    try:
        page.wait_for_function('document.querySelector("#results").textContent.includes("Physical movement")',timeout=20000)
    finally:
        page.keyboard.up('w')
    page.wait_for_function('JSON.parse(document.querySelector("#results").textContent).status',timeout=120000)
    report=json.loads(page.locator('#results').inner_text());report['page_errors']=errors
    page.screenshot(path=str(out/'combined-review.png'),full_page=True)
    (out/'receipt.json').write_text(json.dumps(report,indent=2))
    browser.close()
    assert report['status']=='PASS' and not errors,report
