# Volume XIV upload handoff

The general **Comic Publisher** supersedes the old hardcoded XIV importer. See [COMIC_PUBLISHER.md](COMIC_PUBLISHER.md) for current instructions and the saved release manifest at `publishing/releases/xiv-corrected-20261110.json`.

Use the single `TechOps-Hero-XIV-GitHub-Import.zip` matching that manifest. The current ZIP SHA-256 is `4c58fc56f8e11a8467698bb3eab576312ac6dcce37e79018b7dd5b2732b64dd7` (279,556,589 bytes). Its 133 WebPs match the approved per-page hashes, and its source parts reconstruct the unchanged corrected PDF.

Attach it to the source draft release tagged `techops-xiv-source-20261110`, then publish the prerelease to stage and qualify it. Or run `python scripts/upload-comic.py /path/to/TechOps-Hero-XIV-GitHub-Import.zip --release xiv-corrected-20261110 --publish` from a computer already authenticated with GitHub CLI.

A source upload does not bypass PR #72's archive/redirect, build, browser or site-size checks. The website is published only after a qualified owner-authorized merge, explicit deployment and successful live verification.
