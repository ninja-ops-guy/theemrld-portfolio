#!/usr/bin/env python3
"""Stage a registered immutable-media revision; never merge or deploy it."""
from __future__ import annotations
import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

REPO = 'ninja-ops-guy/theemrld-portfolio'
MARKER = '.publisher-source.json'

class StageError(ValueError):
    pass

def need(condition, message):
    if not condition:
        raise StageError(message)

def digest(path):
    with Path(path).open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()

def verifier():
    spec = importlib.util.spec_from_file_location('comic_publisher', Path(__file__).with_name('comic-publisher.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def binding(m, manifest_hash):
    return {'schema_version': 1, 'release_id': m['id'], 'manifest_sha256': manifest_hash,
            'source_sha256': m['source']['sha256'], 'base_media_commit': m['base_media_commit']}

def bind_book(current, m, media_commit):
    """Return a minimal book-only update; unrelated books and global pins stay intact."""
    need(re.fullmatch('[a-f0-9]{40}', media_commit), 'Invalid immutable media commit')
    updated = copy.deepcopy(current)
    book = updated['books'].get(m['edition'])
    need(book is not None, 'Register a reader book before staging')
    need(book.get('mediaCommit', current.get('mediaCommit')) == m['base_media_commit']
         or (book.get('publisherRelease') == m['id'] and book.get('mediaCommit') == media_commit), 'Current book media differs from approved base')
    need(book['pageCount'] == m['page_count'], 'Page count changes need a reviewed reader migration')
    need(book['revision'] == m['compatibility_revision'], 'Reader compatibility revision changed')
    folder = str(Path(m['images'][0]['path']).parent) + '/'
    need(book['imagePath'] == folder, 'Reader image directory changed')
    need(all((i['width'], i['height']) == (book['width'], book['height']) for i in m['images']),
         'Reader dimensions changed')
    tag = m['source']['tag']
    book.update(mediaCommit=media_commit, releaseTag=tag,
                publisherRelease=m['id'], contentRevision=m['content_revision'], revision=m['compatibility_revision'],
                imageBase=f'https://raw.githubusercontent.com/{REPO}/{media_commit}/{folder}',
                pdfUrl=f'https://github.com/{REPO}/releases/download/{tag}/{m["pdf"]["filename"]}',
                pdfFilename=m['pdf']['filename'], pdfSha256=m['pdf']['sha256'], pdfBytes=m['pdf']['bytes'])
    return updated

class Commands:
    def run(self, args, cwd=None, input=None):
        result = subprocess.run(args, cwd=cwd, input=input, text=True, capture_output=True, timeout=1800)
        # Do not echo stderr: authenticated git/gh failures can contain credentials or signed URLs.
        if result.returncode:
            raise StageError(f'Command failed ({result.returncode}): {args[0]} {args[1] if len(args)>1 else ""}; inspect its service status before retrying')
        return result.stdout.strip()

    def git(self, directory, *args):
        return self.run(['git', *args], cwd=directory)

    def api(self, path):
        return json.loads(self.run(['gh', 'api', f'repos/{REPO}/{path}']))

    def optional_ref(self, branch):
        # Listing exact refs avoids confusing 403/network errors with a missing ref.
        refs = self.api('git/matching-refs/heads/' + branch)
        exact = [ref for ref in refs if ref['ref'] == 'refs/heads/' + branch]
        need(len(exact) <= 1, 'Ambiguous media ref')
        return exact[0]['object']['sha'] if exact else None

    def release(self, tag):
        return self.api('releases/tags/' + tag)

    def assets(self, release_id):
        values = []
        for page in range(1, 101):
            batch = self.api(f'releases/{release_id}/assets?per_page=100&page={page}')
            values.extend(batch)
            if len(batch) < 100:
                return values
        raise StageError('Too many source assets; refusing incomplete inspection')

    def download(self, tag, name, directory):
        self.run(['gh', 'release', 'download', tag, '--repo', REPO, '--pattern', name, '--dir', str(directory)])

    def upload(self, tag, path):
        self.run(['gh', 'release', 'upload', tag, str(path), '--repo', REPO])


def verify_pdf_asset(commands, m, master):
    """Reuse exact bytes, upload absent bytes once, and verify independent readback."""
    need(Path(master).is_file() and Path(master).stat().st_size == m['pdf']['bytes']
         and digest(master) == m['pdf']['sha256'], 'Local master does not match approved manifest')
    release = commands.release(m['source']['tag'])
    need(release.get('tag_name') == m['source']['tag'] and not release.get('draft')
         and release.get('prerelease') is True, 'Source must be the registered public prerelease')
    matches = [asset for asset in commands.assets(release['id']) if asset['name'] == m['pdf']['filename']]
    need(len(matches) <= 1, 'Duplicate master assets')
    if matches:
        need(matches[0]['size'] == m['pdf']['bytes'] and matches[0].get('state') == 'uploaded',
             'Existing master differs or upload is incomplete; no overwrite attempted')
    with tempfile.TemporaryDirectory(prefix='comic-master-') as tmp:
        root = Path(tmp)
        if not matches:
            upload = root / m['pdf']['filename']
            shutil.copyfile(master, upload)
            commands.upload(m['source']['tag'], upload)
        readback = root / 'readback'
        readback.mkdir()
        commands.download(m['source']['tag'], m['pdf']['filename'], readback)
        actual = readback / m['pdf']['filename']
        need(actual.is_file() and actual.stat().st_size == m['pdf']['bytes']
             and digest(actual) == m['pdf']['sha256'], 'Master readback does not match; publication blocked')
    return release['id']


def cas_push(commands, directory, branch, expected):
    """Lease is an atomic compare-and-swap, never permission to rewrite history."""
    need(re.fullmatch(r'(?:release|publisher)/[A-Za-z0-9_./-]+', branch)
         and '..' not in branch and not branch.endswith('/'), 'Unsafe push branch')
    need(expected == '' or re.fullmatch('[a-f0-9]{40}', expected), 'Invalid expected push head')
    need(commands.optional_ref(branch) == (expected or None), 'Push lease is stale; inspect remote state')
    if expected:
        # A lease alone would permit a rewrite. Prove fast-forward ancestry first.
        commands.git(directory, 'merge-base', '--is-ancestor', expected, 'HEAD')
    # Empty expected value creates only an absent ref, even if one appears mid-run.
    commands.git(directory, 'push', f'--force-with-lease=refs/heads/{branch}:{expected}',
                 'origin', f'HEAD:refs/heads/{branch}')


def clean_checkout(commands, directory):
    need(not commands.git(directory, 'status', '--porcelain', '--untracked-files=all'), 'Staging checkout must be clean')
    remote = commands.git(directory, 'remote', 'get-url', 'origin')
    need(remote in (f'https://github.com/{REPO}', f'https://github.com/{REPO}.git',
                    f'git@github.com:{REPO}.git'), 'Unexpected Git remote')


def stage(manifest_path, archive, candidate, media, receipt_path, expected_head, commands=None, checks=None):
    need(isinstance(expected_head, str) and re.fullmatch('[a-f0-9]{40}', expected_head),
         'Exact reviewed PR head is required')
    commands = commands or Commands()
    checks = checks or verifier()
    manifest_path = Path(manifest_path)
    m = checks.load_manifest(manifest_path)
    need(m['schema_version'] == 2 and not m.get('disabled', False) and m.get('enabled') is not False
         and not m.get('retired') and m.get('lifecycle') != 'retired', 'Only enabled immutable-media manifests may stage')
    mh = digest(manifest_path)
    expected = binding(m, mh)
    candidate, media = Path(candidate).resolve(), Path(media).resolve()
    need(candidate != media and candidate not in media.parents and media not in candidate.parents,
         'Candidate and media checkouts must be separate')
    clean_checkout(commands, candidate)
    clean_checkout(commands, media)
    need(commands.git(media, 'rev-parse', 'HEAD') == m['base_media_commit'], 'Wrong starting media snapshot')
    pr = commands.api(f'pulls/{m["target"]["pr"]}')
    need(pr['state'] == 'open' and not pr.get('merged') and pr['head']['repo']['full_name'] == REPO
         and pr['head']['ref'] == m['target']['branch'] and pr['base']['ref'] == 'main', 'Target PR identity/state changed')
    need(pr['head']['sha'] == expected_head, 'Target PR head changed from reviewed snapshot; re-resolve before staging')
    original_head = expected_head
    # Candidate may include a merge of pinned main, but must retain the inspected PR head.
    commands.git(candidate, 'merge-base', '--is-ancestor', original_head, 'HEAD')
    current_path = candidate / 'src/data/comic-current-editions.json'
    current = json.loads(current_path.read_text())
    branch = 'publisher/media/' + m['id']
    existing = commands.optional_ref(branch)
    # Validate metadata before any external write; existing source is verified below.
    bind_book(current, m, existing or m['base_media_commit'])
    with tempfile.TemporaryDirectory(prefix='comic-source-') as tmp:
        source = Path(tmp)
        checks.extract(m, Path(archive), source)
        if existing:
            commands.git(media, 'fetch', '--no-tags', 'origin', existing)
            commands.git(media, 'checkout', '--detach', existing)
            marker = media / MARKER
            need(marker.is_file() and json.loads(marker.read_text()) == expected,
                 'Release ID already has a different immutable media binding')
            checks.verify_tree(m, media)
            allowed = {MARKER, *(m['images'][i - 1]['path'] for i in m['changed_pages'])}
            altered = set(commands.git(media, 'diff', '--name-only', m['base_media_commit'], existing).splitlines())
            need(altered <= allowed, 'Existing immutable source modifies undeclared files')
            media_commit = existing
        else:
            for number in m['changed_pages']:
                image = m['images'][number - 1]
                target = media / image['path']
                # Parent validator rejects unsafe paths; also refuse checkout symlinks.
                for item in (target, *target.parents):
                    if item == media:
                        break
                    need(not item.is_symlink(), 'Symlink in media destination')
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source / image['path'], target)
            checks.verify_tree(m, media)
            (media / MARKER).write_text(json.dumps(expected, sort_keys=True, indent=2) + '\n')
            commands.git(media, 'config', 'user.name', 'github-actions[bot]')
            commands.git(media, 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
            commands.git(media, 'add', '--', MARKER, *(m['images'][i - 1]['path'] for i in m['changed_pages']))
            commands.git(media, 'commit', '-m', 'Stage immutable comic media ' + m['id'])
            media_commit = commands.git(media, 'rev-parse', 'HEAD')
        updated = bind_book(current, m, media_commit)
        # Inspect the target again before the first remote write.
        need(commands.api(f'pulls/{m["target"]["pr"]}')['head']['sha'] == original_head,
             'Target moved during staging; no candidate push attempted')
        verify_pdf_asset(commands, m, source / m['pdf']['path'])
        if not existing:
            need(commands.optional_ref(branch) is None, 'Another media staging appeared; inspect before retrying')
            cas_push(commands, media, branch, '')
        need(commands.optional_ref(branch) == media_commit, 'Immutable media ref readback mismatch')
        current_path.write_text(json.dumps(updated, indent=2, ensure_ascii=False) + '\n')
        commands.git(candidate, 'config', 'user.name', 'github-actions[bot]')
        commands.git(candidate, 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
        commands.git(candidate, 'add', '--', 'src/data/comic-current-editions.json')
        if commands.git(candidate, 'diff', '--cached', '--name-only'):
            commands.git(candidate, 'commit', '-m', 'Bind verified comic source ' + m['id'])
        need(commands.api(f'pulls/{m["target"]["pr"]}')['head']['sha'] == original_head,
             'Target moved before push; verified assets retained, inspect before retrying')
        head = commands.git(candidate, 'rev-parse', 'HEAD')
        cas_push(commands, candidate, m['target']['branch'], original_head)
        need(commands.api(f'pulls/{m["target"]["pr"]}')['head']['sha'] == head, 'Candidate push readback mismatch')
    receipt = dict(expected, status='STAGED_NOT_PUBLISHED', head=head, media_commit=media_commit,
                   source_tag=m['source']['tag'], pdf_sha256=m['pdf']['sha256'], pr=m['target']['pr'])
    Path(receipt_path).write_text(json.dumps(receipt, indent=2) + '\n')
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('manifest', 'archive', 'candidate', 'media', 'receipt'):
        parser.add_argument('--' + key, type=Path, required=True)
    parser.add_argument('--expected-head', required=True)
    args = parser.parse_args()
    print(json.dumps(stage(args.manifest, args.archive, args.candidate, args.media, args.receipt, args.expected_head)))

if __name__ == '__main__':
    try:
        main()
    except (StageError, ValueError, KeyError, OSError, subprocess.TimeoutExpired) as exc:
        print('STAGING_BLOCKED: ' + str(exc), file=sys.stderr)
        sys.exit(2)
