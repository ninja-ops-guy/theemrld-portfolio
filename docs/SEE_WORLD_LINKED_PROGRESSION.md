# SEE WORLD — linked progression requirement

Status: OWNER-REQUESTED ARCHITECTURE / RELEASE BLOCKER. This document supersedes the independent-anthology progression direction in SEE_WORLD_CAMPAIGNS.md and PR #45. It is a specification, not a claim that cross-game synchronization has shipped. The existing playable preview is still unlinked.

## Owner requirement

The state of each See World campaign must be tracked against actual game completion in TechOps Hero so the player can follow the story chronologically. Advancing See World can unlock sections inside Night Walker. This means one linked playthrough with multiple viewpoints, not four unrestricted parallel saves and not a percentage-based content gate.

## Authority and direction

TechOps Hero owns main-story completion, character discovery, rescues and the campaign timeline. See World owns its authored decisions, chapter progress and branch consequences. Night Walker owns whether an unlocked section can actually launch under its own story, character and runtime constraints.

The loop is:

TechOps completed beat -> See World chapter becomes available -> See World earned checkpoint -> a Night Walker section becomes eligible -> Night Walker's ordinary eligibility checks -> player actually plays and completes that section -> TechOps records its own resulting milestone.

An availability grant is never a completed mission. Do not auto-complete Duet, rescue K/Waldo, certify MORNINGSTAR, reveal an identity, start an ending, or bypass native campaign prerequisites by applying a See World reward. No circular dependency may make an existing TechOps beat depend on See World content that itself requires that beat.

## Inspected source anchors

Inspected TechOps Hero main at e85aa67a7fd2ec2827b100345483c2138d682dd0:

- campaign_act1.js: schemaVersion 2; campaign save key techops_hero_campaign_v1; opening flags and campaign history.
- campaign_story.js: story.completedActs and story.facts; predecessor-checked ACTS and transitionStatus/completeAct. act_3 produces violinist_revealed; act_6 produces duet_protocol_complete and orbital_signal_found; interlude produces the rescue/return facts; act_7 produces mike_meets_k and k_personhood_affirmed.
- campaign_act2.js: independent p1.reveal, Evidence/Trust and duet state. The newer Story Bible v1.7 remains the story authority for Felicia's solo availability before formal Duet; older runtime labels must not reverse that requirement.
- good_dogs_campaign_state.js: native S.meta.goodDogs checkpoint facts and explicit rejection of standalone-origin canonical completion. Cell 118 reach/discovery/release, Cell 1984 release, Warden defeat and return are separate checkpoints. A compressed runtime mission number is not itself a narrative fact.
- game.js: profile and campaign saves are distinct. The runtime profile save and the dedicated campaign save must be reconciled by a native adapter, not guessed to be identical by See World.

Do not read whichever save has the greatest apparent progress or union facts across unrelated runs. In particular, do not treat a standalone Good Dogs completion as the main campaign's interlude completion.

## Chapter gating and disclosure

Gate story nodes/checkpoints, not just the four campaign start buttons. Each gate records an entry milestone, spoiler ceiling, story placement, and any proposed return-unlock condition. Direct URLs, imported progress, resume, journals and collections all enforce the same gate.

### Felicia — A Signal Is Not a Confession

Entry: Mike has completed The Violinist reveal (ordered source progression with violinist_revealed; native act_3 is the inspected corresponding act). Felicia's solo missions remain playable before Duet Protocol. Her private investigation may be known to the player before Mike; that knowledge reaches Mike only through depicted evidence transfer.

See World checkpoints can propose Night Walker signal-investigation, rooftop and Hangar Three preparation sections. Formal Duet and airborne MORNINGSTAR remain their own earned native milestones. Do not require completed Duet to start Felicia, and do not stamp Duet complete from her See World ending.

### K — The Name I Keep

