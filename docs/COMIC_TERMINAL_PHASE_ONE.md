# Comic / K Terminal — phase-one implementation

Status: draft implementation, not a release. Related: issue #62.
Baseline: `1a97e7b09997bc2c3da4a1836a4ce9d9007c7e8c`.

## Scope actually implemented

- The classic `/terminal` gets a resume link with edition + last successfully loaded page. Existing browser bookmarks migrate without shifting the already-current 316-page key. Failed loads and next-page prefetches do not advance it. Private-storage failures retain an in-memory session fallback.
- The existing terminal prompt accepts `comic 197`, `comic resume`, explicit `comic xiii 12` / `comic legacy 150`, and navigation aliases `iona-set`, `recording-session`, `finale`. These commands route to edition-qualified URLs. Normal music/comment commands pass through unchanged.
- `comic <cue-id>` or a hyphenated song title, including `comic ride-or-die`, resolves only when that name has an unambiguous validated cue in the active, revision-matched soundtrack. It is not a hardcoded song assignment.
- Mapped pages show **Listen in K Terminal** and the song title. The terminal shows that requested song, an explicit Play button, a return-to-page link and a scene-start link. Opening the link alone does not select, pause, restart or play audio. Selecting the already-current song resumes rather than restarts it.
- Handoffs bind edition, page, art revision, cue ID and exact SoundCloud URL. A stale link cannot silently select a replacement song. Local score previews are clearly marked as device-local, not published assignments.
- A silent four-beat motif appears in the comic route loader, page-art loader, existing skippable intro and classic terminal header. It has a reduced-motion fallback and does not delay navigation or generate audio.
- `register` opens the existing Revision F reader key at page 2. `verify` and `cutoff` remain explicitly locked; no reveal dates, spoiler progress or operational authority are invented.

## Correct page map / content boundaries

The current Revision F manifest declares **316 pages**, not 315. Issue #62's initial 315-page baseline note was erroneous. The known insertion is page 34; only the older 315-page bookmark key migrates by one at/after old page 34.

Creator-requested navigation ranges: Iona's set p.88, recording session pp.196–216, finale pp.314–316. These ranges are metadata for navigation, **not music credits or song assignments**. Unmapped performance pages expose a definition prompt instead of a misleading playable link. This PR does not alter `guided-cues.json`, the release catalogue, lyrics, the comic ending, page descriptions, PDFs, artwork or page order.

The source/public JavaScript boundary uses the same runtime-import approach as the existing guided-score module, avoiding static imports of JavaScript inside Vite's public directory.

## Verification recorded locally

`node --test tests/story-*.test.mjs`: **38 passing, 0 failing** (32 behavioral unit tests + 6 static integration-contract tests). Covers page bounds, edition routing, bookmark migration, corrupt/denied storage, ambiguous aliases, stale revisions, reused cue IDs, unsafe URLs, command fallthrough and integration source contracts. All cue URLs in tests are synthetic fixtures and are never published as placements.

TypeScript `transpileModule`: 8 changed/new TS/TSX implementation files, zero syntax diagnostics. This is **not** dependency-aware typechecking or a production build. The container could not retrieve repository dependencies; the existing Portfolio PR Build workflow is the full TypeScript + Vite build gate. A separate read-only PR workflow runs the new tests. Workflow/build outcomes must be reported separately after an actual run.

No browser/mobile/audio-provider interaction or visual QA has been certified by these checks. Keep this PR draft until those checks pass.

## Review checklist before release

- Current-head full build and the new test workflow pass.
- Desktop and phone: classic prompt routes correctly; reader artwork loads; resume survives reload and moves across editions; failed images leave the bookmark unchanged.
- Verify the terminal header does not obscure the existing console at narrow widths and large text sizes. Check keyboard focus, details controls, reduced motion and intro skipping.
- Use a disposable local score: map a test track, follow Listen, verify no automatic transport change, press Play, return to page, and verify exact song / pause / background behavior. Remove the test draft afterward.
- Back/forward navigation, repeat same-song handoffs, cross-tab bookmarks and denied browser storage.
- Reusing a cue ID for a different URL must invalidate an old link rather than play another track.

## Still outstanding from #62

Actual creator-approved track placements; reveal-gated `verify`/`cutoff`; all-page visual-register metadata; spoiler-aware cast; mobile panel coordinates/zoom; verified Revision F transcripts; responsive image assets; offline storage; scene/page social previews. The native K World iframe prompt at `/k/terminal` is unchanged in this first pass. Its future integration should reuse `public/k-world/story.js`, not duplicate rules.

No merge, publication or deployment is part of this draft.
