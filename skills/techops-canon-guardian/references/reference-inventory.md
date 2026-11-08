# Reference inventory and limits

This inventory records items located during the November 6, 2026 skill update. It is not a declaration that every item is approved or visually verified. Recheck exact file/version and creator acceptance for each production task.

## Story and page sources

- Story Bible v1.7: bundled DOCX `TechOps_Hero_Story_Bible_v1_7.docx`; source SHA256 is in `source-manifest.json`. It is the broad narrative canon baseline.
- Repository addendum: `docs/techops-hero-story-bible-addendum.md`; blob SHA `fc42a152db86b64be49eec43d819e196e5e99808`. Supplement to v1.7, limited to its clarifications.
- Comic scene descriptions: `src/data/comic-descriptions.json`; blob SHA `11c97c2b7d0cadd0d9c07c428bcd52c3ec024231`. Use to locate required beats and relative order; it is not a visual model sheet.
- Accepted comic editions located in Library: `TechOps_Hero_Collected_Volumes_1-4_Rev11.pdf` and `TechOps_Hero_All_Volumes_Rev11_Mobile.pdf`. Their existence and revisions are confirmed, but this skill update did not visually inspect every page against every reference. Re-open the actual relevant page before comparing.
- A separate Volume Five canon addendum/storyboard was located. It expressly says the storyboard is not final visually approved comic art and that actor close-ups, likeness, lettering and actual face references remain unverified. Do not treat its schematic silhouettes as an approved face model.

## Image references located

| Character/asset | Located source | Use/status |
|---|---|---|
| K / face under ascent mask | `Techops Hero: Deatheater — The First Take.png` (Library) and creator portrait referenced by the repository addendum | Candidate likeness reference. The addendum specifies dark eyes, square black frames, close curls and connected beard/moustache. Verify the actual portrait and its approval before face certification. |
| Iona | `IMG_3154.jpeg` and `IMG_3154(1).jpeg` (Library profile-sheet screenshots) | Useful visual guides for short black bowl cut and design; screenshot/profile source. Confirm exact approved original reference before final likeness judgment. |
| Mike and other cast | `IMG_3005*.jpeg`, `TechOps Hero: Neon Visual Bible.png` (Library) | Cast-sheet/visual-bible material located; some are screenshots or generated composites. Do not presume approved facial references. |
| Waldo/Oz | `IMG_3011*.jpeg`, Waldo/Oz continuity material, and Volume I Revision 11 | Useful continuity references; exact accepted face/model sheet should be verified for the current production scene. |
| Katrin and Manchez | `TechOps_Hero_Good_Dogs_Character_Corrected_Excerpt.pdf` | Corrected visual excerpt with accessory/gear notes; check actual pages for the specific use. |
| Environment/style | Prior accepted Volume I–IV pages and comic reader | Compare actual neighboring pages for location layout, palette, camera and panel continuity; do not let unapproved boards override fixed canon. |

## Gaps to keep visible

- A face description is not a pixel-exact face reference. If a character's approved full-resolution likeness image is unavailable, report `MISSING_REFERENCE` and mark likeness `NOT_VERIFIED`.
- Library search results and thumbnails establish candidate assets exist, not their approval or exact current version.
- No claim is made here that every Revision 11 page has been checked against the November 6 addendum.
- Environment details can be confirmed from accepted pages and creator direction; where no accepted establishing image exists, label new staging as `PROPOSED` and do not invent it as established canon.

## November 8 supplement — Claudia

The [Claudia addendum](../../../docs/techops-hero-claudia-addendum-2026-11-08.md) records the creator-approved `IMG_3331.jpeg`, version 0, retrieved and visually inspected on November 8. SHA-256: `81b0f03b41bc653ab8621f310b169681ac0c24ed91a0497a7d873d6b42818099`. It is an Earth likeness reference, not a full-body model sheet or fixed wardrobe. The access-controlled source and current Bible version 2 are linked there; neither binary is republished or substituted for the bundled Bible. Future users must inspect the actual image before certifying likeness; inaccessible pixels remain `MISSING_REFERENCE`.
