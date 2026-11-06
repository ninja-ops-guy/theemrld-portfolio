#!/usr/bin/env python3
"""Sync public @raikouno RSS releases into a dated, auditable K Terminal feed.

Fail closed: no empty/undated replacement when SoundCloud RSS is unavailable.
SoundCloud RSS must be enabled by the account owner for this feed to work.
"""
import argparse
import datetime as dt
import email.utils
import json
import pathlib
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

FEED = "https://soundcloud.com/raikouno/rss"
DEST = pathlib.Path("public/k-world/latest-releases.json")
ARTIST = "raikouno"

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
            if date is None:
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
    tracks.sort(key=lambda t: t["createdAt"], reverse=True)
    if not tracks:
        raise ValueError("No valid, dated @raikouno tracks in RSS feed")
    return tracks

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--feed-file", type=pathlib.Path, help="Offline fixture for tests")
    parser.add_argument("--output", type=pathlib.Path, default=DEST)
    args = parser.parse_args()
    try:
        if args.feed_file:
            data = args.feed_file.read_bytes()
        else:
            request = urllib.request.Request(FEED, headers={"User-Agent": "KTerminalReleaseSync/1.0"})
            with urllib.request.urlopen(request, timeout=20) as response:
                data = response.read(3_000_000)
        tracks = parse_feed(data)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        result = json.dumps(tracks, ensure_ascii=False, indent=2) + "\n"
        if args.output.exists() and args.output.read_text(encoding="utf-8") == result:
            print(f"Unchanged: {len(tracks)} dated releases")
            return 0
        args.output.write_text(result, encoding="utf-8")
        print(f"Synced {len(tracks)} dated @raikouno releases")
        return 0
    except Exception as error:
        print(f"RELEASE_SYNC_BLOCKED: {error}. Existing catalogue preserved.", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
