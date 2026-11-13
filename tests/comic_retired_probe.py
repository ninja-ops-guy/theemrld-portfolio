"""Retired comic asset HTTP acceptance: only 404/410 prove retirement.

Do not classify edge/proxy 503 as a successful 404. Retry short, bounded 503
responses and retain HTTP status/headers for diagnosis. No background traffic.
"""
import json
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen

class RetiredAssetProbeError(AssertionError):
    def __init__(self, url, trace):
        self.url = url
        self.trace = trace
        super().__init__('Retired asset did not return 404/410: ' + url
                         + ' ' + json.dumps(trace, sort_keys=True))

def _headers(headers):
    selected = ('server', 'via', 'location', 'retry-after', 'x-github-request-id',
                'x-served-by', 'x-cache', 'x-proxy-cache', 'cf-ray', 'content-type')
    return {key: headers.get(key) for key in selected if headers and headers.get(key)}

def check_retired_asset(url, *, opener=urlopen, sleeper=time.sleep, max_attempts=3):
    if not 1 <= max_attempts <= 5:
        raise ValueError('max_attempts must be between 1 and 5')
    trace = []
    for attempt in range(1, max_attempts + 1):
        request = Request(url, headers={'User-Agent': 'TechOps-Comic-Publication-Acceptance/1'})
        try:
            with opener(request, timeout=30) as response:
                code = response.status
                final_url = response.geturl()
                headers = response.headers
        except HTTPError as failure:
            code = failure.code
            final_url = failure.geturl()
            headers = failure.headers
            failure.close()
        trace.append({'attempt': attempt, 'status': code,
                      'final_url': final_url, 'headers': _headers(headers)})
        if code in (404, 410):
            return trace
        if code == 503 and attempt < max_attempts:
            sleeper(0.5 * attempt)
            continue
        raise RetiredAssetProbeError(url, trace)
    raise RetiredAssetProbeError(url, trace)
