# SEE WORLD — four playable campaign drafts

## Delivery state

This is a playable choice-narrative implementation, not a completed 3D action release.
The flagship hub presents Iona's revenge plus Felicia, K, and Waldo campaigns.
There are 56 authored nodes, 80 choice options, and 12 endings. Options are not all
independent plot branches. New dialogue and alternate outcomes remain review drafts.
No merge, deployment, marketing launch, or numbered-comic canon approval is implied.

## Run and review

- In the full portfolio: run the existing Vite development/build commands and open `#/see-world`.
- Without the React shell: `python -m http.server 8765 --directory public`, then open
  `http://localhost:8765/see-world/index.html`.
- Pure logic: `node --test scripts/see-world.test.mjs` (Node 20+).
- Browser smoke: install the pinned runner used by the existing world tests,
  `python -m pip install playwright==1.57.0` then
  `python -m playwright install chromium`. With the static server running, execute
  `SEE_WORLD_BASE_URL=http://localhost:8765/see-world/index.html python scripts/see-world-browser.py`.
- `#/links` points to the new experience; original comic, terminal, standalone game,
  and `/k/*` routes remain available. No existing saved-game keys are touched.

## Campaigns

| Character | Episode | Distinct decisions | Endings |
| --- | --- | --- | --- |
| Iona | The World He Left Running | flight approach, power isolation, independent evacuation count, ledger custody, depot fate | Burn / neighborhood workshop / independent witnesses |
| Felicia | A Signal Is Not a Confession | repeatable observations, incomplete hardware, external stop, explicit evidence handoff | witnessed briefing / bounded report / repair continuation |
| K | The Name I Keep | external memory anchors, consent to care, prison escape, chosen information boundaries | private record / limited sharing / quiet self-definition |
| Waldo / Oz | No One Left Behind | companion information, rescue order, recovery time, physical crossing, positive boarding count | shelter / consent-bound introduction / practical rescue record |

Iona's depot choice is committed only after the rescue, recovered ledger, and
independently witnessed evacuation. Each fate has its own playable follow-up and
saved consequence. These are narrative outcomes; the current WebGL city meshes are
NOT destroyed/rebuilt according to the depot flag.

Felicia tracks Evidence and Trust separately. Her episode is solo preparation before
formal Duet Protocol, not an automatic unlock of that joint operation or flight.
K's identity is never a score or a reward. Waldo's humor does not erase the need for
rest, care, and individual companion behavior.

## Canon provenance and approval boundaries

Primary source reviewed: `TechOps_Hero_Story_Bible_v1_7_Night_Walker_and_El.docx`,
especially Night Walker progression, Good Dogs, information transfer, and character
rules. This supersedes conflicting initial-unlock and prison-discovery wording in
older v1.2 material.

Iona source reviewed: `TechOps-Hero-Iona-Script-and-Game-Decision.md`, Draft 08,
"The World He Left Running", including the proposed game-decision record.
The source comic is provisional and its alternate game branches are proposals.
This implementation adapts those branches; it does not declare them approved canon.

Fixed constraints retained:
- Iona's arc follows Red's arrest and precedes voice-window contact. Red remains
  offstage. The research authorizer is not invented; North Intake remains a lead.
- Mara is he/him and independently owns the west gate and count.
- The ledger survives all depot routes. The comic's intercept/corridor/burn route
  is one game path, not a mandatory outcome for every player.
- Felicia has solo missions before Duet. Private player knowledge reaches Mike
  only through a depicted handoff. MORNINGSTAR remains grounded here.
- Oz is already in Cell 1984 and K in Cell 118. The dogs discover K; they free him
  before K and the dogs free Oz. The alcove, Warden, and shuttle follow.
- K and Mike stay distinct. Ghost Fork is not moved ahead of the rescue.
  No original-Mike reveal, Evan-origin reveal, or El-level powers are introduced.
- The four routes are selectable anthology previews. They do not set progression
  flags in the separate TechOps Hero game and are not one chronological save.

No new character likenesses, voice performances, comic illustrations, or music
rights have been fabricated. Geometric typography is interface art, not character art.

## Implementation

- `public/see-world/campaigns.mjs`: declarative authored node/choice graph.
- `engine.mjs`: pure transition reducer, gates, event replay, save validation.
- `app.mjs`: accessible DOM-based narrative UI, journal, collection, export/import.
- `index.html` / `styles.css`: responsive flagship hub and story presentation.
- `src/pages/SeeWorld.tsx`: same-origin React host and allowlisted navigation bridge.

Four independent runs use `see-world:campaigns:v1`, schema 1, content revision
`2026-11-07-a`. Saves serialize decisions and reconstruct derived flags/stats via
replay. Unknown versions and impossible histories are rejected. A corrupt existing
save is not silently overwritten. Storage failure allows in-memory play and export.
Import/restart/irreversible changes require confirmation. There is no cloud sync.
Local saves and publicly shipped reward text are not secure entitlement controls.

The optional existing-world iframe is lazy and reused, so campaign UI has no second
audio player. Navigation checks both exact origin and source window, with allowlisted
destinations. Re-rendering an unchanged story location does not reset the world camera.
The browser smoke substitutes a small same-origin fixture for this world to isolate
bridge behavior; that does not qualify WebGL rendering or SoundCloud playback.

Unlocks are four written dossiers and a fifth all-perspectives reflection. They are
not unreleased songs, art files, or required comic chapters. The comic stays public.

## Verification recorded during authoring

Local Node 22 run: 22 tests passed, 0 failed. Exhaustive traversal reached every node
and all 12 endings. Completed choice paths: Iona 768, Felicia 274, K 187, Waldo 64
(total 1,293). Every completed path round-tripped through validated save replay.
Syntax checks passed for the JavaScript modules. These are engine tests, not visual QA.

Local browser execution was attempted but the Chromium executable was unavailable;
network access was unavailable to install it. Therefore no local browser acceptance,
screenshot review, full React build, real-device accessibility, WebGL, or audio pass
is claimed here. The added CI workflow runs the engine and browser smoke and retains
its receipt/screenshots; only observed results on the actual commit count as passes.
The existing Portfolio PR Build remains the full TypeScript/Vite build gate.

## Release gates still open

1. Owner review of newly authored dialogue, branch consequences, rewards, and spoilers.
2. Exact-head TypeScript/Vite build and browser/mobile UI acceptance.
3. Real renderer/audio integration, keyboard/screen-reader and touch review.
4. Dedicated mission geography, NPC animation, combat/stealth mechanics, cinematics,
   original art/audio direction, and geometric consequences for depot fates.
5. Public release approval. This draft must not be represented as the finished flagship.
