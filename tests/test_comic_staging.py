import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('staging', Path(__file__).parents[1] / 'scripts/stage-comic.py')
staging = importlib.util.module_from_spec(spec)
spec.loader.exec_module(staging)

PDF = b'%PDF-fixture'
BASE = 'a' * 40
MEDIA = 'b' * 40

def manifest():
    return {'schema_version': 2, 'id': 'fixture-v2', 'edition': 'xiv', 'base_media_commit': BASE,
            'target': {'pr': 78, 'branch': 'release/fixture'},
            'source': {'tag': 'fixture-source', 'sha256': '0' * 64},
            'pdf': {'path': 'master.pdf', 'filename': 'Fixture.pdf', 'bytes': len(PDF),
                    'sha256': hashlib.sha256(PDF).hexdigest()},
            'page_count': 1, 'content_revision': 'revised', 'compatibility_revision': 'compatible',
            'changed_pages': [1],
            'images': [{'path': 'techops-comic/volume-xiv/001.webp', 'width': 10, 'height': 20}]}

def current():
    return {'mediaCommit': BASE, 'releaseTag': 'old-source', 'books': {
        'xiv': {'pageCount': 1, 'revision': 'compatible', 'width': 10, 'height': 20,
                'imagePath': 'techops-comic/volume-xiv/', 'sections': [{'start': 1}], 'links': {}},
        'g': {'untouched': True}}}

class FakeAssets:
    def __init__(self, present=False, payload=PDF):
        self.present = present
        self.payload = payload
        self.uploads = 0
        self.public = True
        self.pre = True
        self.state = 'uploaded'
        self.size = len(PDF)
    def release(self, tag):
        return {'id': 1, 'tag_name': tag, 'draft': not self.public, 'prerelease': self.pre}
    def assets(self, release_id):
        return [{'name': 'Fixture.pdf', 'size': self.size, 'state': self.state}] if self.present else []
    def upload(self, tag, path):
        self.uploads += 1
        self.present = True
        self.payload = Path(path).read_bytes()
    def download(self, tag, name, directory):
        (Path(directory) / name).write_bytes(self.payload)

class StagingTests(unittest.TestCase):
    def test_updates_only_target_book_and_preserves_navigation(self):
        before = current()
        result = staging.bind_book(before, manifest(), MEDIA)
        self.assertEqual(before, current())
        self.assertEqual(result['books']['g'], before['books']['g'])
        self.assertEqual(result['mediaCommit'], BASE)
        book = result['books']['xiv']
        self.assertEqual(book['sections'], before['books']['xiv']['sections'])
        self.assertEqual(book['revision'], 'compatible')
        self.assertEqual(book['contentRevision'], 'revised')
        self.assertEqual(book['publisherRelease'], 'fixture-v2')
        self.assertEqual(book['mediaCommit'], MEDIA)
        self.assertIn('/' + MEDIA + '/', book['imageBase'])
        self.assertEqual(book['pdfUrl'], 'https://github.com/ninja-ops-guy/theemrld-portfolio/releases/download/fixture-source/Fixture.pdf')

    def test_metadata_drift_rejected(self):
        for key, value in [('pageCount', 2), ('revision', 'newer'), ('imagePath', 'other/'), ('width', 11)]:
            data = current()
            data['books']['xiv'][key] = value
            with self.subTest(key=key), self.assertRaises(staging.StageError):
                staging.bind_book(data, manifest(), MEDIA)

    def test_newer_base_cannot_be_overwritten(self):
        data = current()
        data['books']['xiv']['mediaCommit'] = 'c' * 40
        with self.assertRaises(staging.StageError):
            staging.bind_book(data, manifest(), MEDIA)

    def test_exact_staged_book_can_be_reused(self):
        first = staging.bind_book(current(), manifest(), MEDIA)
        self.assertEqual(staging.bind_book(first, manifest(), MEDIA), first)
        with self.assertRaises(staging.StageError):
            staging.bind_book(first, manifest(), 'c' * 40)

    def test_invalid_sha(self):
        with self.assertRaises(staging.StageError):
            staging.bind_book(current(), manifest(), 'main')

    def test_binding_is_small_and_exact(self):
        expected = staging.binding(manifest(), 'f' * 64)
        self.assertEqual(set(expected), {'schema_version', 'release_id', 'manifest_sha256', 'source_sha256', 'base_media_commit'})
        self.assertEqual(expected['manifest_sha256'], 'f' * 64)

    def with_pdf(self, operation):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'master.pdf'
            path.write_bytes(PDF)
            return operation(path)

    def test_upload_once_and_reuse_verified_asset(self):
        api = FakeAssets()
        self.with_pdf(lambda path: staging.verify_pdf_asset(api, manifest(), path))
        self.with_pdf(lambda path: staging.verify_pdf_asset(api, manifest(), path))
        self.assertEqual(api.uploads, 1)

    def test_existing_wrong_hash_is_never_overwritten(self):
        api = FakeAssets(present=True, payload=b'X' * len(PDF))
        with self.assertRaises(staging.StageError):
            self.with_pdf(lambda path: staging.verify_pdf_asset(api, manifest(), path))
        self.assertEqual(api.uploads, 0)

    def test_draft_nonprerelease_and_incomplete_asset_are_blocked(self):
        for attribute, value in [('public', False), ('pre', False), ('state', 'starter'), ('size', 1)]:
            api = FakeAssets(present=True)
            setattr(api, attribute, value)
            with self.subTest(attribute=attribute), self.assertRaises(staging.StageError):
                self.with_pdf(lambda path: staging.verify_pdf_asset(api, manifest(), path))
            self.assertEqual(api.uploads, 0)

    def test_command_error_does_not_expose_stderr(self):
        with self.assertRaises(staging.StageError) as error:
            staging.Commands().run(['python3', '-c', 'import sys; print("SECRET", file=sys.stderr); sys.exit(1)'])
        self.assertNotIn('SECRET', str(error.exception))


