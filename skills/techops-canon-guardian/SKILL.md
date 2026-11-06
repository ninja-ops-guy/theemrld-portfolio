---
name: techops-canon-guardian
description: Enforce TechOps Hero comic, game, and cutscene art style and show-bible continuity before drafting, generating, revising, or approving scenes.
user-invocable: true
---

# TechOps Hero — Visual Canon Guardian

Use for **every** TechOps Hero image-generation prompt, character/environment design, comic panel/page, storyboard, cutscene, visual revision, and canon/consistency review. Invoke explicitly with `/techops-canon-guardian` or load automatically when a TechOps Hero task is recognized. This skill is editorial governance, not permission to invent lore, retcon canon, or certify images without inspecting evidence.

## Current reference and authority order

At each new task, identify the intended volume/scene and inspect current sources needed for that scope. The existing story bible and previously accepted artwork remain authoritative. The November 6 repository addendum supplements the existing story bible; it does not automatically replace it.

Use this order, with specificity and approval status recorded:
1. Later explicit creator approval for the exact scene/artwork or change (must be attributable and scoped).
2. Integrated Story Bible v1.7 and its fixed identity, event, disclosure and chronology rules.
3. Accepted comic revisions and approved character/environment reference images for visual execution, provided they do not contradict a higher-level story lock. A reference is approved only when its acceptance is known, not merely because it exists in a Library or repository.
4. The November 6 story-bible addendum for explicitly scoped clarifications in `references/creator-updates.md`.
5. Current page-specific scene descriptions in the comic reader, as navigation and local sequence evidence.
6. Screenplays, progression manifests and page revisions.
7. Exploratory boards, generated images, or unapproved drafts.

If two sources conflict, preserve both citations and status, apply the higher authority only where its scope is explicit, and mark unresolved conflict as `UNCERTAIN`; do not silently rewrite canon.

## Load these local references
1. Read `{baseDir}/references/canon-locks.md` (mandatory cast, lore, chronology, and disclosure rules).
2. Read `{baseDir}/references/visual-direction.md` (comic and game-specific visual language).
3. Read `{baseDir}/references/creator-updates.md` (the November 6 supplemental addendum and its provenance).
4. If facts are disputed or unclear, inspect the full source `{baseDir}/references/TechOps_Hero_Story_Bible_v1_7.docx`; see `{baseDir}/references/source-manifest.json` for the source digest. Do not claim a later bible is incorporated unless its actual file has been verified and the reference pack updated.
5. Locate approved character references and accepted page/revision images for the current scene. Check provenance, acceptance status, source/revision, and that the relevant character/appearance is visible. Do not infer that a concept image, screenshot, sprite sheet, or prior generated image was approved. Do not invent exact facial anatomy, outfits, tattoos, scars, proportions, colors, or photo likenesses absent from the references.
6. Read `references/reference-inventory.md` for discovered source classes and known gaps. Refresh links/hashes from the repository when stale; do not rely on the inventory instead of current inspection.

## Findings taxonomy

Every report finding must be classified:
- `CONFIRMED_CANON_VIOLATION`: direct contradiction of a cited, applicable canon rule or approved reference; identify the actual image/panel evidence.
- `UNCERTAIN_INTERPRETATION`: ambiguity, source conflict, weak inference, visually obscured detail, or unconfirmed approval status. State what would resolve it.
- `MISSING_REFERENCE`: a required source/image/model sheet/page is unavailable or was not inspected. Do not guess to fill it.
- `STYLE_OR_CRAFT_DEVIATION`: objectively observable uniformity or craft issue not itself a canon contradiction.
- `PASS_WITH_EVIDENCE`: checked criterion with actual sources and output identified.

Absence of evidence is not proof of a violation. A likeness cannot be passed based on descriptive text alone. Overall verdict must be `BLOCKED`, `PROVISIONAL`, or `READY`; use `READY` only when all applicable references and rendered outputs were checked and no P0/P1 findings remain.

## Canon authority
`Latest explicit creator-approved direction > integrated Story Bible v1.7 > approved character model sheets (for visual execution, subordinate to narrative locks) > revised screenplay / progression manifest > approved page-specific revisions > exploratory boards / prior generated images.`

Where a model-sheet likeness and a specific creator correction conflict, apply the correction only within its stated scope and record the supersession. Never let an older comic panel override a fixed name, cast identity, memory source, disclosure gate, location, or chronology. Draft staging proposals in v1.7 do **not** silently become locked canon.

## Mandatory workflow (before, during, after)
**PRE-FLIGHT —** Identify medium (reader comic, game pixel art, storyboard, music-video art), chapter, volume, scene time/place, POV, cast, who knows what, memory/communication channel and source references. Make/update a `scene-manifest.json` using `{baseDir}/templates/scene-manifest.json`. Maintain one actor ID for K/Red/El and one for Waldo/Oz, even with multiple names and costumes. Record reference ID/URL, revision, approval provenance and hash where available. If a needed image reference is not actually available and inspected, mark likeness `NOT_VERIFIED`.

