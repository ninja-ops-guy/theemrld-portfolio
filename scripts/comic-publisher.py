#!/usr/bin/env python3
"""Manifest-bound comic imports and deployment verification (Python stdlib only)."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import struct
import sys
import tempfile
import time
import urllib.parse
import urllib.request
import zipfile

REPO = 'ninja-ops-guy/theemrld-portfolio'
BUDGET = 1_000_000_000
CHUNK = 1024 * 1024

class GateError(ValueError):
    """A release is blocked; no success or publication should be inferred."""

def need(ok: bool, message: str) -> None:
    if not ok:
        raise GateError(message)

def digest(path: Path) -> str:
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def safe_path(value: str, prefix: str) -> str:
    need(isinstance(value, str), 'Path must be a string')
    p = PurePosixPath(value)
    need(bool(re.fullmatch(r'[A-Za-z0-9_./-]+', value)) and not p.is_absolute()
         and '..' not in p.parts and str(p) == value and value.startswith(prefix),
         'Unsafe or out-of-scope asset path: ' + value)
    return value

def sha(value: str) -> None:
    need(isinstance(value, str) and bool(re.fullmatch('[a-f0-9]{64}', value)), 'Invalid SHA-256')

def file_spec(spec: dict, prefix: str) -> None:
    safe_path(spec['path'], prefix)
    sha(spec['sha256'])
    need(type(spec['bytes']) is int and 0 < spec['bytes'] <= BUDGET, 'Invalid file length')

def load_manifest(path: Path) -> dict:
    m = json.loads(path.read_text(encoding='utf-8'))
    need(m['schema_version'] in (1, 2) and m['repository'] == REPO, 'Wrong schema or repository')
    if m['schema_version'] == 2:
        return validate_v2(m)
    need(bool(re.fullmatch('[a-z0-9][a-z0-9-]{0,79}', m['id'])), 'Invalid release ID')
    source = m['source']
    need(bool(re.fullmatch('[A-Za-z0-9][A-Za-z0-9_.-]{0,119}', source['tag'])), 'Invalid source tag')
    need(bool(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,159}\.zip', source['asset'])), 'Invalid ZIP name')
    sha(source['sha256'])
    need(type(source['bytes']) is int and 0 < source['bytes'] < 2_000_000_000, 'Invalid ZIP size')
    target = m['target']
    need(bool(re.fullmatch('(?:release|publisher)/[A-Za-z0-9_./-]+', target['branch']))
         and '..' not in target['branch'] and not target['branch'].endswith('/'), 'Unsafe release branch')
    need(type(target['pr']) is int and target['pr'] > 0, 'Existing PR required')
    pdf = m['pdf']
    file_spec(pdf, 'public/techops-comic/')
    need(pdf['path'].endswith('.pdf'), 'Master must be a PDF')
    need(0 < len(pdf['parts']) <= 100, 'Invalid PDF parts')
    for part in pdf['parts']:
        file_spec(part, 'print-source/')
        need(part['bytes'] < 100_000_000, 'PDF part exceeds safe Git blob size')
    need(sum(p['bytes'] for p in pdf['parts']) == pdf['bytes'], 'PDF part sizes do not total master')
    need(type(m['page_count']) is int and 0 < m['page_count'] <= 5000
         and len(m['images']) == m['page_count'], 'Page count mismatch')
    for i, image in enumerate(m['images'], 1):
        file_spec(image, 'public/techops-comic/')
        need(PurePosixPath(image['path']).name == f'{i:03d}.webp', 'Non-contiguous numbered artwork')
        need(all(type(image[k]) is int and 0 < image[k] <= 16383 for k in ('width', 'height')), 'Invalid image dimensions')
    need(len({str(PurePosixPath(i['path']).parent) for i in m['images']}) == 1, 'Images must use one volume directory')
    names = [x['path'] for x in pdf['parts'] + m['images']]
    need(len(set(names)) == len(names) and pdf['path'] not in names, 'Duplicate or overlapping asset paths')
    need(sum(x['bytes'] for x in pdf['parts'] + m['images']) <= 2 * BUDGET, 'Expanded source exceeds safety budget')
    need(type(m['archive_gate']) is bool, 'archive_gate must be explicit')
    need(m['site_url'] in ('https://kterminal.site/', 'https://ninja-ops-guy.github.io/theemrld-portfolio/'), 'Unapproved website origin')
    return m

def validate_v2(m: dict) -> dict:
    need(bool(re.fullmatch('[a-z0-9][a-z0-9-]{0,79}', m['id'])), 'Invalid release ID')
    need(m.get('publication_policy') == 'current-only', 'Current-only publication policy required')
    catalogue = json.loads((Path(__file__).resolve().parents[1] / 'src/data/comic-publication-catalogue.json').read_text())
    need(catalogue.get('publicationPolicy') == 'current-only', 'Current-only catalogue required')
    registered = {b['id']: b['pageCount'] for b in catalogue['books']}
    need(m['edition'] in registered and m['edition'] not in ('f', 'xiii', 'legacy'), 'Unknown current edition')
    need(bool(re.fullmatch('[a-f0-9]{40}', m['base_media_commit'])), 'Immutable base media commit required')
    target, source, pdf = m['target'], m['source'], m['pdf']
    need(bool(re.fullmatch(r'(?:release|publisher)/[A-Za-z0-9_./-]+', target['branch']))
         and '..' not in target['branch'] and not target['branch'].endswith('/'), 'Unsafe release branch')
    need(type(target['pr']) is int and target['pr'] > 0, 'Existing PR required')
    need(bool(re.fullmatch('[A-Za-z0-9][A-Za-z0-9_.-]{0,119}', source['tag'])), 'Invalid source tag')
    need(bool(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,159}\.zip', source['asset'])), 'Invalid ZIP name')
    sha(source['sha256'])
    need(type(source['bytes']) is int and 0 < source['bytes'] < 2_000_000_000, 'Invalid ZIP size')
    need(pdf['path'] == 'master.pdf', 'Source master must be master.pdf')
    need(bool(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,159}\.pdf', pdf['filename'])), 'Invalid master filename')
    file_spec(pdf, 'master.pdf')
    need(type(m['page_count']) is int and 0 < m['page_count'] <= 5000
         and len(m['images']) == m['page_count'], 'Page count mismatch')
    for i, spec in enumerate(m['images'], 1):
        file_spec(spec, 'techops-comic/')
        need(PurePosixPath(spec['path']).name == f'{i:03d}.webp', 'Non-contiguous numbered artwork')
        need(all(type(spec[k]) is int and 0 < spec[k] <= 16383 for k in ('width', 'height')), 'Invalid image dimensions')
    need(len({str(PurePosixPath(i['path']).parent) for i in m['images']}) == 1, 'Images must use one volume directory')
    need(sum(x['bytes'] for x in m['images']) + pdf['bytes'] <= 2 * BUDGET, 'Expanded source exceeds safety budget')
    changed = m['changed_pages']
    need(isinstance(changed, list) and changed and all(type(n) is int and 1 <= n <= m['page_count'] for n in changed)
         and changed == sorted(set(changed)), 'Changed pages must be unique sorted page numbers')
    for field in ('content_revision', 'compatibility_revision'):
        need(bool(re.fullmatch('[a-z0-9][a-z0-9-]{0,119}', m[field])), 'Invalid revision identity')
    corrections = m['corrections']
    need(isinstance(corrections, list) and corrections, 'Explicit correction dispositions required')
    need(len({c['id'] for c in corrections}) == len(corrections), 'Duplicate correction ID')
    for correction in corrections:
        need(isinstance(correction.get('id'), str) and 0 < len(correction['id']) <= 120, 'Invalid correction ID')
        need(correction.get('status') in ('included', 'not_applicable'), 'Unresolved correction blocks registration')
        need(isinstance(correction.get('evidence'), str) and 0 < len(correction['evidence']) <= 2000, 'Correction evidence required')
    need(m['site_url'] in ('https://kterminal.site/', 'https://ninja-ops-guy.github.io/theemrld-portfolio/'), 'Unapproved website origin')
    need(m['reader_path'] == '/#/comic?edition=' + m['edition'] + '&page={page}', 'Unapproved reader route')
    return m


def source_specs(m: dict) -> list[dict]:
    if m['schema_version'] == 2:
        return [m['pdf']] + [m['images'][n - 1] for n in m['changed_pages']]
    return m['pdf']['parts'] + m['images']


def verify_source(m: dict, root: Path) -> None:
    if m['schema_version'] != 2:
        verify_tree(m, root)
        return
    for spec in source_specs(m):
        path = joined(root, spec['path'])
        verify_file(path, spec)
        if spec['path'] != 'master.pdf':
            need(webp_dimensions(path) == (spec['width'], spec['height']), 'Image dimensions changed')
    with (root / 'master.pdf').open('rb') as f:
        need(f.read(5) == b'%PDF-', 'Master has no PDF header')


def verify_publication(m: dict, root: Path) -> dict:
    pub = json.loads((root / 'techops-comic/publication.json').read_text())
    need(pub.get('earlierEditionsPublic') is False, 'Earlier website editions must remain retired')
    book = next((b for b in pub['books'] if b['id'] == m['edition']), None)
    need(book is not None, 'Published edition missing')
    media = book.get('mediaCommit', '')
    need(bool(re.fullmatch('[a-f0-9]{40}', media)), 'Immutable edition media commit required')
    need(book['pageCount'] == m['page_count'] and book['pdfSha256'] == m['pdf']['sha256'], 'Published master identity mismatch')
    need(book.get('publisherRelease') == m['id'] and book.get('contentRevision') == m['content_revision'], 'Published release identity mismatch')
    prefix = 'https://raw.githubusercontent.com/' + REPO + '/' + media + '/'
    expected_base = prefix + str(PurePosixPath(m['images'][0]['path']).parent) + '/'
    expected_pdf = 'https://github.com/' + REPO + '/releases/download/' + m['source']['tag'] + '/' + m['pdf']['filename']
    need(book.get('imageBase') == expected_base and book['pdfUrl'] == expected_pdf, 'Published source URLs mismatch')
    return book


def joined(root: Path, name: str) -> Path:
    root = root.resolve()
    p = root / name
    for part in [p, *p.parents]:
        if part == root:
            break
        need(not part.is_symlink(), 'Symlink in output path: ' + name)
    need(p.resolve().is_relative_to(root), 'Output escaped its root')
    return p

def webp_dimensions(path: Path) -> tuple[int, int]:
    with path.open('rb') as f:
        head = f.read(12)
        need(len(head) == 12 and head[:4] == b'RIFF' and head[8:] == b'WEBP', 'Not a WebP: ' + str(path))
        need(struct.unpack('<I', head[4:8])[0] + 8 == path.stat().st_size, 'Malformed WebP container')
        while header := f.read(8):
            need(len(header) == 8, 'Truncated WebP chunk')
            kind, length = header[:4], int.from_bytes(header[4:], 'little')
            data = f.read(min(length, 10))
            need(len(data) == min(length, 10), 'Truncated WebP data')
            if kind == b'VP8X' and length >= 10:
                return int.from_bytes(data[4:7], 'little') + 1, int.from_bytes(data[7:10], 'little') + 1
            if kind == b'VP8 ' and length >= 10 and data[3:6] == b'\x9d\x01\x2a':
                return int.from_bytes(data[6:8], 'little') & 16383, int.from_bytes(data[8:10], 'little') & 16383
            if kind == b'VP8L' and length >= 5 and data[0] == 47:
                bits = int.from_bytes(data[1:5], 'little')
                return (bits & 16383) + 1, ((bits >> 14) & 16383) + 1
            f.seek(length - len(data) + (length % 2), 1)
    raise GateError('WebP has no image header')

def verify_file(path: Path, spec: dict) -> None:
    need(path.is_file() and not path.is_symlink(), 'Missing regular file: ' + str(path))
    need(path.stat().st_size == spec['bytes'], 'Byte count mismatch: ' + str(path))
    need(digest(path) == spec['sha256'], 'SHA-256 mismatch: ' + str(path))

def verify_tree(m: dict, root: Path, built: bool = False) -> None:
    if m['schema_version'] == 2 and built:
        verify_publication(m, root)
        return
    for image in m['images']:
        name = image['path'][7:] if built else image['path']
        p = joined(root, name)
        verify_file(p, image)
        need(webp_dimensions(p) == (image['width'], image['height']), 'Image dimensions changed: ' + name)
    if m['schema_version'] == 2:
        return
    if built:
        p = joined(root, m['pdf']['path'][7:])
        verify_file(p, m['pdf'])
        with p.open('rb') as f:
            need(f.read(5) == b'%PDF-', 'Master has no PDF header')
    else:
        h = hashlib.sha256()
        for i, part in enumerate(m['pdf']['parts']):
            p = joined(root, part['path'])
            verify_file(p, part)
            with p.open('rb') as f:
                if i == 0:
                    need(f.read(5) == b'%PDF-', 'Source has no PDF header')
                    f.seek(0)
                while block := f.read(CHUNK):
                    h.update(block)
        need(h.hexdigest() == m['pdf']['sha256'], 'Assembled PDF differs from approved master')

def extract(m: dict, archive: Path, root: Path) -> None:
    verify_file(archive, m['source'])
    specs = {s['path']: s for s in source_specs(m)}
    # Nothing is copied to the repository until every archived file is verified.
    with tempfile.TemporaryDirectory(prefix='comic-verified-') as tmp:
        stage = Path(tmp)
        with zipfile.ZipFile(archive) as z:
            entries = z.infolist()
            need(len(entries) <= len(specs) + 100, 'Too many ZIP entries')
            names = [i.filename for i in entries if not i.is_dir()]
            need(len(names) == len(set(names)) and set(names) == set(specs), 'ZIP must contain exactly the declared files')
            for entry in entries:
                need(not entry.flag_bits & 1, 'Encrypted ZIP entries unsupported')
                mode = entry.external_attr >> 16
                need(stat.S_IFMT(mode) in (0, stat.S_IFREG, stat.S_IFDIR), 'ZIP contains special files or symlinks')
                if entry.is_dir():
                    need(any(n.startswith(entry.filename) for n in specs), 'Unexpected ZIP directory')
                    continue
                spec = specs[entry.filename]
                need(entry.file_size == spec['bytes'], 'Unexpected expanded size')
                p = joined(stage, entry.filename)
                p.parent.mkdir(parents=True, exist_ok=True)
                with z.open(entry) as src, p.open('wb') as dst:
                    shutil.copyfileobj(src, dst, CHUNK)
            verify_source(m, stage)
        # Preflight all destination paths before performing the first copy.
        for name in specs:
            joined(root, name)
        for name in specs:
            p = joined(root, name)
            p.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(stage / name, p)
    verify_source(m, root)

def size_gate(root: Path) -> int:
    need(root.is_dir(), 'Build output is missing')
    total = 0
    for p in root.rglob('*'):
        need(not p.is_symlink(), 'Symlinks are not allowed in the deployment')
        if p.is_file():
            total += p.stat().st_size
    need(total <= BUDGET, f'PAGES_CAPACITY_BLOCKED: {total:,} bytes > {BUDGET:,}; no files were silently deleted')
    return total

def marker(root: Path, commit: str, m: dict | None = None) -> dict:
    need(bool(re.fullmatch('[a-f0-9]{40}', commit)), 'Exact deployment commit required')
    if m:
        verify_tree(m, root, built=True)
    state = {'schema_version': 1, 'commit': commit, 'repository': REPO,
             'release_id': m['id'] if m else None,
             'pdf_sha256': m['pdf']['sha256'] if m else None,
             'page_count': m['page_count'] if m else None,
             'status': 'BUILT_NOT_YET_LIVE'}
    if m and m['schema_version'] == 2:
        book = verify_publication(m, root)
        verify_remote(m, book['mediaCommit'])
        state.update(media_commit=book['mediaCommit'], pdf_url=book['pdfUrl'], image_base=book['imageBase'])
    p = root / 'publishing/deployment.json'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(state, sort_keys=True) + '\n')
    size_gate(root)
    return state

class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        u = urllib.parse.urlsplit(newurl)
        need(u.scheme == 'https' and u.hostname and not u.username and not u.password,
             'Unsafe live-download redirect')
        need(u.hostname in ('kterminal.site', 'ninja-ops-guy.github.io', 'github.com')
             or u.hostname.endswith('.githubusercontent.com'), 'Unexpected redirect host')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def live_file(url: str, spec: dict) -> None:
    req = urllib.request.Request(url, headers={'User-Agent': 'TechOps-Publisher/1.0', 'Accept-Encoding': 'identity'})
    with urllib.request.build_opener(SafeRedirect()).open(req, timeout=45) as r:
        need(r.status == 200, 'Live asset did not return HTTP 200')
        h, total = hashlib.sha256(), 0
        while b := r.read(CHUNK):
            total += len(b)
            need(total <= spec['bytes'], 'Live file exceeds approved size')
            h.update(b)
    need(total == spec['bytes'] and h.hexdigest() == spec['sha256'], 'Live bytes differ: ' + url)

def verify_remote(m: dict, media: str) -> None:
    need(bool(re.fullmatch('[a-f0-9]{40}', media)), 'Immutable media identity required')
    prefix = 'https://raw.githubusercontent.com/' + REPO + '/' + media + '/'
    assets = [(prefix + spec['path'], spec) for spec in m['images']]
    assets += [('https://github.com/' + REPO + '/releases/download/' + m['source']['tag'] + '/' + m['pdf']['filename'], m['pdf'])]
    for url, spec in assets:
        for attempt in range(3):
            try:
                live_file(url, spec)
                break
            except (OSError, ValueError):
                if attempt == 2:
                    raise
                time.sleep(3)


def verify_live(base: str, commit: str, m: dict | None) -> None:
    need(base in ('https://kterminal.site/', 'https://ninja-ops-guy.github.io/theemrld-portfolio/'), 'Unapproved live origin')
    need(bool(re.fullmatch('[a-f0-9]{40}', commit)), 'Exact commit required')
    url = base + 'publishing/deployment.json?commit=' + commit
    for attempt in range(12):
        try:
            with urllib.request.build_opener(SafeRedirect()).open(url, timeout=30) as r:
                got = json.loads(r.read(16384))
            need(got['commit'] == commit and got['repository'] == REPO, 'Stale live deployment marker')
            if m:
                need(got['release_id'] == m['id'] and got['pdf_sha256'] == m['pdf']['sha256'], 'Wrong live release marker')
            break
        except (OSError, ValueError, KeyError):
            if attempt == 11:
                raise GateError('LIVE_VERIFICATION_BLOCKED: exact deployed commit not observable')
            time.sleep(10)
    if m:
        if m['schema_version'] == 2:
            media = got.get('media_commit', '')
            need(bool(re.fullmatch('[a-f0-9]{40}', media)), 'Live media commit missing')
            image_base = 'https://raw.githubusercontent.com/' + REPO + '/' + media + '/'
            pdf_url = 'https://github.com/' + REPO + '/releases/download/' + m['source']['tag'] + '/' + m['pdf']['filename']
            specs = [(image_base + spec['path'], spec) for spec in m['images']] + [(pdf_url, m['pdf'])]
            need(got.get('pdf_url') == pdf_url, 'Wrong live master URL')
        else:
            specs = [(base + spec['path'][7:] + '?release=' + m['id'], spec) for spec in m['images'] + [m['pdf']]]
        for file_url, spec in specs:
            for attempt in range(3):
                try:
                    live_file(file_url, spec)
                    break
                except (OSError, ValueError):
                    if attempt == 2:
                        raise
                    time.sleep(3)

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=['check', 'extract', 'verify-tree', 'verify-dist', 'stamp', 'live'])
    p.add_argument('--manifest', type=Path)
    p.add_argument('--root', type=Path, default=Path('.'))
    p.add_argument('--archive', type=Path)
    p.add_argument('--commit')
    p.add_argument('--url', default='https://kterminal.site/')
    args = p.parse_args()
    m = load_manifest(args.manifest) if args.manifest else None
    need(m is not None or args.command in ('stamp', 'live'), 'Manifest is required')
    if args.command == 'extract':
        need(args.archive is not None, 'Archive is required')
        extract(m, args.archive, args.root)
    elif args.command == 'verify-tree':
        verify_tree(m, args.root)
    elif args.command == 'verify-dist':
        verify_tree(m, args.root, built=True)
        size_gate(args.root)
    elif args.command == 'stamp':
        marker(args.root, args.commit, m)
    elif args.command == 'live':
        verify_live(args.url, args.commit, m)
    print(json.dumps({'command': args.command, 'release_id': m['id'] if m else None, 'result': 'PASS'}))

if __name__ == '__main__':
    try:
        main()
    except (GateError, KeyError, OSError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        print(f'PUBLISHING_BLOCKED: {exc}', file=sys.stderr)
        sys.exit(2)
