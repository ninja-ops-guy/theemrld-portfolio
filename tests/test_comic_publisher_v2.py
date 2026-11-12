import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec=importlib.util.spec_from_file_location('publisher',Path(__file__).resolve().parents[1]/'scripts/comic-publisher.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)

class PublisherV2Tests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        payload=b'\0'*4+(15).to_bytes(3,'little')+(23).to_bytes(3,'little')
        self.webp=b'RIFF'+struct.pack('<I',22)+b'WEBPVP8X'+struct.pack('<I',10)+payload
        self.pdf=b'%PDF-1.7\nfixture\n%%EOF\n'
        def fs(name,data):return dict(path=name,bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
        self.m=dict(schema_version=2,repository=p.REPO,id='demo-v2',title='Demo',edition='xiv',
            target=dict(pr=123,branch='release/demo-v2'),source=dict(tag='demo-v2-source',asset='demo.zip',bytes=1,sha256='0'*64),
            base_media_commit='a'*40,pdf=dict(fs('master.pdf',self.pdf),filename='Demo.pdf'),page_count=2,
            images=[dict(fs(f'techops-comic/volume-xiv/{n:03d}.webp',self.webp),width=16,height=24) for n in (1,2)],
            changed_pages=[2],content_revision='demo-v2',compatibility_revision='demo-v1',
            corrections=[dict(id='page-2-arm',status='included',evidence='Approved revision source')],
            publication_policy='current-only',site_url='https://kterminal.site/',reader_path='/#/comic?edition=xiv&page={page}')
        self.archive=self.root/'demo.zip'
        with zipfile.ZipFile(self.archive,'w') as z:
            z.writestr('master.pdf',self.pdf);z.writestr(self.m['images'][1]['path'],self.webp)
        self.m['source'].update(bytes=self.archive.stat().st_size,sha256=p.digest(self.archive))
    def tearDown(self):self.tmp.cleanup()
    def load(self):
        path=self.root/'manifest.json';path.write_text(json.dumps(self.m));return p.load_manifest(path)
    def publication(self):
        return dict(earlierEditionsPublic=False,books=[dict(id='xiv',pageCount=2,pdfSha256=self.m['pdf']['sha256'],
            mediaCommit='b'*40,imageBase=f'https://raw.githubusercontent.com/{p.REPO}/'+ 'b'*40+'/techops-comic/volume-xiv/',
            pdfUrl=f'https://github.com/{p.REPO}/releases/download/demo-v2-source/Demo.pdf',publisherRelease='demo-v2',contentRevision='demo-v2')])
    def dist(self):
        d=self.root/'dist';(d/'techops-comic').mkdir(parents=True);(d/'techops-comic/publication.json').write_text(json.dumps(self.publication()));return d
    def test_validate(self):self.assertEqual(self.load()['schema_version'],2)
    def test_changed_only_source_roundtrip(self):
        out=self.root/'out';p.extract(self.load(),self.archive,out)
        self.assertEqual((out/'master.pdf').read_bytes(),self.pdf)
        self.assertFalse((out/self.m['images'][0]['path']).exists())
        with self.assertRaises(p.GateError):p.verify_tree(self.m,out)
        (out/self.m['images'][0]['path']).write_bytes(self.webp);p.verify_tree(self.m,out)
    def test_changed_file_wrong_hash_no_writes(self):
        self.m['images'][1]['sha256']='1'*64
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
        self.assertFalse((self.root/'out').exists())
    def test_unresolved_correction_rejected(self):
        self.m['corrections'][0]['status']='pending'
        with self.assertRaises(p.GateError):self.load()
    def test_corrections_evidence_required(self):
        self.m['corrections'][0]['evidence']=''
        with self.assertRaises(p.GateError):self.load()
    def test_changed_list_sorted_unique(self):
        for value in ([2,2],[2,1],[],[True],[3]):
            self.m['changed_pages']=value
            with self.assertRaises(p.GateError):self.load()
    def test_no_placeholder_or_unpinned_source(self):
        self.m['base_media_commit']='NEW_XIV_MEDIA_COMMIT'
        with self.assertRaises(p.GateError):self.load()
    def test_no_external_target(self):
        self.m['target']['branch']='main'
        with self.assertRaises(p.GateError):self.load()
    def test_no_path_escape(self):
        self.m['images'][0]['path']='techops-comic/../../001.webp'
        with self.assertRaises(p.GateError):self.load()
    def test_wrong_route_rejected(self):
        self.m['reader_path']='/#/comic?edition=g&page={page}'
        with self.assertRaises(p.GateError):self.load()
    def test_current_only_required(self):
        self.m['publication_policy']='restore-history'
        with self.assertRaises(p.GateError):self.load()
    def test_marker_binds_remote_source(self):
        d=self.dist()
        with patch.object(p,'verify_remote') as remote:p.marker(d,'c'*40,self.load())
        remote.assert_called_once_with(self.m,'b'*40)
        marker=json.loads((d/'publishing/deployment.json').read_text());self.assertEqual(marker['media_commit'],'b'*40)
    def test_wrong_live_source_not_stamped(self):
        d=self.dist();pub=self.publication();pub['books'][0]['pdfUrl']='https://github.com/other/file'
        (d/'techops-comic/publication.json').write_text(json.dumps(pub))
        with self.assertRaises(p.GateError):p.marker(d,'c'*40,self.load())
        self.assertFalse((d/'publishing/deployment.json').exists())
    def test_wrong_release_not_stamped(self):
        d=self.dist();pub=self.publication();pub['books'][0]['publisherRelease']='other'
        (d/'techops-comic/publication.json').write_text(json.dumps(pub))
        with self.assertRaises(p.GateError):p.marker(d,'c'*40,self.load())
    def test_verify_remote_hashes_every_page_and_master(self):
        with patch.object(p,'live_file') as read:p.verify_remote(self.m,'b'*40)
        self.assertEqual(read.call_count,3)
        self.assertIn('/'+'b'*40+'/',read.call_args_list[0].args[0])
        self.assertTrue(read.call_args_list[-1].args[0].endswith('/demo-v2-source/Demo.pdf'))

if __name__=='__main__':unittest.main()
