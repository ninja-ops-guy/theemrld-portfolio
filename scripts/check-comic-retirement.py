#!/usr/bin/env python3
"""Read-only, fail-closed retirement checks. Service errors never prove removal."""
import argparse
import concurrent.futures
import json
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ASSETS = [
    'TechOps-Hero-Revision-11.pdf', 'TechOps-Hero-Revision-11.1.pdf',
    'TechOps-Hero-Revision-F-Complete.pdf',
    'TechOps-Hero-Revision-F-Annotation-Update-315-Pages.pdf',
    'revision-f/001.webp', 'volume-xiii/001.webp', 'volume-v/001.webp', '001.webp',
]
RETRYABLE = {408, 429, 500, 502, 503, 504}


def probe(url, opener=urlopen):
    request = Request(url, headers={'User-Agent': 'TechOps-Retirement-Check/1.0'})
    try:
        with opener(request, timeout=15) as response:
            # Bound body reads: never download a possibly superseded PDF.
            return {'status': response.status, 'url': response.geturl(),
                    'content_type': response.headers.get('Content-Type', ''),
                    'prefix': response.read(160).decode('utf-8', errors='replace')}
    except HTTPError as error:
        with error:
            return {'status': error.code, 'url': error.geturl(),
                    'content_type': error.headers.get('Content-Type', ''),
                    'prefix': error.read(160).decode('utf-8', errors='replace')}
    except (URLError, TimeoutError, OSError) as error:
        return {'status': None, 'url': url, 'error': type(error).__name__ + ': ' + str(error)}


def check_asset(base, asset, identity, *, attempt=probe, sleep=time.sleep):
    url = base.rstrip('/') + '/techops-comic/' + asset + '?' + urlencode({'retired': identity})
    history = []
    for delay in (0, 2, 5, 10):
        if delay:
            sleep(delay)
        result = attempt(url)
        history.append(result)
        status = result['status']
        if status in (404, 410):
            # A redirect to a generic missing page is not evidence that this URL is retired.
            state = 'REMOVAL_VERIFIED' if result.get('url') == url else 'UNVERIFIED_REDIRECT'
            break
        if status is not None and 200 <= status < 300:
            state = 'RETIRED_PATH_ACCESSIBLE'
            break
        state = 'REMOVAL_UNVERIFIED'
        if status is not None and status not in RETRYABLE:
            break
    return {'asset': asset, 'url': url, 'result': state, 'attempts': history}


def check_retirement(base, identity, *, assets=ASSETS, attempt=probe, sleep=time.sleep):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda asset: check_asset(base, asset, identity, attempt=attempt, sleep=sleep), assets))
    return {'site_url': base, 'source_commit': identity,
            'result': 'PASS' if all(r['result'] == 'REMOVAL_VERIFIED' for r in results) else 'FAIL',
            'checks': results}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--receipt', required=True)
    args = parser.parse_args()
    receipt = check_retirement(args.url, args.commit)
    from pathlib import Path
    target = Path(args.receipt)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))
    return 0 if receipt['result'] == 'PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
