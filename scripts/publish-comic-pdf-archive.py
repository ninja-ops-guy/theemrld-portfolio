"""Publish only the three owner-approved historical PDF assets, never latest."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

REPOSITORY = 'ninja-ops-guy/theemrld-portfolio'
TAG = 'techops-hero-pdf-archive-20261110'
SOURCE = '558244a8fc55358fdaf816d3a384ae1cb8bed131'


def gh(*args):
    return subprocess.check_output(['gh', *args], text=True)


def verify(path, entry):
    sha = hashlib.sha256()
    size = 0
    with path.open('rb') as stream:
        while chunk := stream.read(1024 * 1024):
            size += len(chunk)
            sha.update(chunk)
    if size != entry['bytes'] or sha.hexdigest() != entry['sha256']:
        raise ValueError(f'Archive integrity mismatch: {path.name}')


def main():
    manifest = json.loads(Path('docs/COMIC_PDF_ARCHIVES.json').read_text())
    if manifest['archive_tag'] != TAG or manifest['source_commit'] != SOURCE:
        raise ValueError('Unexpected archive identity')
    entries = manifest['archives']
    expected = {
        'techops-comic/TechOps-Hero-Revision-11.pdf',
        'techops-comic/TechOps-Hero-Revision-11.1.pdf',
        'techops-comic/TechOps-Hero-Revision-F-Annotation-Update-315-Pages.pdf',
    }
    if len(entries) != 3 or {entry['path'] for entry in entries} != expected:
        raise ValueError('Unexpected archive file set')
    for entry in entries:
        verify(Path('public') / entry['path'], entry)
    # Use the release list to distinguish absence from a failed authenticated request.
    releases = json.loads(gh('api', '--paginate', '--slurp', f'repos/{REPOSITORY}/releases?per_page=100'))
    release = next((r for page in releases for r in page if r['tag_name'] == TAG), None)
    if release is None:
        body = ('Historical reading PDFs preserved byte-for-byte. These are superseded editions, '
                'not new comic revisions. The 315-page annotation update is separate from the '
                'current 316-page Revision F collection. Current reader: https://kterminal.site/#/comic\n\n')
        body += '\n'.join(f'- {Path(e["path"]).name}: {e["bytes"]:,} bytes; SHA-256 `{e["sha256"]}`' for e in entries)
        with tempfile.TemporaryDirectory() as temp:
            notes = Path(temp) / 'release-notes.md'
            notes.write_text(body)
            gh('release', 'create', TAG, '--repo', REPOSITORY, '--target', SOURCE,
               '--title', 'TechOps Hero — historical reading PDFs (November 10, 2026)',
               '--notes-file', str(notes), '--draft', '--latest=false')
        release = json.loads(gh('api', f'repos/{REPOSITORY}/releases/tags/{TAG}'))
    refs = json.loads(gh('api', f'repos/{REPOSITORY}/git/matching-refs/tags/{TAG}'))
    target = next((ref for ref in refs if ref['ref'] == f'refs/tags/{TAG}'), None)
    if target is not None:
        if target['object']['type'] != 'commit' or target['object']['sha'] != SOURCE:
            raise ValueError('Archive tag is not pinned to the approved source commit')
    elif not release['draft'] or release['target_commitish'] != SOURCE:
        raise ValueError('New draft tag must target the approved source commit')
    names = {Path(e['path']).name for e in entries}
    assets = {asset['name']: asset for asset in release['assets']}
    if set(assets) - names:
        raise ValueError('Unexpected asset in this archive release')
    for entry in entries:
        name = Path(entry['path']).name
        if name not in assets:
            if not release['draft']:
                raise ValueError('Refusing to modify an incomplete published archive')
            gh('release', 'upload', TAG, str(Path('public') / entry['path']), '--repo', REPOSITORY)
    # Read back every uploaded asset before publishing. Never overwrite an existing asset.
    with tempfile.TemporaryDirectory() as temp:
        gh('release', 'download', TAG, '--repo', REPOSITORY, '--dir', temp)
        for entry in entries:
            verify(Path(temp) / Path(entry['path']).name, entry)
    if release['draft']:
        gh('release', 'edit', TAG, '--repo', REPOSITORY, '--draft=false', '--latest=false')
    final = json.loads(gh('api', f'repos/{REPOSITORY}/releases/tags/{TAG}'))
    if final['draft'] or final['prerelease']:
        raise ValueError('Archive publication did not complete')
    target = json.loads(gh('api', f'repos/{REPOSITORY}/git/ref/tags/{TAG}'))
    if target['object']['type'] != 'commit' or target['object']['sha'] != SOURCE:
        raise ValueError('Published archive tag does not match approved source')
    latest = json.loads(gh('api', f'repos/{REPOSITORY}/releases/latest'))
    if latest['tag_name'] == TAG:
        raise ValueError('Historical archive must not be marked latest')
    print('Published and verified exact historical PDFs:', final['html_url'])
    for asset in final['assets']:
        print(asset['name'], asset['size'], asset['browser_download_url'])


if __name__ == '__main__':
    main()
