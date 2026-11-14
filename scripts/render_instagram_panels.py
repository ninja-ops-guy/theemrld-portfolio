#!/usr/bin/env python3
"""Review-only, native-resolution Instagram panel exports for Revision G p006.

The crop map was visually inspected against the complete 10-panel printed page.
Coordinates reference the prior 1080x1350 full-page export, where original art
occupied x=90..990 and y=0..1350. The renderer samples the independently
hash-verified original 2160x3240 WebP, never an enlarged Instagram JPEG.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

POST_ID = "THIG-P01-PANEL"
STORY_PAGE = 6
PANEL_CROPS_EXPORT = [
    (110, 15, 300, 264),
    (295, 15, 650, 263),
    (648, 15, 976, 263),
    (110, 260, 339, 586),
    (337, 260, 562, 586),
    (560, 260, 978, 588),
    (111, 582, 501, 919),
    (498, 582, 976, 922),
    (110, 918, 502, 1300),
    (499, 920, 974, 1299),
]
CAPTION = ("TECHOPS HERO — VOLUME I, PART 1 ⚡\n\n"
           "A normal day at AeroTech turns into something Mike can’t explain.\n\n"
           "Swipe through the opening scene, one panel at a time so the "
           "dialogue is easier to read on a phone.\n\n"
           "Created by Mike Olivares. Read the full comic at kterminal.site.\n\n"
           "#TechOpsHero #IndieComics #SciFiComics #GraphicNovel #Webcomic")

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def native_box(export_box, size):
    """Map reviewed export panel rectangles to source pixels exactly."""
    w, h = size
    if (w, h) != (2160, 3240):
        raise ValueError("Expected original native 2160x3240 web render")
    a, b, c, d = export_box
    if not (90 <= a < c <= 990 and 0 <= b < d <= 1350):
        raise ValueError("Crop box escapes approved full-page artwork")
    return tuple(round(v) for v in (
        (a-90)*w/900, b*h/1350, (c-90)*w/900, d*h/1350))

def render_panel(source, box, slide_number, dest):
    if source.size != (2160, 3240):
        raise ValueError("Not an original native-resolution page")
    selected = native_box(box, source.size)
    panel = source.crop(selected)
    canvas = Image.new("RGB", (1080, 1350), (5, 19, 27))
    draw = ImageDraw.Draw(canvas)
    # Auxiliary labels stay legible when reduced to 390px phone display.
    font = ImageFont.load_default(size=32)
    content = (35, 108, 1045, 1230)
    panel.thumbnail((content[2]-content[0], content[3]-content[1]), Image.Resampling.LANCZOS)
    x = (1080-panel.width)//2
    y = content[1] + (content[3]-content[1]-panel.height)//2
    canvas.paste(panel, (x, y))
    draw.rectangle((x-3, y-3, x+panel.width+2, y+panel.height+2), outline=(85, 135, 141), width=2)
    draw.line((34, 73, 1046, 73), fill=(83, 149, 150), width=2)
    draw.line((34, 1285, 1046, 1285), fill=(83, 149, 150), width=2)
    draw.text((37, 31), "TECHOPS HERO  /  VOL. I", font=font, fill=(237, 243, 245))
    draw.text((925, 31), f"{slide_number:02d} / 10", font=font, fill=(237, 243, 245))
    draw.text((37, 1295), f"ORIGINAL PAGE 04  /  PANEL {slide_number:02d}", font=font, fill=(192, 209, 212))
    draw.text((943, 1295), "SWIPE", font=font, fill=(192, 209, 212))
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest, format="JPEG", quality=95, subsampling=0, optimize=True)
    out = dest.read_bytes()
    if len(out) > 8_000_000:
        raise ValueError("JPEG exceeds 8 MB publishing media limit")
    return {"source_crop_native": list(selected), "source_crop_review_export": list(box),
            "rendered_panel_dimensions": list(panel.size),
            "image_sha256": sha256(out), "bytes": len(out),
            "instagram_dimensions": [1080, 1350]}

def build(root, output):
    receipt = json.loads((root / "docs/INSTAGRAM_APPROVED_SOURCE.json").read_text())
    if (receipt.get("edition"), receipt.get("pages"), receipt.get("media_commit"), receipt.get("source_pdf_sha256")) != (
            "Full collection", 316, "aa8c132035a46e73fb47ee14e05e371909799d64",
            "c18407af88e9ba6dbb5ed4707fc998bd19e12d31c59b2f92b87f58d8a0bfa50b"):
        raise ValueError("Source identity is not the approved Revision G edition")
    page = receipt["web_render"]["pages"][str(STORY_PAGE)]
    raw = (root / page["path"]).read_bytes()
    if len(raw) != page["bytes"] or sha256(raw) != page["sha256"]:
        raise ValueError("Native source asset failed approved SHA-256 / bytes check")
    with Image.open(io.BytesIO(raw)) as im:
        source = ImageOps.exif_transpose(im).convert("RGB")
    if source.size != (2160, 3240):
        raise ValueError("Approved native source has unexpected dimensions")
    folder = output / POST_ID
    slides = []
    for i, crop in enumerate(PANEL_CROPS_EXPORT, 1):
        dest = folder / f"{POST_ID}-{i:02d}-page006-panel{i:02d}.jpg"
        audit = render_panel(source, crop, i, dest)
        slides.append({"slide": i, "source_page": STORY_PAGE, "source_panel": i,
                       "filename": dest.name, **audit})
    caption_sha = sha256(CAPTION.encode("utf-8"))
    packet = {"status": "REVIEW_ONLY_NOT_APPROVED_NOT_SCHEDULED", "account": "@defied_stars",
              "metricool_brand": 7974031, "post_id": POST_ID,
              "edition": "Full collection / Revision G", "media_commit": receipt["media_commit"],
              "source_pdf_sha256": receipt["source_pdf_sha256"],
              "source_webp_sha256": page["sha256"], "source_dimensions": [2160, 3240],
              "caption": CAPTION, "caption_sha256": caption_sha,
              "proposed_time": "PENDING EXACT OWNER APPROVAL", "delivery": "NOT HOSTED",
              "notes": "Panel crop boundaries require visual sign-off; captions and account/time require exact approval. Never auto-publish.",
              "slides": slides}
    (folder / "caption.txt").write_text(CAPTION + "\n", encoding="utf-8")
    (folder / "packet.json").write_text(json.dumps(packet, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{POST_ID}: {len(slides)} native-resolution panel slides verified, REVIEW ONLY")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, default=Path("qa/instagram-panel-review"))
    args = parser.parse_args()
    build(args.root, args.output)
