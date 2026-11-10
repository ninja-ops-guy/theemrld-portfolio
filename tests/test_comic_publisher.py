import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import stat
import struct
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec=importlib.util.spec_from_file_location('publisher',Path(__file__).resolve().parents[1]/'scripts/comic-publisher.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)

class PublisherTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.archive=self.root/'assets.zip'
        payload=b'\0'*4+(15).to_bytes(3,'little')+(23).to_bytes(3,'little')
        self.webp=b'RIFF'+struct.pack('<I',22)+b'WEBPVP8X'+struct.pack('<I',10)+payload
        self.pdf=b'%PDF-1.7\nfixture\n%%EOF\n'
        self.files={'print-source/demo.part0':self.pdf,'public/techops-comic/demo/001.webp':self.webp}
        def fs(name,data):return {'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
        self.m={'schema_version':1,'repository':p.REPO,'id':'demo','title':'Demo',
                'source':{'tag':'demo-source','asset':'demo.zip','bytes':1,'sha256':'0'*64},
                'target':{'branch':'release/demo','pr':1},'page_count':1,
                'pdf':dict(fs('public/techops-comic/demo/demo.pdf',self.pdf),parts=[fs('print-source/demo.part0',self.pdf)]),
                'images':[dict(fs('public/techops-comic/demo/001.webp',self.webp),width=16,height=24)],
                'site_url':'https://kterminal.site/','archive_gate':False}
        self.zip()
    def tearDown(self):self.tmp.cleanup()
    def zip(self,files=None,special=None):
        with zipfile.ZipFile(self.archive,'w') as z:
            for n,b in (files or self.files).items():
                if special and n in special:
                    i=zipfile.ZipInfo(n);i.create_system=3;i.external_attr=special[n]<<16;z.writestr(i,b)
                else:z.writestr(n,b)
        self.m['source']['bytes']=self.archive.stat().st_size;self.m['source']['sha256']=p.digest(self.archive)
    def load(self):
        f=self.root/'manifest.json';f.write_text(json.dumps(self.m));return p.load_manifest(f)
    def test_valid_manifest(self):self.assertEqual(self.load()['id'],'demo')
    def test_complete_roundtrip_and_idempotent_extract(self):
        root=self.root/'out';root.mkdir();p.extract(self.load(),self.archive,root);p.extract(self.m,self.archive,root);p.verify_tree(self.m,root)
        dist=self.root/'dist';(dist/'techops-comic/demo').mkdir(parents=True)
        (dist/'techops-comic/demo/001.webp').write_bytes(self.webp);(dist/'techops-comic/demo/demo.pdf').write_bytes(self.pdf)
        p.verify_tree(self.m,dist,built=True);p.marker(dist,'a'*40,self.m);self.assertEqual(json.loads((dist/'publishing/deployment.json').read_text())['commit'],'a'*40)
    def test_bad_archive_hash_no_writes(self):
        self.m['source']['sha256']='0'*64
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
        self.assertFalse((self.root/'out').exists())
    def test_wrong_image_hash_no_writes(self):
        self.m['images'][0]['sha256']='0'*64
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
        self.assertFalse((self.root/'out').exists())
    def test_wrong_part_hash(self):
        self.m['pdf']['parts'][0]['sha256']='0'*64
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_wrong_master_hash(self):
        self.m['pdf']['sha256']='0'*64
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_missing_page(self):
        self.zip({'print-source/demo.part0':self.pdf})
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_zip_slip(self):
        self.zip(dict(self.files,**{'../../bad':b'x'}))
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_extra_executable(self):
        self.zip(dict(self.files,**{'.github/workflows/evil.yml':b'x'}))
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_duplicate_zip_entry(self):
        with zipfile.ZipFile(self.archive,'a') as z:z.writestr('print-source/demo.part0',self.pdf)
        self.m['source'].update(bytes=self.archive.stat().st_size,sha256=p.digest(self.archive))
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_symlink_archive(self):
        self.zip(special={'print-source/demo.part0':stat.S_IFLNK|0o777})
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_symlink_parent(self):
        out=self.root/'out';out.mkdir();(out/'public').symlink_to(self.root/'elsewhere',target_is_directory=True)
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,out)
        self.assertFalse((out/'print-source').exists())
    def test_bad_dimensions(self):
        self.m['images'][0]['width']=17
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_fake_webp(self):
        self.files['public/techops-comic/demo/001.webp']=b'X'*len(self.webp);self.zip();self.m['images'][0]['sha256']=hashlib.sha256(b'X'*len(self.webp)).hexdigest()
        with self.assertRaises(p.GateError):p.extract(self.m,self.archive,self.root/'out')
    def test_path_traversal_in_manifest(self):
        self.m['images'][0]['path']='public/techops-comic/../001.webp'
        with self.assertRaises(p.GateError):self.load()
    def test_noncontiguous_images(self):
        self.m['images'][0]['path']='public/techops-comic/demo/002.webp'
        with self.assertRaises(p.GateError):self.load()
    def test_count_mismatch(self):
        self.m['page_count']=2
        with self.assertRaises(p.GateError):self.load()
    def test_wrong_repository(self):
        self.m['repository']='other/repo'
        with self.assertRaises(p.GateError):self.load()
    def test_no_main_target(self):
        self.m['target']['branch']='main'
        with self.assertRaises(p.GateError):self.load()
    def test_budget_guard(self):
        (self.root/'big').write_bytes(b'0123456789')
        with patch.object(p,'BUDGET',5),self.assertRaises(p.GateError):p.size_gate(self.root)
    def test_reject_stale_marker(self):
        class R:
            def __enter__(s):return s
            def __exit__(s,*a):pass
            def read(s,*a):return json.dumps({'commit':'b'*40,'repository':p.REPO}).encode()
        with patch.object(p.urllib.request,'build_opener') as op,patch.object(p.time,'sleep'),self.assertRaises(p.GateError):
            op.return_value.open.return_value=R();p.verify_live('https://kterminal.site/','a'*40,None)
    def test_no_live_credential_or_private_origin(self):
        with self.assertRaises(p.GateError):p.verify_live('http://127.0.0.1/','a'*40,None)
    def test_live_file_hash_checked(self):
        class R:
            status=200
            def __init__(s):s.done=False
            def __enter__(s):return s
            def __exit__(s,*a):pass
            def read(s,*a):
                if s.done:return b''
                s.done=True;return b'wrong'
        with patch.object(p.urllib.request,'build_opener') as op,self.assertRaises(p.GateError):
            op.return_value.open.return_value=R();p.live_file('https://kterminal.site/test',{'bytes':5,'sha256':'0'*64})

if __name__=='__main__':unittest.main()

