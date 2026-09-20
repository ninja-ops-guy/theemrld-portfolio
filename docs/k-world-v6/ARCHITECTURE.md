# Spatial implementation

## Why this is a replacement, not another overlay patch

The earlier gallery attached its art, banner, pillars, altar and benches to screen
coordinates. That cannot become a walkable room by shrinking rectangles. Here,
each frame is a textured plane on a wall with actual trim and a nearby inspection
node. Objects occlude one another according to depth. Camera translation and yaw
therefore change perspective naturally, including on a narrow phone viewport.

## Renderer

`renderer.js` supplies matrix math, batched geometry, a WebGL1 depth renderer,
restrained material lighting, fog and phosphor/ASCII postprocessing. Devices
without WebGL use a Canvas software rasterizer with near-plane clipping,
perspective-correct texture coordinates and a per-pixel z-buffer. The fallback
uses the same meshes, textures, camera and collision model—not a screenshot.
The fallback caps the long edge at 960 pixels and throttles drawing; the world
stops redrawing behind modal UI. It is not intended to promise 60 FPS on CPU.

`scenes.js` defines eight separate geometry/collision/interaction collections.
The gallery is enclosed. The city has roads, curbs, storefronts and overhead
structures. Each portal has a different footprint, geometry, materials and
sky. Portal return gates lead to the city; a city doorway leads to the gallery.
No scene is selected by the player's arbitrary coordinate band.

`assets.js` decodes each original separately, caches textures and labels, and
shows named error panels on missing images. `manifest.json` records input and
output SHA-256 digests and decoded dimensions. Reference imagery is stored
separately from the playable room.

## Audio boundary

`audio.js` separates a pure Sequencer from the provider transport. Sequence state
tracks desired room, active room, pending room, mode, pause intent, current track,
position/duration, load generation and finished generation. Navigation cannot
advance an active/loading/paused song. Only actual end or explicit transport
commands advance. There is no crossfade path. Stale callbacks and duplicate
finish events cannot advance a new generation.

The SoundCloud adapter creates one iframe and binds its events once. Async load
callbacks are generation-bound; loads request auto_play=false, then explicit play
is decided from current user intent. Retries are bounded and user-directed. The
local audio alternative pauses SoundCloud before activation. Neither path
inspects cross-origin audio or uses undocumented speed controls.

SoundCloud reactivity is honestly labelled timeline choreography. Local audio
uses analyser samples. Pausing zeros the reactive envelope and freezes the
playback-driven phase; independent navigation remains available.

## Safety and accessibility

Native dialogs contain keyboard focus. Input and contenteditable keys do not
reach world controls. Pointer cancellation, lost focus and overlay opening clear
movement. Touch movement, drag-look and large action buttons are provided.
Reduced-motion disables ambient animation. All artwork can be inspected without
pixel hunting through `art 1` through `art 12`.

The Temple-of-Solomon vocabulary is an artistic blend: bronze twin columns,
cedar/gold panels, palm/pomegranate friezes and ceremonial symmetry. No historical
reconstruction or claim about the user's religion is implied.
