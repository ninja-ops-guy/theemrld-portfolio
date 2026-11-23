#!/usr/bin/env python3
"""Faithful, review-only Instagram export of the current Full collection comic pages."""
import argparse
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageOps

POSTS = {
    "THIG-P01": list(range(6, 12)), "THIG-P02": list(range(12, 18)),
    "THIG-P03": list(range(18, 24)), "THIG-P04": list(range(24, 30)),
    "THIG-P05": list(range(30, 36)), "THIG-P06": list(range(36, 42)),
    "THIG-P07": list(range(42, 47)), "THIG-P08": list(range(47, 52)),
}
CAPTIONS = {
    "THIG-P01": "TECHOPS HERO — VOLUME I, PART 1/8 ⚡\n\nEvery connection starts somewhere. Meet the world of TechOps Hero in the opening pages of Engineering the Human Connection. Swipe to begin.\n\nCreated by Mike Olivares. Read the full comic through the link in bio.\n\n#TechOpsHero #IndieComics #GraphicNovel #SciFiComics #Webcomic",
    "THIG-P02": "TECHOPS HERO — VOLUME I, PART 2/8 ⚡\n\nThe story keeps moving. Read the next six pages of Engineering the Human Connection. Swipe in order; start with Part 1 if you are new.\n\nCreated by Mike Olivares. Full comic: link in bio.\n\n#TechOpsHero #IndieComics #ComicSeries #GraphicNovel",
    "THIG-P03": "TECHOPS HERO — VOLUME I, PART 3/8 ⚡\n\nPressure builds in Volume I. These pages continue directly from Part 2. Swipe through in story order.\n\nCreated by Mike Olivares. Full comic: link in bio.\n\n#TechOpsHero #IndieComics #SciFiComics #GraphicNovel",
    "THIG-P04": "TECHOPS HERO — VOLUME I, PART 4/8 ⚡\n\nThe next sequence in Engineering the Human Connection. Swipe to keep reading; earlier parts are on this profile.\n\nCreated by Mike Olivares. Full comic: link in bio.\n\n#TechOpsHero #ComicSeries #GraphicNovel #Webcomic",
    "THIG-P05": "TECHOPS HERO — VOLUME I, PART 5/8 ⚡\n\nA story about systems, choices, and the people inside them. Continue Volume I in order.\n\nCreated by Mike Olivares. Full comic: link in bio.\n\n#TechOpsHero #IndieComics #GraphicNovel #SciFiComics",
    "THIG-P06": "TECHOPS HERO — VOLUME I, PART 6/8 ⚡\n\nAnother chapter of Engineering the Human Connection. Swipe for the next pages; no panels skipped.\n\nCreated by Mike Olivares. Full comic: link in bio.\n\n#TechOpsHero #ComicSeries #GraphicNovel #Webcomic",
    "THIG-P07": "TECHOPS HERO — VOLUME I, PART 7/8 ⚡\n\nThe final stretch of Volume I begins here. Read the pages in order, then continue with Part 8.\n\nCreated by Mike Olivares. Full comic: link in bio.\n\n#TechOpsHero #IndieComics #GraphicNovel",
    "THIG-P08": "TECHOPS HERO — VOLUME I, PART 8/8 ⚡\n\nThe end of this Volume I Instagram serialization. Continue the story in the full TechOps Hero reader.\n\nCreated by Mike Olivares. Full comic: link in bio.\n\n#TechOpsHero #ComicSeries #SciFiComics #GraphicNovel",
}

def sha256(blob):
    return hashlib.sha256(blob).hexdigest()

def render_one(raw, dest):
    with Image.open(io.BytesIO(raw)) as src:
        src.load()
        src = ImageOps.exif_transpose(src).convert("RGB")
        original = list(src.size)
        scale = min(1080 / src.width, 1350 / src.height)
        img = src.resize((round(src.width * scale), round(src.height * scale)), Image.Resampling.LANCZOS)
        corners = [src.getpixel(xy) for xy in [(0,0),(src.width-1,0),(0,src.height-1),(src.width-1,src.height-1)]]
        background = tuple(sorted(c[i] for c in corners)[2] for i in range(3))
        canvas = Image.new("RGB",(1080,1350),background)
        x,y = (1080-img.width)//2,(1350-img.height)//2
        canvas.paste(img,(x,y))  # No original art is cropped or obscured.
        dest.parent.mkdir(parents=True,exist_ok=True)
        canvas.save(dest,"JPEG",quality=94,subsampling=0,optimize=True)
        return {"source_dimensions":original,"art_dimensions":list(img.size),
                "padding_pixels":[x,y,1080-img.width-x,1350-img.height-y],"background_rgb":list(background)}

def build(root,output,post_id):
    receipt = json.loads((root/"docs/INSTAGRAM_APPROVED_SOURCE.json").read_text())
    if (receipt.get("edition"),receipt.get("pages"),receipt.get("media_commit"),receipt.get("source_pdf_sha256")) != (
        "Full collection",316,"aa8c132035a46e73fb47ee14e05e371909799d64",
        "c18407af88e9ba6dbb5ed4707fc998bd19e12d31c59b2f92b87f58d8a0bfa50b"):
        raise ValueError("Source identity is not the compared Full collection release")
    for post in (POSTS if post_id == "ALL" else [post_id]):
        slides=[]
        for position,page in enumerate(POSTS[post],1):
            expected=receipt["web_render"]["pages"][str(page)]
            src=root/expected["path"]
            raw=src.read_bytes()
            if len(raw)!=expected["bytes"] or sha256(raw)!=expected["sha256"]:
                raise ValueError(f"Source asset does not match release manifest: {src}")
            dest=output/post/f"{post}-{position:02d}-page-{page:03d}.jpg"
            evidence=render_one(raw,dest)
            encoded=dest.read_bytes()
            slides.append({"slide":position,"comic_page":page,"source_path":expected["path"],
                "source_sha256":expected["sha256"],
                "baseline_source_sha256":expected["baseline_source_sha256"],
                "source_disposition":expected["source_disposition"],
                "comparison_finding":expected["comparison_finding"],"instagram_file":str(dest.relative_to(output)),
                "instagram_sha256":sha256(encoded),"instagram_bytes":len(encoded),**evidence})
        packet={"status":"REVIEW_ONLY_NOT_SCHEDULED","approval_required":True,
            "account":"@defied_stars","post_id":post,"edition":receipt["edition"],
            "reader_revision":receipt["reader_revision"],"media_commit":receipt["media_commit"],"source_pdf_sha256":receipt["source_pdf_sha256"],
            "caption":CAPTIONS[post],"format":"Instagram carousel 1080x1350 JPEG; no audio; no original art cropping",
            "proposed_time":"PENDING APPROVAL","slides":slides}
        folder=output/post
        (folder/"caption.txt").write_text(CAPTIONS[post]+"\n",encoding="utf-8")
        (folder/"packet.json").write_text(json.dumps(packet,indent=2)+"\n",encoding="utf-8")
        print(post,len(slides),"verified slides ready for review, NOT scheduled")

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",type=Path,default=Path("."))
    parser.add_argument("--output",type=Path,default=Path("qa/instagram-pilot"))
    parser.add_argument("--post",choices=["ALL",*POSTS],default="THIG-P01")
    a=parser.parse_args()
    build(a.root,a.output,a.post)