Duet/orbital discovery opens the prison context, not unrestricted access to every K reveal. Character display/name and playable stages follow the actual Cell 118 discovery/release milestones. Later cells, Warden and return scenes wait for their corresponding source checkpoints; Ghost Fork remains after the return.

See World memory-anchor and chosen-boundary checkpoints may unlock new K investigation sections when the native K/prison gates also permit them. They cannot grant later-volume powers, original-Mike/Evan reveals, or an escape that the source game has not completed. Revisiting a pre-release scene after release is labeled a recollection, not a second escape.

### Waldo / Oz — No One Left Behind

Respect established Waldo introduction and the Duet/orbital entry gate. Gate the Cell 1984 account, dog-mediated discovery, K release, Oz release, Warden encounter and return individually. Do not expose unseen K information through a Waldo card or journal.

Companion coordination and recovery checkpoints may unlock optional Night Walker team/rescue sections. The dogs free K before K and the dogs free Oz. Local preview/standalone dog missions never certify the linked campaign's rescue.

### Iona — The World He Left Running

Story placement remains after Red's arrest and before Iona's voice-window contact. Entry requires the player-facing arrest disclosure at the appropriate spoiler ceiling. No trustworthy Red-arrest disclosure flag was identified in the inspected native files. A native authored event/mapping is REQUIRED; do not infer it from elapsed days, a percentage, arbitrary chapter rank, or an invented existing flag.

If the safe player-discovery point is later than the event's occurrence, label the episode as an earlier interlude. The actual arrest disclosure and Red/K identity disclosure are different facts and must not be collapsed.

Mara coordination, ledger recovery and depot fate can open Low Quarter follow-up sections. Burn/workshop/witness outcomes change the linked playthrough's section selection, venue access and archive availability. They do not rewrite the numbered comic or award the established Open Network ending. Exact new section IDs and content remain implementation work, not currently available levels.

## Player-facing timeline

Display a shared Story Timeline in See World and the Night Walker journal. For each revealed chapter show:
- where/when it belongs relative to named story beats;
- whose viewpoint the player is following;
- state: undiscovered, locked, available, in progress, completed, or alternate replay;
- the next prerequisite in spoiler-safe wording;
- the section earned by the last completed checkpoint, without declaring it completed;
- explicit flashback/parallel-event labels where event occurrence and player discovery differ.

Undiscovered entries use neutral placeholders rather than character names, spoiler titles, portraits, ending summaries or locked reward text. Never invent a fixed day number to make parallel events appear linear.

## Shared playthrough and persistence

Introduce explicit native profileId and playthroughId. New Game creates a new playthrough identity; reload and same-run Continue do not. Bind all See World histories, Night grants and branch outcomes to that identity and a versioned content/rules revision.

Keep separate source-owned records: a persisted TechOps milestone snapshot, per-character See World decision histories, and consumed/eligible Night Walker grants. A native publisher emits only after a successful authoritative save and clears or changes the active binding on reset/profile switch. Include source save revision and snapshot sequence; reject stale or wrong-run updates instead of merging them.

Current GitHub Pages locations share an origin, so same-browser storage and storage events are a viable initial transport. Their repository paths do not create storage isolation. This is local progression, not cross-device/cloud sync, cryptographic evidence, or secure entitlement control. Future custom-domain deployments require an explicit origin-checked bridge or backend. A storage event is not sent to its originating document; the adapter must also refresh its local view after a successful write and on return/focus.

See World must not mutate raw native flags or profile blobs. The TechOps publisher normalizes the two native save sources and their provenance. Night Walker rechecks its own prerequisites at launch, even after receiving a grant.

Version and validate every envelope. Preserve corrupt/unsupported saves for recovery. Imports require compatible run identity and replayable history; conflicting irreversible branches must not be unioned. Use revision checks for competing tabs. Export/import must include the linked identity, source revision, decision history and grant provenance, not just apparent completion booleans.

