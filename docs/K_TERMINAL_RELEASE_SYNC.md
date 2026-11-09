# K Terminal release sync

K Terminal reads `public/k-world/latest-releases.json`. The automatic updater
checks @raikouno's public SoundCloud RSS feed hourly, at minute 23 UTC, through
the **Sync K Terminal releases** GitHub Actions workflow. GitHub may delay a
scheduled run; this is periodic synchronization, not an upload webhook.

The source feed is
`https://feeds.soundcloud.com/users/soundcloud:users:72536165/sounds.rss`.
Only public, dated tracks included in that RSS feed can be discovered. In
SoundCloud, enable **Include in RSS feed** in upload defaults to include future
tracks automatically; existing tracks can be included in their edit settings.

## Publication behavior

- The parser accepts the artist's SoundCloud track links, removes duplicates,
  and orders them newest first. Stable ordering resolves equal publication dates.
- If the track list and metadata are unchanged, the file remains byte-identical.
  `verifiedAt` records when the current snapshot was written, not each hourly check.
- Network errors, invalid/empty feeds, and oversized responses fail the run while
  preserving the previous catalogue. Atomic file replacement prevents a partial
  catalogue from becoming the published file.
- Changed data is committed to `main` only when the checkout is still current.
  If `main` advances, or an ordinary push is rejected, the workflow stops without
  overwriting another commit. The next scheduled run starts from current `main`.
- The workflow explicitly dispatches `pages.yml` after a change because a push
  made with `GITHUB_TOKEN` does not trigger the normal Pages push workflow.
- On unchanged-data runs, the updater compares the public site's tracks with
  the repository snapshot. A mismatch dispatches Pages again, covering an earlier
  failed dispatch or deployment. A failed public-site check reports a failed run
  and retries on the next schedule instead of requesting an unnecessary rebuild.

The updater uses a sparse checkout and does not build the site when the released
catalogue is already current. Its token needs `contents: write` to publish the
manifest and `actions: write` to dispatch the existing Pages workflow. It uses
neither SoundCloud credentials nor a token in browser code.

## Manual operations

Run **Sync K Terminal releases** using its workflow-dispatch control on `main` to
check immediately. A successful run may say unchanged; this is expected when the
published catalogue is current.

For a local refresh:

```sh
python scripts/sync_raikouno.py
python -m unittest discover -s tests -p 'test_raikouno_sync.py'
```

The local command updates the file only. Commit and publish it through the normal
repository workflow. `--feed-file path/to/feed.xml` is available for deterministic
fixtures, and `--output path/to/catalogue.json` selects a different output file.

The browser's sync controls reload this published catalogue. They cannot trigger
a privileged GitHub workflow or bypass the publication interval. Automatic
catalogue refresh preserves the song the listener is already playing.
