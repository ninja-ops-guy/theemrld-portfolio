# Ascended K reconciliation — local review candidate

Date: November 7, 2026. No remote branch update, merge or deployment performed.

## Source inputs

- Released portfolio base: `0f5b308ad36c2bee7124afa7f889f2f0ffbc1fb4` (remote main rechecked after implementation).
- Portal source: PR #48, `978424919315bc6906b0b8d6994903bcb82b2cdd`.
- Released native game: `053ee3948170ac972bc1af44eacfa4857fc32a0f`.
- Original divergence: portal 15 commits ahead / 40 behind main.
- Local branch: `review/ascended-k-reconciled`, based directly on released main.

## Reconciliation decisions

| Branch material | Decision |
| --- | --- |
| Original cathedral painting, fixed frame, walk-through aperture, chamber geometry, conversations, return pose, accessible buttons | Port unique implementation from d60a4b5; preserve existing artwork bytes and released gallery/music changes. |
| Old `linked-store.mjs` and `universe-core.js`, source envelope and old section IDs | Do not introduce. Portal consumes the released `linked.mjs` contract. |
| Old `k_anchor` completion check | Map to released `memory-anchor`; use `loadNight` to validate its receipt against the active run and replayed history. Mere receipt truthiness never grants access. |
| Old See World app and HTML replacements | Do not introduce. Add only “Visit the painting” to the released linked reader's K ending. |
| Sandbox gallery embedding | Add `preview=1` to the existing preview app's iframe so a sandbox cannot inherit a completed linked reward. |
| Old reset/announcement fix | Do not transplant the obsolete app. Keep released identity-change, pending-choice and synchronization handling. |
| Old linked workflows, fixtures, manifests and source pins | Keep released files; add a new combined workflow pinned to released native SHA and new portal contracts/review harness. |
| Presentation workflow reader hash | Update only its expected reader blob for the added button. Preserve byte checks on the save contract, engine and campaign content. |

A raw merge has five textual conflict paths: `docs/SEE_WORLD_LINKED_IMPLEMENTATION.md`, `public/see-world/index.html`, `scripts/see-world-linked-browser.py`, `scripts/see-world-linked.test.mjs`, and `src/pages/SeeWorld.tsx`. All remain exactly as main. The seven-file gallery-only patch applied cleanly; its access module required deliberate semantic adaptation despite having no textual conflict. Raw conflict evidence is in `ascended-k-review/original-merge-conflicts.txt`.

## Proposed behavior and exact scope

- `public/k-world/app.js`: fixed painting, guarded entry, movement crossing, three conversation topics, return controls and periodic/storage/focus/pageshow revalidation. Changed or unreadable playthroughs eject an open chamber safely.
- `ascended-access.mjs`: read-only access using `context`, `loadProgress`, `runsFrom`, `loadNight` and `same`. Requires a legal completed K route, native return, and validated physical-anchor completion for that profile/run.
- `ascended-scene.js`, `ascended.css`, gallery `data.js`, `scenes.js`, `index.html`: retained original portal scene, routing, touch-sized buttons and dialogue. Room stays out of the atlas and uses gallery audio authority.
- `public/see-world/linked-app.mjs`: one ending action; `app.mjs`: one preview query parameter.
- New portal Node tests, isolated browser review and CI runner. The fixture harness lives under `scripts/`, is staged only for review, and is absent from production `dist/`.

No native files, save schema, campaign text, painting asset or public presentation assets change. `ascended-k-review/preserved-blobs.json` records unchanged Git blobs. Dialogue remains the existing optional game-only review draft; this does not approve numbered-comic canon, grant powers or claim that scenic stairs are climbable.

## Validation observed on the combined files

| Check | Result |
| --- | --- |
| Production build | PASS; existing large-chunk warning remains. |
| Story/save, recovery/publication, gallery/audio, portal contracts | 132 tests PASS. Portal coverage includes all 187 legal K paths / three endings, corrupt and foreign records, missing anchor, preview denial and byte-unchanged reads. |
| Released native production gate | 114 suites PASS; syntax check 597 JavaScript files PASS. Native repository unchanged. |
| Managed Chromium combined review | Nine checks PASS, no reported harness errors. Locked access; original 732×732 painting; earned entry/conversation/safe return; unchanged saves; physical crossing; true reload; sandbox denial; 390px layout/44px targets; active-run revocation; foreign receipt denial; reader/gallery return navigation. |
| Preservation checks | Original painting, current catalogue, linked contract, story engine/content, presentation HTML/modules/styles and React shell retain main's exact blobs. |
| Whitespace and harness syntax | PASS. |

Browser prerequisites were generated from the released native save contract. Movement used real held-key input in addition to fixture positioning. The 390px check is narrow-frame layout coverage, not physical touch hardware or screen-reader certification. This session did not replay the complete native memory-anchor UI loop or run the full existing Firefox/WebKit presentation and recovery matrices on the new candidate. The new workflow is prepared to run the native interaction suite and presentation suite alongside portal review; no hosted result is claimed before approval/push. Historical PR #48 workflow passes are not counted for this candidate.

## Approval boundary

Recommended next action: publish this candidate as a new review branch and draft PR for hosted checks, leaving PR #48 history intact. Do not merge or deploy until the combined evidence is reviewed and explicitly approved. Rewriting PR #48 instead would require separate explicit approval and a lease against its exact current head.
