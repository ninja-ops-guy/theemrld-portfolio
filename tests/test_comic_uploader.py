import base64
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('uploader',Path(__file__).resolve().parents[1]/'scripts/upload-comic.py')
u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)

class UploaderTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.archive=self.root/'source.zip';self.archive.write_bytes(b'approved-package')
        self.m={'schema_version':2,'repository':u.REPO,'id':'demo','target':{'pr':123,'branch':'release/demo'},'title':'Demo',
                'source':{'tag':'demo-source','asset':'demo.zip','bytes':self.archive.stat().st_size,'sha256':hashlib.sha256(self.archive.read_bytes()).hexdigest()}}
        self.release={'id':11,'tag_name':'demo-source','draft':True,'prerelease':True}
        self.assets=[];self.calls=[];self.bad_download=False
    def tearDown(self):self.tmp.cleanup()
    def api(self,path,method='GET',data=None):
        self.calls.append(('api',path,method,data))
        if path.startswith('contents/'):return {'content':base64.b64encode(json.dumps(self.m).encode()).decode()}
        if path=='pulls/123':return {'state':'open','head':{'sha':'a'*40,'repo':{'full_name':u.REPO},'ref':'release/demo'}}
        if path.startswith('releases?'):return [self.release]
        if path.startswith('releases/11/assets'):return self.assets
        if path=='releases/11' and method=='PATCH':self.release.update(data);return self.release
        raise AssertionError((path,method))
    def gh(self,*args,**kw):
        self.calls.append(('gh',args))
        if args[:2]==('release','download'):
            folder=Path(args[args.index('--dir')+1]);(folder/'demo.zip').write_bytes(b'wrong' if self.bad_download else self.archive.read_bytes())
        return ''
    def run_upload(self,*flags):
        with patch.object(u,'api',self.api),patch.object(u,'gh',self.gh),patch.object(u.shutil,'which',return_value='/usr/bin/gh'),patch.object(u.sys,'argv',['upload',str(self.archive),'--release','demo',*flags]):u.main()
    def test_default_only_uploads(self):
        self.run_upload()
        self.assertTrue(self.release['draft']);self.assertFalse(any(c[0]=='gh' and c[1][:2]==('workflow','run') for c in self.calls))
    def test_stage_requests_once_after_source_publication(self):
        self.run_upload('--stage','--request-id','my-request')
        self.assertFalse(self.release['draft']);dispatch=[c for c in self.calls if c[0]=='gh' and c[1][:2]==('workflow','run')]
        self.assertEqual(len(dispatch),1);self.assertIn('action=stage',dispatch[0][1]);self.assertIn('request_id=my-request',dispatch[0][1])
    def test_reuses_existing_exact_upload(self):
        self.assets=[{'name':'demo.zip','size':self.m['source']['bytes']}];self.run_upload()
        self.assertFalse(any(c[0]=='gh' and c[1][:2]==('release','upload') for c in self.calls))
    def test_bad_readback_does_not_request_or_publish(self):
        self.bad_download=True
        with self.assertRaises(RuntimeError):self.run_upload('--publish')
        self.assertTrue(self.release['draft']);self.assertFalse(any(c[0]=='gh' and c[1][:2]==('workflow','run') for c in self.calls))
    def test_retired_manifest_cannot_upload(self):
        self.m['lifecycle']='retired'
        with self.assertRaises(RuntimeError):self.run_upload('--publish')
        self.assertFalse(any(c[0]=='gh' and c[1][:2]==('release','upload') for c in self.calls))
    def test_invalid_request_cannot_upload(self):
        with self.assertRaises(RuntimeError):self.run_upload('--stage','--request-id','Not valid')
        self.assertFalse(any(c[0]=='gh' and c[1][:2]==('release','upload') for c in self.calls))

if __name__=='__main__':unittest.main()
