"""Regression checks for Instagram pilot pagination and no-crop framing."""
import io
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from render_instagram_comic import POSTS, render_one, build

class InstagramPilotTest(unittest.TestCase):
    def test_all_pages_once_in_order(self):
        pages=[p for part in POSTS.values() for p in part]
        self.assertEqual(pages,list(range(6,52)))
        self.assertEqual(len(POSTS),8)
        self.assertTrue(all(5<=len(x)<=7 for x in POSTS.values()))

    def test_stale_release_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/"docs").mkdir()
            (root/"docs/INSTAGRAM_APPROVED_SOURCE.json").write_text(json.dumps({"edition":"Revision F - continuity reviewed","pages":316}))
            with self.assertRaisesRegex(ValueError,"Source identity"):
                build(root,root/"output","THIG-P01")
            self.assertFalse((root/"output").exists())

    def test_corrupt_current_page_fails_closed(self):
        package=Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/"docs").mkdir()
            shutil.copyfile(package/"docs/INSTAGRAM_APPROVED_SOURCE.json",root/"docs/INSTAGRAM_APPROVED_SOURCE.json")
            (root/"sources/g").mkdir(parents=True)
            (root/"sources/g/006.webp").write_bytes(b"corrupt source")
            with self.assertRaisesRegex(ValueError,"does not match release"):
                build(root,root/"output","THIG-P01")
            self.assertFalse((root/"output").exists())

    def test_full_page_preserved_with_horizontal_letterboxing(self):
        src=Image.new("RGB",(2160,3240),"black")
        for y in range(0,3240,40):
            src.putpixel((0,y),(255,0,0))
            src.putpixel((2159,y),(0,255,0))
        buffer=io.BytesIO()
        src.save(buffer,"WEBP",lossless=True)
        with tempfile.TemporaryDirectory() as tmp:
            dest=Path(tmp)/"slide.jpg"
            evidence=render_one(buffer.getvalue(),dest)
            with Image.open(dest) as out:
                self.assertEqual(out.size,(1080,1350))
            self.assertEqual(evidence["art_dimensions"],[900,1350])
            self.assertEqual(evidence["padding_pixels"],[90,0,90,0])

if __name__=="__main__":
    unittest.main()
