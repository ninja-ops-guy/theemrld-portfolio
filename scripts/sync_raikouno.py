#!/usr/bin/env python3
"""Sync public @raikouno RSS releases into a dated, auditable K Terminal feed.

Fail closed: no empty/undated replacement when SoundCloud RSS is unavailable.
Identical track data leaves the previous bytes and verification date untouched.
SoundCloud RSS must be enabled by the account owner for this feed to work.
"""
import argparse
import datetime as dt
import email.utils
import json
import pathlib
import sys
import tempfile
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

FEED = "https://feeds.soundcloud.com/users/soundcloud:users:72536165/sounds.rss"
DEST = pathlib.Path("public/k-world/latest-releases.json")
ARTIST = "raikouno"
MAX_FEED_BYTES = 3_000_000

def parse_feed(xml: bytes) -> list[dict]:
    root = ET.fromstring(xml)
    channel = root.find("channel")
    if channel is None:
        raise ValueError("SoundCloud RSS channel missing")
    tracks = []
    seen = set()
    for item in channel.findall("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        published = (item.findtext("pubDate") or "").strip()
        parsed = urllib.parse.urlsplit(link)
        parts = parsed.path.strip("/").split("/")
        if parsed.scheme != "https" or parsed.hostname not in ("soundcloud.com", "www.soundcloud.com"):
            continue
        if len(parts) != 2 or parts[0].lower() != ARTIST or parts[1] in ("sets", "tracks", "likes"):
            continue
        if not title or not published:
            continue
        try:
            date = email.utils.parsedate_to_datetime(published)
            if date is None or date.tzinfo is None:
                continue
            date = date.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")
        except (ValueError, TypeError):
            continue
        url = f"https://soundcloud.com/{ARTIST}/{parts[1]}"
        if url in seen:
            continue
        seen.add(url)
        tracks.append({"id": parts[1], "title": title, "url": url,
                       "provider": "soundcloud", "createdAt": date})
    # A feed reorder must not generate a release commit for equal-date tracks.
    tracks.sort(key=lambda t: (t["createdAt"], t["url"]), reverse=True)
    if not tracks:
        raise ValueError("No valid, dated @raikouno tracks in RSS feed")
    return tracks

def update_snapshot(output: pathlib.Path, tracks: list[dict]) -> bool:
    """Atomically publish changed track data; return False for a semantic no-op."""
    if output.exists():
        try:
            previous = json.loads(output.read_text(encoding="utf-8"))
            verified = dt.datetime.fromisoformat(previous["verifiedAt"].replace("Z", "+00:00"))
            if verified.tzinfo is not None and previous.get("tracks") == tracks:
                return False
        except (ValueError, TypeError, KeyError, AttributeError):
            # A valid feed can repair a malformed local catalogue.
            pass
    output.parent.mkdir(parents=True, exist_ok=True)
    snapshot = {
        "verifiedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "tracks": tracks,
    }
    result = json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n"
    file = tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=output.parent, delete=False)
    temporary = pathlib.Path(file.name)
    try:
        with file:
            file.write(result)
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)
    return True

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--feed-file", type=pathlib.Path, help="Offline fixture for tests")
    parser.add_argument("--output", type=pathlib.Path, default=DEST)
    args = parser.parse_args()
    try:
        if args.feed_file:
            data = args.feed_file.read_bytes()
            tracks = parse_feed(data)
        else:
            headers = {"User-Agent": "Mozilla/5.0 (compatible; KTerminalReleaseSync/1.0)"}
            request = urllib.request.Request(FEED, headers=headers)
            with urllib.request.urlopen(request, timeout=20) as response:
                data = response.read(MAX_FEED_BYTES + 1)
                if len(data) > MAX_FEED_BYTES:
                    raise ValueError("SoundCloud RSS response exceeds the size limit")
                tracks = parse_feed(data)
        changed = update_snapshot(args.output, tracks)
        print(f"{'Updated' if changed else 'Unchanged'}: {len(tracks)} dated @raikouno releases")
        return 0
    except Exception as error:
        print(f"RELEASE_SYNC_BLOCKED: {error}. Existing catalogue preserved.", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
