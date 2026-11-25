#!/usr/bin/env python3
"""Stamp a private local build after checking its proposed public URLs and private bytes.

This marker is never public proof and is not accepted by the production publisher.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
from tempfile import NamedTemporaryFile

spec = importlib.util.spec_from_file_location('publisher', Path(__file__).with_name('comic-publisher.py'))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)

def stamp(manifest, assets, dist, head, media, expected_manifest):
    p = publisher
    p.need(bool(re.fullmatch(r'[a-f0-9]{40}', head)), 'Exact private build head required')
    p.need(bool(re.fullmatch(r'[a-f0-9]{40}', media)), 'Exact private media commit required')
    p.sha(expected_manifest)
    p.need(p.digest(manifest) == expected_manifest, 'Private manifest has changed')
    m = p.load_manifest(manifest)
    p.need(m['edition'] == 'ixiv' and 'delivery' in m and m['page_count'] == 514,
           'Exact split-delivery I–XIV manifest required')
    p.need(m['changed_pages'] == list(range(1, 515)), 'I–XIV requires every source page')
    p.need(not dist.resolve().is_relative_to(assets.resolve())
           and not assets.resolve().is_relative_to(dist.resolve()), 'Build and private source must be disjoint')
    p.verify_source(m, assets)
    p.need(not (dist / '__private__').exists() and not (dist / 'private-preview-media').exists(),
           'Private source must not be bundled in site files')
    book = p.verify_publication(m, dist)
    p.need(book['mediaCommit'] == media, 'Private build media pin differs from expected')
    marker = {'schema_version': 1, 'commit': head, 'media_commit': media,
              'release_id': m['id'], 'repository': m['repository'], 'page_count': 514,
              'pdf_sha256': m['pdf']['sha256'], 'manifest_sha256': expected_manifest,
              'status': 'PRIVATE_BUILT_NOT_PUBLISHED'}
    target = p.joined(dist, 'publishing/deployment.json')
    p.need(not target.exists(), 'Refusing to replace an existing deployment marker')
    body = json.dumps(marker, sort_keys=True) + '\n'
    p.need(p.size_gate(dist) + len(body.encode()) <= p.BUDGET, 'Private build exceeds Pages budget')
    target.parent.mkdir(exist_ok=True)
    with NamedTemporaryFile(mode='w', dir=target.parent, delete=False) as f:
        temp = Path(f.name)
        f.write(body)
    try:
        # Exclusive create; do not overwrite a concurrent stamp.
        os.link(temp, target)
    finally:
        temp.unlink()
    return marker

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('manifest', 'assets', 'dist'):
        parser.add_argument('--' + key, type=Path, required=True)
    for key in ('head', 'media', 'expected-manifest'):
        parser.add_argument('--' + key, required=True)
    print(json.dumps(stamp(**vars(parser.parse_args())), sort_keys=True))
