"""Exclude historical PDFs only after byte and public-link preservation checks."""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.error
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def checked_path(root, relative):
    candidate = (root / relative).resolve()
    if not candidate.is_relative_to(root.resolve()):
        raise ValueError(f'Path outside deployment: {relative}')
    return candidate


def digest(stream):
    size = 0
    sha = hashlib.sha256()
    while chunk := stream.read(1024 * 1024):
        size += len(chunk)
        sha.update(chunk)
    return size, sha.hexdigest()


def verify_local(root, entry):
    with checked_path(root, entry['path']).open('rb') as stream:
        size, sha = digest(stream)
    if size != entry['bytes'] or (entry.get('sha256') and sha != entry['sha256']):
        raise ValueError(f'Local PDF integrity mismatch: {entry["path"]}')


def verify_archive(entry):
    request = urllib.request.Request(entry['archive_url'], headers={'Accept': 'application/pdf'})
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.status != 200:
            raise ValueError('Archive did not return HTTP 200')
        size, sha = digest(response)
    if (size, sha) != (entry['bytes'], entry['sha256']):
        raise ValueError(f'Public archive differs from original: {entry["path"]}')


def verify_redirect(source, destination, statuses):
    request = urllib.request.Request(source, method='HEAD')
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=30) as response:
            status, location = response.status, response.headers.get('Location')
    except urllib.error.HTTPError as error:
        status, location = error.code, error.headers.get('Location')
        error.close()
    if status not in statuses or location != destination:
        raise ValueError(f'Required redirect missing: {source} -> {destination}; got {status} {location}')


def prepare(root, manifest, verify_only=False):
    entries = manifest['archives']
    paths = [entry['path'] for entry in entries]
    if len(paths) != 3 or len(set(paths)) != 3:
        raise ValueError('Expected exactly three distinct historical PDF paths')
    if set(paths) & {entry['path'] for entry in manifest['protected_pdfs']}:
        raise ValueError('Cannot exclude a protected current PDF')
    # Complete every check before changing the deployment artifact.
    for entry in manifest['protected_pdfs']:
        verify_local(root, entry)
    for entry in entries:
        verify_local(root, entry)
        verify_archive(entry)
        verify_redirect(entry['legacy_url'], entry['archive_url'], {302, 307})
        verify_redirect(entry['github_pages_url'], entry['legacy_url'], {301, 302, 307, 308})
    excluded = {checked_path(root, entry['path']) for entry in entries}
    projected = sum(file.stat().st_size for file in root.rglob('*')
                    if file.is_file() and file.resolve() not in excluded)
    if projected > manifest['max_deployment_bytes']:
        raise ValueError(f'Exceeds Pages budget: {projected:,} bytes')
    print(f'Verified projected Pages payload: {projected:,} bytes')
    if not verify_only:
        for file in excluded:
            file.unlink()
    return projected


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    manifest = json.loads(Path('docs/COMIC_PDF_ARCHIVES.json').read_text())
    prepare(Path('dist'), manifest, args.verify_only)
