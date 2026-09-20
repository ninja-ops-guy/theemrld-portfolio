# K//CITY — KX Experience Program reconciliation

Status: implementation/qualification backlog; NOT a completed release.
Source: user-supplied `Pasted markdown(10).md`, titled **K//CITY — 10/10 Experience Program**.
Source SHA-256: `65134ae551f23b2a528a23830f08ac386e139cfe17ecb8c493ee87a8f298fbb8`.
The original is preserved byte-for-byte in the accompanying source bundle under `docs/source/KX-10-10-Experience-Program.uploaded.md`.

## Scope and authority

Preserve KX-01 through KX-22 and their original priorities. Stop adding breadth while reliability, hierarchy, onboarding, accessibility and qualification are unresolved. The source's 10-second understanding / 30-second movement / 60-second destination targets are acceptance targets, NOT observed user outcomes.

Explicit reconciliations (not silent edits to the source):

1. KX-10's crossfade suggestion conflicts with the user's repeated full-song/no-overlap instruction. Keep one playback owner; location changes queue; only completion advances automatically. Manual pause/skip/selection remain authoritative. No simultaneous music crossfade.
2. KX-09 supersedes the earlier screen-space salon-wall workaround. Paintings and furniture remain WORLD objects; artwork details are MODAL; navigation is HUD; particles are AMBIENT. Do not reintroduce camera-attached paintings to hide failed assets.
3. ASCII remains ON for fresh visits, missing/corrupt storage and unavailable storage. Respect an explicit saved boolean display choice.
4. The KX-07 mission totals and KX-16 all-PASS JSON are illustrative examples, not project evidence. Do not publish those example totals, fictional usability findings, or an all-PASS receipt.
5. KX-18 telemetry is optional. No telemetry service is enabled by this work, and no terminal-command collection is authorized.
6. The supplied document ends after `I would not call K//CITY finished until all of these are true:`. Its final 10/10 release checklist is missing. The integration gates below are engineering proposals, not a recovered ending.

## Verified repository state at intake

- Main: `1cc984353e5331bfa8c6fa72dc6cb459ad86060a` (the older gallery-composition correction).
- Release branch intake: `6b620357cb24c32c1d01844217157e16757b83dc`.
- The branch's `AsciiCityWorld.tsx` points to `public/k-world/index.html`, but that file and the complete runtime/asset directory were absent at intake (connector returned 404; recursive tree confirmed absence).
- A TypeScript/Vite pass alone cannot qualify this branch: static iframe targets are not type-checked.
- Do NOT fast-forward main to a host-only branch. First install the complete approved runtime and assets, then qualify the exact resulting source and built bytes.

Approved local basis: `K-WORLD-v6.0.1-ascii-default.zip`, SHA-256 `365772a186961cf355103a080d7cf1125a984ab59c3437127891fd5a5d9d3b5c`.

## KX traceability

LOCAL means the downloadable source, not deployed main. PARTIAL is not a pass.

