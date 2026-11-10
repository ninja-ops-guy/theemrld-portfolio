# TechOps Publisher: one revision, one upload, resumable publication

The publisher runs in GitHub Actions. Chat submits a small request and reads a durable receipt; it does not render artwork, move binary data through tool text, or keep polling until deployment completes.

## Installation and safe scope

This implementation is being repaired in PR #75. Until that PR is merged and the first installed status run succeeds, do not describe the generic runner as installed. Main's ordinary Pages workflow and current published art remain independent. Installing tooling is not authorization to publish a new artwork revision.

The old `xiv-corrected-20261110` registration is retired and its target PR #72 is closed. No active replacement is guessed. Before registering a release, reconcile ALL requested corrections against exact master and image hashes, including corrections made in separate chats. An older verified kit is not proof that it contains later corrections.

## Normal procedure

1. Freeze the approved revision: one master PDF, all numbered image identities, a list of changed pages, and explicit correction dispositions. Record included or not-applicable with evidence; unresolved corrections block registration. Preserve the original files.
2. Register its v2 manifest in `publishing/releases/<id>.json`. Use a new ID for changed artwork. Bind the existing target PR, base media commit, exact ZIP bytes/hash, exact master bytes/hash, every page hash/dimension, content revision, compatible bookmark revision, and current-only website policy.
3. Upload the exact ZIP once to its explicitly named GitHub source prerelease. An authenticated browser or GitHub CLI can do the binary transfer. Connector repository permissions do not automatically authenticate browser or CLI, and the chat connector does not expose Release-asset upload. Do not request tokens in chat, transmit base64 files in chat tools, or rebuild the package to work around a transfer problem.
4. Submit one explicit `stage` request after source upload to verify the package, create/reuse immutable media, attach and verify the exact master, update the same reader PR and qualify it. Source prerelease publication is separate from website publication.
5. Submit `publish` only with authorization for that exact revision, its current reviewed head and manifest hash. The runner requalifies before merge. Successful merge is followed by an explicitly bound Pages dispatch and live verification.

## Source package and uploader

A v2 ZIP contains exactly `master.pdf` and the declared changed image paths such as `techops-comic/volume-xiv/024.webp`. Unchanged pages are referenced by the pinned base media commit, not repackaged. Every page is still verified against the full manifest before staging.

On a computer already authenticated with GitHub CLI:

```sh
python scripts/upload-comic.py /path/to/approved.zip --release <id>
```

The default uploads and verifies only. Add `--stage` to make the source prerelease public and qualify it, or `--publish` to also authorize website publication. Neither option marks the source prerelease Latest. The uploader checks and reuses an exact existing ZIP; it refuses to overwrite a different asset. It verifies readback before submitting one explicit request. Source-release events do not launch a duplicate job. A completed upload is resumable by reuse, but interrupted transfers are not byte-range resumable.

The helper prints a request ID. Keep it with the release receipt. Reuse an ID only for an identical request; a new action or changed authorization needs a new ID. Run status or resume on a merged release rather than uploading or merging it again. For a browser upload, ask for stage or publish after the source prerelease is uploaded; there is no automatic release-event dispatch.

## Saved requests and checkpoints

`publishing/request.json` on the dedicated `publisher-requests` branch is the connector-friendly control file. Initialize that branch from current main once if absent; never commit requests to main. The workflow reads request bytes at the exact triggering commit and loads trusted controller code and manifests from main. A request therefore cannot advance production or invalidate deployment recovery. A request includes release_id, action, request_id, expected_head and manifest_sha256. Hash the exact UTF-8 manifest bytes, not reformatted JSON. Read the current blob SHA before replacement. The runner accepts owner-authorized events, rejects stale identity bindings and serializes publisher operations. Do not submit another request while one is active.

The controller records small per-release/request checkpoints on its dedicated state branch. Requests with the same ID but different action, head or manifest are rejected. Checkpoints bind staged head, qualified tree, merge commit and deployment request. The PR and Actions retain human-readable receipts, but expiring artifacts are not the only recovery record.

Use `status` to inspect. Use `resume` to recover the same approved release after interruption. Never assume a timeout means an operation failed: read its outcome first. An already merged PR resumes deployment/verification rather than remerging. A changed main or release identity stops recovery instead of deploying an older site over newer work. No rollback target is guessed.

## Qualification and completion

- Validate source ZIP size/hash, exact paths, no duplicate/special files, master PDF hash, changed images and all unchanged images.
- Keep one immutable media commit per exact revision. Require selected book's existing media pin to match the approved base before applying changes. Reject concurrent branch changes with a compare-and-swap lease that is permitted only for proven fast-forward history.
- Keep each book's independent media commit and PDF release pins. Preserve pagination, sections, current saved-book positions and soundtrack compatibility unless a separate requested migration changes them.
- Build the site, run publication tests, apply the existing current-only website cleanup, enforce the 1,000,000,000-byte deployment budget, and verify remote image/PDF bytes.
- Qualify desktop Chromium and phone-emulated Chromium/WebKit readers. These are not physical-device tests.
- Bind publication to the exact qualified head/tree and main snapshot. The runner proves fast-forward ancestry and uses an exact-base compare-and-swap lease for the main update, then waits for GitHub to recognize the existing PR as merged. Repository protection failures stop the operation; there is no merge-API fallback or protection bypass. Explicitly dispatch Pages with that exact commit and release identity.
- Require exact live commit marker, expected release identity, all declared image hashes and original master hash. `MERGED_DEPLOYMENT_REQUESTED` is not `PUBLISHED_HASH_VERIFIED`.

## Failure handling

- Missing source: `AWAITING_SOURCE_UPLOAD`; stop, provide one correct upload destination.
- Source/hash/correction mismatch: reject before candidate writes. Do not regenerate approved art or substitute an older kit.
- Qualification failure: keep the current website unchanged; repair the failed gate and requalify.
- Merge response uncertain: read PR state and qualified tree before taking another action.
- Merged but dispatch failed: resume from the recorded merge identity. Do not repeat the merge.
- Deployment active: return its run rather than start another.
- Live verification failed: report that exact state. Investigate before a separately approved rollback.

New volumes outside the three current books need a reviewed reader/data change as well as a manifest. Do not disguise new content as an existing revision merely to pass the gates.
