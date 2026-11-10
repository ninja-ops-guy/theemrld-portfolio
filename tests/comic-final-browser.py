"""Current-only comic library acceptance. Chromium emulation, not physical-device certification."""
import json
import os
import re
import time
import traceback
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('COMIC_BASE_URL', 'http://127.0.0.1:4173/').rstrip('/') + '/'
OUT = Path(os.environ.get('COMIC_QA_DIR', 'qa/comic-final'))
OUT.mkdir(parents=True, exist_ok=True)
MANIFEST = json.loads((ROOT / 'src/data/comic-current-editions.json').read_text())
LABELS = json.loads((ROOT / 'src/data/comic-display-labels.json').read_text())
CHECKS = []
receipt = {'baseUrl': BASE, 'sourceCommit': os.environ.get('GITHUB_SHA'), 'checks': CHECKS, 'physicalDeviceTest': False}

def checked(name):
    CHECKS.append(name)
    print('PASS:', name, flush=True)

def reader_url(edition='g', page=None, extra=''):
    return BASE + '#/comic?edition=' + edition + (f'&page={page}' if page else '') + extra

def page_image(page):
    image = page.locator('.comic-page-image')
    expect(image).to_be_visible(timeout=60000)
    page.wait_for_function("() => {const i=document.querySelector('.comic-page-image'); return i && i.complete && i.naturalWidth>0;}", timeout=60000)
    return image

def swipe(page):
    page.evaluate("""() => {
      const target=document.querySelector('.comic-stage');
      const touch=new Touch({identifier:1,target,clientX:320,clientY:350});
      target.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[touch],changedTouches:[touch]}));
      const end=new Touch({identifier:1,target,clientX:80,clientY:350});
      target.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[end]}));
    }""")

