# TechOps Hero Revision E — website publication gate

## Source identity

- Author: Mike Olivares
- Intended release source: `TechOps-Hero-Revision-E-Annotation-Update-312-Pages.pdf` (latest November 7, 2026 digital review)
- Size: 96,921,010 bytes
- Pages: 312
- Expected SHA-256: `392b3f6d0ae3e021c2560ed21c53b7c3ace85cb96b0fe20410afec6e2b7884fc`
- Status: digital review candidate; creator approval, full-book final read, and print preflight remain outstanding. Do not label certified.

## Publication target

Place the complete PDF bytes at:

`public/techops-comic/TechOps-Hero-Revision-E-Annotation-Update-312-Pages.pdf`

The existing `src/pages/TechOpsComic.tsx` legacy illustrated reader remains unchanged and continues to work. It only exposes the **Complete 312-page Rev. E review** link if the public PDF responds to HTTP HEAD with a 2xx status and PDF Content-Type. Do not link to an absent asset or a signed-in ChatGPT Library URL on a public site.

## Required verification before merging/publishing

1. Confirm the file is byte-complete: SHA-256 above and exactly 312 PDF pages.
2. Confirm all 47 links and 30 bookmarks still work in the file; inspect all 14 revised pages.
3. Verify public GitHub Pages URL serves PDF bytes, with the expected Content-Type and no authentication requirement.
4. Verify desktop and mobile navigation and the PDF link, alongside existing old-reader pages, volume V, See World, and K Terminal.
5. Verify build and GitHub Actions are green. Do not merge without the PDF asset.

The PDF is currently in the owner's ChatGPT Library. The current GitHub connector cannot stream a binary file from that Library source into repository contents. This branch prepares an honest, guarded public link but does **not** contain the PDF.
