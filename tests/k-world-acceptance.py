#!/usr/bin/env python3
"""K//WORLD release acceptance browser gate.

Scopes the P0/P1 checks that can be made deterministically in CI:
- original K Terminal is preserved and `gallery` hands off to K//WORLD
- ASCII is the fresh default
- expanded archive loads, twelve physical frames remain, and look-away rotation
  changes content without duplicating visible works when alternatives exist
- inspector metadata follows the rotated work
- dynamic art addressing reaches the full archive and rejects out-of-range values
- city/gallery/realm navigation stays distinct
- mobile layout does not create document overflow
- acid-green/black continuity is present

Audio continuity itself is covered by tests/k-world-audio.test.mjs where FINISH,
pause, queue-collapse, stale callbacks and explicit skip are deterministic.
"""
from __future__ import annotations
import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("K_WORLD_BASE_URL", "http://127.0.0.1:4173/theemrld-portfolio/")
OUT = Path(os.environ.get("K_WORLD_QA_DIR", "qa/k-world-acceptance"))
OUT.mkdir(parents=True, exist_ok=True)
checks = []

def record(name, ok, detail=""):
    checks.append({"id": name, "status": "PASS" if ok else "FAIL", "detail": detail})
    if not ok:
        raise AssertionError(f"{name}: {detail}")

