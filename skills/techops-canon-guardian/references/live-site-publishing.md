# Publishing the TechOps Hero comic

Recorded 2026-11-08 (America/New_York). These are publishing locators and operating steps, not automatic canon or likeness approval. Inspect the current repository before each release.

## Correct destination

- Comic reader: https://ninja-ops-guy.github.io/theemrld-portfolio/#/comic
- Source repository: https://github.com/ninja-ops-guy/theemrld-portfolio
- Production branch: main.
- GitHub Pages workflow: .github/workflows/pages.yml, named Deploy portfolio to GitHub Pages. A push to main builds with npm and deploys dist.
- The user supplied this exact comic URL. The separate ninja-ops-guy/techops-hero repository hosts the game; it is not the comic publishing destination. Production Atlas and Branching Story Sites are separate production tools.
- Direct Revision F page links must include the edition: #/comic?edition=f&page=34. A bare page query can select the legacy edition.

## Source and assets

- Reader component: src/pages/TechOpsComic.tsx.
- Current release receipt: docs/COMIC_CURRENT_RELEASE.json. Read it for current page count, PDF path, ordered parts, hashes, links, bookmarks, and reader revision. Historical receipts are evidence of earlier releases only.
- Page/section/hotspot manifest: src/data/comic-revision-f.json. The Waldo continuity edition has 316 pages, twelve volumes, an Iona interlude, 47 PDF links and 31 bookmarks.
- Reader artwork: public/techops-comic/revision-f/001.webp through 316.webp, 2160 x 3240 (2:3), exported directly from the corrected master at 360 dpi.
- Public PDF path: public/techops-comic/TechOps-Hero-Revision-F-Complete.pdf. The page count is deliberately absent from this stable name.
- Render helper: scripts/render-revision-f.py (PyMuPDF and Pillow); it checks the current receipt's SHA-256. Build the PDF first. WebP settings are quality 92, method 4, with a PyMuPDF Matrix(5, 5) or Poppler at 360 dpi. Do not overwrite high-resolution pages with the earlier 1080 x 1620 exports. Preserve the reader's logical cover-crop and hotspot coordinate systems; source-image resolution and layout coordinates serve different purposes.
- For a bounded repair, replace only affected artwork and preserve other page files and navigation data. Export dimensions do not establish native source detail. The new Waldo scene's native generated art is 1024 x 1536; its reader export is 2160 x 3240. Do not describe enlargement as newly recovered detail.

## Current edition and large PDF storage

The November 8 continuity-reviewed master is 151,835,204 bytes, SHA-256 46943e144014e61b6b556b13722b8d9548b59a17d066c3ade066f9c735282733. The reader revision is continuity-hq-46943e14. The build preserves the master byte-for-byte without recompression. Always re-read docs/COMIC_CURRENT_RELEASE.json for later releases; these values are a dated snapshot.

The preceding Waldo continuity master was SHA-256 939b90bb8f597fc1601ad90ea02f33cad59dd6bb95a48ac652055b130525ce48. The reviewed edition retains that scene and earlier annotation repairs, and corrects K's gloves (PDF page 29 top panel), the Director's hair (128 bottom), and Mara's locs (138 bottom). See docs/COMIC_CONTINUITY_REVIEW.md and docs/COMIC_CONTINUITY_VERIFICATION.json.

- Added PDF/web page 34, printed folio 31A, titled Before the Knock: Waldo visibly removes his mask, then shaves, immediately before K meets Mike and Felicia. The existing reunion moved from page 34 to 35.
- The creator clarified that no mask-removal scene existed yet. The current page 34 explicitly depicts removing the mask in its top panel. The earlier version began with the mask already off; that staging is superseded. This revision keeps 316 pages and all navigation positions unchanged.
- Earlier approved-scope annotation repairs moved from PDF pages 118, 120, 132, 136 to 119, 121, 133, 137. Printed folios remain unchanged. Do not confuse PDF position with printed folio.
- The preceding 315-page v2 master SHA-256 was badf8bb6d4b68f2739ffcd00cf95d46f84fdf5a17f036eca8ef3aedc4eefbb6f. docs/COMIC_ANNOTATIONS_V2_VERIFICATION.json remains historical.
- Git tracks print-source/revision-f.part0, revision-f.part1 and revision-f.part2, split at 75,000,000 bytes. Keep every tracked part below GitHub's 100 MiB file limit. Future masters may require a different number of parts.
- scripts/assemble-revision-f.mjs reads the current receipt, concatenates the parts, checks length and SHA-256, and writes the public PDF. package.json runs it from prebuild and predev alongside the existing Volume V assembler.
- The assembled PDF is ignored by Git. Do not commit an oversized master or publish a Git LFS pointer as the download. The workflow publishes the assembled file in dist.
- Update parts and receipt together, and confirm the assembled PDF hash matches the reviewed master exactly.

## Inserting a scene