| Spec | Intake evidence / local coverage | Outstanding requirement |
|---|---|---|
| KX-01 Asset Integrity Gate | LOCAL hardening: all 13 art/band sources decoded, expected dimensions and hashes checked; named failure placeholders; accurate failure counts | Complete runtime upload, actual Vite output comparison, deployed base-path and in-component checks |
| KX-02 First-class portfolio project | NOT IMPLEMENTED in this integration; existing route wiring is not product discoverability | Project card, clear Explore K//CITY CTA, representative preview and design-case-study link |
| KX-03 15-second onboarding | PARTIAL: entry/sound choices and controls help exist | Progressive MOVE/LOOK/INTERACT completion; persisted tutorial; touch-first instructions; first-visit timing study |
| KX-04 Persistent navigation anchor | PARTIAL: Atlas, terminal and dialogs exist | Dedicated Escape/menu with continue/map/music/controls/accessibility/restart/portfolio return |
| KX-05 Information hierarchy | PARTIAL: world-space depth renderer replaces floating cards | Explicit L1–L5 hierarchy and human review at canonical viewports |
| KX-06 Destination architecture | PARTIAL: gallery/city/six realms have separate mesh and collision collections and return gates | Bind destinations to actual portfolio information; do not add Factory/Lab scope before P0 quality gates |
| KX-07 World objects as portfolio interfaces | NOT IMPLEMENTED as evidenced artifacts | Project/architecture/receipt interactions using real source artifacts, no invented counters |
| KX-08 Gallery redesign | PARTIAL: real 12 world-space frames, original-aspect inspection and close; ceremonial architecture | Quiet-entry polish, artwork metadata and Listen links only where supplied/confirmed, visual review |
| KX-09 Presentation layers | LOCAL: artwork/world furniture use geometry; inspection uses dialog | Formal layer registry and automated no-screen-space-art regression |
| KX-10 Audio system | LOCAL sequencer tests and local-file browser playback; full-song priority retained | Live SoundCloud and production session-continuity qualification; no live-provider pass claimed |
| KX-11 Reactive hierarchy | PARTIAL: procedural clock envelopes; local audio analyser path | Separate environment responses instead of predominantly combined energy; keep UI readability stable |
| KX-12 Motion tokens | NOT IMPLEMENTED as one token system | Central motion durations and consistent transitions |
| KX-13 Accessibility/Calm | PARTIAL: OS reduced-motion handling exists | Explicit controls for reduced motion/flicker, contrast, text size, reactivity and static background; verify all JS loops including band frame changes |
| KX-14 Designed mobile mode | PARTIAL: directional touch controls, drag look, tested portrait overflow and pointer cancellation | Touch-first progressive instructions, joystick design, comfortable target audit, optional landscape suggestion |
| KX-15 Performance budget | NOT QUALIFIED against specified supported devices | Actual render timing, p95, long tasks, ten-minute memory, transitions and production transfer; see warning below |
| KX-16 Experience qualification | PARTIAL: local functional tests plus asset gate | Q1–Q6 end-to-end exact-build receipts; explicit NOT_RUN states and blocked release |
| KX-17 Visual regression | PARTIAL: canonical screenshots exist | Reviewed baselines, automated comparison and threshold-review workflow; taking screenshots is not a diff pass |
| KX-18 Coarse telemetry | NOT ENABLED intentionally | Optional disclosed/consented event-only instrumentation; no commands/content collection |
| KX-19 UX research protocol | NOT RUN | Real 5–8 participant sessions and before/change/after findings; cannot be simulated by browser tests |
| KX-20 Design case study | NOT IMPLEMENTED | Real problem/constraints/IA/iterations/testing/outcomes; mark unmeasured claims |
| KX-21 Portfolio compression | PROPOSED, separate homepage scope | Review cards and reduce density without deleting evidence; do not silently redesign unrelated content |
| KX-22 Artifact previews | PARTIAL: real world screenshots exist locally | Curated project preview components grounded in actual artifacts |

## Asset changes implemented locally in the KX hardening bundle

`Assets.load()` previously decoded images but did not enforce expected dimensions; startup could still say 13 verified after a failure. The hardening adds dimension checks from the reviewed manifest, per-asset diagnostics and settled counts. Gallery failures render `ARTIFACT SIGNAL LOST / asset: <id>`. Failed inspectors show the same named message, not a broken image. A failed band displays a named fallback instead of broken sprites.

These local runtime edits are not implied to be present in GitHub until the full runtime is uploaded and its hashes are compared. This commit adds the repository-side gate, not a replacement runtime.

## Executed local evidence for the hardening revision

- Node unit/scene/audio/ASCII/asset tests: 57 PASS, 0 FAIL.
- Existing full Chromium functional browser suite: 52 PASS, 0 FAIL, zero runtime errors.
- Additional Chromium negative-asset checks: 7 PASS, 0 FAIL, zero runtime errors.
- ASCII preference browser checks: 13 PASS, 0 FAIL; storage is an injected localStorage-compatible fixture, not a real-origin persistence test.
- Runtime/hash/Pillow/Chromium asset gate: 64 PASS; all 13 source assets decode with expected dimensions.
- Gate negative/byte-comparison fixture tests: 7 PASS. Exact-copy fixtures are NOT a real Vite build.
- Installer tests: 6 PASS.
- Browser environment exercised Canvas fallback, not GPU. These are local results, not CI/deployment or usability results.

The Canvas fallback source explicitly throttles rendering at 140 ms. It therefore cannot establish KX-15's 55/45 FPS goals. A 60 Hz animation callback is not a 60 FPS renderer. Runtime-plus-asset bytes excluding reference images measured 2,669,402 raw and 2,584,007 as a sum of per-file gzip estimates; this is NOT measured initial network transfer. Do not downsample the approved art merely to manufacture a budget pass.

## Ordered execution / proposed integration gates

1. Land the complete approved runtime, individual art/band files, published catalogue, tests and host; ASCII ON by default. Preserve legacy song numbers and queries. Refuse unrelated route changes.
2. Run KX-01 on source and actual `dist/k-world`; verify hashes, dimensions, full decoding and no empty frames. Verify real deployed base paths and in-component images separately.
3. Implement and qualify P0 onboarding, persistent menu/escape, calm mode and performance instrumentation. Keep location changes from interrupting playback.
4. Add discoverability and the design case study; bind spatial project interfaces to real evidence.
5. Complete canonical visual regression, device/browser QA, live provider qualification and human usability work before claiming 9–10-class finished UX.

`scripts/kx_asset_gate.py` always labels its scope as asset/runtime integrity and its full-release status as BLOCKED. Unexecuted deployed checks remain NOT_RUN. It is a prerequisite, not a substitute for KX-16.

No production merge, deployment, telemetry activation, or finished-UX claim is authorized by a green asset-only result.
