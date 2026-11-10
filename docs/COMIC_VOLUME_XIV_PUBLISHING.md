# Volume XIV publication receipt (staging)

User authorized website publication on November 10, 2026. **This branch does not yet contain the 133 illustrated WebP files or the three PDF binary parts. Do not merge or describe it as deployed until those files are uploaded and verified.**

- Source PDF: `TechOps-Hero-Volume-XIV-The-System-Is-Healthy.pdf`; 133 pages; 181,907,121 bytes.
- SHA-256: `97f16edf9df072863bb7af69d7b52e0ffee77fef6ace7e64936facff5cdcbfae`.
- Binary parts: 75,000,000 + 75,000,000 + 31,907,121 bytes; paths in `docs/COMIC_VOLUME_XIV_RELEASE.json`.
- Web art: `public/techops-comic/volume-xiv/001.webp`–`133.webp`; 2160×3330, WebP quality 88; render directly from the corrected PDF.
- Before release, copy all 133 WebPs and all three parts into this branch. Compare each file hash against the local full `COMIC_VOLUME_XIV_RELEASE.json` QA manifest; inspect cover, chapter boundaries and the three confirmed correction scenes. Run `node scripts/assemble-volume-xiv.mjs`, `npm run build`, and validate the output PDF hash and every reader image. Extend `prebuild` to invoke `node scripts/assemble-volume-xiv.mjs` only after parts are present.
- Preserve the released 316-page Revision F (and approved Revision G work when independently production-ready), 40-page Volume XIII and all older URLs. Do not merge unrelated draft PRs while publishing XIV.
- Publish on `main` via `.github/workflows/pages.yml` only after the full assets are present. Confirm the exact commit's Pages workflow, live PDF length and hash, first and last image, and phone reader.

The corrected master was inspected on November 10, 2026. It includes the document-orientation repair (CH37-P04/08), Earth removal (CH39-P06) and the final label pass (CH37-P19, CH40-P14/20). Creator review remains open for the small K-likeness note, rather than asserting approval.
