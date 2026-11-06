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
import re
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

def parse_profile_html(html: bytes) -> list[dict]:
    """Extract only public, artist-owned dated tracks from SoundCloud's hydration JSON."""
    page = html.decode("utf-8", errors="replace")
    match = re.search(r"window\\.__sc_hydration\\s*=\\s*", page)
    if not match:
        raise ValueError("No public SoundCloud track hydration found")
    hydration, _ = json.JSONDecoder().raw_decode(page[match.end():].lstrip())
    found = []
    seen = set()

    def visit(node):
        if isinstance(node, list):
            for entry in node:
                visit(entry)
        elif isinstance(node, dict):
            link = node.get("permalink_url", "")
            if isinstance(link, str):
                parsed = urllib.parse.urlsplit(link)
                parts = parsed.path.strip("/").split("/")
                owner = node.get("user") or {}
                owner_slug = owner.get("permalink") if isinstance(owner, dict) else None
                if (parsed.hostname in ("soundcloud.com", "www.soundcloud.com")
                        and len(parts) == 2 and parts[0].lower() == ARTIST
                        and (not owner_slug or owner_slug.lower() == ARTIST)
                        and link not in seen):
                    date = node.get("display_date") or node.get("release_date") or node.get("created_at")
                    try:
                        when = dt.datetime.fromisoformat(date.replace("Z", "+00:00"))
                        when = when.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")
                        title = node.get("title", "")
                        if title and when:
                            seen.add(link)
                            found.append({"id": str(node.get("id") or parts[1]),
                                          "title": title, "url": f"https://soundcloud.com/{ARTIST}/{parts[1]}",
                                          "provider": "soundcloud", "createdAt": when})
                    except (ValueError, AttributeError, TypeError):
                        pass
            for child in node.values():
                visit(child)

    visit(hydration)
    found.sort(key=lambda x: x["createdAt"], reverse=True)
    if not found:
        raise ValueError("No dated @raikouno tracks found in public profile hydration")
    return found


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
            try:
                request = urllib.request.Request(FEED, headers=headers)
                with urllib.request.urlopen(request, timeout=20) as response:
                    data = response.read(3_000_000)
                tracks = parse_feed(data)
            except (ValueError, ET.ParseError, OSError) as rss_error:
                # RSS is optional on SoundCloud. The public profile may provide dated
                # track metadata in its server-rendered hydration payload instead.
                print(f"RSS unavailable ({type(rss_error).__name__}); checking public profile", file=sys.stderr)
                request = urllib.request.Request("https://soundcloud.com/raikouno/tracks", headers=headers)
                with urllib.request.urlopen(request, timeout=20) as response:
                    tracks = parse_profile_html(response.read(5_000_000))
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
