import copy
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from test_comic_staging import PDF, BASE, MEDIA, LocalChecks, staging, current, manifest

class ReadOnlyAPI:
    def __init__(self, candidate, media):
        self.shas = {candidate: 'c'*40, media: BASE}
        self.read_head = self.shas[candidate]
        self.prepared = []
    def git(self, d, *args):
        if args[:2] == ('remote', 'get-url'): return 'https://github.com/'+staging.REPO
        if args[0] == 'rev-parse': return self.shas[d]
        if args[:2] == ('diff','--cached'): return 'src/data/comic-current-editions.json'
        if args[0] in ('status','merge-base','config','add'): return ''
        if args[0] == 'commit':
            self.shas[d] = 'd'*40 if d.name == 'candidate' else MEDIA
            self.prepared.append(d.name)
            return ''
        raise AssertionError('Unexpected Git command: '+args[0])
    def optional_ref(self, branch):
        return None
    def api(self, path):
        assert path == 'pulls/78'
        return {'state':'open','merged':False,'head':{'sha':self.read_head,
                'repo':{'full_name':staging.REPO},'ref':'release/fixture'},'base':{'ref':'main'}}
    def release(self, *_):
        raise AssertionError('Private build called a release mutation path')
    def upload(self, *_):
        raise AssertionError('Private build uploaded bytes')

class Checks(LocalChecks):
    def verify_file(self, p, row):
        staging.verifier().verify_file(p, row)

class BuildOnlyTests(unittest.TestCase):
    def test_split_creates_local_candidate_without_remote_writes(self):
        with TemporaryDirectory() as tmp:
            root=Path(tmp).resolve(); candidate=root/'candidate';media=root/'media'
            candidate.mkdir();media.mkdir()
            catalog=candidate/'src/data/comic-current-editions.json'
            catalog.parent.mkdir(parents=True);catalog.write_text(json.dumps(current()))
            m=manifest()
            m['delivery']={'tag':'different-reader-pdf'}
            inp=root/'manifest.json';inp.write_text(json.dumps(m))
            pdf=root/'delivery.pdf';pdf.write_bytes(PDF)
            api=ReadOnlyAPI(candidate,media)
            with self.assertRaisesRegex(staging.StageError,'requires private build-only'):
                staging.stage(inp,root/'source.zip',candidate,media,root/'out.json',api.read_head,api,Checks())
            self.assertEqual(api.prepared,[])
            proof=staging.stage(inp,root/'source.zip',candidate,media,root/'out.json',api.read_head,api,Checks(),private_pdf=pdf)
            self.assertEqual(proof['status'],'PRIVATE_STAGE_BUILT')
            self.assertEqual(api.prepared,['media','candidate'])
            self.assertEqual(proof['media_commit'],MEDIA)
            self.assertIn('/different-reader-pdf/',json.loads(catalog.read_text())['books']['xiv']['pdfUrl'])
    def test_legacy_never_accepts_private_build_parameter(self):
        with TemporaryDirectory() as tmp:
            root=Path(tmp); inp=root/'manifest.json';inp.write_text(json.dumps(manifest()))
            with self.assertRaisesRegex(staging.StageError,'legacy staging must not use it'):
                staging.stage(inp,root/'source.zip',root/'c',root/'m',root/'out.json','c'*40,None,Checks(),private_pdf=root/'f.pdf')
