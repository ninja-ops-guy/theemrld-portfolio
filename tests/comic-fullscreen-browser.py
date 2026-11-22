"""Reader full-screen regression checks. Run against a local preview with Playwright.

COMIC_BASE_URL=http://127.0.0.1:4173/ python tests/comic-fullscreen-browser.py
Emulation is not a substitute for real iPhone Safari and native fullscreen testing.
"""
import os
import re
import json
from pathlib import Path
from urllib.parse import parse_qs
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('COMIC_BASE_URL', 'http://127.0.0.1:4173/').rstrip('/') + '/'
# Deterministic image delivery keeps these interaction tests independent of media hosts.
IMAGE = b'<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="3240"><rect width="2160" height="3240" fill="#556"/></svg>'
BOOK = json.loads((Path(__file__).parents[1] / 'src/data/comic-current-editions.json').read_text())['books']['g']
COLLECTION = json.loads((Path(__file__).parents[1] / 'src/data/comic-collection-serving.json').read_text())


def check_zoomed_hotspots(page):
    """Verify targets against the rendered image, then activate a panned target."""
    page.goto(BASE + '#/comic?edition=g&page=1')
    page.get_by_role('button', name='Full screen', exact=True).click()
    page.get_by_role('button', name='Zoom in', exact=True).click()
    page.get_by_role('button', name='Zoom in', exact=True).click()
    expect(page.get_by_role('button', name='Fit whole page')).to_have_text('200%')
    page.wait_for_function("document.querySelector('.comic-page-image')?.naturalWidth > 0")
    bounds = page.locator('.comic-page-image').bounding_box()
    assert bounds
    for link in BOOK['links']['1']:
        target = page.get_by_role('button', name=f"Read page {link['page']}:", exact=False)
        box = target.bounding_box()
        assert box
        left, top, right, bottom = link['rect']
        expected = {
            'x': bounds['x'] + bounds['width'] * left / 100,
            'y': bounds['y'] + bounds['height'] * top / 100,
            'width': bounds['width'] * (right - left) / 100,
            'height': bounds['height'] * (bottom - top) / 100,
        }
        assert all(abs(box[key] - value) <= 1 for key, value in expected.items()), (box, expected)
    last = BOOK['links']['1'][-1]
    target = page.get_by_role('button', name=f"Read page {last['page']}:", exact=False)
    target.scroll_into_view_if_needed()
    # An actual pointer click, not dispatch_event, catches misaligned/covered targets.
    target.click()
    expect(page.get_by_label('Jump to page')).to_have_value(str(last['page']))
    expect(page.get_by_role('button', name='Fit whole page')).to_have_text('100%')
    expect(page.get_by_role('dialog', name='Full-screen comic reader')).to_be_visible()
    page.get_by_role('button', name='Exit full screen').click()


