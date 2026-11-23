# Comic production preflight — review candidate

## Scope and authority

This adds a local evidence check, not a new canon source, image generator, visual reviewer, PDF assembler or publisher. Story Bible v1.7, the Canon Guardian and later scoped creator corrections retain their authority. Do not publish unreleased art, scripts or private reference portraits to this repository merely to satisfy this tool.

The inspected guardian instructions refer to `scripts/canon_check.py` and `scripts/image_audit.py` inside the skill; those files are absent from the inspected main directory. This new tool is an additive candidate at `scripts/comic_production_preflight.py`, not a claim that those old commands have been restored. Adoption into the active production process and a later documentation reconciliation remain required. Missing helpers are an enforcement gap, not proof of the sole cause of likeness drift.

## Run

Use Python 3.10+ and Pillow in an isolated environment. Test with:

```sh
python -m unittest discover -s tests -p 'test_comic_production_preflight.py' -v
```

Inspect a private production evidence directory with:

```sh
python scripts/comic_production_preflight.py contract.json manifest.json \
  --root /path/to/private/evidence \
  --contract-sha256 "$INDEPENDENTLY_APPROVED_CONTRACT_SHA256" \
  --json preflight-result.json
```

The contract digest must come from the independently approved contract, not be silently recalculated from a changed candidate. Exit 1 means blocked. Exit 0 means automated evidence checks passed, but the verdict remains **PROVISIONAL** and `release_authorized` remains false.

## Contract schema

Both inputs use `schema_version: "techops-production-bundle/1"`. This is a new production-bundle format, not a silent reinterpretation of the guardian's legacy scene manifest.

The contract contains `aspect_ratio: [2, 3]` and an ordered `pages` array. Each page needs a unique `id`, an approved `source` record, a `cast` list of `{actor_id, appearance_id}` pairs, and optional `additional_checks` names. A source record has `path`, `sha256` and `approval_evidence`. The source should be the frozen page script/lettering brief, including scene/time, panel sequence, speaker attribution and any creator corrections. Cast comes from that source, never from whatever the generated page happens to show. An unresolved cast is blocked; an explicitly empty cast is allowed for a genuinely character-free page. Include covers in the exact inventory and distinguish them from story-page counts.

The manifest contains `references` and an ordered `pages` array matching the contract exactly. Each reference has `id`, `actor_id`, `appearance_id`, local image `path`, `sha256`, `status: "APPROVED"`, and `approval_evidence`. Reference bytes must decode as a static PNG, JPEG or WebP; a prose description or inaccessible link is insufficient.

Each output page has `id`, image `path`, `sha256`, `reference_ids`, and `visual_review`. The review must contain `status: "PASS_WITH_EVIDENCE"`, `reviewer`, `evidence`, `output_sha256`, `source_sha256`, `reference_sha256` (ID-to-digest object), and a `checks` object. Required true booleans: `likeness`, `chronology`, `panel_sequence`, `speaker_assignment`, `lettering`, `hands_props`, `phone_legibility`, plus every page-specific contract check. Never prefill these as passed.

The tests contain executable synthetic examples. They are not comic pages, approved character references, or production evidence.

## Checks and limits

The tool verifies local file hashes, reference availability, actor/appearance bindings, approved inventory order/count, portrait geometry, review freshness, required recorded checks and exact decoded-page duplication, including a re-encoded copy. Absolute paths and symlink/path escapes outside the evidence root are rejected.

It cannot authenticate approval authors, prove a generator actually used the supplied references, read visual meaning, verify that every scripted word appears, detect all near-duplicates, certify an assembled PDF, or authorize publication. A fabricated review can still lie; independent side-by-side review remains mandatory. A changed page, script or reference requires a new review bound to those bytes. No production volume is passed by the synthetic tests.

## Adoption and completion gates

1. Establish approved source and reference files privately; pin the contract independently.
2. Retrieve existing page assets before regenerating anything. Keep active page ownership explicit to avoid competing edits.
3. Generate/revise sequentially; independently inspect pages against source, references and neighbors at full and phone size.
4. Populate genuine review records and run this tool before assembly.
5. Inspect the assembled PDF for completeness, page order, lettering, links and unchanged protected scenes. Obtain separate creator publication approval.

This candidate adds no workflow, deployment, runtime changes or automatic publishing. It leaves current comic masters and unrelated repair PRs untouched.
