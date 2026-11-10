import importlib.util
import io
from pathlib import Path
import unittest
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('retirement', Path(__file__).resolve().parents[1] / 'scripts/check-comic-retirement.py')
retirement = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retirement)


class RetirementTests(unittest.TestCase):
    def test_error_body_timeout_is_retryable_transport_failure(self):
        class SlowBody(io.BytesIO):
            def read(self, *_args):
                raise TimeoutError('Synthetic slow error body')
        def opener(request, **_kwargs):
            raise HTTPError(request.full_url, 503, 'Unavailable', {}, SlowBody())
        result = retirement.probe('https://example.test/old.pdf', opener=opener)
        self.assertIsNone(result['status'])
        self.assertIn('TimeoutError', result['error'])

    def check(self, statuses, *, redirect=False):
        self.calls = []
        self.delays = []
        def attempt(url):
            self.calls.append(url)
            return {'status': statuses.pop(0), 'url': 'https://example.test/404' if redirect else url}
        return retirement.check_asset('https://example.test/', 'old.pdf', 'a' * 40,
                                      attempt=attempt, sleep=self.delays.append)

    def test_absent_path_passes_without_retry(self):
        self.assertEqual(self.check([404])['result'], 'REMOVAL_VERIFIED')
        self.assertEqual(len(self.calls), 1)

    def test_gone_path_passes(self):
        self.assertEqual(self.check([410])['result'], 'REMOVAL_VERIFIED')

    def test_transient_then_absent_is_verified(self):
        result = self.check([503, 502, 404])
        self.assertEqual(result['result'], 'REMOVAL_VERIFIED')
        self.assertEqual(self.delays, [2, 5])

    def test_persistent_service_failure_never_passes_or_claims_public(self):
        result = self.check([503] * 4)
        self.assertEqual(result['result'], 'REMOVAL_UNVERIFIED')
        self.assertEqual(len(self.calls), 4)

    def test_timeout_is_bounded(self):
        self.assertEqual(self.check([None] * 4)['result'], 'REMOVAL_UNVERIFIED')
        self.assertEqual(self.delays, [2, 5, 10])

    def test_public_asset_fails_immediately(self):
        self.assertEqual(self.check([200])['result'], 'RETIRED_PATH_ACCESSIBLE')
        self.assertEqual(len(self.calls), 1)

    def test_partial_content_is_public(self):
        self.assertEqual(self.check([206])['result'], 'RETIRED_PATH_ACCESSIBLE')

    def test_unauthorized_is_unverified_not_absent(self):
        self.assertEqual(self.check([403])['result'], 'REMOVAL_UNVERIFIED')
        self.assertEqual(len(self.calls), 1)

    def test_redirected_missing_page_is_not_proof(self):
        self.assertEqual(self.check([404], redirect=True)['result'], 'UNVERIFIED_REDIRECT')

    def test_pages_and_collection_acceptance_use_same_strict_verifier(self):
        root = Path(__file__).resolve().parents[1]
        pages = (root / '.github/workflows/pages.yml').read_text()
        browser = (root / 'tests/comic-final-browser.py').read_text()
        self.assertIn('path: scripts/check-comic-retirement.py', pages)
        self.assertIn('python3 retirement-verifier/check-comic-retirement.py --url "$SITE_URL" --commit "$GITHUB_SHA" --receipt comic-retirement-receipt.json', pages)
        self.assertIn('retirement.check_retirement(BASE, EXPECTED_COMMIT', browser)
        self.assertIn("if retirement_receipt['result'] != 'PASS':", browser)
        self.assertNotIn('Retired asset still public:', pages)

    def test_all_paths_are_examined_even_after_one_failure(self):
        seen = []
        def attempt(url):
            seen.append(url)
            return {'status': 200 if 'old.pdf' in url else 404, 'url': url}
        result = retirement.check_retirement('https://example.test', 'head', assets=['old.pdf', 'old.webp'],
                                            attempt=attempt, sleep=lambda _: None)
        self.assertEqual(result['result'], 'FAIL')
        self.assertEqual(len(result['checks']), 2)
        self.assertEqual(len(seen), 2)


if __name__ == '__main__':
    unittest.main()
