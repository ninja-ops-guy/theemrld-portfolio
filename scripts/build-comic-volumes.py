#!/usr/bin/env python3
"""Build volume-scoped reading images from the current, immutable Full Collection."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from http.client import IncompleteRead
from io import BytesIO
import json
from pathlib import Path
import re
from time import sleep
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW_BASE = 'https://raw.githubusercontent.com/ninja-ops-guy/theemrld-portfolio/'


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def page_sources(book, release, folders):
    if (release['id'] != book['publisherRelease'] or release['edition'] != 'g'
            or release['page_count'] != book['pageCount']
            or release['pdf']['sha256'] != book['pdfSha256']):
        raise ValueError('Full Collection source does not match the published book')

    entries = release['images']
    by_path = {entry['path']: entry for entry in entries}
    if len(entries) != book['pageCount'] or len(by_path) != len(entries):
        raise ValueError('Incomplete or duplicate Full Collection source images')

    page = 1
    for section in book['sections']:
        folder = folders[section['label']]
        if not re.fullmatch(r'[a-z0-9-]+', folder):
            raise ValueError(f'Invalid collection folder: {folder}')
        if section['start'] != page or not page <= section['end'] <= book['pageCount']:
            raise ValueError(f'Invalid Full Collection section boundary at page {page}')
        for page in range(section['start'], section['end'] + 1):
            filename = f'{page:03d}.webp'
            yield folder, filename, by_path[book['imagePath'] + filename]
        page = section['end'] + 1
    if page != book['pageCount'] + 1:
        raise ValueError('Full Collection sections do not cover every page')


def download(url, spec):
    request = Request(url, headers={'User-Agent': 'TechOps-Comic-Pages-Build'})
    for attempt in range(3):
        try:
            with urlopen(request, timeout=45) as response:
                data = response.read(spec['bytes'] + 1)
            if len(data) == spec['bytes'] and sha256(data).hexdigest() == spec['sha256']:
                return data
            raise ValueError(f'Comic source size or SHA-256 mismatch: {url}')
        except (OSError, IncompleteRead) as error:
            if attempt == 2 or (isinstance(error, HTTPError) and error.code not in (429, 500, 502, 503, 504)):
                raise RuntimeError(f'Could not fetch comic source: {url}') from error
            sleep(2 ** attempt)


def encode_reader_image(data, spec, width, quality):
    output = BytesIO()
    with Image.open(BytesIO(data)) as image:
        if image.format != 'WEBP' or image.size != (spec['width'], spec['height']):
            raise ValueError(f"Wrong source format or dimensions: {spec['path']}")
        size = (width, round(image.height * width / image.width))
        fitted = image.resize(size, Image.Resampling.LANCZOS, reducing_gap=2.0)
        fitted.save(output, format='WEBP', quality=quality, method=4,
                    icc_profile=image.info.get('icc_profile', b''))
    return output.getvalue()


def build_collection(dist, root=ROOT):
    layout = read_json(root / 'src/data/comic-collection-serving.json')
    book = read_json(root / 'src/data/comic-current-editions.json')['books']['g']
    commit = book['mediaCommit']
    release_id = book['publisherRelease']
    if not re.fullmatch(r'[a-f0-9]{40}', commit) or not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,79}', release_id):
        raise ValueError('Full Collection requires an immutable source pin')
    if book['imageBase'] != f"{RAW_BASE}{commit}/{book['imagePath']}":
        raise ValueError('Full Collection image URL does not match its source pin')
    release = read_json(root / f'publishing/releases/{release_id}.json')
    pages = list(page_sources(book, release, layout['folders']))
    output_dir = dist / layout['directory'] / commit
    width = layout['width']

    def write_page(page):
        folder, filename, spec = page
        url = book['imageBase'] + filename
        data = download(url, spec)
        encoded = encode_reader_image(data, spec, width, layout['quality'])
        target = output_dir / folder / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix('.tmp')
        temporary.write_bytes(encoded)
        temporary.replace(target)
        return len(encoded)

    with ThreadPoolExecutor(max_workers=8) as workers:
        sizes = list(workers.map(write_page, pages))
    original_bytes = sum(spec['bytes'] for _, _, spec in pages)
    reader_bytes = sum(sizes)
    if reader_bytes >= original_bytes:
        raise ValueError('Full Collection reading copies must reduce the transferred bytes')

    receipt = {
        'mediaCommit': commit,
        'pageCount': len(pages),
        'width': width,
        'originalBytes': original_bytes,
        'readerBytes': reader_bytes,
        'volumes': [
            {**section, 'folder': layout['folders'][section['label']]}
            for section in book['sections']
        ],
    }
    (output_dir / 'index.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(f"Full Collection: {len(pages)} pages in {len(set(folder for folder, _, _ in pages))} folders, "
          f"{reader_bytes:,} reader bytes vs. {original_bytes:,} source bytes.")
    return receipt


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', type=Path, default=ROOT / 'dist')
    build_collection(parser.parse_args().dist)
