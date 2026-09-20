# K World v6.0.1 — ASCII-default qualification

## Implemented

- ASCII is the default for first visits, missing preferences, corrupt JSON,
  invalid non-boolean values and unavailable browser storage.
- Both renderer constructors (WebGL and Canvas) start with the same default.
- An explicitly saved boolean display preference is respected: saved phosphor
  remains phosphor; saved ASCII remains ASCII.
- Startup no longer writes a display preference the visitor did not choose.
- The toggle reports `ASCII ON` or `ASCII OFF` with an accessible pressed state.
- `V`, the toggle, `view ascii` and `view phosphor` remain available.
- No artwork, world geometry, audio sequencing or route behavior was replaced
  relative to the approved v6 source bundle.

## Executed against this revision

| Check | Result |
|---|---:|
| Node unit/asset/scene/audio/default tests | 52 passed, 0 failed |
| Full Chromium browser regression suite | 52 passed, 0 failed |
| Additional ASCII/settings browser regressions | 13 passed, 0 failed |
| Installer tests | 6 passed, 0 failed |
| Runtime JS errors in both browser suites | 0 |
| Native JS syntax checks | Passed |
| Portable HTML rebuild | Passed |

Full browser checks use the production Canvas z-buffer renderer at 1440×900 and
390×844. New checks cover the initial ASCII state and accessible toggle. The
additional settings tests use an explicitly injected in-memory localStorage-like
fixture because URL navigation is blocked by the environment. They cover saved
true/false, travel, the terminal command, corrupt JSON and denied storage; they
are not a real-origin persistence test.

## Remote status and remaining limits

No commit, push, merge or GitHub Pages deployment was performed in this turn.
Connected GitHub reads showed main at
`d69f8b2ede443268feedbb46eb259d5c61dee73e`, with old PR #26 still open at
`1cc984353e5331bfa8c6fa72dc6cb459ad86060a`. That older PR is not this approved v6
replacement. Available GitHub actions in this session expose reads, not writes.
The CLI clone attempt failed: `Could not resolve host: github.com`.

The full repository Vite build, real-origin browser persistence, live SoundCloud
playback, GPU rendering and production Pages verification remain unexecuted.
These are limitations, not recorded passes.

## Reproduce

```sh
node --test tests/*.test.mjs
python tests/installer_test.py
python scripts/build_portable.py
python tests/browser_qa.py --output qa/ascii-default-browser
python tests/ascii_preferences_browser.py
```

The updated source bundle retains `scripts/install_into_repo.py`, which installs
into a clean target worktree, preserves the legacy song catalogue and refuses
unexpected route shapes. It does not push or merge. Existing integration and
architecture documents describe the host's single persistent audio session.
