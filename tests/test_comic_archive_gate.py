import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('gate', Path(__file__).parents[1] / 'scripts/prepare-pages-comic-release.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class GateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.entries = []
        for i in range(3):
            data = f'archive-{i}'.encode()
            path = f'old-{i}.pdf'
            (self.root / path).write_bytes(data)
            self.entries.append(dict(path=path, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                                     archive_url=f'https://archive/{i}', legacy_url=f'https://old/{i}',
                                     github_pages_url=f'https://pages/{i}'))
        (self.root / 'current.pdf').write_bytes(b'current')
        self.manifest = dict(archives=self.entries, max_deployment_bytes=100,
                             protected_pdfs=[dict(path='current.pdf', bytes=7)])

    def run_gate(self, **kwargs):
        with patch.object(gate, 'verify_archive'), patch.object(gate, 'verify_redirect'):
            return gate.prepare(self.root, self.manifest, **kwargs)

    def assert_archives_present(self):
        self.assertTrue(all((self.root / e['path']).exists() for e in self.entries))

    def test_verify_only_never_excludes(self):
        self.assertEqual(self.run_gate(verify_only=True), 7)
        self.assert_archives_present()

    def test_last_archive_failure_preserves_every_file(self):
        with patch.object(gate, 'verify_archive', side_effect=[None, None, ValueError('wrong hash')]), patch.object(gate, 'verify_redirect'):
            with self.assertRaises(ValueError):
                gate.prepare(self.root, self.manifest)
        self.assert_archives_present()

    def test_redirect_failure_preserves_every_file(self):
        with patch.object(gate, 'verify_archive'), patch.object(gate, 'verify_redirect', side_effect=ValueError('no redirect')):
            with self.assertRaises(ValueError):
                gate.prepare(self.root, self.manifest)
        self.assert_archives_present()

    def test_over_budget_preserves_every_file(self):
        self.manifest['max_deployment_bytes'] = 6
        with self.assertRaises(ValueError):
            self.run_gate()
        self.assert_archives_present()

    def test_changed_current_pdf_blocks_exclusion(self):
        (self.root / 'current.pdf').write_bytes(b'wrong')
        with self.assertRaises(ValueError):
            self.run_gate()
        self.assert_archives_present()

    def test_success_excludes_only_archives(self):
        self.assertEqual(self.run_gate(), 7)
        self.assertTrue((self.root / 'current.pdf').exists())
        self.assertTrue(all(not (self.root / e['path']).exists() for e in self.entries))

    def test_cannot_exclude_protected_path(self):
        self.manifest['protected_pdfs'].append(self.entries[0])
        with self.assertRaises(ValueError):
            self.run_gate()
        self.assert_archives_present()


if __name__ == '__main__':
    unittest.main()
