# Publishing the TechOps Hero comic

Recorded 2026-11-08 (America/New_York). These are deployment locators and operating steps, not automatic canon or likeness approval. Inspect the current repository before each release.

## Correct destination

- Comic reader: https://ninja-ops-guy.github.io/theemrld-portfolio/#/comic
- Source repository: https://github.com/ninja-ops-guy/theemrld-portfolio
- Production branch: main.
- GitHub Pages workflow: .github/workflows/pages.yml, named Deploy portfolio to GitHub Pages. A push to main builds with npm and deploys dist.
- The user supplied this exact comic URL. The separate ninja-ops-guy/techops-hero repository hosts the game; it is not the comic publishing destination. Production Atlas and Branching Story Sites are separate production tools.
- Direct Revision F page links must include the edition: #/comic?edition=f&page=120. A bare page query can select the legacy edition.

## Source and assets

- Reader component: src/pages/TechOpsComic.tsx.
- Page/section/hotspot manifest: src/data/comic-revision-f.json. Revision F currently has 315 pages, twelve volumes, an Iona interlude, 47 PDF links and 30 bookmarks. Preserve these unless the requested edit changes them.
- Reader artwork: public/techops-comic/revision-f/001.webp through 315.webp, 2160 x 3240 (2:3), exported from the corrected master at 360 dpi.
- Public PDF path: public/techops-comic/TechOps-Hero-Revision-F-Final-Annotations-315-Pages.pdf.
- Render helper: scripts/render-revision-f.py (PyMuPDF and Pillow); it checks the current receipt's SHA-256. Build the PDF first. High-resolution WebP settings are quality 92, method 4, with a PyMuPDF Matrix(5, 5) or Poppler at 360 dpi. Do not overwrite high-resolution pages with the earlier 1080 x 1620 exports. Preserve the reader's existing logical cover-crop and hotspot coordinate systems; source-image resolution and layout coordinates serve different purposes.
- For a bounded repair, replace only the affected page artwork and preserve all other page files and navigation data.

## Large PDF storage

The November 8 corrected v2 PDF is 133,222,088 bytes, SHA-256 badf8bb6d4b68f2739ffcd00cf95d46f84fdf5a17f036eca8ef3aedc4eefbb6f. It is preserved byte-for-byte, without recompression.

- Git tracks print-source/revision-f.part0 and revision-f.part1, split at 75,000,000 bytes. Keep every tracked part below GitHub's 100 MiB file limit. A future master may need a different number of parts.
- docs/COMIC_ANNOTATIONS_V2_VERIFICATION.json owns the ordered parts list, master byte count and SHA-256, corrected pages and page-image hashes. Inspect/update the current receipt rather than assuming this old fingerprint applies to a new revision.
- scripts/assemble-revision-f.mjs concatenates those parts, checks length and SHA-256, and writes the public PDF at its stable download path. package.json runs this from prebuild and predev alongside the existing Volume V assembler.
- The assembled PDF is ignored by Git. Do not accidentally commit an oversized master or use a Git LFS pointer as the public download. The workflow publishes the assembled file in dist.
- For the next master, update all parts and receipt together. Confirm the assembled PDF hash matches the reviewed master exactly.

## Publish and verify

1. Confirm the user's requested scope and publication authorization; an explicit instruction to put the corrected edition on this live site authorizes the routine update. Preserve audience, repository identity and unrelated portfolio/game features.
2. Inspect current main, relevant repository instructions, the reader component, receipt and Pages workflow. Use an isolated checkout and check for concurrent changes before pushing. Never force-push over unrelated work.
3. Prepare the actual corrected PDF and page images, inspect them with adjacent reference panels, and verify page count, geometry, text, links and bookmarks. The November 8 v2 edits affect PDF pages 118, 120, 132 and 136; these are PDF indices, not printed folios (118 = Iona folio 33, 120 = 35, 132 = 47).
4. Update the master parts, receipt, affected WebP files and revisionFArtRevision in TechOpsComic.tsx. Both reader images and the PDF URL carry that revision query so returning visitors receive the new assets. Preserve the canonical PDF path and edition-aware reader links.
5. Install existing dependencies and run npm run build with GITHUB_ACTIONS=true so Vite builds with /theemrld-portfolio/ as its base. Verify dist contains the exact PDF and all 315 Revision F page images at 2160 x 3240; inspect the diff for unrelated changes.
6. Commit the complete coherent change and push to main only when the user has requested publication. Wait for the Pages workflow for that exact commit to finish successfully; a successful push alone is not a live release.
7. Fetch the public site and its current JavaScript bundle. Confirm the new revision token, successful PDF content type and expected byte count. Download/hash the served PDF and all changed page assets against the local receipt, checking decoded image dimensions as well. For a collection-wide resolution upgrade, verify all 315 images. Inspect the deployed reader when browser tools are available, including page navigation and the PDF link. Distinguish HTTP/hash verification from browser interaction if browser access is unavailable.
8. Record the deployed commit, workflow URL/conclusion and public asset checks. Report the live comic link and any real limitation. Do not claim browser checks that did not run.

## Access and repair lessons

- Prefer the connected GitHub tools for repository discovery/reads. They support text-file edits but do not upload local binary PDF/WebP files; the authenticated Git CLI is suitable for the complete asset commit.
- A restricted-network DNS error can make gh auth status misleading. When the environment permits an approved network retry, test connectivity with the existing sign-in before asking the user to reconnect. Never print, persist, copy into a skill, or place GitHub credentials in a remote URL.
- If GitHub rejects an unpublished commit with GH007, use the owner's verified GitHub noreply identity from repository history for that commit's author and committer, then retry. Do not weaken email privacy settings or alter published history.
- PDF annotations can be scoped to one panel even when the page's other panels are accepted. Preserve character face, hair, uniform and prop continuity against neighboring panels; inspect hands, thumb side and grip after an anatomy edit.
- The source PDF reuses content streams between unrelated pages. Before merging an overlay, detach the target page's Contents stream and clone its resource dictionaries. Otherwise a local edit can propagate to unrelated pages. Compare content and image resources for every supposedly untouched page, then render the changed pages.
- Preserve the unmodified source and the reviewed master. Publishing/export work must not silently introduce a new visual revision. Export high-resolution reader images directly from the reviewed PDF, never by enlarging the previous small WebP files; resolution does not create detail missing from source art.
