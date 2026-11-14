export function bandFrame(positionMs: number, bpm = 120, offsetMs = 0, beatsPerLoop = 1, frameCount = 6): number {
  if (![positionMs, bpm, offsetMs].every(Number.isFinite) || bpm < 40 || bpm > 240) return 0;
  const cycleMs = 60000 / bpm * beatsPerLoop;
  const phase = ((positionMs - offsetMs) % cycleMs + cycleMs) % cycleMs;
  return Math.min(frameCount - 1, Math.floor(phase / cycleMs * frameCount));
}
// Stop extrapolating when provider progress stalls.
export function bandPosition(positionMs: number, elapsedMs: number, playing: boolean, rate = 1): number {
  return Math.max(0, positionMs) + (playing ? Math.max(0, Math.min(350, elapsedMs)) * rate : 0);
}
export type BandTiming = { bpm: number; offsetMs: number };
export const PREVIEW_TIMING: BandTiming = { bpm: 120, offsetMs: 0 };

export function readBandTiming(raw: string | null): BandTiming | null {
  try {
    const v = JSON.parse(raw || 'null');
    if (v && Number.isFinite(v.bpm) && v.bpm >= 40 && v.bpm <= 240 && Number.isFinite(v.offsetMs) && Math.abs(v.offsetMs) <= 600000) return { bpm: v.bpm, offsetMs: v.offsetMs };
  } catch { /* Use the track default when the saved settings cannot be parsed. */ }
  return null;
}

export function tapTempo(taps: readonly number[], playbackRate: number): number | null {
  if (taps.length < 4 || !Number.isFinite(playbackRate) || playbackRate <= 0) return null;
  const intervals = taps.slice(1).map((tap, i) => (tap - taps[i]) * playbackRate).sort((a, b) => a - b);
  const middle = Math.floor(intervals.length / 2);
  const median = intervals.length % 2 ? intervals[middle] : (intervals[middle - 1] + intervals[middle]) / 2;
  if (intervals.some(interval => !Number.isFinite(interval) || Math.abs(interval - median) > median * 0.2)) return null;
  const average = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const bpm = Math.round(600000 / average) / 10;
  return bpm >= 40 && bpm <= 240 ? bpm : null;
}
