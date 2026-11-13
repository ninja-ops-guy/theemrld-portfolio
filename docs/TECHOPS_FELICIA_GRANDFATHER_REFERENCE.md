# Felicia's grandfather — corrected reference and published continuity audit

## Approved reference (recovered November 8, 2026)

**Source artwork:** *Felicia and Grandfather at Tea.png* (1448 × 1086).
Felicia's grandfather has gray-streaked auburn curls, a gray beard, a face with familial resemblance to Felicia, and a mustard knitted cardigan over a collared shirt. The approved image includes their shared gaze, the blue floral teapot and cups, and the notebook. This recovered artwork is the reference; do not invent another version or revert to a short gray-haired unrelated face.

## Published correction — Volume XIII, page 29, Chapter 32

- The retired illustration on the **top tea-table panel** depicted an older, unrelated-looking short-gray-haired grandfather.
- [PR #105](https://github.com/ninja-ops-guy/theemrld-portfolio/pull/105) replaced this illustration in the live reader using `public/assets/comic/volume-xiii-029-grandfather.webp` (SHA-256 `3428da2138356ed243b0a8419baed0efd4e25ad794990bea4879e359fd5c9e38`).
- [PR #107](https://github.com/ninja-ops-guy/theemrld-portfolio/pull/107) rebuilt the 49-page PDF from the original reviewed master and the same approved panel image, verifying all 49 pages' text and pixels outside the target top panel unchanged.
- [PR #108](https://github.com/ninja-ops-guy/theemrld-portfolio/pull/108) updated both active current-edition manifests to the new, content-verified [official corrected XIII PDF](https://github.com/ninja-ops-guy/theemrld-portfolio/releases/download/techops-xiii-grandfather-pdf-20261113/TechOps-Hero-Volume-XIII-The-Last-Launch-Grandfather-Corrected.pdf) (SHA-256 `d9a88cae0217cc0ece73955b96e187a93b0e33f0d0da092cea0588e14db2047d`; 66,806,862 bytes).
- Captions and dialogue remain unchanged: “Her grandfather encrypts the rehearsal time and the name of the song he wants to hear.” / “You hid the answer under the teapot.” / “And you found it.”

## Follow-up visual continuity review — November 13, 2026

**Scope:** 498 published pages: Revision G (316 pages), revised XIII (49 pages), and the **current** XIV (133 pages). The local audit rendered each page into contact sheets to look for additional grandfather appearances, then enlarged the plausible references. This is a character-specific review, **not** a general panel-by-panel anatomy certification.

| Edition | Source verified | Finding |
| --- | --- | --- |
| Revision G, Volumes I–XII, 316 pages | SHA-256 `c18407af88e9ba6dbb5ed4707fc998bd19e12d31c59b2f92b87f58d8a0bfa50b` | No separate Felicia-grandfather portrait or identifiable recurring appearance found. Other elderly characters (such as Mara) are different people. |
| Revised XIII, 49 pages | Official corrected master SHA-256 `d9a88cae0217cc0ece73955b96e187a93b0e33f0d0da092cea0588e14db2047d` | Page 29 contains the approved new grandfather face. Adjacent pages 30–32 do not present another conflicting portrait. |
| XIV, 133 pages | Current release `TechOps-Hero-Volume-XIV-Page-24-Repair-Candidate.pdf`, SHA-256 `fcb01afed21d790aeef43f7a88ff88de3b0ce3904909f18d33fb127db37e5ce8` | Pages **57** and **120** show recurring, elderly-looking hands, a knitted sleeve and a blue floral soup bowl during Felicia's family-memory echo; neither shows a grandfather face. These are compatible with the approved reference and should be retained. |

**Current XIV comparison:** The earlier November 10 PDF (`97f16edf9df072863bb7af69d7b52e0ffee77fef6ace7e64936facff5cdcbfae`) was visually compared against the current XIV master across all 133 pages. Only 13 rendered pages differ: 2, 5, 24, 33, 47, 54, 64, 90, 97, 112, 117, 119 and 133. All were reviewed side-by-side for grandfather identity; none introduces a second grandfather portrait. The underlying published WebP page blobs for **57** and **120** are *identical* between `aa8c132035a46e73fb47ee14e05e371909799d64` and `c88ae09eb1dc5decb68d6aa8a5fed60e916bf0cb`, confirming the callbacks themselves were not modified by the later XIV release.

**Publication policy:** The reader offers three separately downloadable books: Revision G (I–XII), XIII, and XIV. The 316-page “Full collection” does **not** contain Volume XIII, so no other currently published combined PDF containing XIII requires the page-29 replacement. Revisit if a new all-volumes compilation is published.

## Separate operations issue

The custom domain sporadically served HTTP 503 when requesting *retired* old PDF paths during live acceptance. That is **not** grandfather art drift or a bad official XIII PDF. Track HTTP status and edge behavior independently in [#109](https://github.com/ninja-ops-guy/theemrld-portfolio/issues/109). Retired assets still must return 404/410; a 503 must not be counted as success.

## Re-use gate

For any future panel with Felicia's grandfather, reuse the recovered November 8 reference and cross-check curly gray-streaked hair, beard, features, knit cardigan, and Felicia's appearance, plus prop and dialogue continuity. Re-audit any **new** page or new compiled edition rather than treating the November 13 review as a perpetual certification.
