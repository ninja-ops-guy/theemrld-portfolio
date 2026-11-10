"""Verify narrow-screen labels and current-book soundtrack choices."""
import json
import os
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE=os.environ.get('COMIC_BASE_URL','http://127.0.0.1:4173/').rstrip('/')+'/'
OUT=Path(os.environ.get('COMIC_QA_DIR','qa/comic-final'))
OUT.mkdir(parents=True,exist_ok=True)
receipt={'sourceCommit':os.environ.get('GITHUB_SHA'),'baseUrl':BASE,'checks':[],'physicalDeviceTest':False}
try:
    with sync_playwright() as driver:
        browser=driver.chromium.launch()
        for width in [320,390,768,1440]:
            context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce',is_mobile=width<500,has_touch=width<500)
            page=context.new_page()
            page.goto(BASE+'#/comic?edition=g',wait_until='domcontentloaded')
            expect(page.locator('.comic-current-card')).to_have_count(3)
            page.wait_for_function("() => [...document.querySelectorAll('.comic-current-card img')].every(i=>i.complete&&i.naturalWidth>0)",timeout=60000)
            geometry=page.evaluate("""() => ({
              viewport:innerWidth, document:document.documentElement.scrollWidth,
              letters:[...document.querySelectorAll('.comic-title-line b')].map(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})),
              summary:document.querySelector('.comic-actions>span').getBoundingClientRect().toJSON()
            })""")
            assert geometry['document']<=geometry['viewport']+1,geometry
            assert all(b['left']>=-1 and b['right']<=geometry['viewport']+1 for b in geometry['letters']),geometry
            assert geometry['summary']['right']<=geometry['viewport']+1,geometry
            page.screenshot(path=str(OUT/f'polish-{width}-library.png'),full_page=False)
            if width in (390,1440):
                page.locator('.comic-current-books').screenshot(path=str(OUT/f'polish-{width}-books.png'))
            receipt['checks'].append(f'{width}px: headline, reading action and page-count text fit without horizontal overflow')
            page.get_by_role('button',name='Define songs',exact=True).click()
            select=page.get_by_label('Soundtrack book',exact=True)
            expect(select).to_be_visible(timeout=30000)
            expect(select).to_have_value('g')
            assert select.locator('option').all_text_contents()==['Full collection · 316 pages','Volume XIII · 49 pages','Volume XIV · 133 pages']
            select.select_option('xiii-r')
            expect(page.get_by_label('FROM PAGE',exact=True)).to_have_attribute('max','49')
            select.select_option('xiv')
            expect(page.get_by_label('FROM PAGE',exact=True)).to_have_attribute('max','133')
            page.get_by_role('button',name='Close soundtrack editor',exact=True).click()
            receipt['checks'].append(f'{width}px: soundtrack offers only Full collection, XIII and XIV with correct page bounds')
            context.close()
        browser.close()
    receipt['result']='PASS'
except Exception as failure:
    receipt.update(result='FAIL',error=str(failure),traceback=traceback.format_exc())
finally:
    (OUT/'polish-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps(receipt,indent=2),flush=True)
if receipt['result']!='PASS': raise SystemExit(1)