- Follow the creator's actual continuity direction and use neighboring panels as visual references. For Waldo, match his face, short swept dark hair, leather jacket, silver chain and shorter reunion beard. Keep him distinct from K, Mike and Felicia. Generated art is not automatically creator-approved likeness.
- Insert the page at the correct story position without replacing accepted adjacent panels. Retain existing printed folios where practical; page 34 uses 31A.
- Update numbered index text, PDF outline destinations, internal link targets, manifest sections/scenes/hotspots, cover keys, image filenames, page count, download label and reader descriptions together. Validate destinations and page order, not just counts.
- Migrate stored reading positions: the Waldo release uses techops-hero:revision-f:waldo-continuity:page. A valid old techops-hero:revision-f:page value of 34 or later shifts by one; earlier values stay unchanged. Explicit new page links address the new numbering.
- Compare every untouched page's content and image resources with its mapped original. Re-render edited guide pages as well as new artwork.

## Publish and verify

1. Confirm the requested scope and publication authorization. An explicit instruction to put the corrected edition on this live site authorizes the routine update. Preserve audience, repository identity and unrelated portfolio/game features.
2. Inspect current main, repository instructions, reader component, receipt and Pages workflow. Use an isolated checkout and check for concurrent changes before pushing. Never force-push over unrelated work.
3. Prepare the corrected PDF and images, inspect them with adjacent reference panels, and verify count, geometry, text, links, bookmarks and untouched pages.
4. Update master parts, receipt, affected WebP files and revisionFArtRevision in TechOpsComic.tsx. Reader images and PDF URL carry that revision query so returning visitors receive the new assets. Preserve edition-aware links.
5. Run npm run build with GITHUB_ACTIONS=true so Vite builds with /theemrld-portfolio/ as its base. Verify dist contains the exact PDF and the receipt's full page set at 2160 x 3240. Remove obsolete generated PDF downloads from the build, and check the final deployment size against the host's current limit.
6. Commit the coherent change and push main when publication is authorized. Wait for the Pages workflow for that exact commit to succeed; a successful push alone is not a live release.
7. Fetch the public site and current JavaScript bundle. Confirm the revision token, PDF content type and byte count. Download/hash the served PDF and changed images against the receipt, checking decoded dimensions. After collection-wide export or renumbering, verify every image (316 in this edition). Inspect reader navigation and PDF download in a browser when available. Distinguish HTTP/hash verification from browser interaction.
8. Record deployed commit, workflow URL/conclusion and public asset checks. Report the live link and real limitations. Do not claim checks that did not run.

## Access and repair lessons

- Prefer connected GitHub tools for repository discovery/reads. They do not upload local binary PDF/WebP files; the authenticated Git CLI is suitable for the complete asset commit.
- Restricted-network DNS errors can make gh auth status misleading. When an approved network retry is available, test existing sign-in connectivity before asking the user to reconnect. Never print, persist, put in a skill, or embed GitHub credentials in remote URLs.
- If GitHub rejects an unpublished commit with GH007, use the owner's verified GitHub noreply identity from repository history for that commit's author and committer, then retry. Do not weaken email privacy settings or alter published history.
- Anatomy annotations can concern one panel while the others are accepted. Preserve face, hair, uniform and props against neighboring panels; inspect hands, thumb side and grip after editing.
- The source PDF reuses content streams between unrelated pages. Before overlays or index-text edits, detach target Contents and clone resources. Otherwise local edits can propagate. Compare content and image resources across every supposedly untouched page.
- Preserve the unmodified source and reviewed master. Export high-resolution reader images from that PDF, never from the older small WebP files.

## Collection review and concurrent editions

- Record broad screening separately from detailed inspection. The 316-page November 8 review screened every page at 800 x 1200 and inspected flagged areas and relevant neighbors at full reader resolution. It did not certify all likenesses against a complete approved model-sheet set; its comprehensive likeness verdict remains PROVISIONAL.
- Do not repair an apparent extra finger until inspecting occlusion, foreshortening and ownership across overlapping hands. Do not normalize Red/K hair across distinct memory, intake or transformation states without timeline evidence.
- Use actual neighboring artwork for bounded continuity repairs, with source hashes and explicit approval provenance. Uncertain mask geometry remains uncertain without a definitive approved reference.
- Check generated details after PDF placement at both full size and mobile size. Reject visible patch seams or shifted anatomy. If a tiny patch cannot blend cleanly, edit the single affected panel, inspect all faces, hands, props and lettering, and preserve the remaining panels. Do not describe a regenerated panel as pixel-identical outside the requested correction.
- Keep native generated dimensions in the release evidence; 2160 x 3240 reader exports do not create native detail. Reviewed panel source sizes were 1512 x 1040 (page 29), 1300 x 1209 (128), and 1479 x 1064 (138).
- Volume XIII is a separate 40-page edition, published concurrently in commit 53ec7b0. Preserve it when updating Revision F. Its route is #/comic?edition=xiii&page=1; its receipt is docs/COMIC_VOLUME_XIII_RELEASE.json and its assets are public/techops-comic/volume-xiii/. The 316-page review does not cover those 40 additional pages. Check current main for newer editions before release and retain unrelated publication changes.
