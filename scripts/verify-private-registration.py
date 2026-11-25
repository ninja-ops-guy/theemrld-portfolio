#!/usr/bin/env python3
"""Verify the exact registration contents after applying the private overlay."""
import argparse
import hashlib
from pathlib import Path
import re
import subprocess

REVIEWED = '30135f67bd5451d8739a6296b5d4fd3e5b6d55f7'
MANIFEST = 'publishing/releases/ixiv-9b2f94974027.json'
MANIFEST_HASH = '2e7ff8f81da905077463c08aca9a50fdddc033ea3cededf416a45553298407d4'
SCOPE_HASH = '1d5b4b42a3e6521fd48816e1da3b29e93139184e2b6dc34d69b62c2ef4bdf504'
PATHS = {
    'src/pages/LatestComicReader.css', 'src/pages/LatestComicReader.tsx',
    'src/pages/TechOpsComic.tsx', 'tests/comic-final-browser.py',
    'tests/comic-final-polish.py', 'tests/comic-music-browser.py',
    'public/k-world/guided-cues.json', 'public/k-world/guided.js',
    MANIFEST, 'src/data/comic-current-editions.json',
    'src/data/comic-display-labels.json', 'src/data/comic-optional-tracks.json',
    'tests/comic-corrected-release.test.mjs', 'tests/comic-optional-tracks.test.mjs',
}

def verify(candidate, main, reviewed, manifest_sha, git=None):
    def guard(condition, msg):
        if not condition:
            raise ValueError('PRIVATE_REGISTRATION_HOLD: ' + msg)
    if git is None:
        def git(*args):
            return subprocess.run(['git', '-C', str(candidate), *args], check=True,
                                  stdout=subprocess.PIPE, stderr=subprocess.DEVNULL).stdout
    guard(bool(re.fullmatch(r'[a-f0-9]{40}', main)), 'invalid main')
    guard(reviewed == REVIEWED and manifest_sha == MANIFEST_HASH, 'wrong reviewed head or manifest')
    git('merge-base', '--is-ancestor', main, 'HEAD')
    git('merge-base', '--is-ancestor', reviewed, 'HEAD')
    entries = git('diff', '--name-only', '--no-renames', '-z', main, 'HEAD').decode().split('\0')
    guard(entries[-1] == '' and len(entries) == len(PATHS)+1 and set(entries[:-1]) == PATHS,
          'registered reader changed unexpected paths')
    raw = git('ls-tree', '--full-tree', '-z', 'HEAD', '--', *sorted(PATHS))
    guard(hashlib.sha256(raw).hexdigest() == SCOPE_HASH, 'registered files or modes changed')
    catalog = Path(candidate) / MANIFEST
    guard(not catalog.is_symlink() and catalog.is_file(), 'wrong registration manifest type')
    guard(hashlib.sha256(catalog.read_bytes()).hexdigest() == manifest_sha, 'registration manifest bytes changed')
    return git('rev-parse', 'HEAD^{tree}').decode().strip()

if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--candidate',type=Path,required=True)
    for flag in ('main','reviewed','manifest-sha'):
        p.add_argument('--'+flag,required=True)
    print('PRIVATE_REGISTRATION_MATCH: '+verify(**vars(p.parse_args())))
