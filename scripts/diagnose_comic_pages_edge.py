#!/usr/bin/env python3
"""One-shot read-only GitHub Pages vs custom-domain retired-asset probe."""
import json
import os
import socket
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

CUSTOM = 'https://kterminal.site/'
DEFAULT = 'https://ninja-ops-guy.github.io/theemrld-portfolio/'
RETIRED = ['TechOps-Hero-Revision-11.pdf', 'TechOps-Hero-Revision-11.1.pdf']
FIELDS = ['server','location','via','retry-after','x-github-request-id','x-served-by',
          'x-cache','x-proxy-cache','cf-ray','content-type','content-length',
          'strict-transport-security']

def dns(host):
    try:
        resolved = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
        return sorted({item[4][0] for item in resolved})
    except OSError as error:
        return {'error': str(error)}

def probe(base, relative, *, query=False, method='GET'):
    url = base + relative + (('?edge-diagnostic=' + str(time.time_ns())) if query else '')
    request = Request(url, method=method, headers={'User-Agent': 'TechOps-Comic-Edge-Diagnostic/1',
                                                    'Cache-Control': 'no-cache'})
    record = {'origin': base, 'path': relative, 'cache_buster': query, 'method': method,
              'request_url': url}
    try:
        try:
            response = urlopen(request, timeout=18)
        except HTTPError as error:
            response = error
        with response:
            record['status'] = getattr(response, 'status', None) or response.code
            record['final_url'] = response.geturl()
            headers = response.headers
            record['headers'] = {key: headers.get(key) for key in FIELDS if headers.get(key)}
            if method == 'GET' and record['status'] >= 400:
                record['body_sample'] = response.read(240).decode('utf8','replace')
    except (URLError, OSError, TimeoutError) as error:
        record['error'] = str(error)
    return record

def main():
    result = {
        'purpose': 'Diagnostic only: 503 does not establish retired-asset success',
        'recorded_at': datetime.now(timezone.utc).isoformat(),
        'commit': os.environ.get('GITHUB_SHA'),
        'dns': {'kterminal.site': dns('kterminal.site'),
                'ninja-ops-guy.github.io': dns('ninja-ops-guy.github.io')},
        'observations': []
    }
    paths = ['techops-comic/publication.json'] + ['techops-comic/' + s for s in RETIRED] + [
        'techops-comic/definitely-missing-retirement-probe.pdf']
    # Compare custom and default-domain behavior, and the effect of query strings.
    for origin in (CUSTOM, DEFAULT):
        for path in paths:
            for cache_buster in (False, True):
                result['observations'].append(probe(origin, path, query=cache_buster))
                time.sleep(0.1)
    # Also distinguish HEAD from GET on the first retired asset.
    result['observations'].append(probe(CUSTOM, 'techops-comic/'+RETIRED[0], method='HEAD'))
    Path('qa').mkdir(exist_ok=True)
    Path('qa/comic-retired-edge-probe.json').write_text(json.dumps(result,indent=2)+'\n')
    for row in result['observations']:
        print(json.dumps({key:row.get(key) for key in ('origin','path','method','cache_buster',
            'status','final_url','error','headers')},ensure_ascii=False),flush=True)
    codes = [row.get('status') for row in result['observations'] if row['path'].endswith('.pdf')]
    print('DIAGNOSTIC_ONLY: retired-file status codes:', codes,flush=True)

if __name__ == '__main__':
    main()
