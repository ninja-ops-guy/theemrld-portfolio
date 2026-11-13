"""Unit tests for truthful retirement response handling (no external HTTP)."""
import io
import unittest
from urllib.error import HTTPError
from comic_retired_probe import check_retired_asset, RetiredAssetProbeError

URL = 'https://kterminal.site/techops-comic/TechOps-Hero-Revision-11.pdf'

class FakeResponse:
    def __init__(self, status):
        self.status = status
        self.headers = {'server': 'test-edge'}
    def geturl(self):
        return URL
    def __enter__(self):
        return self
    def __exit__(self, *_):
        return False

def sequence(statuses):
    remaining = iter(statuses)
    called = []
    def open_request(request, timeout):
        code = next(remaining)
        called.append((request.full_url, timeout, code))
        if code >= 400:
            raise HTTPError(request.full_url, code, 'fake', {'server': 'test-edge'},
                            io.BytesIO(b'not a PDF'))
        return FakeResponse(code)
    return open_request, called

class RetiredAssetTests(unittest.TestCase):
    def test_404_is_valid_without_retry(self):
        open_request, called = sequence([404])
        trace = check_retired_asset(URL, opener=open_request, sleeper=lambda _: self.fail('slept'))
        self.assertEqual([entry['status'] for entry in trace], [404])
        self.assertEqual(len(called), 1)

    def test_410_is_valid_without_retry(self):
        open_request, _ = sequence([410])
        self.assertEqual(check_retired_asset(URL, opener=open_request)[-1]['status'], 410)

    def test_short_503_then_404_proves_retirement_but_records_503(self):
        open_request, called = sequence([503, 503, 404])
        pauses = []
        trace = check_retired_asset(URL, opener=open_request, sleeper=pauses.append)
        self.assertEqual([entry['status'] for entry in trace], [503, 503, 404])
        self.assertEqual(pauses, [0.5, 1.0])
        self.assertEqual(len(called), 3)

    def test_persistent_503_never_passes(self):
        open_request, called = sequence([503, 503, 503])
        with self.assertRaises(RetiredAssetProbeError) as raised:
            check_retired_asset(URL, opener=open_request, sleeper=lambda _: None)
        self.assertEqual([x['status'] for x in raised.exception.trace], [503,503,503])
        self.assertEqual(len(called), 3)

    def test_200_or_403_is_not_a_retirement(self):
        for code in (200, 403):
            open_request, called = sequence([code])
            with self.assertRaises(RetiredAssetProbeError) as raised:
                check_retired_asset(URL, opener=open_request, sleeper=lambda _: self.fail('slept'))
            self.assertEqual(raised.exception.trace[0]['status'], code)
            self.assertEqual(len(called), 1)

    def test_invalid_attempt_limits_are_rejected(self):
        for count in (0, 6):
            with self.assertRaises(ValueError):
                check_retired_asset(URL, max_attempts=count)

if __name__ == '__main__':
    unittest.main()
