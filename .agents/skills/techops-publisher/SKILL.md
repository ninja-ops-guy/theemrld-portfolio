---
name: techops-publisher
description: Publish, stage, resume, or check TechOps Hero comics and approved revisions on kterminal.site using the existing GitHub publisher. Use when Mike asks to publish to the website, upload a completed volume, resume a blocked release, or verify whether a comic is live. Do not use this to rewrite or regenerate artwork.
---

# TechOps Publisher

Repository: `ninja-ops-guy/theemrld-portfolio`. Website: `https://kterminal.site/`. Canonical procedure: `docs/COMIC_PUBLISHER.md`. Registered releases: `publishing/releases/`. Runner: `.github/workflows/comic-publisher.yml`. This skill supplies procedure, not credentials or a new binary-upload capability.

## Start from durable evidence

Read the current repository guide, applicable release manifest, target PR metadata, latest Comic Publisher run/receipt, and latest exact-commit Pages run before doing work. Use the GitHub connector, not web search, for authenticated repository operations. Discover only needed actions. Reuse the registered PR; do not create another publishing branch/workflow for each user message. Keep output and tool responses small: metadata, hashes and receipts, never binary/base64 payloads or huge repository dumps.

When the user says “publish”, that authorizes the existing requested release through its checks. It does not authorize unrelated revision merges, artwork changes, DNS changes, weakening safeguards or deleting archived material. Distinguish a source prerelease from the public website.

## Submit a bounded request

1. Read `publishing/releases/<id>.json` from main and validate it using `scripts/comic-publisher.py check` when available. Compute SHA-256 from the exact UTF-8 file content; do not hash a reformatted JSON object.
2. Read the target PR's live head SHA, same-repository identity, base branch, state, and current active publisher runs. Do not launch a second publishing job while one is active. For an already merged PR, inspect its Pages/live receipt rather than requesting another merge.
3. Check the source GitHub Release and named ZIP asset. GitHub metadata alone does not prove its contents; the runner verifies all bytes. If source exists, read the current blob SHA of `publishing/request.json`, then update that one file on main with `release_id`, `action: publish`, a unique `request_id`, `expected_head`, and the computed `manifest_sha256`. Use `status`, `prepare`, or `stage` instead when that is what the user requested. A file-commit trigger is intentional because the chat connector may not expose workflow dispatch.
4. Confirm the request commit exists and the matching workflow run started. Inspect a bounded number of run/job/receipt calls, never a tight polling loop. Work can run independently in GitHub, but do not promise future reporting without an authorized automation. State the current phase precisely. A fresh chat resumes from the same repository evidence.

## When source bytes are only in ChatGPT

First locate the already-produced file through Files in the Library; do not ask the user to find it again. Establish an actual local path before giving a sandbox link. Verify the exact source/package hashes. Do not treat a sandbox link as a publicly downloadable URL or invent GitHub upload access.

Use an actually available authenticated binary-transfer action if one exists. Otherwise this connector requires one source handoff: prepare the GitHub draft upload slot and give the exact ZIP plus source-release link, or the repository's `scripts/upload-comic.py` command for a computer already authenticated with GitHub CLI. Do not start device-code loops, request tokens in chat, create unrelated hosting accounts, upload to other providers, or repeatedly repackage media. Explain the single remaining handoff once. A skill cannot remove missing transfer permissions.

## Gates and success criteria

The runner validates source integrity, every numbered image, original master PDF, existing archival/redirect requirements, build, total Pages bytes, desktop/mobile-emulated reader checks, exact head/base, merge and explicit Pages dispatch. Never bypass these to make “publish” appear successful. If a gate fails, inspect its specific logs and repair only within the user's scope; preserve original assets and historical download URLs.

Report `AWAITING_SOURCE_UPLOAD`, `STAGED_QUALIFICATION_BLOCKED`, `QUALIFIED_NOT_PUBLISHED`, `MERGED_DEPLOYMENT_REQUESTED`, or `PUBLISHED_HASH_VERIFIED` according to actual receipts. “Merged”, “green preflight”, “source uploaded”, and “workflow installed” do not mean live. Completion requires the matching successful Pages run, live commit marker, all declared file hashes and reader qualification receipts. Emulated phone tests do not establish physical-device success; separate hostname/DNS failures from reader defects.

## Adding another volume

Prepare a new approved manifest and reader PR using the same schema, source ZIP layout and workflows. Record actual file hashes, count, dimensions, source tag and target PR. A different revision requires its own identifier; do not overwrite approved sources. Reuse the packager/uploader and persistent receipts. Do not edit workflow code merely to change a volume number.

Current initial registration: XIV corrected release `xiv-corrected-20261110`, PR #72. Treat these as lookup hints, not proof of present state. Revision G is separate. The current full instructions and manifests in GitHub override historical chat status claims.
