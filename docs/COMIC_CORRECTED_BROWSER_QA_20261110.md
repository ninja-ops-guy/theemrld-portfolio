# Corrected comic publication — independent readback and browser acceptance

Checked November 10, 2026. Creator requested publication of the latest corrected editions. This receipt does not add artwork approval or claim physical-device testing.

## Exact identities

Application implementation tested: `cae7c51634fbe15d04f1b595f61680dd47fe3a1b`.
Immutable public media: `aa8c132035a46e73fb47ee14e05e371909799d64`.
Release: `techops-corrected-20261110-c18407af-97f16edf`.

- Revision G: 316 pages, 336,208,773 bytes, SHA-256 `c18407af88e9ba6dbb5ed4707fc998bd19e12d31c59b2f92b87f58d8a0bfa50b`.
- Volume XIII revised: 49 pages, 65,854,157 bytes, SHA-256 `85c2fbd8c80b8704c884cdfe2f1771f2bbd856bbfaabde57ca855112c4580637`.
- Volume XIV: 133 pages, 181,907,121 bytes, SHA-256 `97f16edf9df072863bb7af69d7b52e0ffee77fef6ace7e64936facff5cdcbfae`.

A separate unauthenticated network environment downloaded all 498 public images and matched every byte count and SHA-256 against the pinned media receipt: 471,100,010 bytes, 498/498 PASS. It also read all three public Release PDF downloads in full, verified `%PDF-` signatures and exact hashes/lengths: 3/3 PASS. Release downloads respond HTTP 200 through GitHub's download service with `application/octet-stream`; original PDF bytes are unchanged.

## Implementation checks

30 targeted Node tests passed: corrected-release identity/sequence/hotspots/legacy routing, existing guided-score behavior, and guided playback. TypeScript compilation and Vite build passed. The complete hosted publication build retained the original PDF assemblers and protected historical PDF files; its Pages output measured 912,028,047 bytes.

The published application branch's reader, CSS, legacy wrapper, guided registry/types, and corrected-release test bytes were compared to the separately tested files and matched exactly. The publication metadata binds the actual immutable media commit and live Release tag. No preview-only placeholder URLs were committed.

## Browser acceptance

Chromium was tested in desktop (1440×1000) and mobile-sized touch (390×844) profiles, reduced-motion enabled. Both profiles passed for G316, XIII49, and XIV133: first/last images load, page selectors contain exact counts, next/previous navigation works, boundary buttons disable correctly, no page-error exceptions, and no horizontal page overflow. Explicit F, old XIII40, and page-only legacy URLs remained on the old reader. The default catalogue showed three corrected books.

Eight additional interaction checks passed: source-PDF contents hotspot with world-return parameter preservation; edition-specific bookmark restore; browser-dispatched mobile horizontal swipe; keyboard next page; enlarge/fit controls; chapter jump; deliberately failed image followed by retry recovery; all three current cover images loading. These checks were repeated against the actual public immutable image URLs after the local media check.

The XIV page-95 escape scene was visually inspected in desktop and mobile reader views: the Earth/atmospheric horizon is absent. This is a bounded correction-scene check, not a fresh artistic audit of every illustration.

## Preservation and remaining release gate

No existing PDF URLs, earlier image paths, DNS, deployment exclusions, or unrelated application/game files were changed. Newly corrected media lives outside the Pages artifact. Existing soundtrack edition stamps remain separate; no old cue is silently assigned to a new edition.

This records pre-deployment acceptance. Merge and verify the exact resulting Pages deployment and public current-editions manifest before declaring the website live. Physical iPhone Safari/Android Chrome certification and new creator approval of all illustrations are not claimed.
