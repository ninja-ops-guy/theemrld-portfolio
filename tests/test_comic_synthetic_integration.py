"""Network-free publisher integration: real CLIs, ZIP verification and local Git.

Run: python3 -m unittest discover -s tests -p 'test_comic_synthetic_integration.py' -v
Only the GitHub API/asset transport is fake. Git fetch/push are redirected to a
fresh local bare repository; all non-file Git transports are disabled for every
verb, so new/unexpected commands cannot contact external remotes.
"""
import base64
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPO = 'ninja-ops-guy/theemrld-portfolio'
URL = f'https://github.com/{REPO}.git'
BRANCH = 'release/synthetic'
RID = 'synthetic-integration'
WEBPS = [base64.b64decode(x) for x in (
    'UklGRhwAAABXRUJQVlA4TA8AAAAvAYAAAAcQ/Y/+ByKi/wEA',
    'UklGRhwAAABXRUJQVlA4TA8AAAAvAYAAAAcQ0f/+ByKi/wEA',
    'UklGRhwAAABXRUJQVlA4TA8AAAAvAYAAAAdQwIj+ByKi/wEA')]
PDF = b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'


def sh(args, *, cwd=None, env=None, check=True, data=None):
    result = subprocess.run(args, cwd=cwd, env=env, input=data, text=True,
                            capture_output=True, timeout=60)
    if check and result.returncode:
        raise AssertionError(f'{args[0:3]} failed: {result.stderr}')
    return result


def sha(data):
    return hashlib.sha256(data).hexdigest()


def fake_transport(mode):
    """Invoked as a subprocess shim, not a mock of production Python functions."""
    root = Path(os.environ['SYNTHETIC_ROOT'])
    state_path = root / 'service.json'
    state = json.loads(state_path.read_text())
    args = sys.argv[2:]
    real_git = os.environ['SYNTHETIC_REAL_GIT']
    bare = str(root / 'remote.git')
    def git(*values, check=True):
        return sh([real_git, '--git-dir', bare, *values], check=check).stdout.strip()
    def ref(name):
        return git('rev-parse', '--verify', f'refs/heads/{name}', check=False) or None
    def save():
        state_path.write_text(json.dumps(state))
    def pr():
        return {'state': 'open', 'merged': False, 'head': {'sha': ref(BRANCH),
                'repo': {'full_name': REPO}, 'ref': BRANCH}, 'base': {'ref': 'main'}}
    def asset(name):
        file = root / 'assets' / name
        return {'name': name, 'size': file.stat().st_size, 'state': 'uploaded'}
    if mode == '--fake-git':
        if args and args[0] in ('fetch', 'push'):
            if 'origin' not in args:
                raise RuntimeError('Synthetic transport refuses non-origin network verbs')
            args[args.index('origin')] = bare
            if args[0] == 'push':
                state['pushes'].append(args[-1])
                if BRANCH in args[-1] and state.pop('candidate_push_race', False):
                    git('update-ref', 'refs/heads/' + BRANCH, state['competitor'], state['original_head'])
                save()
        result = subprocess.run([real_git, *args], capture_output=True, text=True)
        sys.stdout.write(result.stdout); sys.stderr.write(result.stderr)
        return result.returncode
    state['calls'].append(args)
    if args[:2] == ['auth', 'status']:
        save(); return 0
    if args[0] == 'api':
        prefix = f'repos/{REPO}/'
        if not args[1].startswith(prefix):
            raise RuntimeError('Synthetic transport refuses unexpected API repository')
        path = args[1][len(prefix):]
        method = args[args.index('--method') + 1] if '--method' in args else 'GET'
        data = json.load(sys.stdin) if '--input' in args else None
        if path.startswith('contents/publishing/releases/'):
            result = {'content': base64.b64encode((root / 'manifest.json').read_bytes()).decode()}
        elif path == 'pulls/78':
            state['pr_reads'] += 1
            if state.get('move_on_pr_read') == state['pr_reads']:
                git('update-ref', 'refs/heads/' + BRANCH, state['competitor'], state['original_head'])
            result = pr()
        elif path.startswith('git/matching-refs/heads/'):
            branch = path.removeprefix('git/matching-refs/heads/')
            head = ref(branch)
            result = [{'ref': 'refs/heads/' + branch, 'object': {'sha': head}}] if head else []
        elif path == 'branches/main': result = {'commit': {'sha': ref('main')}}
        elif path.startswith('releases?'): result = [state['release']] if state['release'] else []
        elif path.startswith('releases/11/assets?'):
            result = [asset(p.name) for p in sorted((root / 'assets').iterdir())]
        elif path == 'releases' and method == 'POST':
            state['release'] = dict(data, id=11); result = state['release']
        elif path == 'releases/11' and method == 'PATCH':
            state['release'].update(data); result = state['release']
        elif path == 'releases/tags/synthetic-source': result = state['release']
        else: raise RuntimeError(f'Unimplemented synthetic API: {method} {path}')
        save(); print(json.dumps(result)); return 0
    if args[:2] == ['release', 'upload']:
        source = Path(args[3]); dest = root / 'assets' / source.name
        if dest.exists(): raise RuntimeError('Asset overwrite attempted')
        shutil.copyfile(source, dest); state['uploads'].append(source.name)
    elif args[:2] == ['release', 'download']:
        name = args[args.index('--pattern') + 1]
        dest = Path(args[args.index('--dir') + 1]) / name
        shutil.copyfile(root / 'assets' / name, dest)
    elif args[:2] == ['workflow', 'run']:
        state['dispatches'].append(args)
    else: raise RuntimeError(f'Unimplemented synthetic gh operation: {args}')
    save(); return 0


class SyntheticIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='comic-synthetic-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.real_git = shutil.which('git')
        self.env = {k: v for k, v in os.environ.items() if not (
            k.startswith(('GH_', 'GITHUB_', 'GIT_')) or k in ('SSH_AUTH_SOCK',))}
        home = self.root / 'home'; home.mkdir()
        self.env.update(HOME=str(home), GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL=os.devnull,
                        GIT_TERMINAL_PROMPT='0', GIT_NO_REPLACE_OBJECTS='1', GIT_ALLOW_PROTOCOL='file',
                        GIT_AUTHOR_NAME='Synthetic Test', GIT_AUTHOR_EMAIL='synthetic@example.invalid',
                        GIT_COMMITTER_NAME='Synthetic Test', GIT_COMMITTER_EMAIL='synthetic@example.invalid',
                        SYNTHETIC_ROOT=str(self.root), SYNTHETIC_REAL_GIT=self.real_git)
        bin_dir = self.root / 'bin'; bin_dir.mkdir()
        for name in ('gh', 'git'):
            wrapper = bin_dir / name
            wrapper.write_text(f'#!{sys.executable}\nimport runpy,sys\nsys.argv=[{str(Path(__file__).resolve())!r},"--fake-{name}",*sys.argv[1:]]\nrunpy.run_path(sys.argv[0],run_name="__main__")\n')
            wrapper.chmod(0o755)
        self.env['PATH'] = str(bin_dir) + os.pathsep + os.environ['PATH']
        self.bare = self.root / 'remote.git'
        self.git('init', '--bare', '--initial-branch=main', str(self.bare))
        self.media = self.root / 'media'; self.candidate = self.root / 'candidate'
        for directory in (self.media, self.candidate):
            self.git('init', '--initial-branch=main', str(directory))
            self.git('remote', 'add', 'origin', URL, cwd=directory)
        for i, payload in enumerate(WEBPS[:2], 1):
            file = self.media / f'techops-comic/volume-xiv/{i:03d}.webp'
            file.parent.mkdir(parents=True, exist_ok=True); file.write_bytes(payload)
        self.commit(self.media, 'Synthetic base media')
        self.base_media = self.git('rev-parse', 'HEAD', cwd=self.media)
        self.git('push', str(self.bare), 'HEAD:refs/heads/media-base', cwd=self.media)
        self.current = {'mediaCommit': self.base_media, 'releaseTag': 'previous', 'books': {
            'xiv': {'pageCount': 2, 'revision': 'synthetic-compatible', 'width': 2, 'height': 3,
                    'imagePath': 'techops-comic/volume-xiv/', 'sections': [{'start': 1}], 'links': {}},
            'g': {'untouched': True}}}
        path = self.candidate / 'src/data/comic-current-editions.json'
        path.parent.mkdir(parents=True); path.write_text(json.dumps(self.current))
        (self.candidate / 'unrelated-reader.txt').write_text('Keep unrelated reader work.\n')
        self.commit(self.candidate, 'Synthetic base reader')
        self.original = self.git('rev-parse', 'HEAD', cwd=self.candidate)
        self.git('push', str(self.bare), 'HEAD:refs/heads/main', 'HEAD:refs/heads/' + BRANCH, cwd=self.candidate)
        (self.candidate / 'concurrent.txt').write_text('Concurrent author\n')
        self.commit(self.candidate, 'Synthetic competing change')
        competitor = self.git('rev-parse', 'HEAD', cwd=self.candidate)
        self.git('push', str(self.bare), 'HEAD:refs/heads/competitor', cwd=self.candidate)
        self.git('reset', '--hard', self.original, cwd=self.candidate)
        self.archive = self.root / 'source.zip'
        with zipfile.ZipFile(self.archive, 'w') as z:
            z.writestr('master.pdf', PDF); z.writestr('techops-comic/volume-xiv/001.webp', WEBPS[2])
        self.manifest = {'schema_version': 2, 'repository': REPO, 'id': RID, 'title': 'Synthetic Test',
            'edition': 'xiv', 'base_media_commit': self.base_media, 'publication_policy': 'current-only',
            'target': {'pr': 78, 'branch': BRANCH}, 'source': {'tag': 'synthetic-source', 'asset': 'Synthetic.zip',
            'bytes': self.archive.stat().st_size, 'sha256': sha(self.archive.read_bytes())},
            'pdf': {'path': 'master.pdf', 'filename': 'Synthetic.pdf', 'bytes': len(PDF), 'sha256': sha(PDF)},
            'page_count': 2, 'content_revision': 'synthetic-revised', 'compatibility_revision': 'synthetic-compatible',
            'changed_pages': [1], 'corrections': [{'id': 'synthetic-color', 'status': 'included', 'evidence': 'Synthetic bytes only.'}],
            'site_url': 'https://kterminal.site/', 'reader_path': '/#/comic?edition=xiv&page={page}',
            'images': [{'path': f'techops-comic/volume-xiv/{i:03d}.webp', 'bytes': len(payload),
                        'sha256': sha(payload), 'width': 2, 'height': 3} for i, payload in enumerate((WEBPS[2], WEBPS[1]), 1)]}
        self.manifest_path = self.root / 'manifest.json'; self.manifest_path.write_text(json.dumps(self.manifest))
        (self.root / 'assets').mkdir()
        self.set_state({'release': None, 'calls': [], 'uploads': [], 'dispatches': [], 'pushes': [],
                        'pr_reads': 0, 'competitor': competitor, 'original_head': self.original})

    def git(self, *args, cwd=None):
        return sh([self.real_git, *args], cwd=cwd, env=self.env).stdout.strip()
    def commit(self, directory, message):
        self.git('add', '.', cwd=directory); self.git('commit', '-m', message, cwd=directory)
    def state(self): return json.loads((self.root / 'service.json').read_text())
    def set_state(self, value): (self.root / 'service.json').write_text(json.dumps(value))
    def update_state(self, **changes):
        value = self.state(); value.update(changes); self.set_state(value)
    def ref(self, branch):
        result = sh([self.real_git, '--git-dir', str(self.bare), 'rev-parse', '--verify', 'refs/heads/' + branch], env=self.env, check=False)
        return result.stdout.strip() if result.returncode == 0 else None
    def upload(self, *flags, success=True):
        result = sh([sys.executable, str(ROOT / 'scripts/upload-comic.py'), str(self.archive), '--release', RID, *flags], env=self.env, check=False)
        self.assertEqual(result.returncode, 0 if success else 2, result.stdout + result.stderr)
        return result
    def stage(self, expected=None, success=True):
        result = sh([sys.executable, str(ROOT / 'scripts/stage-comic.py'), '--manifest', str(self.manifest_path),
                     '--archive', str(self.archive), '--candidate', str(self.candidate), '--media', str(self.media),
                     '--receipt', str(self.root / 'receipt.json'), '--expected-head', expected or self.ref(BRANCH)], env=self.env, check=False)
        self.assertEqual(result.returncode, 0 if success else 2, result.stdout + result.stderr)
        return json.loads(result.stdout) if success else result
    def prepare_source(self):
        self.upload('--stage', '--request-id', 'synthetic-stage')
        self.update_state(pr_reads=0)

    def test_unexpected_git_verb_cannot_use_https_transport(self):
        # ls-remote is deliberately not rewritten by the shim. Git must reject
        # HTTPS before starting a transport, even for a newly introduced verb.
        before = self.state()
        result = sh(['git', 'ls-remote', 'origin'], cwd=self.candidate,
                    env=self.env, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("transport 'https' not allowed", result.stderr)
        self.assertEqual(result.stdout, '')
        self.assertEqual(self.state(), before)
        self.assertEqual(self.ref('main'), self.original)

    def test_real_upload_stage_qualification_and_deployment_recovery(self):
        self.upload(); self.upload()
        self.assertTrue(self.state()['release']['draft'])
        self.assertEqual(self.state()['dispatches'], [])
        self.prepare_source()
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip'])
        dispatch = self.state()['dispatches']; self.assertEqual(len(dispatch), 1)
        self.assertIn('expected_head=' + self.original, dispatch[0])
        self.assertIn('manifest_sha256=' + sha(self.manifest_path.read_bytes()), dispatch[0])
        first = self.stage()
        self.assertEqual(first['status'], 'STAGED_NOT_PUBLISHED')
        self.assertEqual(self.ref('main'), self.original)
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip', 'Synthetic.pdf'])
        self.git('reset', '--hard', self.base_media, cwd=self.media)
        second = self.stage()
        self.assertEqual(first, second)
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip', 'Synthetic.pdf'])
        bound = json.loads((self.candidate / 'src/data/comic-current-editions.json').read_text())
        self.assertEqual(bound['books']['g'], self.current['books']['g'])
        self.assertEqual(bound['books']['xiv']['sections'], self.current['books']['xiv']['sections'])
        self.assertEqual(bound['mediaCommit'], self.base_media)
        self.assertEqual((self.media / 'techops-comic/volume-xiv/002.webp').read_bytes(), WEBPS[1])
        result = sh(['node', str(ROOT / 'tests/fixtures/synthetic-publish.mjs'), str(self.root)],
                    cwd=self.candidate, env=self.env)
        report = json.loads(result.stdout)
        self.assertEqual(report['main_updates'], 1)
        self.assertEqual(report['dispatch_calls'], 2)  # one definite rejection, one accepted
        self.assertEqual(report['retry_calls'], 1)
        self.assertEqual(report['phase'], 'DEPLOYED_AWAITING_RECEIPT')
        self.assertTrue(report['checkpoint_is_orphan_history'])
        self.assertEqual(report['qualification']['head'], first['head'])

    def test_corrupt_uploaded_zip_is_not_overwritten_or_dispatched(self):
        self.upload()
        asset = self.root / 'assets/Synthetic.zip'
        asset.write_bytes(b'X' * asset.stat().st_size)
        result = self.upload('--publish', '--request-id', 'synthetic-publish', success=False)
        self.assertIn('Existing asset differs', result.stderr)
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip'])
        self.assertTrue(self.state()['release']['draft'])
        self.assertEqual(self.state()['dispatches'], [])
        self.assertEqual(self.ref('main'), self.original)

    def test_pr_move_before_first_remote_write_is_rejected(self):
        self.prepare_source(); self.update_state(move_on_pr_read=2)
        result = self.stage(expected=self.original, success=False)
        self.assertIn('Target moved during staging', result.stderr)
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip'])
        self.assertIsNone(self.ref('publisher/media/' + RID))
        self.assertEqual(self.ref(BRANCH), self.state()['competitor'])
        self.assertFalse((self.root / 'receipt.json').exists())

    def test_real_candidate_lease_race_retains_assets_and_resumes(self):
        self.prepare_source(); self.update_state(candidate_push_race=True)
        result = self.stage(expected=self.original, success=False)
        self.assertIn('Command failed', result.stderr)
        immutable = self.ref('publisher/media/' + RID)
        self.assertIsNotNone(immutable)
        self.assertEqual(self.ref(BRANCH), self.state()['competitor'])
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip', 'Synthetic.pdf'])
        self.assertFalse((self.root / 'receipt.json').exists())
        # Re-resolve the reviewed head and retain the competing author's commit.
        self.git('reset', '--hard', self.base_media, cwd=self.media)
        self.git('fetch', str(self.bare), BRANCH, cwd=self.candidate)
        self.git('reset', '--hard', 'FETCH_HEAD', cwd=self.candidate)
        resumed = self.stage()
        self.assertEqual(resumed['media_commit'], immutable)
        self.assertTrue((self.candidate / 'concurrent.txt').is_file())
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip', 'Synthetic.pdf'])
        self.assertEqual(self.ref('main'), self.original)

    def test_unchanged_image_hash_mismatch_blocks_remote_writes(self):
        self.prepare_source()
        self.manifest['images'][1]['sha256'] = 'f' * 64
        self.manifest_path.write_text(json.dumps(self.manifest))
        result = self.stage(success=False)
        self.assertIn('SHA-256 mismatch', result.stderr)
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip'])
        self.assertIsNone(self.ref('publisher/media/' + RID))
        self.assertEqual(self.ref(BRANCH), self.original)

    def test_reusing_media_id_for_changed_manifest_is_rejected(self):
        self.prepare_source(); first = self.stage()
        self.git('reset', '--hard', self.base_media, cwd=self.media)
        self.manifest['corrections'][0]['evidence'] += ' Changed binding.'
        self.manifest_path.write_text(json.dumps(self.manifest))
        result = self.stage(success=False)
        self.assertIn('different immutable media binding', result.stderr)
        self.assertEqual(self.ref('publisher/media/' + RID), first['media_commit'])
        self.assertEqual(self.ref(BRANCH), first['head'])
        self.assertEqual(self.state()['uploads'], ['Synthetic.zip', 'Synthetic.pdf'])


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1].startswith('--fake-'):
        sys.exit(fake_transport(sys.argv[1]))
    unittest.main()
