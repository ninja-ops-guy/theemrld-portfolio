# ASCII-default update — v6.0.1

The approved world now starts with **ASCII ON**. Saved boolean choices are
respected. The header toggle, V key and `view ascii|phosphor` commands remain.
This source is locally tested, **not pushed or merged**. See
`docs/QUALIFICATION.md` for current test results and remote limitations.

---

# K // THE EMRLD — spatial world rebuild (v6)

**A working, dependency-free implementation, not a design brief.**

This rebuild replaces the old screen-space gallery panels and coordinate-swapped
raycaster with eight independent, walkable 3D environments. Paintings, columns,
benches, the central sculpture, street facades and portal architecture occupy
world coordinates and participate in depth rendering. Your twelve supplied art
pieces are separate, verified images—not crops from the previous atlas.

## Try it

Open `K-WORLD-preview.html` in a browser. The art, geometry, interface and local
file audio work without a server. SoundCloud requires internet access and may
require a Play gesture. For the modular source, use:

```sh
python -m http.server 8765 --directory public
```

Then open `http://localhost:8765/k-world/index.html`. Python 3 is sufficient; no
npm installation is needed for this standalone build.

## Controls

WASD walks, arrow keys turn/walk, and dragging the view turns the camera. E
interacts, T opens K Terminal without moving you, M opens the Atlas, V switches
between phosphor and color-ASCII views, and Escape closes a dialog. Touch users
have a direction pad, drag-look and an interaction button. Artwork inspection
preserves camera position and displays the original aspect ratio.

Inside K-01 Orbital, F toggles bounded EVA, Space climbs, C descends, and F returns
to the safe departure position. Space gives a low-gravity jump on the Moon.
Interact with the city car to enter K // DRIVE; A/D steers and E exits.

## K Terminal

The single controller persists across every scene and dialog. Location changes
queue the latest destination and wait for the provider's actual end event.
Returning to the currently playing room cancels an obsolete queued room.
Explicit pause remains paused; manual song selection disables automatic track
replacement. Explicit Play/Next/Skip are the only ways to cut a song short.

```text
play 1
play "Ponderthought"
pause
resume
auto on
queue
volume 55
visualizer style ring
visualizer theme violet
visualizer bars 32
visualizer off
band off
view ascii
gallery
city
station
art 1
```

`speed 1.25`, `faster` and `slower` work with your own local audio. SoundCloud's
public widget has no playback-rate or audio-sample API: these commands explicitly
report that limitation instead of claiming a change. SoundCloud visualization is
labelled **playback-clock sync**, not FFT. Local files use the real Web Audio FFT
analyser and stay on your device.

Song numbers remain stable in the saved library. Previous `k-terminal:tracks:v3`
storage is migrated; the installer also preserves the old bundled song catalogue.
Recent selections remain clickable. Published catalogue refresh does not reload
the active player; the SoundCloud profile syncs its available public tracks when
the widget first initializes. This is not an authenticated full-account feed.

## Install into the portfolio repository

The installer intentionally requires a clean Git worktree, checks the expected
App routes, creates a new branch, preserves old public song entries, and refuses
to guess when the integration shape has changed. It does **not** push or deploy.

```sh
python scripts/install_into_repo.py --repo /path/to/theemrld-portfolio
python scripts/install_into_repo.py --repo /path/to/theemrld-portfolio --apply
cd /path/to/theemrld-portfolio
npm run build
```

Review `docs/INTEGRATION.md` and the resulting diff before committing. Existing
portfolio sections and case studies are not replaced. The `/k/*` route family
keeps one iframe mounted so travel cannot remount the audio player. Legacy
`/terminal`, `/gallery` and `/city` routes redirect into that family.

## Verification

See `docs/QUALIFICATION.md` and `qa/`. This delivery includes a local runnable
preview, modular source, a repository installer, tests, asset hashes and real
browser screenshots. It has **not** been committed, merged or deployed to GitHub
in this turn. The current GitHub tools only exposed reads.

The gallery is a retro 3D/ASCII interpretation of your concept image, not a
photorealistic or archaeological reconstruction. WebGL and live SoundCloud
playback require follow-up testing in an unrestricted browser; the delivered
Canvas fallback and native UI were exercised here.

## Artwork and source files

The included artwork and self-portraits are the files you supplied for this
project; their existing rights are unchanged. No new licence for those images is
granted by this bundle. `scripts/prepare_assets.py --source /path/to/originals`
rebuilds the verified WebPs with Pillow when the listed original filenames are
available. The ready-to-run build does not require Pillow or the originals.
