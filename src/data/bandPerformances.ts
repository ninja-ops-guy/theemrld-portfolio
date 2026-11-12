import type { PerformanceId, SpriteClip, TrackPerformance } from '../lib/bandPerformance';

const existingClip = (row: number): SpriteClip => ({
  atlas: 'assets/techops-band-ensemble-v1.webp', columns: 6, rows: 4,
  firstCell: row * 6, frameCount: 6, beatsPerLoop: 1,
});

// Drawn row boundaries differ slightly from the nominal 229px grid.
// Use measured blank gutters so adjacent hair/props never bleed into a frame.
const stripBounds = [[0, 229], [229, 448], [448, 672], [672, 896], [896, 1145]];
const instrumentClip = (row: number, beatsPerLoop = 2): SpriteClip => ({
  atlas: 'assets/techops-band-instruments-v1.webp', columns: 6, rows: 5,
  firstCell: row * 6, frameCount: 6, beatsPerLoop,
  strip: { top: stripBounds[row][0], height: stripBounds[row][1] - stripBounds[row][0], atlasHeight: 1145, frameWidth: 229 },
});
export const BAND_CLIPS: Partial<Record<PerformanceId, SpriteClip>> = {
  'k-guitar': existingClip(0),
  'iona-drums': existingClip(1),
  'iona-drums-fast': {
    atlas: 'assets/iona-drums-fast.webp', columns: 4, rows: 4,
    firstCell: 0, frameCount: 16, beatsPerLoop: 2,
  },
  'felicia-dance': existingClip(2),
  'waldo-dance': existingClip(3),
  'waldo-mixing': instrumentClip(0),
  'felicia-violin': instrumentClip(1),
  'felicia-piano': instrumentClip(2),
  'felicia-synth': instrumentClip(3),
  'mike-bass': instrumentClip(4, 1),
  'katrin-backswing': {
    atlas: 'assets/techops-band-katrin-backswing.webp', columns: 6, rows: 4,
    firstCell: 0, frameCount: 24, beatsPerLoop: 2,
  },
  'katrin-marmot': {
    atlas: 'assets/katrin-marmot-march.webp', columns: 6, rows: 8,
    firstCell: 0, frameCount: 48, beatsPerLoop: 4,
  },
  'manchez-drum-dance': {
    atlas: 'assets/manchez-drum-dance-v1.webp', columns: 4, rows: 1,
    firstCell: 1, frameCount: 3, beatsPerLoop: 0.25,
    rotation: { activeBeats: 4, intervalBeats: 8, restCell: 0 },
  },
};

// Key by the exact track URL used by KTerminal, never title substrings.
// Public artist genre/tags checked 2026-11-12; evidence in docs/band-song-metadata.json.
// Electronic genre is a stage assignment requested by the creator, not a recording credit.
// Drum & Bass is not evidence of a physical bass guitar. No keyboard/string parts guessed.
export const TRACK_PERFORMANCES: Record<string, TrackPerformance> = Object.fromEntries([
  'ghost-town', 'motorcell-mp3', 'black', 'wake-up-and-die-ft-oz', 'two-horses',
  'maybe-mp3', 'winter-mp3', 'winter-2-mp3', 'i-see-the-dead-mp3',
].map(slug => [`https://soundcloud.com/raikouno/${slug}`, { instruments: ['electronic'] }]));
