# Volume XIV publication receipt (staging)

User authorized website publication on November 10, 2026. **This branch does not yet contain the 133 illustrated WebP files or the three PDF binary parts. Do not merge or describe it as deployed until those files are uploaded and verified.**

- Source PDF: `TechOps-Hero-Volume-XIV-The-System-Is-Healthy.pdf`; 133 pages; 181,907,121 bytes.
- SHA-256: `97f16edf9df072863bb7af69d7b52e0ffee77fef6ace7e64936facff5cdcbfae`.
- Binary parts: 75,000,000 + 75,000,000 + 31,907,121 bytes; paths in `docs/COMIC_VOLUME_XIV_RELEASE.json`.
- Web art: `public/techops-comic/volume-xiv/001.webp`–`133.webp`; 2160×3330, WebP quality 75; render directly from the corrected PDF.
- Before release, copy all 133 WebPs and all three parts into this branch. Compare each file hash against the local full `COMIC_VOLUME_XIV_RELEASE.json` QA manifest; inspect cover, chapter boundaries and the three confirmed correction scenes. Run `node scripts/assemble-volume-xiv.mjs`, `npm run build`, and validate the output PDF hash and every reader image. Extend `prebuild` to invoke `node scripts/assemble-volume-xiv.mjs` only after parts are present.
- Preserve the released 316-page Revision F (and approved Revision G work when independently production-ready), 40-page Volume XIII and all older URLs. Do not merge unrelated draft PRs while publishing XIV.
- Publish on `main` via `.github/workflows/pages.yml` only after the full assets are present. Confirm the exact commit's Pages workflow, live PDF length and hash, first and last image, and phone reader.

The corrected master was inspected on November 10, 2026. It includes the document-orientation repair (CH37-P04/08), Earth removal (CH39-P06) and the final label pass (CH37-P19, CH40-P14/20). Creator review remains open for the small K-likeness note, rather than asserting approval.

## GitHub Pages site-size safety (November 10 recheck)

The main tree's tracked `public/` files total 742,010,250 bytes. The Revision F and Volume V master PDF assemblers add another 166,621,572 bytes, so the pre-XIV deployed payload is ~908,631,822 bytes before Vite-generated code. Simply adding the original XIV images (169,438,986 bytes) and its 181,907,121-byte PDF would take the site to ~1,259,977,929 bytes, above GitHub Pages' 1GB published-site limit. This is an independent blocker beyond uploading media.

The corrected XIV PDF remains byte-exact. Its 133 browser WebPs have been re-rendered **directly from that corrected PDF** at the same 2160×3330 resolution, WebP quality 75, totaling **97,628,296 bytes**, with per-page integrity hashes recorded in the full local release kit. The same visual repairs and page sequence are retained.

The Pages build can exclude three superseded, unlinked historical PDFs **from the deploy artifact only** (not from source control): `TechOps-Hero-Revision-11.pdf`, `TechOps-Hero-Revision-11.1.pdf`, and `TechOps-Hero-Revision-F-Annotation-Update-315-Pages.pdf`. The active Revision 11.2 PDF, current 316-page Revision F and Volume XIII assets remain accessible. These archived assets remain in GitHub history but their previous direct Pages URLs would cease to work; review any external direct links before release.

Estimated deployed size after those exclusions and XIV Q75 art: **972,062,141 bytes** plus generated app assets; workflow must hard-fail if deployed dist exceeds **1,000,000,000 bytes**. Preserve a future CDN/media-offload plan because margin remains limited. Do not merge before the binary source parts and 133 web pages are pushed and release build passes.
