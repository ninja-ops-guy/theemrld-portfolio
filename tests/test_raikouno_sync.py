import json
import subprocess
import sys
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

    def test_soundcloud_feed_shape(self):
        # Selected fields from the numeric-ID SoundCloud feed on November 7, 2026.
        feed = b"""<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
        <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:72536165/sounds.rss" rel="self"/>
        <item><title>DAMN ROBOT!</title><link>https://soundcloud.com/raikouno/damn-robot</link>
        <guid isPermaLink="false">tag:soundcloud,2010:tracks/2433954672</guid>
        <pubDate>Sat, 07 Nov 2026 16:17:09 +0000</pubDate></item>
        </channel></rss>"""
        track, = parse_feed(feed)
        self.assertEqual(track["url"], "https://soundcloud.com/raikouno/damn-robot")
        self.assertEqual(track["createdAt"], "2026-11-07T16:17:09Z")

    def test_failed_sync_preserves_last_verified_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            feed = Path(directory) / "feed.xml"
            output = Path(directory) / "latest-releases.json"
            command = [sys.executable, "-m", "scripts.sync_raikouno", "--feed-file", str(feed), "--output", str(output)]
            feed.write_bytes(FEED)
            subprocess.run(command, check=True, capture_output=True)
            previous = output.read_bytes()
            snapshot = json.loads(previous)
            self.assertTrue(snapshot["verifiedAt"].endswith("Z"))
            self.assertEqual(snapshot["tracks"][0]["title"], "New")
            for response in (b"<rss><channel/></rss>", b"<html>"):
                with self.subTest(response=response):
                    feed.write_bytes(response)
                    self.assertEqual(subprocess.run(command, capture_output=True).returncode, 1)
                    self.assertEqual(output.read_bytes(), previous)

    def test_no_undated_tracks_accepted(self):
        with self.assertRaises(ValueError):
            parse_feed(b"<rss><channel><item><title>A</title><link>https://soundcloud.com/raikouno/a</link></item></channel></rss>")

if __name__ == "__main__":
    unittest.main()
