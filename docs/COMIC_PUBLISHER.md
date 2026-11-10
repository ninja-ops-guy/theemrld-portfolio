# TechOps Publisher

The publisher executes in GitHub Actions, not in a chat session. The registered release manifest is the source of truth. It preserves the exact PDF and page bytes, stages only declared files, explicitly qualifies the staged commit, merges only that qualified tree after a fresh owner publication request, explicitly dispatches Pages, and verifies the live commit and every declared file.

## For Mike

After a release's approved source ZIP is in its GitHub source release, ask **“Publish Volume XIV”**, **“Publish [registered volume/revision]”**, or **“Check publishing status.”** The TechOps Publisher skill reads saved state and submits one small request. It does not rebuild the comic, reopen a new publishing PR, or move hundreds of megabytes through a tool response.

An asset that exists only in ChatGPT still needs one authorized transfer. The current GitHub chat connector has no binary release-upload action. The skill must say so directly, not manufacture a link, authentication, or successful transfer. Two supported transfers:

* Browser: attach the prepared ZIP to the draft source release, then publish that source prerelease to auto-stage it. Source publication does **not** approve a website merge.
* Computer with GitHub CLI: `python scripts/upload-comic.py /path/to/approved.zip --release xiv-corrected-20261110 --publish`. This uses `gh auth login` once, verifies upload readback, and explicitly dispatches the publisher. Never paste credentials into chat. Omit `--publish` to stage only.

Source slots can be created through **Actions → Comic Publisher → Run workflow → prepare**, or by a small saved request with `action: prepare`. No additional storage provider or paid account is required by this implementation.

## Saved release and request

Manifests live in `publishing/releases/<release-id>.json`. They bind the source release tag, ZIP name/bytes/hash, target PR/branch, PDF parts and master hash, each numbered WebP hash/dimensions, reader route, and historical-download gate. New volumes require a new manifest and an existing reader PR, **not new workflow code**. The source pack layout follows repository paths: `print-source/...` and `public/techops-comic/<volume>/001.webp`, etc. No arbitrary source URLs or executable files are accepted in source ZIPs.

A chat with GitHub write access can trigger through `publishing/request.json` on `main`. Read the current blob SHA before replacing it. Use a new request ID and do not resubmit an already running request:

```json
{
  "release_id": "xiv-corrected-20261110",
  "action": "publish",
  "request_id": "a-new-unique-request-id",
  "expected_head": "the-current-40-character-PR-head-SHA",
  "manifest_sha256": "SHA-256-of-the-exact-manifest-file-bytes"
}
```

Only repository-owner events can authorize production publication. Source-release events stage only. `status` and `prepare` do not merge a PR. Do not use `workflow_dispatch` from a different branch. Unknown releases and stale requests are rejected. Every publish request requalifies the current exact candidate. Branch updates are non-force pushes. The default Pages workflow ignores a request-only commit to avoid deploying the old site just because a new request was submitted.

## Execution and evidence

1. Resolve the manifest, PR identity, owner request, current head and available source asset. A missing upload is `AWAITING_SOURCE_UPLOAD`, not a successful release.
2. Merge the recorded main snapshot into the release branch, verify the ZIP, and verify every file **before** copying any media into the candidate. Validate all PDF parts, the concatenated master hash, numbered images, hashes, and dimensions. No PDFs, source archives, or existing URLs are silently removed.
3. On a separate read-only runner, run comic tests, install dependencies, build, run the existing archival/redirect gate where required, verify built media and enforce the 1,000,000,000-byte site budget.
4. Run Chromium desktop, Chromium phone emulation and WebKit phone emulation against the first and final reader page and PDF link. Save screenshots and JSON receipts. These are emulated browser checks, **not a physical iPhone or Android test**. Browser version is pinned; update it through a tested PR.
5. For an explicit `publish` request only, reject changed head/base or unsuccessful exact-head checks; honor GitHub merge protections; merge; compare the merged Git tree with the qualified tree; explicitly dispatch `pages.yml` with the exact merge SHA and release ID.
6. Pages rebuilds, stamps its exact commit, enforces capacity, deploys, waits for the exact live commit marker, and downloads/hashes all declared images and the PDF. Only its `publisher-live-receipt` with `PUBLISHED_HASH_VERIFIED` establishes a verified publication.

Intermediate receipts are `publisher-plan`, `publisher-qualified`, `publisher-browser-receipts`, and `publisher-receipt` in Actions, retained 90 days where configured. Phase summaries are also posted to the release PR. `MERGED_DEPLOYMENT_REQUESTED` is not `PUBLISHED_HASH_VERIFIED`. A cancelled run is not success; inspect the run and safely resubmit only after the active run ends. Repeated invocations reuse exact existing bytes.

## XIV migration

Registered release: `xiv-corrected-20261110`; existing PR: #72. The regenerated ZIP container has SHA-256 `4c58fc56f8e11a8467698bb3eab576312ac6dcce37e79018b7dd5b2732b64dd7`; its packaging metadata differs from an earlier quoted ZIP hash. All 133 page hashes match the existing per-page receipt; the original corrected PDF is unchanged (`97f16edf9df072863bb7af69d7b52e0ffee77fef6ace7e64936facff5cdcbfae`). Use the package matching this manifest. The legacy XIV action now forwards to the generic staging workflow.

This tooling does not claim XIV is live. Its source transfer and the separately required legacy-PDF redirects must still be verified. PR #72's archive preservation checks remain mandatory. Revision G is not included or silently approved.

## Recovery and rollback

Failures include the exact stage/run. Never retry blindly, force-push, weaken checks, regenerate an approved master, or delete historical PDFs to make a budget pass. Repair the specific blocker and submit a fresh head/manifest-bound request. A failed pre-deployment run leaves the currently served site unchanged. A post-deployment verification failure is reported as such; inspect it before authorizing rollback. Rollback is an explicit reviewed revert to the prior known-good commit, followed by normal Pages deployment and live verification. This publisher does not guess a rollback target or automatically undo unrelated work.