def main():
    console_errors, page_errors = [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(viewport={"width": 1440, "height": 1000})
        page = context.new_page()
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))

        # Original terminal must remain the portfolio entry point.
        page.goto(BASE + "#/terminal", wait_until="domcontentloaded", timeout=90000)
        terminal = page.locator(".kt-input")
        terminal.wait_for(state="visible", timeout=90000)
        terminal.fill("play 1")
        record("ORIGINAL-TERMINAL-SPACES", terminal.input_value() == "play 1", terminal.input_value())
        terminal.fill("gallery")
        terminal.press("Enter")
        page.wait_for_function("location.hash.includes('/k/gallery')", timeout=30000)
        world_host = page.locator('iframe[title*="K // THE EMRLD"]')
        world_host.wait_for(state="attached", timeout=30000)
        record("TERMINAL-GALLERY-HANDOFF", world_host.count() == 1, page.url)

        # Direct QA entry gives deterministic instrumentation without replacing the
        # production user flow above.
        page.goto(BASE + "k-world/index.html?qa=1#gallery", wait_until="domcontentloaded", timeout=90000)
        page.wait_for_function("window.__K_WORLD_QA__ !== undefined", timeout=120000)
        page.wait_for_function("window.__K_WORLD_QA__.state().activeId === 'gallery'", timeout=30000)
        state = page.evaluate("window.__K_WORLD_QA__.state()")
        record("ASCII-DEFAULT", state["ascii"] is True, str(state["ascii"]))
        record("ARCHIVE-ASSETS-LOAD", len(state["errors"]) == 0, json.dumps(state["errors"]))

        palette = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--green').trim()")
        body_bg = page.evaluate("getComputedStyle(document.body).backgroundColor")
        record("ACID-GREEN-PALETTE", palette.lower() == "#00ff41", palette)
        record("BLACK-FOUNDATION", body_bg in ("rgb(2, 4, 2)", "rgba(0, 0, 0, 0)", "rgb(1, 2, 1)"), body_bg)

        archive = page.evaluate("window.__K_WORLD_QA__.archive()")
        frames = page.evaluate("window.__K_WORLD_QA__.frameState()")
        record("ARCHIVE-SIZE", len(archive) >= 41, str(len(archive)))
        record("TWELVE-PHYSICAL-FRAMES", len(frames) == 12, str(len(frames)))
        record("INITIAL-FRAMES-UNIQUE", len({f["art"] for f in frames}) == 12, json.dumps(frames))

        # Repeatedly rotate every frame. This is a deterministic harness entry to the
        # same production function that fires when the visitor looks away.
        for round_no in range(5):
            slots = [f["slot"] for f in page.evaluate("window.__K_WORLD_QA__.frameState()")]
            for slot in slots:
                changed = page.evaluate("(slot)=>window.__K_WORLD_QA__.rotateFrame(slot)", slot)
                record(f"ROTATE-{round_no+1}-{slot}", bool(changed) and changed["after"] != changed["before"], json.dumps(changed))
                visible = page.evaluate("window.__K_WORLD_QA__.frameState()")
                record(f"VISIBLE-UNIQUE-{round_no+1}-{slot}", len({x["art"] for x in visible}) == len(visible), json.dumps(visible))

        # Inspector must follow current frame metadata, not its original assignment.
        current = page.evaluate("window.__K_WORLD_QA__.frameState()[0]")
        index = next(i for i, piece in enumerate(archive) if piece["id"] == current["art"])
        page.evaluate("(i)=>window.__K_WORLD_QA__.inspect(i)", index)
        page.locator("#art-dialog[open]").wait_for(timeout=10000)
        title = page.locator("#art-title").inner_text()
        src = page.locator("#art-image").get_attribute("src") or ""
        expected = archive[index]
        record("INSPECTOR-FOLLOWS-ROTATION", expected["title"] in title, f"{title} / {expected['title']}")
        record("INSPECTOR-SOURCE", expected["src"].split("/")[-1] in src or src == expected["src"], src)
        page.evaluate("window.__K_WORLD_QA__.close()")

        count = len(archive)
        page.evaluate("(n)=>window.__K_WORLD_QA__.command('art '+n)", count)
        page.locator("#art-dialog[open]").wait_for(timeout=10000)
        record("LAST-ART-ADDRESSABLE", archive[-1]["title"] in page.locator("#art-title").inner_text(), page.locator("#art-title").inner_text())
        page.evaluate("window.__K_WORLD_QA__.close()")
        page.evaluate("(n)=>window.__K_WORLD_QA__.command('art '+n)", count + 1)
        output = page.locator("#console-output").inner_text()
        record("OUT-OF-RANGE-ART-FAILS-CLEANLY", f"art 1–{count}" in output, output[-500:])

        # Topology: eight visual environments remain separate and navigable.
        for scene_id in ["gallery", "city", "sol", "torus", "prism", "tesseract", "moon", "station"]:
            page.evaluate("(id)=>window.__K_WORLD_QA__.navigate(id)", scene_id)
            st = page.evaluate("window.__K_WORLD_QA__.state()")
            record("SCENE-" + scene_id.upper(), st["activeId"] == scene_id and st["meshCount"] > 3, json.dumps(st))
        page.evaluate("window.__K_WORLD_QA__.navigate('gallery')")

        # Audio authority UI must expose the non-overlap contract. Deterministic
        # transition semantics are exercised by the Node audio suite.
        page.evaluate("window.__K_WORLD_QA__.terminal()")
        status = page.locator("#terminal-audio-status").inner_text()
        record("ONE-PLAYER-UI-CONTRACT", "NO CROSSFADE" in status, status)
        page.evaluate("window.__K_WORLD_QA__.command('status')")
        status_log = page.locator("#console-output").inner_text()
        record("ONE-PLAYER-COMMAND-CONTRACT", "No crossfade, no second player." in status_log, status_log[-800:])
        page.evaluate("window.__K_WORLD_QA__.close()")

        page.screenshot(path=str(OUT / "gallery-desktop.png"), full_page=True)

        # Portrait/mobile acceptance.
        page.set_viewport_size({"width": 390, "height": 844})
        time.sleep(0.5)
        overflow = page.evaluate("({scroll:document.documentElement.scrollWidth,inner:innerWidth,body:document.body.scrollWidth})")
        record("MOBILE-NO-HORIZONTAL-OVERFLOW", overflow["scroll"] <= overflow["inner"] + 1 and overflow["body"] <= overflow["inner"] + 1, json.dumps(overflow))
        page.screenshot(path=str(OUT / "gallery-mobile.png"), full_page=True)

        # Only application/runtime errors fail this gate; browser network console
        # diagnostics from blocked third-party media are captured separately.
        record("NO-PAGEERRORS", len(page_errors) == 0, json.dumps(page_errors))
        browser.close()

    receipt = {
        "schema": "k-world-release-acceptance/v1",
        "base_url": BASE,
        "status": "PASS" if all(c["status"] == "PASS" for c in checks) else "FAIL",
        "checks": checks,
        "console_errors": console_errors,
        "page_errors": page_errors,
        "limitations": [
            "SoundCloud provider playback is not exercised in CI; sequencer invariants are unit-tested.",
            "Human visual review remains required for aesthetic quality and scene uniqueness.",
            "This gate does not substitute for a real-device 10–15 minute soak."
        ]
    }
    (OUT / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"status": receipt["status"], "checks": len(checks), "screenshots": 2}))
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        # Preserve a failure receipt even when an assertion aborts early.
        receipt = {"schema":"k-world-release-acceptance/v1","base_url":BASE,"status":"FAIL","checks":checks,"error":repr(exc)}
        (OUT / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
        print(json.dumps(receipt), file=sys.stderr)
        raise
