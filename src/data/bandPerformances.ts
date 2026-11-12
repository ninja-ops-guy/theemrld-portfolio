import type { PerformanceId, SpriteClip, TrackPerformance } from '../lib/bandPerformance';

const existingClip = (row: number): SpriteClip => ({
  atlas: 'assets/techops-band-ensemble-v1.webp', columns: 6, rows: 4,
  firstCell: row * 6, frameCount: 6, beatsPerLoop: 1,
});

// Register new clips only after the actual files, likeness and loop have been reviewed.
// Missing roles deliberately retain their existing dance (Mike remains offstage).
// Do not point an instrument role at a dance row or a nonexistent planned filename.
export const BAND_CLIPS: Partial<Record<PerformanceId, SpriteClip>> = {
  'k-guitar': existingClip(0),
  'iona-drums': existingClip(1),
  'felicia-dance': existingClip(2),
  'waldo-dance': existingClip(3),
};

// Key by the exact track URL used by KTerminal, never title substrings.
// No song instrumentation has been verified for this change yet.
export const TRACK_PERFORMANCES: Record<string, TrackPerformance> = {};