try:
    with urlopen(BASE + 'techops-comic/publication.json?verify=' + str(time.time_ns()), timeout=30) as response:
        publication = json.load(response)
    assert publication['earlierEditionsPublic'] is False
    assert [b['pageCount'] for b in publication['books']] == [316,49,133]
    assert publication['books'][0]['label'] == 'Full collection'
    if os.environ.get('GITHUB_SHA'):
        assert publication['sourceCommit'] == os.environ['GITHUB_SHA'], publication
    checked('exact-commit public manifest and 316/49/133 counts')

    for asset in ['TechOps-Hero-Revision-11.pdf', 'TechOps-Hero-Revision-11.1.pdf', 'TechOps-Hero-Revision-F-Complete.pdf', 'TechOps-Hero-Revision-F-Annotation-Update-315-Pages.pdf', 'revision-f/001.webp', 'volume-xiii/001.webp', 'volume-v/001.webp', '001.webp']:
        try:
            with urlopen(BASE + 'techops-comic/' + asset + '?retired=' + str(time.time_ns()), timeout=30) as response:
                raise AssertionError(f'Retired asset still public: {asset}: {response.status}')
        except HTTPError as failure:
            assert failure.code in (404,410), (asset, failure.code)
    checked('retired PDFs and reader page assets return 404/410')

    for id, book in MANIFEST['books'].items():
        # Inspect the real PDF response without fetching hundreds of megabytes again.
        request = Request(book['pdfUrl'], headers={'Range':'bytes=0-4','User-Agent':'TechOps-Publication-Check'})
        with urlopen(request, timeout=60) as response:
            assert response.status in (200,206)
            assert response.read(5) == b'%PDF-', id
            total = response.headers.get('Content-Range','').split('/')[-1]
            if total.isdigit(): assert int(total) == book['pdfBytes'], id
        checked(f'{id}: current PDF is a real publicly readable PDF')

    with sync_playwright() as driver:
        browser = driver.chromium.launch()
        for name, settings in [('desktop', {'viewport':{'width':1440,'height':1000}}), ('mobile-touch', {'viewport':{'width':390,'height':844},'is_mobile':True,'has_touch':True,'device_scale_factor':2})]:
            context = browser.new_context(**settings, reduced_motion='reduce')
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(reader_url(), wait_until='domcontentloaded')
            expect(page.locator('.comic-current-card')).to_have_count(3)
            expect(page.locator('.comic-current-card').nth(0)).to_contain_text('Full collection')
            expect(page.locator('.comic-current-card').nth(0)).to_contain_text('Volumes I–XII')
            body = page.locator('main').inner_text()
            assert not re.search(r'Earlier Revision|legacy readers|LATEST CORRECTED|REVISED NOVEMBER|The corrected collection', body)
            expect(page).to_have_title('TechOps Hero · Full collection')
            page.wait_for_function("() => [...document.querySelectorAll('.comic-current-card img')].every(i=>i.complete&&i.naturalWidth>0)", timeout=60000)
            page.screenshot(path=str(OUT / f'{name}-library.png'), full_page=False)
            checked(f'{name}: exactly three current books, final labels and loaded covers')

            for retired, expected_id in [('f','g'), ('legacy','g'), ('xiii','xiii-r'), ('unknown','g')]:
                page.goto(reader_url(retired,34,'&from=world'), wait_until='domcontentloaded')
                expect(page.locator('.comic-current-card')).to_have_count(3)
                expect(page).to_have_url(re.compile(r'edition=' + re.escape(expected_id) + r'(?:&|$)'))
                query = parse_qs(urlsplit(page.url).fragment.split('?',1)[1])
                assert query.get('page') is None
                assert query['from'] == ['world']
                expect(page.locator('.comic-mast a').first).to_have_attribute('href', '#/k/terminal')
                expect(page.locator('.comic-previous-edition')).to_have_count(0)
            page.goto(BASE + '#/comic?page=34', wait_until='domcontentloaded')
            expect(page).to_have_url(re.compile(r'edition=g$'))
            checked(f'{name}: all retired and page-only routes go to current contents')

            for id, book in MANIFEST['books'].items():
                page.goto(reader_url(id,1), wait_until='domcontentloaded')
                page_image(page)
                expect(page.get_by_role('button', name='Previous page', exact=True)).to_be_disabled()
                expect(page.locator('.comic-download')).to_have_attribute('href', book['pdfUrl'])
                expect(page.get_by_label('Choose book')).to_have_value(id)
                options = page.get_by_label('Choose book').locator('option').all_text_contents()
                assert options == ['Full collection','Volume XIII','Volume XIV'], options
                page.get_by_role('button', name='Next page', exact=True).click()
                expect(page.get_by_label('Jump to page', exact=True)).to_have_value('2')
                page_image(page)
                page.get_by_role('button', name='Previous page', exact=True).click()
                expect(page.get_by_label('Jump to page', exact=True)).to_have_value('1')
                target = str(book['scenes'][1]['page'])
                page.get_by_label('Jump to scene', exact=True).select_option(target)
                expect(page.get_by_label('Jump to page', exact=True)).to_have_value(target)
                page.get_by_label('Jump to page', exact=True).select_option(str(book['pageCount']))
                page_image(page)
                expect(page.get_by_role('button', name='Next page', exact=True)).to_be_disabled()
                if id != 'xiv':
                    expected_next = 'xiii-r' if id == 'g' else 'xiv'
                    page.locator('.comic-current-continue button').click()
                    expect(page.get_by_label('Choose book')).to_have_value(expected_next)
                    expect(page.get_by_label('Jump to page', exact=True)).to_have_value('1')
                    page_image(page)
                else:
                    expect(page.locator('.comic-current-continue')).to_have_count(0)
                checked(f'{name}: {id} PDF link, loaded pages, navigation, scenes, ending and continuation')

            page.goto(reader_url('g',12), wait_until='domcontentloaded')
            page_image(page)
            page.goto(reader_url(), wait_until='domcontentloaded')
            page.get_by_role('button', name='Resume · p. 12', exact=False).click()
            expect(page.get_by_label('Jump to page', exact=True)).to_have_value('12')
            page.get_by_role('button', name='Enlarge', exact=False).click()
            expect(page.locator('.comic-stage')).to_have_class(re.compile('is-enlarged'))
            page.get_by_role('button', name='Fit page', exact=False).click()
            if name == 'mobile-touch':
                swipe(page)
                expect(page.get_by_label('Jump to page', exact=True)).to_have_value('13')
            else:
                page.locator('body').click(position={'x':2,'y':2})
                page.keyboard.press('ArrowRight')
                expect(page.get_by_label('Jump to page', exact=True)).to_have_value('13')
            checked(f'{name}: saved position, zoom and swipe/keyboard controls')

            broken = MANIFEST['books']['g']['imageBase'] + '008.webp'
            page.route(broken + '*', lambda route: route.abort())
            page.goto(reader_url('g',8), wait_until='domcontentloaded')
            expect(page.get_by_role('alert')).to_contain_text('This page could not load.', timeout=60000)
            page.unroute(broken + '*')
            page.get_by_role('button', name='Retry page', exact=True).click()
            page_image(page)
            checked(f'{name}: image failure and retry recover correctly')
            page.screenshot(path=str(OUT / f'{name}-reader.png'), full_page=False)
            assert not errors, errors
            checked(f'{name}: no uncaught browser errors')
            context.close()
        browser.close()
    receipt['result'] = 'PASS'
except Exception as failure:
    receipt['result'] = 'FAIL'
    receipt['error'] = str(failure)
    receipt['traceback'] = traceback.format_exc()
    print(receipt['traceback'], flush=True)
finally:
    (OUT / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2), flush=True)
if receipt['result'] != 'PASS':
    raise SystemExit(1)
