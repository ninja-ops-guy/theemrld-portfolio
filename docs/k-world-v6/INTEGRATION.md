# Portfolio integration

## Scope

Install `public/k-world/` and replace `src/sections/AsciiCityWorld.tsx` with the
included persistent iframe host. Migrate the three legacy routes in App.tsx to
redirects under `/k/`, and add one `/k/*` route. Remove the now-unused KTerminal
import from App.tsx. Do not mount the old KTerminal component or KWorldAudio
alongside the new host.

```tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
// Other existing imports remain.

<Route path="/terminal" element={<Navigate to={`/k/terminal${location.search}`} replace />} />
<Route path="/gallery" element={<Navigate to={`/k/gallery${location.search}`} replace />} />
<Route path="/city" element={<Navigate to={`/k/city${location.search}`} replace />} />
<Route path="/k/*" element={<AsciiCityWorld />} />
```

The wrapper uses Vite's BASE_URL and keeps its iframe `src` stable after mount.
Navigation messages are accepted only from the actual parent/child window and
same origin. Portal travel changes scene state inside the app, not iframe URLs.
No credentials, unofficial SoundCloud endpoints, or additional dependencies are
required. SoundCloud iframe creation is lazy and uses the official Widget API.

The installer extracts legacy `defaultTracks` entries into the public catalogue.
It never requests private tracks. Existing `k-terminal:tracks:v3` localStorage is
also read once as the new library's starting point; arbitrary title text is
rendered as text, not HTML. Public catalogue updates are deduplicated by validated
SoundCloud URL and assigned stable slot numbers.

## Files deliberately left intact

Other portfolio components, case-study pages, the old gallery/source files and
old artwork atlas remain available for history. They are not mounted by the
migrated routes. The new world never references the old atlas or inline backdrop
composition. The source gallery reference files are kept in `public/k-world/assets`
for art direction, not pasted across the camera view.

## Validation on the actual repository

1. Run the existing `npm run build` and PR checks after installation.
2. Test the actual GitHub Pages base path and legacy deep links.
3. Test WebGL on desktop and mobile, including context loss and device rotation.
4. Use live SoundCloud: permit playback, let a full song finish after several
   scene changes, pause and travel, retry a blocked/unavailable song, and verify
   that only one sound is audible.
5. Confirm the accessible provider controls recover autoplay on iOS Safari.
6. Review all twelve artwork originals, environment separation and return gates.

The authoring environment could not run the full existing Vite dependency tree
or live network/GPU checks. The included TSX host passed syntax/transpile checking,
not a claim of full-repository type qualification. Installer behavior was tested
against a clean temporary Git fixture and refuses changed route shapes.

Rollback is a normal Git branch switch; the installer creates no remote writes.
