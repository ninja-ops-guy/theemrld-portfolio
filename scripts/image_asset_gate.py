#!/usr/bin/env python3
"""Image asset integrity gate. No deployments, writes to GitHub, or telemetry.

Walks a directory and fully decodes every image (.webp/.png/.jpg/.jpeg/.gif)
with Pillow. File existence and header checks are insufficient: the 2026-11
k-band-sheet incident shipped a 7,505-byte WebP whose RIFF header declared
136,152 bytes, and only a full decode rejects that class of truncation.

    python scripts/image_asset_gate.py --root public --output qa/image-assets-public.json
    python scripts/image_asset_gate.py --root dist   --output qa/image-assets-dist.json

Exit code is 1 when any image fails. Constant-colour images are reported as
warnings, not failures (small legitimately flat assets exist); fully
transparent images fail, since they render nothing. Dependency: Pillow.
"""
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import argparse
import datetime as dt
import hashlib
import json
import os
import sys
from PIL import Image

IMAGE_SUFFIXES = {'.webp', '.png', '.jpg', '.jpeg', '.gif'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def decode_one(argument):
    """Decode a single image in a worker process; never raises."""
    root, name = argument
    path = Path(root)/name
    try:
        data = path.read_bytes()
        if not data:
            raise ValueError('Zero-byte image file')
        # load() decodes the whole image; a truncated file fails here even
        # when its container header claims the full original length.
        with Image.open(path) as image:
            image.load()
            size = image.size
            bands = image.getbands()
            transparent = 'A' in bands and image.getchannel('A').getextrema()[1] == 0
            rgb = image.convert('RGB').getextrema()
        return dict(file=name, bytes=len(data),
                    dimensions=f'{size[0]}x{size[1]}', sha256=sha(data),
                    transparent=transparent,
                    constant=all(lo == hi for lo, hi in rgb))
    except Exception as exc:
        return dict(file=name, error=str(exc))


def qualify(root):
    root = Path(root).resolve()
    checks, assets, warnings = [], [], []

    def check(identifier, okay, detail):
        checks.append(dict(id=identifier,
                           status='PASS' if okay else 'FAIL', detail=detail))
        return okay

    check('ROOT', root.is_dir(), str(root))
    names, symlinks = [], []
    if root.is_dir():
        for path in sorted(root.rglob('*')):
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES:
                (symlinks if path.is_symlink() else names).append(
                    path.relative_to(root).as_posix())
    for name in symlinks:
        check('SYMLINK:' + name, False, 'Deployed assets must be regular files')
    check('INVENTORY', bool(names), f'{len(names)} image files found')

    workers = min(8, os.cpu_count() or 2)
    with ProcessPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(decode_one, [(str(root), n) for n in names]))

    for result in results:
        name = result['file']
        if 'error' in result:
            check('DECODE:' + name, False, result['error'])
            continue
        if result['transparent']:
            check('OPAQUE:' + name, False,
                  'Fully transparent image renders nothing')
        if result['constant']:
            warnings.append(name)
        assets.append({k: result[k]
                       for k in ('file', 'bytes', 'dimensions', 'sha256')})

    failed = any(c['status'] == 'FAIL' for c in checks)
    return dict(schema='image-asset-receipt/v1',
                scope=f'Image decode integrity under {root.name}/',
                created_utc=dt.datetime.now(dt.timezone.utc).isoformat(),
                status='FAIL' if failed else 'PASS',
                image_count=len(assets),
                checks=checks, assets=assets,
                constant_colour_warnings=warnings,
                limitations=['Decode integrity only; not a visual or layout review.',
                             'Constant-colour images are warnings, not failures.'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('qa/image-assets.json'))
    args = parser.parse_args()
    receipt = qualify(args.root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({k: receipt[k]
                      for k in ('status', 'scope', 'image_count')}))
    return 1 if receipt['status'] == 'FAIL' else 0


if __name__ == '__main__':
    sys.exit(main())
