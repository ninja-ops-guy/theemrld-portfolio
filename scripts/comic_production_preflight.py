#!/usr/bin/env python3
"""Check a pinned comic production contract and local evidence; never certify art.

Requires Pillow. Reference approvals and visual-review statements are attestations,
not authenticated identities. Passing is PROVISIONAL, never publication approval.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
from typing import Any

SCHEMA = "techops-production-bundle/1"
CHECKS = ("likeness", "chronology", "panel_sequence", "speaker_assignment",
          "lettering", "hands_props", "phone_legibility")
HASH = re.compile(r"^[0-9a-f]{64}$")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def local_file(root: Path, name: Any) -> Path:
    require(text(name), "Missing local path")
    path = Path(name)
    require(not path.is_absolute(), "Absolute paths are forbidden")
    resolved = (root / path).resolve()
    require(resolved.is_relative_to(root.resolve()), "Path escapes evidence root")
    require(resolved.is_file(), f"Missing regular file: {name}")
    return resolved


def bound_file(root: Path, record: Any) -> tuple[Path, bytes]:
    require(isinstance(record, dict), "File record must be an object")
    expected = record.get("sha256")
    require(isinstance(expected, str) and HASH.fullmatch(expected) is not None,
            "Missing or malformed SHA-256")
    path = local_file(root, record.get("path"))
    data = path.read_bytes()
    require(digest(data) == expected, f"Hash mismatch: {record.get('path')}")
    return path, data


def image_identity(path: Path) -> tuple[tuple[int, int], str]:
    from PIL import Image
    with Image.open(path) as image:
        require(image.format in {"PNG", "JPEG", "WEBP"}, "Unsupported image format")
        require(getattr(image, "n_frames", 1) == 1, "Animated assets are not comic pages")
        image.load()
        rgba = image.convert("RGBA")
        return image.size, digest(str(image.size).encode() + rgba.tobytes())


def inspect_bundle(contract: Any, manifest: Any, root: Path) -> dict[str, Any]:
    """Return failures, not a likeness/meaning/PDF-completeness determination."""
    errors: list[dict[str, str]] = []
    verified_images = 0

    def error(scope: str, message: str) -> None:
        errors.append({"scope": scope, "message": message})

    try:
        require(isinstance(contract, dict) and isinstance(manifest, dict),
                "Contract and manifest must be objects")
        require(contract.get("schema_version") == SCHEMA and
                manifest.get("schema_version") == SCHEMA, "Unsupported schema")
        expected = contract.get("pages")
        pages = manifest.get("pages")
        refs = manifest.get("references")
        require(isinstance(expected, list) and len(expected) > 0, "Contract has no pages")
        require(isinstance(pages, list), "Manifest pages must be a list")
        require(isinstance(refs, list), "References must be a list")
        require(all(isinstance(p, dict) and text(p.get("id")) for p in expected + pages),
                "Each page needs an ID")
        ids = [p["id"] for p in expected]
        require(len(ids) == len(set(ids)), "Duplicate contract page IDs")
        require([p["id"] for p in pages] == ids, "Page order/count/IDs differ from pinned contract")
        ratio = contract.get("aspect_ratio")
        require(isinstance(ratio, list) and len(ratio) == 2 and
                all(type(n) is int and n > 0 for n in ratio), "Invalid aspect ratio")
    except ValueError as exc:
        error("bundle", str(exc))
        return result(errors, verified_images)

    reference_map: dict[str, dict[str, Any]] = {}
    for ref in refs:
        scope = ref.get("id", "reference") if isinstance(ref, dict) else "reference"
        try:
            require(isinstance(ref, dict) and text(ref.get("id")), "Missing reference ID")
            require(ref["id"] not in reference_map, "Duplicate reference ID")
            require(text(ref.get("actor_id")) and text(ref.get("appearance_id")),
                    "Reference needs actor and appearance IDs")
            require(text(ref.get("approval_evidence")), "Reference lacks approval provenance")
            require(ref.get("status") == "APPROVED", "Reference is not marked approved")
            path, _ = bound_file(root, ref)
            image_identity(path)
            reference_map[ref["id"]] = ref
        except (ValueError, OSError, ImportError, SyntaxError) as exc:
            error(str(scope), str(exc))

    seen_pixels: dict[str, str] = {}
    for target, page in zip(expected, pages):
        scope = page["id"]
        try:
            cast = target.get("cast")
            require(isinstance(cast, list), "Pinned cast is unresolved")
            require(all(isinstance(c, dict) and text(c.get("actor_id")) and
                        text(c.get("appearance_id")) for c in cast), "Invalid pinned cast")
            identities = {(c["actor_id"], c["appearance_id"]) for c in cast}
            require(len(identities) == len(cast), "Duplicate pinned cast identities")
            source = target.get("source")
            require(isinstance(source, dict) and text(source.get("approval_evidence")),
                    "Missing approved page-source provenance")
            bound_file(root, source)
            path, _ = bound_file(root, page)
            size, pixel_hash = image_identity(path)
            require(size[0] * ratio[1] == size[1] * ratio[0], "Page aspect ratio differs from contract")
            require(pixel_hash not in seen_pixels,
                    f"Repeated decoded page image: {seen_pixels.get(pixel_hash)}")
            seen_pixels[pixel_hash] = scope
            selected = page.get("reference_ids")
            require(isinstance(selected, list) and all(text(i) for i in selected),
                    "Missing reference-ID list")
            require(len(selected) == len(set(selected)), "Duplicate page reference IDs")
            require(all(i in reference_map for i in selected), "Missing/invalid bound reference")
            actual_cast = {(reference_map[i]["actor_id"], reference_map[i]["appearance_id"])
                           for i in selected}
            require(actual_cast == identities, "Reference cast/appearance differs from pinned contract")
            review = page.get("visual_review")
            require(isinstance(review, dict) and review.get("status") == "PASS_WITH_EVIDENCE",
                    "Actual page visual review is missing or unresolved")
            require(text(review.get("reviewer")) and text(review.get("evidence")),
                    "Visual-review attribution/evidence missing")
            require(review.get("output_sha256") == page["sha256"], "Stale output review")
            require(review.get("source_sha256") == source["sha256"], "Stale script/lettering review")
            require(review.get("reference_sha256") == {i: reference_map[i]["sha256"] for i in selected},
                    "Stale reference review")
            required = target.get("additional_checks", [])
            require(isinstance(required, list) and all(text(c) for c in required),
                    "Invalid page-specific checks")
            checks = review.get("checks")
            require(isinstance(checks, dict) and
                    all(checks.get(c) is True for c in (*CHECKS, *required)),
                    "An applicable visual/continuity check is missing or not passed")
            verified_images += 1
        except (ValueError, OSError, ImportError, SyntaxError) as exc:
            error(scope, str(exc))
    return result(errors, verified_images)


def result(errors: list[dict[str, str]], count: int) -> dict[str, Any]:
    return {"verdict": "BLOCKED" if errors else "PROVISIONAL",
            "automated_checks_passed": not errors, "release_authorized": False,
            "pages_with_bound_evidence": count, "errors": errors,
            "limits": ["Does not authenticate review/approval authors or inspect visual meaning.",
                       "Does not detect all near-duplicates or verify the assembled PDF.",
                       "Independent visual inspection and separate owner release approval remain required."]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("contract", type=Path)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--contract-sha256", required=True,
                        help="Digest obtained from the independently approved contract")
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--json", type=Path)
    args = parser.parse_args()
    try:
        raw_contract = args.contract.read_bytes()
        raw_manifest = args.manifest.read_bytes()
        require(HASH.fullmatch(args.contract_sha256) is not None and
                digest(raw_contract) == args.contract_sha256, "Pinned contract hash mismatch")
        report = inspect_bundle(json.loads(raw_contract), json.loads(raw_manifest), args.root)
        report.update(contract_sha256=digest(raw_contract), manifest_sha256=digest(raw_manifest))
    except (ValueError, OSError) as exc:
        report = result([{"scope": "input", "message": str(exc)}], 0)
    encoded = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    print(encoded, end="")
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(encoded, encoding="utf-8")
    return 0 if report["automated_checks_passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
