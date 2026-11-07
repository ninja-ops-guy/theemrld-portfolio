# Ascended K — linked painting encounter

Implementation candidate, game-only draft. No merge, deployment, new combat powers, origin reveal, or numbered-comic canon approval.

## Player journey

The existing STAIR / CATHEDRAL work is fixed in its original gallery frame rather than rotating away. The archived 732 × 732 WebP depicts the creator's supplied artwork; its bytes and full square composition are unchanged. The frame is lowered for walking access. Eleven other frames retain look-away rotation, and the cathedral cannot duplicate into them.

Before completion, inspecting the painting explains the linked K requirement. After **any** of the three K endings is earned in the active linked playthrough, the visitor may walk forward through the painted aperture or use Enter painting. The K ending also provides Visit the painting, opening the existing world iframe at the gallery.

Beyond the frame is a separate navigable blue/violet chamber: luminous window, curved scenic stairs, stars, altar, and green hooded Ascended K staging. The central nave is walkable. Side stairs are scenery, not a climbable mission. Three optional conversation topics preserve uncertainty about provenance and do not reveal the original-Mike/Evan mystery. Dialogue and geometric character staging remain creator-review drafts.

The chamber has a return painting, an always-available return button, and a return action in the conversation. Leaving restores a collision-free gallery position facing away from the threshold. The same K Terminal player remains in authority; this feature adds no music/voice player, remote service or paid dependency. ASCII defaults and reduced-motion preference remain intact.

## Access and persistence

`public/k-world/ascended-access.mjs` reads the existing linked store. It requires a replayed K ending, native return, and the completed `k_anchor` investigation in the active playthrough. It writes no native or See World save. Entry is rechecked for physical crossing, inspector action and direct room navigation. Storage/focus/pageshow changes and a bounded periodic check revoke an open visit when the active run becomes unavailable or changes.

Old standalone preview saves, apparent completion booleans, wrong-run imports, corrupt history, denied storage and stale native byte stamps cannot open it. A world embedded from sandbox replay carries the preview context and is denied even when another linked run is complete. New Game does **not** inherit the old run's portal. Existing completed linked histories survive reload and separate sandbox replay, without creating a resettable entitlement flag.

This is local same-browser progression, not an anti-cheat/security entitlement or cross-device synchronization.

## Relationship to TechOps Hero / Night Walker

This addition grants the optional gallery chamber and conversation only. It does not auto-complete a native act or award combat powers. Its predecessor requirement is the actual linked native casebook **What the mark can prove** (`k_anchor`).

The preserved paired foundation also contains Felicia's **The missing interval** and **A stop outside your hands**, Waldo/Oz's **Count the people, not the light**, and one Iona branch follow-up: **After the fire**, **No one owns the voices**, or **Write down what I did, too**. These are multi-action casebook investigations, not new combat maps. Availability and completion remain separate.

## Candidate pairing and verification

Built on portfolio linked candidate `ea5128b70c8a37db11ee951333dfcfb701438f72`. The native review pair is now TechOps Hero `83d20ad7c412abdc1d27efa36f80fecba8877991`, including the existing New Game binding fix in native PR #98. This supersedes `492706157fe4b31ff3550896d2247cc087b864d5`, used for the initial local checks and first portal browser pass. The shared universe core and rules revision are unchanged. Both repositories must be deployed together under the same origin; no public release is performed here.

Historical local checks against the initial native pair: 102 Node tests passed (90 preserved contracts and 12 portal tests), including all 187 legal K paths and all three endings; native production regression passed, including JavaScript syntax checks for 600 files. The local managed Chromium blocked localhost, so no local visual/browser pass is claimed. Hosted `Ascended K Linked Review` and `See World Linked Integration` must both pass on the current exact pair; its artifact retains paired heads, test logs, screenshots and JSON receipt. Consult that receipt for actual PASS/FAIL, never infer a browser pass from this document.

The browser test advances long main-story prerequisites through native APIs, then uses actual See World K choices and the native memory investigation UI before entering the painting. QA functions position the 3D camera only; they cannot award the portal. Desktop and touch checks are emulation, not physical-device or screen-reader qualification. External music and unrelated remote archive images are blocked during the test; the cathedral asset remains real and local.
