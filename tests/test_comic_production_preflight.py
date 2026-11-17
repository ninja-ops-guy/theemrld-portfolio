"""Synthetic fixtures only: tests never certify production comic pages."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from PIL import Image

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/comic_production_preflight.py"
spec = importlib.util.spec_from_file_location("preflight", SCRIPT)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class PreflightTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        Image.new("RGB", (20, 30), (80, 110, 140)).save(self.root / "reference.png")
        ref = {"id": "ref-a", "actor_id": "test_actor", "appearance_id": "test-look",
               "path": "reference.png", "sha256": self.sha("reference.png"),
               "status": "APPROVED", "approval_evidence": "SYNTHETIC test approval"}
        self.contract = {"schema_version": guard.SCHEMA, "aspect_ratio": [2, 3], "pages": []}
        self.manifest = {"schema_version": guard.SCHEMA, "references": [ref], "pages": []}
        for index in range(2):
            name = f"p{index}.png"
            Image.new("RGB", (40, 60), (index * 110, 30, 50)).save(self.root / name)
            source_name = f"p{index}.txt"
            (self.root / source_name).write_text(f"Synthetic authored page {index}")
            source = {"path": source_name, "sha256": self.sha(source_name),
                      "approval_evidence": "SYNTHETIC script approval"}
            self.contract["pages"].append({"id": f"P{index}", "source": source,
                "cast": [{"actor_id": "test_actor", "appearance_id": "test-look"}],
                "additional_checks": ["protected_test_beat"]})
            self.manifest["pages"].append({"id": f"P{index}", "path": name,
                "sha256": self.sha(name), "reference_ids": ["ref-a"],
                "visual_review": {"status": "PASS_WITH_EVIDENCE", "reviewer": "test-reviewer",
                    "evidence": "SYNTHETIC inspection", "output_sha256": self.sha(name),
                    "source_sha256": source["sha256"], "reference_sha256": {"ref-a": ref["sha256"]},
                    "checks": {k: True for k in (*guard.CHECKS, "protected_test_beat")}}})

    def sha(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def report(self):
        return guard.inspect_bundle(self.contract, self.manifest, self.root)

    def blocked(self):
        r = self.report()
        self.assertEqual(r["verdict"], "BLOCKED", r)
        self.assertFalse(r["automated_checks_passed"])
        self.assertFalse(r["release_authorized"])

    def test_valid_metadata_never_certifies_art(self):
        r = self.report()
        self.assertEqual(r["verdict"], "PROVISIONAL")
        self.assertEqual(r["pages_with_bound_evidence"], 2)
        self.assertFalse(r["release_authorized"])

    def test_missing_reference(self):
        (self.root / "reference.png").unlink(); self.blocked()

    def test_reference_description_is_not_pixels(self):
        (self.root / "reference.png").write_text("A clear picture in words")
        self.manifest["references"][0]["sha256"] = self.sha("reference.png")
        self.blocked()

    def test_unapproved_reference(self):
        self.manifest["references"][0]["status"] = "DRAFT"; self.blocked()

    def test_missing_reference_provenance(self):
        self.manifest["references"][0]["approval_evidence"] = ""; self.blocked()

    def test_changed_reference(self):
        (self.root / "reference.png").write_bytes(b"changed"); self.blocked()

    def test_stale_reference_review(self):
        self.manifest["pages"][0]["visual_review"]["reference_sha256"] = {}; self.blocked()

    def test_changed_output(self):
        (self.root / "p0.png").write_bytes(b"changed"); self.blocked()

    def test_stale_output_review(self):
        self.manifest["pages"][0]["visual_review"]["output_sha256"] = "0" * 64; self.blocked()

    def test_stale_source_review(self):
        self.manifest["pages"][0]["visual_review"]["source_sha256"] = "0" * 64; self.blocked()

    def test_missing_page(self):
        self.manifest["pages"].pop(); self.blocked()

    def test_reordered_pages(self):
        self.manifest["pages"].reverse(); self.blocked()

    def test_duplicate_ids(self):
        self.manifest["pages"][1]["id"] = "P0"; self.blocked()

    def test_unresolved_cast(self):
        self.contract["pages"][0]["cast"] = None; self.blocked()

    def test_wrong_appearance(self):
        self.manifest["references"][0]["appearance_id"] = "other-look"; self.blocked()

    def test_wrong_aspect(self):
        self.contract["aspect_ratio"] = [1, 1]; self.blocked()

    def test_decoded_duplicates_with_different_encoding(self):
        with Image.open(self.root / "p0.png") as image:
            image.save(self.root / "p1.png", compress_level=0)
        page = self.manifest["pages"][1]
        page["sha256"] = page["visual_review"]["output_sha256"] = self.sha("p1.png")
        self.assertNotEqual(self.sha("p0.png"), self.sha("p1.png"))
        self.blocked()

    def test_false_critical_check(self):
        self.manifest["pages"][0]["visual_review"]["checks"]["speaker_assignment"] = False
        self.blocked()

    def test_numeric_true_is_not_review(self):
        self.manifest["pages"][0]["visual_review"]["checks"]["likeness"] = 1; self.blocked()

    def test_missing_protected_beat(self):
        del self.manifest["pages"][0]["visual_review"]["checks"]["protected_test_beat"]
        self.blocked()

    def test_unsafe_path(self):
        self.manifest["pages"][0]["path"] = "../outside.png"; self.blocked()

    def test_symlink_escape(self):
        with tempfile.TemporaryDirectory() as outside:
            p = Path(outside) / "outside.png"
            p.write_bytes((self.root / "p0.png").read_bytes())
            (self.root / "escape.png").symlink_to(p)
            self.manifest["pages"][0]["path"] = "escape.png"; self.blocked()

    def test_invalid_schema_and_empty_contract(self):
        for value in (None, [], {}, {"schema_version": guard.SCHEMA, "pages": []}):
            with self.subTest(value=value):
                self.assertEqual(guard.inspect_bundle(value, self.manifest, self.root)["verdict"], "BLOCKED")

    def test_cli_rejects_contract_tampering(self):
        contract_file = self.root / "contract.json"
        manifest_file = self.root / "manifest.json"
        contract_file.write_text(json.dumps(self.contract))
        manifest_file.write_text(json.dumps(self.manifest))
        approved = self.sha("contract.json")
        args = [sys.executable, str(SCRIPT), str(contract_file), str(manifest_file),
                "--root", str(self.root), "--contract-sha256", approved]
        run = subprocess.run(args, capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        self.contract["pages"].pop()
        contract_file.write_text(json.dumps(self.contract))
        run = subprocess.run(args, capture_output=True, text=True)
        self.assertEqual(run.returncode, 1)
        self.assertIn("Pinned contract hash mismatch", run.stdout)

    def test_bad_json_produces_blocked_report(self):
        c = self.root / "contract.json"; m = self.root / "manifest.json"
        c.write_text("{"); m.write_text("{")
        run = subprocess.run([sys.executable, str(SCRIPT), str(c), str(m), "--root", str(self.root),
             "--contract-sha256", self.sha("contract.json")], capture_output=True, text=True)
        self.assertEqual(run.returncode, 1)
        self.assertEqual(json.loads(run.stdout)["verdict"], "BLOCKED")


if __name__ == "__main__":
    unittest.main()