The original v1 standalone preview saves remain an archive/sandbox. Do not silently turn their all-four completion into native unlocks. Alternate replay is separate from the active linked branch and cannot overwrite a committed depot fate.

## Required end-to-end acceptance

1. Fresh TechOps run: no undiscovered character/title/reward leaks in See World.
2. The Violinist completion opens Felicia before Duet; new See World checkpoint opens the corresponding native section, not its completion.
3. Prison checkpoint progression opens only the matching K/Waldo nodes; Good Dogs rescue order remains enforced.
4. Iona stays gated until an actual native disclosure mapping exists. Flashback placement is explicit.
5. Each reciprocal grant is idempotent, playthrough-bound and revalidated by Night Walker at launch.
6. Full dependency graph is acyclic; none of the current main campaign routes becomes unwinnable.
7. Reload/return-to-game, two tabs, out-of-order snapshot, storage denial, new game, profile switch, old save and corrupt import do not leak or lose progression.
8. Standalone/QA/preview completions never award linked grants.
9. Each depot branch produces only its own approved follow-up; branch replay/import cannot accumulate mutually exclusive outcomes.
10. Tests traverse a real native save -> See World choice -> native Night section launch -> real native completion on matching candidate heads in both repositories. Fixture-only or separately green suites are insufficient evidence for this integration.

## Release disposition

PR #45 remains DRAFT. Previous green checks establish the unlinked narrative implementation only; they do not establish this requirement. The old independent preview must not be deployed as the completed linked experience. Required implementation remains: native publisher/run IDs, chapter-specific See World guard and timeline, versioned migration, actual Night Walker section consumer/content, and cross-repository acceptance. No merge or deployment is authorized by this specification.

## Local bridge candidate

The linked mode is the default See World route. The explicit standalone preview
continues to use the original archive key. The archive cannot award linked
progress. Native New Game creates a new playthrough ID within the browser's
existing profile slot. Continue preserves both IDs. Existing unbound saves
remain playable and require a new playthrough to participate in the link.

A versioned active record commits the current snapshot sequence and both native
save revisions. TechOps owns all snapshots and only the native publisher reads
the two original saves. Night Walker checks the active runtime against the
durable profile, recomputes the milestone view, and asks the same-origin See World
engine to replay its committed decisions. It independently checks the section's
native prerequisites. Writes from competing See World tabs use a Web Lock and
compare the prior history and snapshot sequence. Linked exports carry the
decision record and derived grant provenance. A file can verify a matching local
record. It cannot create a grant, overwrite a branch, or restore a missing local
record. Missing or denied storage leaves linked play unavailable.

The linked Night Walker journal lists eligible checkpoint follow-ups as awaiting
content. These include Felicia's rooftop signal and Hangar Three preparation,
K's memory and boundary, Waldo's companion and recovery scenes, and Iona's
coordination, ledger, and branch-specific Low Quarter follow-ups. There is no
launch action for these entries. Iona remains undiscovered until the native game
has an authored player-facing arrest disclosure. The current native publisher
has no such mapping. The browser has one native profile slot, so the link isolates
profile IDs without adding a profile-selection screen. Alternate campaign replay
is available through the separate standalone preview.

The native consumer expects the portfolio's GitHub Pages path on the same
origin. The browser harness mounts both sites at their Pages paths without
deploying. A different production origin requires a different transport.

From the portfolio checkout, run:

```sh
node --test scripts/see-world*.test.mjs
node scripts/see-world-native-bridge.mjs ../techops-hero
python scripts/see-world-linked-browser.py ../techops-hero
```

The Node bridge harness runs the actual reducers, publisher, replay and Night
validation with fixture storage and a simulated profile write. The Chromium
harness exercises both actual browser apps. It seeds prerequisites up to the
rooftop, uses the authored reveal and See World choice controls, then checks the
Night Walker journal and native save lifecycle. Browser launch and completion
of a new destination remain separate acceptance requirements.
