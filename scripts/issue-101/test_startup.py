"""Exercise the actual runner with deterministic Playwright event/failure doubles.

These tests validate harness behavior, not browser or product reliability.
"""
import json
import os
from pathlib import Path
import runpy
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

HERE = Path(__file__).parent


def execute(path, failure=None, lifecycle='shared'):
    state = {'launches': 0, 'contexts': 0, 'waits': [], 'navigations': []}

    class Page:
        def on(self, event, callback):
            setattr(self, event, callback)

        def goto(self, url, **kwargs):
            state['navigations'].append((url, kwargs))

        def wait_for_function(self, expression, **kwargs):
            state['waits'].append((expression, kwargs))
            if state['contexts'] == 2:
                if failure == 'crash':
                    self.crash(self)  # Playwright emits the Page, not an ordinal.
                    raise RuntimeError('Target page, context or browser has been closed')
                if failure == 'closed':
                    raise RuntimeError('Target page, context or browser has been closed')
                if failure == 'timeout':
                    raise TimeoutError('readiness deadline exceeded')

    class Context:
        def __init__(self, browser):
            self.browser = browser

        def set_default_timeout(self, timeout):
            assert timeout == 6000

        def route(self, *args):
            pass

        def new_page(self):
            return Page()

        def close(self):
            if state['contexts'] == 2 and failure == 'close-error':
                raise RuntimeError('context disposal failed')
            if state['contexts'] == 2 and failure == 'leak':
                return
            self.browser.contexts.remove(self)

    class Browser:
        version = 'test-double'

        def __init__(self):
            self.contexts = []

        def on(self, *args):
            pass

        def new_context(self, **kwargs):
            assert kwargs == {'viewport': {'width': 1440, 'height': 1000}}
            state['contexts'] += 1
            if state['contexts'] == 2 and failure == 'setup':
                raise RuntimeError('context creation failed')
            c = Context(self)
            self.contexts.append(c)
            return c

        def close(self):
            if failure == 'shutdown':
                raise RuntimeError('browser shutdown failed')
            self.contexts.clear()

    class Engine:
        def launch(self, **kwargs):
            assert kwargs == {'headless': True}
            state['launches'] += 1
            return Browser()

    class Playwright:
        webkit = Engine()

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

    api = types.ModuleType('playwright.sync_api')
    api.sync_playwright = Playwright
    with tempfile.TemporaryDirectory() as directory:
        with patch.dict(os.environ, QA_OUTPUT=directory), patch.dict(sys.modules, {'playwright.sync_api': api}), patch.object(sys, 'argv', [str(path), '--count', '4', '--telemetry', 'off', '--lifecycle', lifecycle]):
            try:
                runpy.run_path(str(path), run_name='__main__')
            except SystemExit as error:
                code = error.code
        result = json.loads((Path(directory) / 'results.json').read_text())
        crashes = [json.loads(p.read_text()) for p in Path(directory).glob('crash-*.json')]
    return code, result, crashes, state


class StartupTests(unittest.TestCase):
    def test_clean_shared_and_isolated(self):
        for lifecycle, launches in [('shared', 1), ('isolated', 4)]:
            with self.subTest(lifecycle=lifecycle):
                code, result, crashes, state = execute(HERE / 'startup.py', lifecycle=lifecycle)
                self.assertEqual(code, 0)
                self.assertEqual([r['status'] for r in result['results']], ['PASS'] * 4)
                self.assertEqual(state['launches'], launches)
                self.assertEqual(crashes, [])
                self.assertEqual(state['waits'], [('window.TechOpsLinked && window.__productionTitleReadiness?.ready===true', {'timeout': 30000})] * 4)

    def test_crash_callback_receipt_and_fail_stop(self):
        code, result, crashes, state = execute(HERE / 'startup.py', 'crash')
        self.assertNotEqual(code, 0)
        self.assertTrue(result['results'][1]['crash'])
        self.assertEqual(crashes[0]['ordinal'], 2)
        self.assertEqual(len(crashes), 1)
        self.assertEqual([r['status'] for r in result['results']], ['PASS', 'FAIL', 'UNEXECUTED', 'UNEXECUTED'])
        self.assertEqual(state['contexts'], 2)
        self.assertEqual(state['launches'], 1)

    def test_other_failures_are_retained_without_replacement(self):
        for failure in ['closed', 'timeout', 'close-error', 'leak', 'setup']:
            with self.subTest(failure=failure):
                code, result, crashes, state = execute(HERE / 'startup.py', failure)
                self.assertNotEqual(code, 0)
                self.assertEqual([r['status'] for r in result['results']], ['PASS', 'FAIL', 'UNEXECUTED', 'UNEXECUTED'])
                self.assertEqual(result['results'][2]['blockedBy'], 2)
                self.assertEqual(state['contexts'], 2)
                self.assertEqual(state['launches'], 1)
                self.assertEqual(crashes, [])

    def test_shutdown_failure_cannot_pass(self):
        code, result, _, _ = execute(HERE / 'startup.py', 'shutdown')
        self.assertNotEqual(code, 0)
        self.assertEqual(result['shutdownError'], 'browser shutdown failed')

    def test_original_callback_negative_control(self):
        original = HERE.parents[2] / 'followup/scripts/issue-101/startup.py'
        if not original.exists():
            original = Path(os.environ['ISSUE101_ORIGINAL_STARTUP'])
        _, result, crashes, state = execute(original, 'crash')
        self.assertIn('Object of type Page is not JSON serializable', result['results'][1]['error'])
        self.assertNotIn('crash', result['results'][1])
        self.assertEqual(crashes, [])
        self.assertEqual(state['contexts'], 4)


if __name__ == '__main__':
    unittest.main(verbosity=2)
