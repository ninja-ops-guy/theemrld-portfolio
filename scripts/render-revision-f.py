"""Render the approved PDF into the web reader. Requires PyMuPDF and Pillow."""

from concurrent.futures import ProcessPoolExecutor
from hashlib import file_digest
import json
from pathlib import Path
import re

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "techops-comic"
SOURCE = ASSETS / "TechOps-Hero-Revision-F-Annotation-Update-315-Pages.pdf"
OUTPUT = ASSETS / "revision-f"
SHA256 = "85c46dcd1c0233d341fa6ba03ad60b42dc4b5ef50fce26d0430de611b55b6d6d"


def render(index):
    with fitz.open(SOURCE) as pdf:
        image = pdf[index].get_pixmap(matrix=fitz.Matrix(2.5, 2.5), alpha=False)
    art = Image.frombytes("RGB", (image.width, image.height), image.samples)
    art.save(OUTPUT / f"{index + 1:03d}.webp", quality=88, method=4)


def main():
    with SOURCE.open("rb") as file:
        assert file_digest(file, "sha256").hexdigest() == SHA256
    OUTPUT.mkdir(exist_ok=True)

    with fitz.open(SOURCE) as pdf:
        assert len(pdf) == 315
        sections = []
        scenes = []
        links = {}
        for _, label, page in pdf.get_toc():
            volume = re.fullmatch(r"Volume ([IVX]+) / (.+?)(?: / continuation)?", label)
            if volume:
                numeral, title = volume.groups()
                sections.append({"start": page, "label": f"Vol. {numeral}", "title": title, "kind": "volume"})
            elif label.startswith("Iona / The World He Left Running"):
                sections.append({"start": page, "label": "Interlude", "title": "Iona · The World He Left Running", "kind": "interlude"})
            elif label in {"Full collection index", "Later collection index", "XI-XII continuation cover and reader note"}:
                sections.append({"start": page, "label": "Guide", "title": label, "kind": "guide"})
            scenes.append({"page": page, "title": label})
        for i, section in enumerate(sections):
            section["end"] = sections[i + 1]["start"] - 1 if i + 1 < len(sections) else len(pdf)
        for page in pdf:
            assert page.rect == fitz.Rect(0, 0, 432, 648)
            for link in page.get_links():
                assert link["kind"] == fitz.LINK_GOTO and 0 <= link["page"] < len(pdf)
                links.setdefault(page.number + 1, []).append({
                    "page": link["page"] + 1,
                    "rect": [round(point, 3) for point in link["from"]],
                })
        assert sum(len(items) for items in links.values()) == 47
        assert sum(section["kind"] == "volume" for section in sections) == 12
        assert len(scenes) == 30
        manifest = {"pageCount": len(pdf), "sections": sections, "scenes": scenes, "links": links}

    with ProcessPoolExecutor(max_workers=4) as workers:
        list(workers.map(render, range(manifest["pageCount"]), chunksize=4))
    (ROOT / "src/data/comic-revision-f.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