def check_immersive_image_recovery(page):
    """Exercise zoom fallback and total failure without leaving the modal."""
    # At fit, the reading copy loads; zoom then asks for an unavailable original.
    original_pattern = BOOK['imageBase'] + '003.webp*'
    page.route(original_pattern, lambda route: route.fulfill(status=503, body='Unavailable'))
    page.goto(BASE + '#/comic?edition=g&page=3')
    image = page.locator('.comic-page-image')
    page.wait_for_function("document.querySelector('.comic-page-image')?.naturalWidth > 0")
    page.get_by_role('button', name='Full screen', exact=True).click()
    with page.expect_request(re.compile(re.escape(BOOK['imageBase'] + '003.webp'))):
        page.get_by_role('button', name='Zoom in').click()
    expect(image).to_have_attribute('src', re.compile(re.escape('/' + COLLECTION['directory'] + '/')))
    page.wait_for_function("document.querySelector('.comic-page-image')?.naturalWidth > 0")
    expect(page.locator('.comic-current-error')).to_have_count(0)
    page.unroute(original_pattern)

    # A later page fails for both the reading copy and original; retry must work
    # inside the same modal and must not save the unreadable page as the bookmark.
    restored = [False]
    # Choose a non-prefetched page so a previously decoded image cannot bypass
    # the deliberately failed responses.
    failed_pattern = '**/008.webp*'
    def failing_page(route):
        if restored[0]:
            route.fulfill(status=200, content_type='image/svg+xml', body=IMAGE)
        else:
            route.fulfill(status=503, body='Unavailable')
    page.route(failed_pattern, failing_page)
    page.get_by_label('Jump to page').select_option('8')
    expect(page.locator('.comic-current-error')).to_be_visible()
    expect(page.get_by_role('dialog', name='Full-screen comic reader')).to_be_visible()
    bookmark_key = f"techops-hero:g:{BOOK['revision']}:page"
    assert page.evaluate('(key) => localStorage.getItem(key)', bookmark_key) == '3'
    restored[0] = True
    page.get_by_role('button', name='Retry page', exact=True).click()
    page.wait_for_function("document.querySelector('.comic-page-image')?.naturalWidth > 0")
    expect(page.locator('.comic-current-error')).to_have_count(0)
    page.wait_for_function("(key) => localStorage.getItem(key) === '8'", arg=bookmark_key)
    expect(page.get_by_role('dialog', name='Full-screen comic reader')).to_be_visible()
    page.get_by_role('button', name='Exit full screen').click()
    expect(page.get_by_role('button', name='Full screen', exact=True)).to_be_focused()
    page.unroute(failed_pattern)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for viewport in [{'width': 1366, 'height': 900}, {'width': 390, 'height': 844}, {'width': 844, 'height': 390}]:
        context = browser.new_context(viewport=viewport, reduced_motion='reduce')
        # Exercise the fallback explicitly; native fullscreen needs its own real-browser test.
        context.add_init_script("Object.defineProperty(Element.prototype, 'requestFullscreen', {value: undefined, configurable: true})")
        page = context.new_page()
        page.route('**/*.webp*', lambda route: route.fulfill(status=200, content_type='image/svg+xml', body=IMAGE))
        page.goto(BASE + '#/comic?edition=g&page=1')
        image = page.locator('.comic-page-image')
        expect(image).to_be_visible()
        page.wait_for_function("document.querySelector('.comic-page-image')?.naturalWidth > 0")
        expect(page.get_by_role('button', name='Enlarge')).to_be_visible()
        page.get_by_role('button', name='Enlarge').click()
        expect(page.locator('.comic-stage')).to_have_class(re.compile('is-enlarged'))
        page.get_by_role('button', name='Full screen').click()
        reader = page.get_by_role('dialog', name='Full-screen comic reader')
        expect(reader).to_be_visible()
        expect(page.get_by_role('button', name='Exit full screen')).to_be_focused()
        # The slider participates in the modal's keyboard cycle.
        first = page.get_by_role('button', name='Fit whole page')
        last = page.get_by_role('button', name='Next page', exact=True)
        last.focus()
        page.keyboard.press('Tab')
        expect(first).to_be_focused()
        page.keyboard.press('Shift+Tab')
        expect(last).to_be_focused()
        expect(reader.get_by_label('Soundtrack volume')).to_be_visible()
        sheet = page.locator('.comic-sheet').bounding_box()
        stage = page.locator('.comic-stage').bounding_box()
        assert sheet and stage and abs(sheet['width'] / sheet['height'] - 2 / 3) < .01
        assert sheet['width'] <= stage['width'] + 1 and sheet['height'] <= stage['height'] + 1
        page.get_by_role('button', name='Zoom in').click()
        expect(page.get_by_role('button', name='Fit whole page')).to_have_text('150%')
        assert page.locator('.comic-stage').evaluate('(e) => e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth')
        page.get_by_role('button', name='Fit whole page').click()
        index_link = page.get_by_role('button', name='Read page 3:', exact=False)
        index_link.focus()
        page.keyboard.press('Enter')
        expect(page.get_by_label('Jump to page')).to_have_value('3')
        expect(page.get_by_role('button', name='Exit full screen')).to_be_focused()
        page.keyboard.press('Escape')
        opener = page.get_by_role('button', name='Full screen', exact=True)
        expect(opener).to_be_focused()
        opener.click()
        page.get_by_role('button', name='Zoom in').focus()
        for _ in range(6):
            page.keyboard.press('Space')
        expect(page.get_by_role('button', name='Fit whole page')).to_have_text('400%')
        page.keyboard.press('Escape')
        expect(opener).to_be_focused()
        opener.click()
        expect(page.get_by_label('Jump to page')).to_have_value('3')
        expect(reader).to_be_visible()
        page.get_by_role('button', name='Next page').click()
        expect(page.get_by_label('Jump to page')).to_have_value('4')
        page.get_by_role('button', name='Previous page').click()
        expect(page.get_by_label('Jump to page')).to_have_value('3')
        page.keyboard.press('Escape')
        expect(reader).to_have_count(0)
        expect(page.get_by_role('button', name='Full screen')).to_be_focused()
        # Enlarge was reset by the page turn, as in the existing reader.
        expect(page.get_by_role('button', name='Enlarge')).to_be_visible()
        assert parse_qs(page.url.split('?', 1)[1])['page'] == ['3']
        page.wait_for_function("Object.entries(localStorage).some(([k,v]) => k.startsWith('techops-hero:g:') && k.endsWith(':page') && v === '3')")
        print(f"PASS fallback interactions and fit: {viewport['width']}x{viewport['height']}")
        check_zoomed_hotspots(page)
        print(f"PASS zoomed hotspot geometry and panned pointer activation: {viewport['width']}x{viewport['height']}")
        check_immersive_image_recovery(page)
        print(f"PASS immersive original fallback, failure and retry: {viewport['width']}x{viewport['height']}")
        context.close()

    # Keep native coverage separate: these assertions require the real API.
    context = browser.new_context(reduced_motion='reduce')
    page = context.new_page()
    page.route('**/*.webp*', lambda route: route.fulfill(status=200, content_type='image/svg+xml', body=IMAGE))
    page.goto(BASE + '#/comic?edition=g&page=1')
    opener = page.get_by_role('button', name='Full screen', exact=True)
    opener.click()
    page.wait_for_function("document.fullscreenElement === document.querySelector('.comic-reading-surface')")
    page.get_by_role('button', name='Exit full screen').click()
    page.wait_for_function('!document.fullscreenElement')
    expect(opener).to_be_focused()
    opener.click()
    page.wait_for_function('!!document.fullscreenElement')
    # API exit exercises the browser fullscreenchange path, outside the Exit handler.
    page.evaluate('document.exitFullscreen()')
    expect(page.get_by_role('dialog', name='Full-screen comic reader')).to_have_count(0)
    expect(opener).to_be_focused()
    context.close()
    print('PASS native fullscreen entry, application exit and external API exit')
    context = browser.new_context()
    context.add_init_script("Element.prototype.requestFullscreen = () => Promise.reject(new Error('denied'))")
    page = context.new_page()
    page.route('**/*.webp*', lambda route: route.fulfill(status=200, content_type='image/svg+xml', body=IMAGE))
    page.goto(BASE + '#/comic?edition=g&page=1')
    page.get_by_role('button', name='Full screen', exact=True).click()
    expect(page.get_by_role('dialog', name='Full-screen comic reader')).to_be_visible()
    assert page.evaluate('document.fullscreenElement === null')
    page.get_by_role('button', name='Exit full screen').click()
    context.close()
    browser.close()
    print('PASS rejected fullscreen request retains usable fallback')
