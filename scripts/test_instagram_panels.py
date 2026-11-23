"""Safety, cropping and source-identity checks for native Instagram panels."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from render_instagram_panels import PANEL_CROPS_EXPORT, native_box, render_panel, build

class NativePanelTest(unittest.TestCase):
    def test_exact_ten_reviewed_rectangles(self):
        self.assertEqual(len(PANEL_CROPS_EXPORT), 10)
        self.assertEqual(len(set(PANEL_CROPS_EXPORT)), 10)
        for box in PANEL_CROPS_EXPORT:
            self.assertTrue(0 <= native_box(box, (2160,3240))[0] < native_box(box, (2160,3240))[2] <= 2160)

    def test_native_mapping(self):
        self.assertEqual(native_box((110,15,300,264), (2160,3240)), (48,36,504,634))
        with self.assertRaisesRegex(ValueError, "original native"):
            native_box(PANEL_CROPS_EXPORT[0], (1080,1350))
        with self.assertRaisesRegex(ValueError, "escapes"):
            native_box((0,0,1080,1350), (2160,3240))

    def test_panel_export_dimensions_and_provenance(self):
        src=Image.new("RGB",(2160,3240),(36,88,107))
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"panel.jpg"
            m=render_panel(src,PANEL_CROPS_EXPORT[0],1,path)
            with Image.open(path) as exported:
                self.assertEqual(exported.size,(1080,1350))
                self.assertEqual(exported.format,"JPEG")
            self.assertEqual(m["source_crop_native"],[48,36,504,634])
            self.assertEqual(m["image_sha256"],hashlib.sha256(path.read_bytes()).hexdigest())
            self.assertLess(m["bytes"],8_000_000)

    def test_reject_wrong_release(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/"docs").mkdir()
            (root/"docs/INSTAGRAM_APPROVED_SOURCE.json").write_text(json.dumps({"edition":"Revision F","pages":316}))
            with self.assertRaisesRegex(ValueError,"Source identity"):
                build(root,root/"out")

    def test_reject_corrupt_original_before_creating_artifacts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/"docs").mkdir()
            (root/"sources/g").mkdir(parents=True)
            (root/"sources/g/006.webp").write_bytes(b"bad")
            original={"edition":"Full collection", "pages":316,
                 "media_commit":"aa8c132035a46e73fb47ee14e05e371909799d64",
                 "source_pdf_sha256":"c18407af88e9ba6dbb5ed4707fc998bd19e12d31c59b2f92b87f58d8a0bfa50b",
                 "web_render":{"pages":{"6":{"path":"sources/g/006.webp","bytes":1425920,"sha256":"bad"}}}}
            (root/"docs/INSTAGRAM_APPROVED_SOURCE.json").write_text(json.dumps(original))
            with self.assertRaisesRegex(ValueError,"SHA-256"):
                build(root,root/"out")
            self.assertFalse((root/"out").exists())

if __name__ == "__main__":
    unittest.main()
