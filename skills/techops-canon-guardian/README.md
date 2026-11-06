# TechOps Hero Visual Canon Guardian skill (v1.1)

Portable AgentSkills/OpenClaw skill that maintains consistent TechOps Hero character appearance, story-bible chronology, scene channel and comic/game style. Includes an offline copy of **Story Bible v1.7** and its SHA256, the November 6 supplemental repository addendum, and guidance for comparing art against accepted revisions and actual character references. It does not claim that all Revision 11 pages or candidate Library images were visually certified.

## Install
Unzip this archive. Copy the **entire** `techops-canon-guardian` directory into an OpenClaw workspace `skills/` directory (e.g. `~/.openclaw/workspace/skills/techops-canon-guardian`) or a project's `.agents/skills/` root. For a multi-agent swarm, install in the **shared workspace** used by all intended agents, or replicate to each isolated workspace. See https://docs.openclaw.ai/tools/skills for exact path precedence. Check `openclaw skills list`; start a fresh session if not loaded.

## Invoke
`/techops-canon-guardian Review TechOps Hero Chapter 5, panels 1–8 for canon, style and continuity.`

## Check manifest
`python scripts/canon_check.py templates/scene-manifest.json --json /tmp/canon-report.json` — initial example intentionally returns a blocked verdict because art/reference review has not occurred.

## Optional rendered-image audit
`pip install Pillow` (if not already installed), then `python scripts/image_audit.py my-scene.json --root /path/to/rendered/pages --json /tmp/image-review.json`. It checks actual image proportions, checksums, coarse duplicate matches and palette outliers, but does not recognize faces, poses, steering-wheel placement, or plot inconsistencies.

## Review and update process
Before each task, recheck the current repository addendum and `src/data/comic-descriptions.json`; their recorded blob SHAs are in `references/creator-updates.md`. Treat descriptions as page/beat navigation, not as visual authority. Use Story Bible v1.7 and accepted comic revisions as established sources, with the addendum supplementing only its explicit clarifications.

For visual review, compare the actual rendered panels side-by-side with approved references and accepted neighboring pages. Record provenance/version/hash and approval status. The skill's rules distinguish confirmed violations, uncertain interpretations, missing references, style/craft deviations, and passes supported by evidence. If a face model sheet or accepted page is not available, mark likeness `NOT_VERIFIED`; do not reconstruct or certify it from memory.

Replace the bundled Story Bible only after confirming a new creator-approved edition. Update the SHA256 in `references/source-manifest.json`, reconcile hard locks and tests, and preserve historical source provenance. Add approved reference images only with provenance. Never silently change a face, hairstyle, costume, established location/event, or panel order; do not add duplicate panels or alter established events without explicit authorization. Report corrections against exact page/panel IDs.

## Invoke for common tasks
- Image prompt: `/techops-canon-guardian Create a prompt for [character/scene]. Load the approved references, freeze identity and costume details, then give me the reusable style header and uncertainties.`
- Comic production: `/techops-canon-guardian Plan [volume/chapter]. Check the bible, addenda and page descriptions; produce a chronology-safe panel brief and identify missing visual references before art generation.`
- Visual revision: `/techops-canon-guardian Review [files/pages/panels] against [reference files]. Compare face, hair, clothing, environment, panel order and duplicate art. Return evidence-backed findings and exact corrections; don't modify files yet.`

## Tests
`python -m unittest discover -s tests -v`
