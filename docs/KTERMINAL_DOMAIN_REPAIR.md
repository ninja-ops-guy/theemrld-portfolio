# K Terminal domain repair candidate

Base: a3e5499eb3205484fcc5e379c44dababe2f825fe. This branch is a review candidate, not a live release.

The custom domain was serving portfolio metadata and loading AdSense globally. This candidate identifies the root as K Terminal, retains a dedicated engineering portfolio route, removes AdSense entirely, and adds static information pages, a privacy notice, robots.txt, sitemap and 404. Hash routes remain supported. The root still defaults to the terminal on kterminal.site; the explicit portfolio route is `#/portfolio`.

## Saved state

A browser origin boundary prevents reading old github.io storage directly. An export-only page must be deployed at `https://ninja-ops-guy.github.io/techops-hero/recover-settings/`. Its source is `public/recover/legacy-export.html` (deployed as index.html), export-only.mjs, settings.mjs and site-info.css, copied byte-for-byte to the companion native PR.

Visitors open that page in their original browser, export only known reading/music settings, then preview/import at `/recover/`. Conflicts are unselected by default. Selected changes require a saved undo journal; stale previews fail, failed writes roll back, and undo refuses to overwrite subsequent edits. A downloadable pre-import journal retains exact previous bytes, including previously invalid values. Malformed/unsupported exports are rejected before writes. The old origin is never modified by the exporter.

There is no cloud sync, silent cross-origin copying, or recovery of already deleted data. Game saves, run/profile identities, milestones, See World records and Night Walker grants are deliberately excluded. Their continuity is addressed by existing paired PRs portfolio #66 / native #102, which keep the game and connected reader on github.io. Those PRs also fix the live smoke's origin and the custom-domain game shortcut. This branch avoids changing their save authority and smoke implementation.

## Soundtrack and feedback

No song assignments are invented. Empty guided mode is explicitly unavailable and cannot interrupt background music. A local score still enables it. Instagram copy-and-share is offered alongside public GitHub issues; it requires Instagram, is not anonymous on-site commenting, and sends nothing automatically. Guest public comments still require a backend/moderation design.

## Verification

- 163 Node tests passed locally after the native fixture checkout was present. The first cross-repository test attempt failed to load that missing checkout; it was not a product assertion failure.
- TypeScript/Vite build passed. Existing bundle-size/Tailwind warnings remain.
- Managed browser: terminal route/title, disabled empty Guided control, comment dialog and copy confirmation observed; no comment submitted.
- `K Terminal Domain Readiness` runs an isolated Chromium test against candidate files under synthetic production origin names. It checks export/import/undo, conflict preservation, foreign-save rejection, 390px static pages, metadata, empty-guided UI and feedback affordances. It makes no live deployment requests and uses no real saves.

## Rollout

Keep this candidate separate from `comic-review-fixes`, which also deletes old PDFs. Deploy the native export page before making recovery available to visitors. The existing #66/#102 paired-save release remains under its separate approval hold; deploy native reader first, then its portfolio routing repair. Run their public smoke after that coordinated release. Candidate/browser passes do not establish that a real returning visitor's old storage still exists.
