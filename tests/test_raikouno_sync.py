import tempfile
import unittest
from pathlib import Path
from scripts.sync_raikouno import parse_feed

FEED = b"""<rss><channel>
<item><title>Old</title><link>https://soundcloud.com/raikouno/old</link><pubDate>Wed, 01 Jul 2026 10:00:00 GMT</pubDate></item>
<item><title>New</title><link>https://soundcloud.com/raikouno/new</link><pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate></item>
<item><title>Foreign</title><link>https://soundcloud.com/other/foreign</link><pubDate>Fri, 06 Nov 2026 10:00:00 GMT</pubDate></item>
<item><title>Duplicate</title><link>https://soundcloud.com/raikouno/new</link><pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate></item>
</channel></rss>"""

class SyncTests(unittest.TestCase):
    def test_newest_first_and_artist_filter(self):
        tracks = parse_feed(FEED)
        self.assertEqual([x["title"] for x in tracks], ["New", "Old"])
        self.assertEqual(tracks[0]["createdAt"], "2026-11-05T10:00:00Z")

    def test_no_undated_tracks_accepted(self):
        with self.assertRaises(ValueError):
            parse_feed(b"<rss><channel><item><title>A</title><link>https://soundcloud.com/raikouno/a</link></item></channel></rss>")

if __name__ == "__main__":
    unittest.main()
