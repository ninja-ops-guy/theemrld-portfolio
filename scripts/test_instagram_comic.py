"""Regression checks for Instagram pilot pagination and no-crop framing."""
import io
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from render_instagram_comic import POSTS, render_one

class InstagramPilotTest(unittest.TestCase):
    def test_all_pages_once_in_order(self):
        pages=[p for part in POSTS.values() for p in part]
        self.assertEqual(pages,list(range(6,52)))
        self.assertEqual(len(POSTS),8)
        self.assertTrue(all(5<=len(x)<=7 for x in POSTS.values()))

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
