#!/usr/bin/env python3
"""KX-01 asset/runtime gate. No deployments, writes to GitHub, or telemetry.

python scripts/kx_asset_gate.py --world public/k-world --output qa/kx-assets.json
python scripts/kx_asset_gate.py --world public/k-world --built-world dist/k-world \
    --chromium /usr/bin/chromium --require-built --output qa/kx-assets.json

Chromium decoding uses data URLs made from the checked bytes. It is NOT a
production URL/base-path test. A passing asset receipt is NOT a release receipt.
Dependencies: Pillow; optional playwright plus an installed Chromium executable.
"""
from pathlib import Path
import argparse
import base64
import datetime as dt
import hashlib
import json
import subprocess
import sys
from PIL import Image

RUNTIME = ('index.html', 'app.js', 'assets.js', 'audio.js', 'data.js', 'icons.js',
           'renderer.js', 'scenes.js', 'world.css', 'catalogue.json',
           'assets/manifest.json')
EXPECTED = {'cope', 'fear', 'death-eater', 'wolf', 'garden', 'meteor', 'cathedral',
            'blue-relic', 'neon-cosmos', 'equations', 'self-i', 'self-ii', 'k-band'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def qualify(world, built=None, chromium=None):
    world = Path(world).resolve()
    checks, assets, inventory = [], [], {}

    def check(identifier, okay, detail, phase='source'):
        checks.append(dict(id=identifier, phase=phase,
                           status='PASS' if okay else 'FAIL', detail=detail))
        return okay

    for name in RUNTIME:
        path = world/name
        check('RUNTIME:'+name, path.is_file() and path.stat().st_size > 0, name)
    try:
        manifest = json.loads((world/'assets/manifest.json').read_text())
        if not isinstance(manifest, list):
            raise ValueError('Manifest must be a list')
        ids = [row.get('id') for row in manifest if isinstance(row, dict)]
        check('ASSET-IDS', len(ids) == len(manifest) == len(EXPECTED)
              and set(ids) == EXPECTED, 'Exactly the 12 artworks and band sheet')
    except (OSError, ValueError, TypeError) as exc:
        check('MANIFEST', False, str(exc)); manifest = []
    names = set()
    for row in manifest:
        try:
            if not isinstance(row, dict):
                raise ValueError('Non-object manifest entry')
            identifier = row['id']; name = row['file']
            if (not isinstance(name, str) or Path(name).name != name
                    or name in names or not name.endswith('.webp')):
                raise ValueError('Duplicate or unsafe asset filename')
            names.add(name); path = (world/'assets'/name).resolve()
            if path.parent != world/'assets':
                raise ValueError('Asset symlink leaves assets directory')
            width, height = row['width'], row['height']
            if (type(width) is not int or type(height) is not int
                    or not 1 <= width <= 16384 or not 1 <= height <= 16384):
                raise ValueError('Invalid expected image dimensions')
            data = path.read_bytes()
            check('HASH:'+identifier, bool(data) and sha(data) == row['sha256'], name)
            # load() decodes the whole image; file existence/header is insufficient.
            with Image.open(path) as image:
                image.load()
                size = image.size
                check('DIMENSIONS:'+identifier, size == (width, height),
                      dict(expected=[width, height], decoded=list(size)))
                # Reject the all-black/all-transparent rectangles from the old atlas.
                rgb = image.convert('RGB').getextrema()
                alpha = image.convert('RGBA').getchannel('A').getextrema()[1]
                check('PAYLOAD:'+identifier, alpha > 0 and any(a != b for a, b in rgb),
                      'Visible, nonconstant decoded pixels')
            assets.append(dict(id=identifier, file=name, width=width, height=height,
                               sha256=sha(data), bytes=len(data)))
        except (KeyError, TypeError, ValueError, OSError) as exc:
            check('DECODE:'+str(row.get('id', '?') if isinstance(row, dict) else '?'),
                  False, str(exc))
    if world.is_dir():
        for path in sorted(world.rglob('*')):
            if path.is_file():
                name = path.relative_to(world).as_posix()
                if path.is_symlink():
                    check('SYMLINK:'+name, False, 'Runtime must contain regular files')
                    continue
                inventory[name] = sha(path.read_bytes())
    if built is not None:
        built = Path(built).resolve()
        for name, digest in inventory.items():
            path = built/name
            okay = path.is_file() and not path.is_symlink() and sha(path.read_bytes()) == digest
            check('BUILD:'+name, okay, 'Source bytes preserved in build', 'built')
        check('BUILT-RUNTIME', bool(inventory) and (built/'index.html').is_file(),
              str(built), 'built')
    if chromium:
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser = pw.chromium.launch(executable_path=str(chromium),
                                             headless=True, args=['--no-sandbox'])
                page = browser.new_page()
                for asset in assets:
                    data = (world/'assets'/asset['file']).read_bytes()
                    url = 'data:image/webp;base64,'+base64.b64encode(data).decode()
                    result = page.evaluate('''async src => {
                        const image = new Image(); image.src = src;
                        try { await image.decode();
                            return {width:image.naturalWidth,height:image.naturalHeight};
                        } catch(e) { return {error:String(e)}; }
                    }''', url)
                    check('CHROMIUM:'+asset['id'], result == dict(width=asset['width'],
                          height=asset['height']), result, 'chromium-decode')
                browser.close()
        except Exception as exc:
            check('CHROMIUM-RUNNER', False, str(exc), 'chromium-decode')
    failed = any(c['status'] == 'FAIL' for c in checks)
    return dict(schema='kx-asset-receipt/v1', scope='KX-01 runtime + asset integrity',
        created_utc=dt.datetime.now(dt.timezone.utc).isoformat(),
        status='FAIL' if failed else 'PASS',
        source_snapshot_sha256=sha(json.dumps(inventory, sort_keys=True).encode()),
        checks=checks, assets=assets, files=inventory,
        coverage=dict(source='EXECUTED', built='EXECUTED' if built else 'NOT_RUN',
                      chromium_decode='EXECUTED' if chromium else 'NOT_RUN',
                      deployed_base_path='NOT_RUN', component_render='NOT_RUN'),
        release_status='BLOCKED',
        limitations=['Not a full KX-16 experience qualification.',
                     'Production URLs and in-component rendering need separate browser tests.',
                     'No live audio, GPU, accessibility, usability or performance claim.'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--world', type=Path, default=Path('public/k-world'))
    parser.add_argument('--built-world', type=Path)
    parser.add_argument('--chromium', type=Path)
    parser.add_argument('--require-built', action='store_true')
    parser.add_argument('--output', type=Path, default=Path('qa/kx-assets.json'))
    args = parser.parse_args()
    receipt = qualify(args.world, args.built_world, args.chromium)
    if args.require_built and args.built_world is None:
        receipt['status'] = 'FAIL'
        receipt['checks'].append(dict(id='BUILT-REQUIRED',phase='built',status='FAIL',
                                      detail='--built-world is mandatory for release CI'))
    try:
        commit = subprocess.check_output(['git','rev-parse','HEAD'], text=True,
                                         stderr=subprocess.DEVNULL).strip()
        receipt['observed_commit'] = commit
        receipt['worktree_dirty'] = bool(subprocess.check_output(
            ['git','status','--porcelain'], text=True).strip())
    except (OSError, subprocess.CalledProcessError):
        receipt['observed_commit'] = None
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, indent=2)+'\n')
    print(json.dumps({k:receipt[k] for k in ('status','scope','coverage','release_status')}))
    return 1 if receipt['status'] == 'FAIL' else 0

if __name__ == '__main__':
    sys.exit(main())
