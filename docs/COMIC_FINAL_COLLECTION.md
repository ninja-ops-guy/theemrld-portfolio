# Full collection — public-reader finalization

Creator direction, November 10, 2026: remove earlier versions and rename the corrected collection to **Full collection**. This supersedes the earlier instruction to keep historical reader editions and PDF downloads available on the public website.

## Public reading order

- Full collection — Volumes I–XII, 316 pages.
- Volume XIII — The Last Launch, 49 pages.
- Volume XIV — The System Is Healthy, 133 pages.

The 498 current images and three original PDF masters are unchanged. Content hashes, immutable media commit, current edition IDs and saved current-book positions remain intact. The full collection label describes the existing I–XII collected book; XIII and XIV remain separate current books, not older editions.

## Removal scope

The public reader has no legacy renderer or earlier-edition link. Retired reader URLs redirect to a current book's contents instead of pretending that old page numbers map exactly. Old XIII redirects to current XIII. Other retired/page-only routes go to Full collection. The `from=world` return context is retained.

The Pages artifact excludes older collection PDFs, legacy numbered comic pages, Revision F art, the old 40-page XIII art, and old Volume V numbered pages/downloads. Shared introduction, dock and cover artwork remains. Git history and separately stored historical GitHub release assets are not deleted; this change removes superseded editions from the website, not archival source history.

The public labels live in `src/data/comic-display-labels.json`. Technical source receipts retain revision names for provenance; those names are not reader-facing edition choices.

## Release acceptance

Run the corrected-source tests, finalization tests, TypeScript/Vite build, current-only deployment cleanup, browser navigation checks and exact-commit Pages readback. Confirm the public manifest's commit, Full collection label, 316/49/133 counts, and HTTP 404/410 for retired website assets. Do not infer visual/print certification of all drawings from this navigation and publication cleanup.
