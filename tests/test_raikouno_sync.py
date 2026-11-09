import json
import contextlib
import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from scripts.sync_raikouno import MAX_FEED_BYTES, main, parse_feed, update_snapshot

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

    def test_unchanged_feed_preserves_snapshot_bytes_and_date(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "latest-releases.json"
            tracks = parse_feed(FEED)
            self.assertTrue(update_snapshot(output, tracks))
            # A previous successful check must not cause hourly timestamp commits.
            snapshot = json.loads(output.read_text())
            snapshot["verifiedAt"] = "2026-11-01T12:00:00Z"
            output.write_text(json.dumps(snapshot, indent=4) + "\n")
            previous = output.read_bytes()
            self.assertFalse(update_snapshot(output, parse_feed(FEED)))
            self.assertEqual(output.read_bytes(), previous)

    def test_new_release_and_title_edits_are_published(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "latest-releases.json"
            update_snapshot(output, parse_feed(FEED))
            updated = FEED.replace(b"<title>New</title>", b"<title>Corrected title</title>")
            added = b"""<item><title>Latest</title><link>https://soundcloud.com/raikouno/latest</link>
            <pubDate>Sun, 08 Nov 2026 10:00:00 GMT</pubDate></item>"""
            updated = updated.replace(b"</channel>", added + b"</channel>")
            self.assertTrue(update_snapshot(output, parse_feed(updated)))
            tracks = json.loads(output.read_text())["tracks"]
            self.assertEqual([track["title"] for track in tracks], ["Latest", "Corrected title", "Old"])

    def test_feed_order_changes_do_not_reorder_equal_date_tracks(self):
        a = b"""<item><title>A</title><link>https://soundcloud.com/raikouno/a</link>
        <pubDate>Sun, 08 Nov 2026 10:00:00 GMT</pubDate></item>"""
        b = a.replace(b"<title>A</title>", b"<title>B</title>").replace(b"raikouno/a", b"raikouno/b")
        self.assertEqual(parse_feed(b"<rss><channel>" + a + b + b"</channel></rss>"),
                         parse_feed(b"<rss><channel>" + b + a + b"</channel></rss>"))

    def test_failed_atomic_replace_keeps_previous_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "latest-releases.json"
            update_snapshot(output, parse_feed(FEED))
            previous = output.read_bytes()
            with patch.object(Path, "replace", side_effect=OSError("write unavailable")):
                with self.assertRaises(OSError):
                    update_snapshot(output, parse_feed(FEED.replace(b"<title>New</title>", b"<title>Changed</title>")))
            self.assertEqual(output.read_bytes(), previous)
            self.assertEqual(list(Path(directory).iterdir()), [output])

    def test_network_failure_keeps_previous_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "latest-releases.json"
            update_snapshot(output, parse_feed(FEED))
            previous = output.read_bytes()
            with patch.object(sys, "argv", ["sync_raikouno.py", "--output", str(output)]):
                with patch("urllib.request.urlopen", side_effect=TimeoutError("feed timeout")):
                    with contextlib.redirect_stderr(io.StringIO()):
                        self.assertEqual(main(), 1)
            self.assertEqual(output.read_bytes(), previous)

    def test_oversized_feed_keeps_previous_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "latest-releases.json"
            update_snapshot(output, parse_feed(FEED))
            previous = output.read_bytes()
            with patch.object(sys, "argv", ["sync_raikouno.py", "--output", str(output)]):
                with patch("urllib.request.urlopen", return_value=io.BytesIO(b" " * (MAX_FEED_BYTES + 1))):
                    with contextlib.redirect_stderr(io.StringIO()):
                        self.assertEqual(main(), 1)
            self.assertEqual(output.read_bytes(), previous)

    def test_valid_feed_repairs_invalid_local_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "latest-releases.json"
            output.write_text('{"tracks": []}')
            self.assertTrue(update_snapshot(output, parse_feed(FEED)))
            self.assertEqual(json.loads(output.read_text())["tracks"][0]["title"], "New")

if __name__ == "__main__":
    unittest.main()
