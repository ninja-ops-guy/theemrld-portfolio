# See World — Ascended K painting

Status: **linked portal candidate for local review.**

## Creator direction

On November 7, 2026, Mike Olivares supplied the attached 732 × 732 artwork and requested a painting inside the See World gallery that players can walk into to meet Ascended K after completing K's campaign.

The existing `cathedral.webp` is an earlier copy of the same composition. Its rotating wall placement is promoted into one permanent, floor-accessible portal at the north end of the gallery. The gallery therefore has eleven rotating frames and one fixed painting. The work remains in the art archive, but cannot rotate into another physical frame.

The original uploaded PNG is retained unchanged as `public/k-world/assets/ascended-k-painting.png`, SHA-256 `735f9c9af1f549e79d94c8de15c0adf9318ca2678189a5f9466acfb84c58ca0a`. It is displayed at its full square aspect ratio. The portal frame and surrounding 3D geometry are separate from the image.

## Playable behavior

- Everyone can inspect the original artwork under its existing *Stair / Cathedral* title. The hint names K's campaign, *The Name I Keep*. The Ascended K title and encounter description are revealed by completion.
- Every legal linked K ending opens it, including all three endings. The ending remains behind the native Earth-return milestone.
- The gallery and story independently replay the committed K decision history for the active native profile and playthrough. Reload and native Continue keep that binding.
- “Visit the painting” brings the player to the gallery side of the frame. Walking across its threshold enters the chamber with a short fade that is disabled by reduced-motion settings. Keyboard and touch interaction offer an equivalent **Enter painting** control. Direct chamber URLs lead to the gallery frame, where the same entry gate applies.
- The chamber contains the blue window, curling stair silhouettes, violet masonry, stars, the source painting's altar/candles, and a hooded emerald figure. Its ground floor is walkable; the raised stair/balcony scenery does not require a climbing mechanic.
- Approach Ascended K or choose **Encounter description** to read the same text about the silent encounter. The text introduces no dialogue or new lore.
- The doorway, visible return control, encounter dialog and Escape provide a way back. Return places the player outside the portal trigger, facing into the gallery. Crossing and returning keep the K Terminal audio session and queue in the same world instance.
- Storage errors fail closed. Parent messages can bring the player to the frame, while entry requires the gallery's own verification of the linked save.
- Missing art or invalid linked saves keep entry unavailable. The gallery reads saves. A new native game, profile switch, or revoked completion returns an occupant to the gallery.

## Canon and visual scope

The encounter is optional post-campaign **game** content. Unlock order is not a date in the numbered comic. K/Red/El remain the single actor `k_red_el`; this scene does not introduce another clone, origin explanation, authorizer, prophecy or branch of comic history.

The original green presentation is preserved. No red-regalia transition occurs. The face is concealed, with no invented face or detailed new mask. This simple geometric silhouette is a draft game representation, **not a creator-approved final El model or likeness certification**.

The encounter does not reveal original-Mike/Evan material, resolve ORPHEUS sponsorship, explain the celestial timeline, or grant extraordinary powers to a playable Earth-bound character. The visit does not alter another campaign's knowledge or outcomes.

## Linked progression

The portal consumes the existing source-owned active snapshot and run-specific
decision record from the issue #97 bridge. The native campaign prerequisites
are enforced at every K decision during replay, with the completed Earth return
and Night Walker’s **What the mark can prove** section required by the ending. The standalone archive uses a separate save key and
remains outside this reward. Entering the chamber leaves native milestones and
Night Walker grants untouched.

The same-origin bridge derives the gallery gate from the native save pair, its
published snapshot, and the committed See World history. It does not introduce
a native story flag or change existing Night Walker section rules.

## Verification commands and review

```sh
TECHOPS_SOURCE=/path/to/techops-hero node --test scripts/see-world*.test.mjs tests/k-world-*.test.mjs tests/ascended-scene.test.mjs
npm run build
LINKED_BASE_URL=http://127.0.0.1:8765 python scripts/see-world-linked-browser.py
```

The paired browser runner exercises the existing native follow-ups and portal
controls. Serve the native checkout at `/techops-hero/` and the portfolio
production build at `/theemrld-portfolio/` on one localhost origin, as the paired
CI workflow does. Use `CHROMIUM_PATH` for a system Chromium executable. Native
main-story prerequisite setup uses fixture-assisted saves through native APIs.
See World choices and native follow-up completion use the real UI.

The candidate is provisional. Source edition is Story Bible v1.7 (bundled SHA-256 `38a0fd866464daf26a036e0c2608cd8f95a879a5e1c7014b5c3ac407906b0d5f`) plus the creator's dated scene guidance and original artwork. The image hash verifies the source painting. The room, face-concealed silhouette, and text encounter are proposed game staging. Definitive character likeness, hosted integration, and linked release remain separate approval or verification gates.
