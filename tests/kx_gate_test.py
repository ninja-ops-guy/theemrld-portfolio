from pathlib import Path
import importlib.util, json, shutil, tempfile, unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('gate',ROOT/'scripts/kx_asset_gate.py')
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
class GateTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
  self.world=self.root/'world';(self.world/'assets').mkdir(parents=True)
  for name in gate.RUNTIME:
   path=self.world/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('// fixture')
  manifest=[]
  for identifier in sorted(gate.EXPECTED):
   image=Image.new('RGB',(2,2),'white');image.putpixel((0,0),(255,0,0))
   path=self.world/'assets'/(identifier+'.webp');image.save(path,format='WEBP',lossless=True)
   manifest.append(dict(id=identifier,file=path.name,width=2,height=2,sha256=gate.sha(path.read_bytes())))
  (self.world/'assets/manifest.json').write_text(json.dumps(manifest))
 def tearDown(self):self.temp.cleanup()
 def test_missing_runtime_fails(self):
  (self.world/'index.html').unlink();r=gate.qualify(self.world);self.assertEqual(r['status'],'FAIL')
 def test_source_only_never_implies_release_pass(self):
  r=gate.qualify(self.world);self.assertEqual(r['status'],'PASS');self.assertEqual(r['release_status'],'BLOCKED');self.assertEqual(r['coverage']['built'],'NOT_RUN')
 def test_truncated_image_fails_decode(self):
  p=self.world/'assets/cope.webp';p.write_bytes(p.read_bytes()[:20]);r=gate.qualify(self.world);self.assertEqual(r['status'],'FAIL');self.assertTrue(any(c['id']=='DECODE:cope' for c in r['checks']))
 def test_wrong_dimensions_fail(self):
  p=self.world/'assets/manifest.json';m=json.loads(p.read_text());m[0]['width']=3;p.write_text(json.dumps(m));r=gate.qualify(self.world);self.assertEqual(r['status'],'FAIL')
 def test_path_traversal_rejected(self):
  p=self.world/'assets/manifest.json';m=json.loads(p.read_text());m[0]['file']='../cope.webp';p.write_text(json.dumps(m));self.assertEqual(gate.qualify(self.world)['status'],'FAIL')
 def test_build_changed_bytes_rejected(self):
  built=self.root/'built';shutil.copytree(self.world,built);(built/'app.js').write_text('// altered');r=gate.qualify(self.world,built);self.assertEqual(r['status'],'FAIL')
 def test_exact_copy_passes_byte_comparison_not_deployment(self):
  built=self.root/'built';shutil.copytree(self.world,built);r=gate.qualify(self.world,built);self.assertEqual(r['status'],'PASS');self.assertEqual(r['coverage']['deployed_base_path'],'NOT_RUN');self.assertEqual(r['release_status'],'BLOCKED')
if __name__=='__main__':unittest.main(verbosity=2)
