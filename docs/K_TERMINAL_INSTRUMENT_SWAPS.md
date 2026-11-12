# K Terminal instrument swaps

K Terminal can now swap Waldo to a mixing board, Felicia to violin, piano or synthesizer, and add Mike on bass. Each role has its own actual playing animation. These are visual stage assignments, not recording credits or changes to story canon.

## Artwork and timing

`public/assets/techops-band-instruments-v1.webp` contains 30 generated poses: six 229px-wide columns and five performance strips in a 1374 x 1145 image. The measured vertical bounds are 0–229, 229–448, 448–672, 672–896 and 896–1145 pixels. Each strip preserves its native aspect ratio; these bounds remove neighboring-row pixels without clipping Mike’s hair. The WebP is a lossless encoding of the generated PNG; no frame was stretched, repainted or substituted from the dance atlas. The existing K/guitar, Iona/drums and dance sprites retain their original asset.

| Row | Character / instrument | Motion | Beats per loop |
| --- | --- | --- | --- |
| 0 | Waldo / mixing board | Fader, knob and cue-pad gestures; head nod | 2 |
| 1 | Felicia / violin | Bow strokes and fingering | 2 |
| 2 | Felicia / piano | Seated keyboard/wrist motion | 2 |
| 3 | Felicia / synthesizer | Keys and control gesture on an X-stand synth | 2 |
| 4 | Mike / bass | Plucking, fretting and head nod | 1 |

The shared playback clock drives all clips with per-song BPM and offset, pause, seek and playback-rate support. Reduced motion uses the first pose. BPM is still a manual setting: the public metadata checked for this change supplied no tempo, so the 120 BPM default remains explicitly labeled a preview tempo.

## Song arrangements

Nine exact SoundCloud URLs automatically select Waldo's mixing board, based on the artist's public electronic, trip-hop or drum-and-bass genre/tags retrieved on 2026-11-12. The bounded metadata snapshot is in `docs/band-song-metadata.json`.

- Ghost town
- MOTORCELL
- BLACK
- Wake up and die B ft OZ
- Urim and Thummim
- Maybe
- Winter
- WINTER 2.mp3
- I see the dead

No particular keyboard, violin or physical bass-guitar part is asserted from those genre labels. In particular, “Drum & Bass” does not automatically put Mike on bass. Unknown arrangements retain the existing ensemble. “Band arrangement” lets the listener pick Waldo's role, Felicia's instrument and Mike's bass; choices are saved per exact song URL on that device. A curated profile may declare Felicia's lead when several instruments are present.

## Reference and visual review

Original reference pixels were retrieved and visually inspected: the creator's original Mike/Felicia visual-bible sheet, original Waldo face photograph, creator-supplied cast/wardrobe screenshot, and existing band atlas for pixel-art treatment. The old generated sprite's hair was not used as Waldo's identity source. Waldo is unmasked, Mike has tied locs/dark sunglasses/beard, and Felicia has long curls and black/gold clothes.

The initial native local-path invocation failed before rendering because the image tool did not accept Windows absolute paths. The successful invocation used four immediately displayed reference image blocks. The local-file preflight therefore is **not** claimed as validation of the successful invocation. The actual prompt, reference order, timestamps and generated original are retained in the task evidence. No new creator likeness approval or independent art certification is claimed.

Visual inspection confirmed the five instrument rows, distinct characters, instrument/hand contact and close first/last poses. Actual desktop and 320px browser renders were inspected. The five-member stage wraps to three columns on small screens. The original photo and private reference screenshots are not included in this repository.

Generated PNG SHA-256: `a40a5e1aace84c086ad1dc6b3c01d22364d429fae68763838b37980be7beeda6`.

Lossless WebP SHA-256: `5d2b5d1cb8119b2e342cd9ce783f4617257abd6a3b13c6a8c9728dcc1a7bea8c`.

## Verification

- Sixteen local tests: selection/fallbacks, persisted input validation, timing, actual React components, real instrument registrations, electronic auto-selection and finite sprite geometry.
- Focused strict TypeScript check passed.
- Eight Chromium browser scenarios passed with actual components and both production atlases: automatic selection, all Felicia choices, playing/paused frames, paused seek, per-song isolation and reload, 320px layout, reduced motion, and image decoding/no browser errors.
- Browser harness uses locally fulfilled requests and a controlled playback clock. It does not certify full SoundCloud end-to-end playback or physical mobile devices.

Run the logic/render tests with `node --test tests/band-timing.test.mjs tests/band-performance.test.mjs tests/band-stage-render.test.mjs`. The PR workflow runs those alongside the existing shared-audio contracts and complete TypeScript/Vite/image-decoding checks.

For the browser harness, install Playwright and its Chromium browser in the development environment, then run `node scripts/check-band-browser.cjs`. `NODE_PATH` can point to an existing dependency installation. Screenshots and results are written under `qa/band-browser`.
