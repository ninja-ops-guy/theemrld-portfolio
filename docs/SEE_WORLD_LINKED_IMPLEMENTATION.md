# Linked Story implementation review

Status: implemented review candidate, not deployed. This supersedes the earlier specification's statement that no linked code exists, but does not claim every production gate is complete.

The original four episodes and twelve endings remain. The default See World route now reads persisted native milestones and gates individual nodes. The unrestricted interface is isolated in `preview.html`; its save key is never imported as earned native progress.

## Player flow

Open the updated TechOps Hero main story. New Game creates a fresh identity; Continue preserves it. An older unbound primary save is adopted only through **Linked Story -> Link this loaded main-story run**. Open See World on the same browser and origin. Complete available choices. When a checkpoint earns a return section, enter the main campaign's Night Walker and use **Linked Story** to launch it. Walk to its three indicated objective positions and perform the evidence/verification interactions. The completion record appears back in See World.

The implementation supports the game's existing primary local profile (`local-primary`) with an independent UUID per playthrough. It does not add cloud accounts or a multi-profile selector. Profile and campaign slots must share that identity. Preview, standalone, wrong-run and incompatible records are not automatically combined.

## Return sections

- Felicia: Signal / Independent Check.
- K: Physical Anchor.
- Waldo / Oz: The Return Path.
- Iona: After the Fire, Shared Workshop, or On the Record, selected exclusively by saved depot fate.

Each is a three-objective native-world investigation. They use existing pixel-world districts and the native renderer. These are not dedicated 3D mission maps, new character rigs, voice performances, new combat systems or rebuilt depot meshes. The selected native avatar is not replaced with a newly generated actor model.

## Authority and saves

`techops_save` owns the live primary profile; `techops_hero_campaign_v1` owns authored acts/facts. The native adapter publishes only from a successfully persisted matching pair. See World validates original byte fingerprints and recomputes named milestones. Fingerprints detect accidental inconsistency; they are not cryptographic signatures or anti-cheat proof. Local storage is controlled by the player.

See World stores replayable, append-only histories per run. Web Locks plus a sequence check reject concurrent stale See World choices. An irreversible depot branch cannot be overwritten by import. Native availability is recomputed from those histories and native prerequisites, rather than trusting an `unlocked=true` payload. Browsers without Web Locks cannot write linked progress.

The native adapter protects its two primary writes from a stale run identity without rewriting payloads. Other native keys are unchanged. Main-story completion is never stamped by a side-operation grant/completion. New return sections are optional; no section is required to complete the native milestone that opened it.

## Canon Guardian review and scene manifest

Authority: Story Bible v1.7, SHA-256 `38a0fd866464daf26a036e0c2608cd8f95a879a5e1c7014b5c3ac407906b0d5f`, plus the creator's explicit linked-progression request. New objective wording and recap staging remain PROVISIONAL pending creator editorial review. No likeness or new illustration was generated; face-accuracy verification is NOT APPLICABLE.

Stable actors: K/Red/El is one person; Waldo/Oz is one person; Iona and Felicia are distinct. Separate Evidence and Trust. Do not infer identity or consent from memory, signal response, archive possession or dog affection.

| Scene | Viewpoint/channel | Chronology and knowledge boundary |
| --- | --- | --- |
| Iona disclosure v1 | Explicit player-facing recap | Discovered after Ghost Fork; tells of an earlier interlude after Red's arrest and before voice-window contact. Does not transfer knowledge to Mike. Exact interval and research authorizer remain unknown. |
| Signal / Independent Check | Felicia-linked bounded evidence objective | Requires native alliance and See World evidence handoff; no automatic Duet or flight clearance. Existing industrial district is staging. |
| Physical Anchor | K-linked physical observation | Requires actual orbital return. Borrowed familiarity does not prove memory origin. No original-Mike/Evan reveal or later El powers. |
| The Return Path | Waldo/Oz-linked companion account | Requires actual return. Katrin and Manchez remain individual companions; their bond does not certify identity. Existing home district is staging. |
| Low Quarter branches | Iona-linked follow-up | One aftermath only: Burn, Workshop or Witness custody. Existing industrial geometry is staging, not a newly authored Low Quarter map. No Open Network auto-ending. |

Felicia's solo eligibility is separated from Duet shared control. Good Dogs discovery/release/return checkpoints retain their order. K's selected identity is not a score. The numbered comic remains the canonical baseline, not overwritten by a game branch.

## Paired deployment and test scope

Both repositories must be released as a compatible pair under the same origin. The optional native module imports the portfolio's linked contract; absence is reported through `__seeWorldLinkedLoadError` without awarding progress. Custom domains and cross-device synchronization are not implemented.

Run `TECHOPS_SOURCE=../techops-hero node --test scripts/see-world.test.mjs scripts/see-world-linked.test.mjs` in the portfolio checkout. The new deterministic suite contains 15 tests; the original suite contains 22. The tests exercise all 1,293 original complete narrative histories only under an appropriately earned native fixture.

The paired browser workflow serves the real native checkout at `/techops-hero/` and portfolio public directory at `/theemrld-portfolio/` on one origin. Its script uses canonical native prerequisite fixtures, then actual UI choices, native district launch, keyboard traversal, objective checks and completion receipts. Enemies are cleared only in that browser fixture to isolate movement/interaction. This is not evidence of an uninterrupted from-scratch human playthrough, full combat certification, real-device iOS testing or cinematic production readiness.

The local browser was blocked by this execution environment's administrator policy and was not bypassed. Hosted test receipts identify the exact paired heads. Consult their observed outcomes; source delivery alone is not a browser pass. Earlier failures and repairs remain in the PR history. No merge or deployment is implied.
