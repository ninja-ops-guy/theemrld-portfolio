# K Terminal instrument swaps — implementation draft

The requested mapping is Waldo on a mixing board for electronic tracks; Felicia on violin, piano or synthesizer; Mike on bass. K and Iona retain their existing stage roles. These are K Terminal performance assignments, not changes to recording credits or story canon.

## Implemented

- Per-song, device-local arrangement overrides, isolated by the exact track URL.
- Curated instrumentation profiles keyed by track URL. Unknown songs keep the existing ensemble; titles and visualizer amplitude do not count as instrument evidence.
- A single Felicia lead can be chosen when a song has multiple keyboard/string instruments. No duplicate Felicia performers or guessed priority.
- Separate clip geometry and beat counts for each performance; all use the existing playback clock, BPM, offset, seek, pause and reduced-motion behavior.
- Five-member stage when Mike's bass performance is available.
- Instrument choices are enabled only for registered clips. With no new clips registered, the arrangement UI stays hidden and the current ensemble remains unchanged.

## Blocking assets — not generated or approved

| Clip ID | Character / instrument | Required motion |
| --- | --- | --- |
| `waldo-mixing` | Waldo / mixing board | Fader hand, knob adjustment, cue tap and restrained beat nod; hands stay on the controls. |
| `felicia-violin` | Felicia / violin | Alternating bow strokes, left-hand fingering, small body sway; violin stays at the shoulder. |
| `felicia-piano` | Felicia / piano | Both hands on the keys, independent finger/wrist motion and seated body sway. |
| `felicia-synth` | Felicia / synthesizer | Key presses plus a modulation/control gesture; keep the instrument visually distinct from piano. |
| `mike-bass` | Mike / bass guitar | Plucking hand and fretting hand, restrained beat nod; preserve Mike's own identity and approved design. |

Prefer twelve evenly registered poses over two beats per clip; actual frame counts and loop lengths are declared in `src/data/bandPerformances.ts`. Each clip must use equal square cells, a fixed camera/foot baseline and no clipped hands or instrument necks. Review the seam at the last-to-first frame and the neutral first frame used for reduced motion. Original character references must remain bound for art production; do not repurpose dance rows as instrument-playing art.

The recent band atlases and source visual-bible image were located, but the supported local download failed with `hosted apps tools/list request failed: DNS`. No reference pixels were materialized or visually inspected in this task. No new artwork was generated, and no likeness approval is claimed.

## Remaining integration and release work

1. Retrieve and inspect the original approved references, create and visually review the five instrument clips, and add their real files and geometry to `BAND_CLIPS`.
2. Verify instrumentation/BPM per song and populate `TRACK_PERFORMANCES`; no real songs are mapped in this draft. Device-local overrides are available once instrument clips exist.
3. Verify playback, track switching, persistence, pause/seek, reduced motion and five-member layouts at 320px and desktop widths in a browser with the actual artwork.
4. Run the complete repository build and relevant hosted checks. This draft has not been merged or deployed and does not deliver the finished visual swaps.

Existing PR #69 concerns the older default sprite URL and is not modified by this work. The stage's current explicit ensemble atlas is preserved.
