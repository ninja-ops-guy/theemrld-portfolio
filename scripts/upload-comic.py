#!/usr/bin/env python3
"""One-file source handoff via an existing GitHub CLI login; never print tokens."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import uuid

REPO='ninja-ops-guy/theemrld-portfolio'
def gh(*args, data=None):
    result=subprocess.run(['gh',*args],input=json.dumps(data) if data is not None else None,
                          text=True,capture_output=True,timeout=1800)
    if result.returncode:raise RuntimeError(result.stderr.strip() or 'GitHub CLI operation failed')
    return result.stdout

def api(path, method='GET', data=None):
    args=['api',f'repos/{REPO}/{path}','--method',method]
    if data is not None:args+=['--input','-']
    result=gh(*args,data=data)
    return json.loads(result) if result.strip() else None

def digest(path):
    with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('archive',type=Path)
    p.add_argument('--release',required=True)
    mode=p.add_mutually_exclusive_group()
    mode.add_argument('--stage',action='store_true',help='Publish source prerelease, then qualify; do not publish website')
    mode.add_argument('--publish',action='store_true',help='Publish source prerelease, then authorize website qualification, merge and deployment')
    p.add_argument('--request-id',default=None,help='Reuse only for an identical previously submitted request')
    a=p.parse_args()
    if not shutil.which('gh'):raise RuntimeError('Install GitHub CLI once, then run gh auth login. Do not paste credentials into chat.')
    gh('auth','status','--hostname','github.com')
    if not re.fullmatch('[a-z0-9][a-z0-9-]{0,79}',a.release):raise RuntimeError('Invalid release ID')
    file=api(f'contents/publishing/releases/{a.release}.json?ref=main')
    raw=base64.b64decode(file['content']);m=json.loads(raw)
    if m['repository']!=REPO or m['id']!=a.release:raise RuntimeError('Wrong registered release')
    if m.get('lifecycle') == 'retired':raise RuntimeError('This registration is retired. Do not upload an obsolete revision.')
    if m.get('schema_version') != 2:raise RuntimeError('Register a reconciled v2 revision before uploading. Legacy source routes are retired.')
    request_id=a.request_id or str(uuid.uuid4())
    if not re.fullmatch('[a-z0-9][a-z0-9-]{0,79}',request_id):raise RuntimeError('Invalid request ID')
    source=m['source']
    if not a.archive.is_file() or a.archive.stat().st_size!=source['bytes'] or digest(a.archive)!=source['sha256']:
        raise RuntimeError('ZIP does not match the registered release. No upload was attempted.')
    pr=api(f"pulls/{m['target']['pr']}")
    if pr['state']!='open' or pr['head']['repo']['full_name']!=REPO or pr['head']['ref']!=m['target']['branch']:
        raise RuntimeError('Target PR identity/state changed. Inspect existing release status.')
    release=None
    for page in range(1,101):
        batch=api(f'releases?per_page=100&page={page}')
        release=next((r for r in batch if r['tag_name']==source['tag']),None)
        if release or len(batch)<100:break
    if not release:
        base=api('branches/main')['commit']['sha']
        release=api('releases','POST',{'tag_name':source['tag'],'target_commitish':base,'name':'Comic source: '+m['title'],
                    'draft':True,'prerelease':True,'make_latest':'false','body':'Manifest-approved source handoff; not a website publication receipt.'})
    if not release.get('prerelease'):raise RuntimeError('Source destination is not a prerelease; refusing to change an existing production release.')
    assets=[]
    for page in range(1,101):
        batch=api(f"releases/{release['id']}/assets?per_page=100&page={page}");assets.extend(batch)
        if len(batch)<100:break
    existing=next((x for x in assets if x['name']==source['asset']),None)
    if existing:
        if existing['size']!=source['bytes']:raise RuntimeError('A different asset already exists. Refusing to overwrite it.')
        with tempfile.TemporaryDirectory() as tmp:
            gh('release','download',source['tag'],'--repo',REPO,'--pattern',source['asset'],'--dir',tmp)
            if digest(Path(tmp)/source['asset'])!=source['sha256']:raise RuntimeError('Existing asset differs; use a new approved revision, not clobber.')
        print('The exact source is already uploaded; reusing it.')
    else:
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/source['asset'];shutil.copyfile(a.archive,src)
            gh('release','upload',source['tag'],str(src),'--repo',REPO)
            readback=Path(tmp)/'readback';readback.mkdir()
            gh('release','download',source['tag'],'--repo',REPO,'--pattern',source['asset'],'--dir',str(readback))
            if digest(readback/source['asset'])!=source['sha256']:raise RuntimeError('Uploaded asset failed readback. Publication not requested.')
        print('Uploaded source passed independent download-and-hash verification.')
    if not (a.stage or a.publish):
        print('Exact ZIP uploaded and verified. Source remains in its existing visibility state; no workflow requested.')
        print('Use --stage to make this source prerelease public and qualify it, or --publish to authorize website publication too.')
        return
    if release['draft']:
        release=api(f"releases/{release['id']}",'PATCH',{'draft':False,'prerelease':True,'make_latest':'false'})
        if release.get('draft') or not release.get('prerelease'):raise RuntimeError('Source prerelease publication not verified. Inspect before retrying.')
    action='publish' if a.publish else 'stage'
    gh('workflow','run','comic-publisher.yml','--repo',REPO,'--ref','main',
       '-f','release_id='+a.release,'-f','request_id='+request_id,'-f','action='+action,'-f','expected_head='+pr['head']['sha'],
       '-f','manifest_sha256='+hashlib.sha256(raw).hexdigest())
    print('Request ID: '+request_id)
    print('Comic Publisher requested: '+action+'. A requested run is not evidence that the website is live.')
    print('Status: https://github.com/'+REPO+'/actions/workflows/comic-publisher.yml')

if __name__=='__main__':
    try:main()
    except (RuntimeError,KeyError,OSError,json.JSONDecodeError,subprocess.TimeoutExpired) as e:
        print('UPLOAD_BLOCKED: '+str(e),file=sys.stderr);sys.exit(2)

