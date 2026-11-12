# Guided comic soundtrack

The guided soundtrack maps individual @raikouno songs to **reader page ranges in a named comic edition**. See the [cue sheet](TECHOPS_GUIDED_SCORE.md) for the scenes, lyric references and SoundCloud artwork behind the published score.

## Define a cue

Open the soundtrack editor through `guided edit`. Choose the edition, the first and last page, the song title, and its individual SoundCloud track URL. Page ranges include covers and use the page numbers shown by the website, not printed folios. A single-page cue has the same first and last page.

The editor saves a draft on the current device. **Preview this score** applies a local preview through the host callback; it does not publish a soundtrack for other visitors. Enable guided mode in the comic to listen. Import and export controls accept the same JSON format used by the published file.

To publish a reviewed score, replace `public/k-world/guided-cues.json` with its exported JSON, validate it, and use the normal repository deployment workflow. A visitor cannot overwrite the public score from the browser.

## Edition binding

The score contains `schemaVersion: 1`, an `editions` mapping, and a `cues` array. Every cue has `id`, `edition`, `startPage`, `endPage`, `title`, and `url` fields. IDs must be unique. Ranges in the same edition cannot overlap; adjacent ranges are valid.

| Edition ID | Edition | Revision stamp | Pages |
| --- | --- | --- | ---: |
| `g` | Full collection, Volumes I–XII and Iona interlude | `corrected-c18407af88e9` | 316 |
| `xiii-r` | Volume XIII · Revised | `corrected-85c2fbd8c80b` | 49 |
| `xiv` | Volume XIV | `corrected-97f16edf9df0` | 133 |
| `f` | Revision F, Volumes I–XII | `continuity-hq-46943e14` | 316 |
| `xiii` | Volume XIII | `reviewed-1c74863c` | 40 |
| `legacy` | Legacy collection, Volumes I–V | `11.2` | 161 |

The score stamp must match the reader’s current revision. If the comic is reordered or republished under a new revision, old cues stay silent until their page ranges are reviewed and the stamp is deliberately updated. Update `GUIDED_EDITIONS` together with the reader when an edition changes. The source consistency test catches drift between the current registry and the reader.

Only individual HTTPS SoundCloud track URLs owned by `raikouno` are accepted. Playlist/profile links, other accounts, credentials in URLs, foreign hosts and overlapping cues are rejected. Import validates the entire file before replacing the draft.

## Playback integration contract

`public/k-world/guided.js` is a pure definition and lookup module. It exports:

- `emptyGuidedScore()` for a new, unassigned score with current edition stamps.
- `validateGuidedScore(input)` and `parseGuidedScore(text)`, returning a clean score or throwing an explanatory error.
- `resolveGuidedCue(score, { edition, page, revision })`, returning the cue for the visible page or `null`.
- `cueKey(cue)`, a stable identity throughout a cue’s range.

The host resolves the visible page after jumps and backwards navigation. Turning pages inside a cue keeps its current play position. On ordinary forward turns, `minimumPlayMs: 30000` lets a cue reach 30 seconds before handing off to the visible scene. The score's explicit quiet page before the explosion takes effect immediately. A track that reaches its natural end stops. The host owns the audio player, gesture handling and pause state.

`GuidedScoreDialog` takes `open`, `onClose`, `onApply(score)`, an optional `initialScore`, and an optional `onUsePublished()` callback. The editor calls `onApply` only with a validated score. `onUsePublished` lets the host stop using a local preview without erasing the saved draft. The host decides when to enter guided mode. The editor stops keyboard propagation and uses a native modal dialog to preserve normal focus and Escape behavior. Runtime helpers load from the public module through a Vite-ignored dynamic import; the `.d.ts` file supplies static types.

## Validation

Run `node --test tests/k-world-guided.test.mjs tests/k-world-guided-playback.test.mjs` to check edition binding, cue boundaries, page navigation, the 30-second minimum, intentional silence and playback state.

