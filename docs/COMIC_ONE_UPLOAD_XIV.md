# TechOps Hero Volume XIV — one-upload handoff

The corrected 133-page PDF is already validated: 181,907,121 bytes; SHA-256 `97f16edf9df072863bb7af69d7b52e0ffee77fef6ace7e64936facff5cdcbfae`. The 133 full-size 2160×3330 WebPs total 97,628,296 bytes. Do not regenerate the master or merge PR #72 without the asset gate passing.

## Only manual transfer step

1. Download `TechOps-Hero-XIV-GitHub-Import.zip` (279,556,589 bytes) from the prepared ChatGPT release kit.
2. In this repository open **Releases → Draft a new release** (https://github.com/ninja-ops-guy/theemrld-portfolio/releases/new).
3. Set **Tag** to exactly `techops-xiv-source-20261110`, title `TechOps Hero XIV source assets`, and check **Set as a pre-release**. Do not make it Latest.
4. Attach that one ZIP as the release binary asset, wait for the browser to finish its upload, then **Publish release**.

The `Import verified Volume XIV assets` GitHub Actions workflow automatically runs on the release's **published** event. Alternatively, after uploading, run the same workflow manually from the Actions tab. It downloads the ZIP **inside GitHub**, verifies the pinned ZIP SHA-256 and size, checks the original PDF and 133 page images, and writes the assets to the existing `release/techops-volume-xiv-20261110` branch / PR #72. Wrong/missing bytes stop it before a commit. No private token, signed cloud-storage URL, or ChatGPT upload is required.

ZIP file SHA-256: `af9e9408e354658e6f0e9a015b335a5121dbee2f0c5ebf8fae9522f653287916`.

## What automatic import does NOT do

It **does not merge PR #72 or publish an incomplete website**. PR #72 separately requires historical PDF archives and the verified legacy URL redirects, site-size enforcement, clean build, and live/mobile verification. The normal Pages deployment only follows a qualified merge. Revision G is a separate release.

`GITHUB_TOKEN`-initiated pushes do not automatically retrigger every ordinary CI workflow. After the importer succeeds, use the import receipt and explicitly rerun relevant PR verification checks if GitHub does not schedule them.

## For future volumes

Keep a single signed-off PDF, render numbered browser pages, calculate a manifest of SHA-256 hashes and exact bytes, and publish one ZIP to an explicitly tagged GitHub prerelease. Model automation after this import, generalizing the manifest per volume; never put the large binary payload into an AI tool response or GitHub Contents API call.