**DESIGN LOCK —** Create a panel brief using `{baseDir}/templates/panel-brief.md`: stable cast IDs + versioned reference files, composition, pose/handedness, prop placement, camera side, costume state, expression, visual register, color motifs, lighting, lettering limits and exact moment in chronology. Preserve 2:3 portrait page geometry for reader-volume output. Compare adjacent panels to avoid face, hairstyle, costume, geometry and setting drift. Check scene descriptions and accepted revisions for required beats. Do not reuse identical art for different rescue beats or create duplicate panels/pages.

**STORY LOCK —** Check event order, objective evidence versus unreliable memory, who learned each fact, relationship state, prison and realm mechanics, reveal timing, and musical credits. Use clear, emotionally grounded dialogue; humor does not erase consequences. A world fact must not be introduced merely to solve an art problem.

**GENERATE / REVISE —** Anchor each image generation/edit in approved reference images when available. Carry a stable character sheet and style header across prompts. Fix only the requested discrepant area without changing already-approved faces, perspective, scene facts or unrelated pages. Do not claim an edit occurred unless the image/PDF/page was actually regenerated and checked. For driver or car scenes, verify steering-wheel side, seating position, eyeline, hands, road direction and screen continuity. Do not silently change established appearance or events; request creator authorization for canon changes.

**QA GATE —** Run `python {baseDir}/scripts/canon_check.py path/to/scene-manifest.json --json path/to/check.json` (optional helper). For rendered pages, also run `python {baseDir}/scripts/image_audit.py path/to/scene-manifest.json --root path/to/output --json path/to/image-check.json` (optional Pillow helper). Then independently inspect each actual output, side-by-side with applicable reference sheets and adjacent accepted pages, using `{baseDir}/references/approval-gates.md`. Inspect enough images at full size and mobile size to catch identity, hairstyle, costume, environment, panel order, geometry, motifs and duplicates. Script checks metadata/pixels heuristically only; it cannot verify faces, meaning, story facts, lettering legibility, image duplication with certainty, undeclared chronology, or PDF completeness. Never claim a complete production pass solely from a script PASS.

**RELEASE —** Deliver a review report based on `{baseDir}/templates/review-report.md` containing: source editions/hashes, files checked, exact scene/page/panel IDs, finding taxonomy, image-vs-reference evidence, canon ambiguity, missing inputs, affected dependencies, actionable correction request, and `READY`, `BLOCKED`, or `PROVISIONAL` verdict. `READY` requires no open P0/P1 findings and an actual visual comparison when likeness matters. Owner approval is required for retcons, changed established appearance, or altered events.

## Nonnegotiable rules
- Characters are not interchangeable: **Iona ≠ Felicia**; **Waldo = Oz**; **Red = K = El** as one continuing person with stage-specific identities.
- Do not conflate telepathy (Oz ↔ dogs), Mike-origin memory feed (Mike → K), prison sightings/vent talks, reconstructed Red/Iona recollections, and objective recordings.
- K's autobiographical amnesia is not loss of learned skills. An emotional fragment is not documentary proof. Turning off the memory feed stops new information without erasing K.
- The Earth-bound extraordinary-control condition applies consistently: K cannot knowingly author the extraordinary effect while certain he is actively controlling it. Do not make an accidental success a conscious superpower on demand.
- Do not reveal protected mysteries or switch another character's knowledge state without an event where they learned it.
- Never invent real GHOST BENDS discography, lyrics, collaborators, release credits, or instrumentation as universal canon. Scene-specific choices may differ.
- No silent visual-style substitutions: reader comic = cinematic inked objective present + painterly subjective memories + clinical ORPHEUS claims; game = established pixel art, not full painterly comic renders.
- Never invent canon to fill a reference gap. Separate confirmed violations from uncertain interpretations and missing reference material.
- Never silently change an established character's face, hairstyle, costume, body design, environment, relationship, or event order.
- Never introduce duplicate panels, repeated page art, or omitted/reordered established events unless the creator explicitly requests the repetition/change; mark intentional visual callbacks.
- Story descriptions support page order and narrative relationships; they do not prove facial likeness or supersede approved references and the story bible.
- **Fail closed on missing definitive visual reference**: label likeness as unverified and request/locate the relevant model sheet; you may draft but not certify face-accurate production art.

## Output contract
For a new scene provide `(1) source/authority snapshot, (2) canon and chronology guardrails, (3) reusable visual style header, (4) numbered panel briefs, (5) QA findings by taxonomy, (6) open owner decisions and missing references`. For a revision, provide exact correction scope, panels/pages checked, evidence of changed output, and whether unrelated canon/pages were preserved. Never silently mark work verified, rendered, approved, tested, or published without evidence.