class LocalGitAPI(FakeAssets):
    """All commands run against temporary local Git repositories, never GitHub."""
    def __init__(self, bare):
        super().__init__()
        self.bare = Path(bare)
        self.real = staging.Commands()
        self.fail_candidate_push = False
    def git(self, directory, *args):
        if args == ('remote', 'get-url', 'origin'):
            return 'https://github.com/' + staging.REPO + '.git'
        if args[0] == 'push' and 'release/fixture' in args[-1] and self.fail_candidate_push:
            raise staging.StageError('Simulated interruption before candidate push')
        return self.real.git(directory, *args)
    def optional_ref(self, branch):
        result = __import__('subprocess').run(['git', '--git-dir', str(self.bare), 'show-ref', '--verify', '--hash', 'refs/heads/' + branch], text=True, capture_output=True)
        return result.stdout.strip() if result.returncode == 0 else None
    def api(self, path):
        return {'state': 'open', 'merged': False, 'head': {'sha': self.optional_ref('release/fixture'),
                'repo': {'full_name': staging.REPO}, 'ref': 'release/fixture'}, 'base': {'ref': 'main'}}

class LocalChecks:
    def load_manifest(self, path):
        return json.loads(Path(path).read_text())
    def extract(self, m, archive, root):
        (root / 'master.pdf').write_bytes(PDF)
        for number in m['changed_pages']:
            path = root / m['images'][number - 1]['path']
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b'changed-image')
    def verify_tree(self, m, root):
        for image in m['images']:
            if (root / image['path']).read_bytes() != b'changed-image':
                raise staging.StageError('Bad media fixture')

