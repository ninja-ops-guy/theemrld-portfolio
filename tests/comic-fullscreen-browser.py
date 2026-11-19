"""Reader full-screen regression checks. Run against a local preview with Playwright.

COMIC_BASE_URL=http://127.0.0.1:4173/ python tests/comic-fullscreen-browser.py
Emulation is not a substitute for real iPhone Safari and native fullscreen testing.
"""
import os
import re
from urllib.parse import parse_qs
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('COMIC_BASE_URL', 'http://127.0.0.1:4173/').rstrip('/') + '/'
# Deterministic image delivery keeps these interaction tests independent of media hosts.
IMAGE = b'<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="3240"><rect width="2160" height="3240" fill="#556"/></svg>'

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
        context.close()
    browser.close()
