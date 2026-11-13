#!/usr/bin/env python3
"""Rebuild Volume XIII's official PDF using the approved, already-published page 29 art.

Only the grandfather's top tea-table image object is replaced; selectable
captions and dialogue stay untouched. This is a release operation, not new art.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path

import fitz
from PIL import Image, ImageChops, ImageDraw

EXPECTED_PDF_SHA = "85c2fbd8c80b8704c884cdfe2f1771f2bbd856bbfaabde57ca855112c4580637"
EXPECTED_PDF_BYTES = 65854157
EXPECTED_ART_SHA = "3428da2138356ed243b0a8419baed0efd4e25ad794990bea4879e359fd5c9e38"
EXPECTED_SIZE = (2160, 3240)
PAGE_INDEX = 28
PAGE_COUNT = 49


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for part in iter(lambda: f.read(1024 * 1024), b""):
            h.update(part)
    return h.hexdigest()


def must(condition, explanation):
    if not condition:
        raise RuntimeError(explanation)


def raster(page):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False, colorspace=fitz.csRGB)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def run(args):
    must(args.original.stat().st_size == EXPECTED_PDF_BYTES and sha256(args.original) == EXPECTED_PDF_SHA,
         "Source is not the immutable reviewed November 10 release PDF")
    must(sha256(args.art) == EXPECTED_ART_SHA, "Page image differs from the approved PR #105 corrected art")
    with Image.open(args.art) as reader:
        must(reader.size == EXPECTED_SIZE, "Wrong source art dimensions")
        with fitz.open(args.original) as doc:
            must(len(doc) == PAGE_COUNT, "Expected 49-page revised Volume XIII")
            original_text = [p.get_text() for p in doc]
            text = original_text[PAGE_INDEX]
            for line in ("32 / WHAT SURVIVED THE FILE",
                         "Her grandfather encrypts the rehearsal time",
                         "FELICIA You hid the answer under the teapot.",
                         "GRANDFATHER And you found it."):
                must(line in text, "Unexpected page 29 dialogue or chapter")
            page = doc[PAGE_INDEX]
            top_images = []
            for info in page.get_images(full=True):
                rects = page.get_image_rects(info[0])
                if len(rects) == 1 and 40 < rects[0].y0 < 55 and 270 < rects[0].y1 < 285:
                    top_images.append((info[0], rects[0]))
            must(len(top_images) == 1, "Tea-table image object was not uniquely identified")
            xref, rect = top_images[0]
            must(59 < rect.x0 < 62 and 370 < rect.x1 < 373 and rect.height > 225,
                 "Unexpected illustration boundary")
            sx = reader.width / page.rect.width
            sy = reader.height / page.rect.height
            must(abs(sx - sy) < 0.001, "Unexpected aspect ratio")
            bounds = tuple(round(v * sx) for v in (rect.x0, rect.y0, rect.x1, rect.y1))
            crop = reader.convert("RGB").crop(bounds)
            must(crop.width > 1400 and crop.height > 1000, "Invalid approved art crop")
            buffer = io.BytesIO()
            crop.save(buffer, "PNG", optimize=True)
            original_render = raster(page)
            page.replace_image(xref, stream=buffer.getvalue())
            must([p.get_text() for p in doc] == original_text, "Original PDF dialogue was changed")
            result_render = raster(doc[PAGE_INDEX])
            mask = Image.new("L", original_render.size, 255)
            ratio = original_render.width / page.rect.width
            ImageDraw.Draw(mask).rectangle(
                (int(rect.x0 * ratio) - 2, int(rect.y0 * ratio) - 2,
                 int(rect.x1 * ratio) + 2, int(rect.y1 * ratio) + 2), fill=0)
            diff = ImageChops.difference(original_render, result_render)
            outside = Image.new("RGB", diff.size)
            outside.paste(diff, mask=mask)
            must(not outside.getbbox(), "Pixels outside the intended panel changed")
            must(diff.getbbox() is not None, "The original tea-table artwork did not change")
            args.output.parent.mkdir(parents=True, exist_ok=True)
            doc.save(args.output, garbage=4, deflate=True)
        with fitz.open(args.output) as check:
            must(len(check) == PAGE_COUNT, "Output page count changed")
            must([p.get_text() for p in check] == original_text, "PDF text changed on output")
            must(not check.is_repaired, "Generated PDF is not structurally sound")
    receipt = {
        "original_pdf_sha256": EXPECTED_PDF_SHA,
        "approved_reader_art_sha256": EXPECTED_ART_SHA,
        "output_pdf": args.output.name,
        "output_sha256": sha256(args.output),
        "output_bytes": args.output.stat().st_size,
        "page_count": PAGE_COUNT,
        "changed_page": 29,
        "all_page_text_unchanged": True,
        "pixels_outside_target_panel_unchanged": True,
    }
    args.receipt.write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--original", type=Path, required=True)
    p.add_argument("--art", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--receipt", type=Path, required=True)
    run(p.parse_args())