class StagingIntegrationTests(unittest.TestCase):
    def fixture(self, root):
        cmd = staging.Commands()
        bare, media, candidate = (root / name for name in ('remote.git', 'media', 'candidate'))
        cmd.run(['git', 'init', '--bare', str(bare)])
        for checkout in (media, candidate):
            cmd.run(['git', 'init', str(checkout)])
            cmd.git(checkout, 'config', 'user.name', 'Fixture')
            cmd.git(checkout, 'config', 'user.email', 'fixture@example.test')
            cmd.git(checkout, 'remote', 'add', 'origin', str(bare))
        image = media / 'techops-comic/volume-xiv/001.webp'
        image.parent.mkdir(parents=True)
        image.write_bytes(b'old-image')
        cmd.git(media, 'add', '.')
        cmd.git(media, 'commit', '-m', 'Base media')
        base = cmd.git(media, 'rev-parse', 'HEAD')
        cmd.git(media, 'push', 'origin', 'HEAD:refs/heads/media-base')
        data = current()
        data['mediaCommit'] = base
        current_path = candidate / 'src/data/comic-current-editions.json'
        current_path.parent.mkdir(parents=True)
        current_path.write_text(json.dumps(data))
        cmd.git(candidate, 'add', '.')
        cmd.git(candidate, 'commit', '-m', 'Base reader')
        cmd.git(candidate, 'push', 'origin', 'HEAD:refs/heads/release/fixture')
        m = manifest()
        m['base_media_commit'] = base
        manifest_path = root / 'manifest.json'
        manifest_path.write_text(json.dumps(m))
        return cmd, LocalGitAPI(bare), m, manifest_path, media, candidate

    def test_end_to_end_staging_and_retry_are_identical(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cmd, api, m, path, media, candidate = self.fixture(root)
            first = staging.stage(path, root / 'fake.zip', candidate, media, root / 'receipt.json', api.optional_ref('release/fixture'), api, LocalChecks())
            self.assertEqual(first['status'], 'STAGED_NOT_PUBLISHED')
            self.assertEqual(api.uploads, 1)
            cmd.git(media, 'reset', '--hard', m['base_media_commit'])
            second = staging.stage(path, root / 'fake.zip', candidate, media, root / 'receipt.json', api.optional_ref('release/fixture'), api, LocalChecks())
            self.assertEqual(first, second)
            self.assertEqual(api.uploads, 1)

    def test_resume_after_media_upload_before_candidate_push(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cmd, api, m, path, media, candidate = self.fixture(root)
            original = api.optional_ref('release/fixture')
            api.fail_candidate_push = True
            with self.assertRaises(staging.StageError):
                staging.stage(path, root / 'fake.zip', candidate, media, root / 'receipt.json', api.optional_ref('release/fixture'), api, LocalChecks())
            self.assertEqual(api.optional_ref('release/fixture'), original)
            self.assertIsNotNone(api.optional_ref('publisher/media/' + m['id']))
            self.assertFalse((root / 'receipt.json').exists())
            api.fail_candidate_push = False
            cmd.git(media, 'reset', '--hard', m['base_media_commit'])
            result = staging.stage(path, root / 'fake.zip', candidate, media, root / 'receipt.json', api.optional_ref('release/fixture'), api, LocalChecks())
            self.assertEqual(api.optional_ref('release/fixture'), result['head'])
            self.assertEqual(api.uploads, 1)


    def test_stale_lease_rejects_remote_change(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cmd, api, m, path, media, candidate = self.fixture(root)
            expected = api.optional_ref('release/fixture')
            (candidate / 'note').write_text('candidate')
            cmd.git(candidate, 'add', 'note')
            cmd.git(candidate, 'commit', '-m', 'Candidate change')
            proposed = cmd.git(candidate, 'rev-parse', 'HEAD')
            # Even when remote moves to the proposed descendant, expected SHA changed.
            cmd.git(candidate, 'push', 'origin', 'HEAD:refs/heads/release/fixture')
            with self.assertRaises(staging.StageError):
                staging.cas_push(api, candidate, 'release/fixture', expected)
            self.assertEqual(api.optional_ref('release/fixture'), proposed)

    def test_nonancestor_never_gets_rewrite_permission(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cmd, api, m, path, media, candidate = self.fixture(root)
            expected = api.optional_ref('release/fixture')
            cmd.git(media, 'fetch', 'origin', expected)
            with self.assertRaises(staging.StageError):
                staging.cas_push(api, media, 'release/fixture', expected)
            self.assertEqual(api.optional_ref('release/fixture'), expected)

    def test_empty_lease_never_overwrites_existing_ref(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cmd, api, m, path, media, candidate = self.fixture(root)
            expected = api.optional_ref('release/fixture')
            with self.assertRaises(staging.StageError):
                staging.cas_push(api, candidate, 'release/fixture', '')
            self.assertEqual(api.optional_ref('release/fixture'), expected)


    def test_rewound_live_head_rejected_before_any_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cmd, api, m, path, media, candidate = self.fixture(root)
            original = api.optional_ref('release/fixture')
            (candidate / 'reviewed-note').write_text('reviewed work')
            cmd.git(candidate, 'add', 'reviewed-note')
            cmd.git(candidate, 'commit', '-m', 'Reviewed candidate')
            reviewed = cmd.git(candidate, 'rev-parse', 'HEAD')
            cmd.git(candidate, 'push', 'origin', 'HEAD:refs/heads/release/fixture')
            # Simulate an intervening rewind after the controller pins reviewed SHA.
            cmd.run(['git', '--git-dir', str(api.bare), 'update-ref',
                     'refs/heads/release/fixture', original, reviewed])
            with self.assertRaisesRegex(staging.StageError, 'reviewed snapshot'):
                staging.stage(path, root / 'fake.zip', candidate, media,
                              root / 'receipt.json', reviewed, api, LocalChecks())
            self.assertEqual(api.optional_ref('release/fixture'), original)
            self.assertIsNone(api.optional_ref('publisher/media/' + m['id']))
            self.assertEqual(api.uploads, 0)
            self.assertFalse((root / 'receipt.json').exists())

    def test_missing_or_unpinned_expected_head_rejected(self):
        for expected in (None, '', 'main', 'A' * 40):
            with self.subTest(expected=expected), self.assertRaises(staging.StageError):
                staging.stage(None, None, None, None, None, expected)


if __name__ == '__main__':
    unittest.main()
