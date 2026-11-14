export function bandFrame(positionMs: number, bpm = 120, offsetMs = 0, beatsPerLoop = 1, frameCount = 6): number {
  if (![positionMs, bpm, offsetMs].every(Number.isFinite) || bpm < 40 || bpm > 240) return 0;
  const cycleMs = 60000 / bpm * beatsPerLoop;
  const phase = ((positionMs - offsetMs) % cycleMs + cycleMs) % cycleMs;
  return Math.min(frameCount - 1, Math.floor(phase / cycleMs * frameCount));
}
export const MAX_POSITION_AGE_MS = 350;
// Stop extrapolating when provider progress stalls.
export function bandPosition(positionMs: number, elapsedMs: number, playing: boolean, rate = 1): number {
  return Math.max(0, positionMs) + (playing ? Math.max(0, Math.min(MAX_POSITION_AGE_MS, elapsedMs)) * rate : 0);
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

export const PHASE_TAPS = 4;
export const TEMPO_TAPS = 12;
export type BandTap = { at: number; position: number };

function tapIntervals(taps: readonly BandTap[], playbackRate: number) {
  return taps.slice(1).map((tap, index) => (tap.at - taps[index].at) * playbackRate);
}

function fitsBeat(intervals: readonly number[], beatMs: number) {
  return beatMs > 0 && intervals.every(interval => Math.abs(interval - beatMs) <= beatMs * 0.2);
}

function fitOffset(taps: readonly BandTap[], bpm: number, referenceOffsetMs: number): BandTiming | null {
  const beatMs = 60000 / bpm;
  const starts = taps.map((tap, index) => tap.position - index * beatMs);
  if (Math.max(...starts) - Math.min(...starts) > Math.min(85, beatMs * 0.2)) return null;
  const start = starts.reduce((total, position) => total + position, 0) / starts.length;
  if (!Number.isFinite(start)) return null;
  // Choose the nearest equivalent beat to keep the existing bar and phrase ordering.
  const offsetMs = Math.round(start - Math.round((start - referenceOffsetMs) / beatMs) * beatMs);
  return Math.abs(offsetMs) <= 600000 ? { bpm, offsetMs } : null;
}

export function alignBeatTaps(taps: readonly BandTap[], playbackRate: number, timing: BandTiming): BandTiming | null {
  if (taps.length !== PHASE_TAPS || !fitsBeat(tapIntervals(taps, playbackRate), 60000 / timing.bpm)) return null;
  return fitOffset(taps, timing.bpm, timing.offsetMs);
}

export function estimateTempoTaps(taps: readonly BandTap[], playbackRate: number, referenceOffsetMs: number): BandTiming | null {
  if (taps.length !== TEMPO_TAPS) return null;
  const intervals = tapIntervals(taps, playbackRate);
  const ordered = [...intervals].sort((a, b) => a - b);
  if (!fitsBeat(intervals, ordered[Math.floor(ordered.length / 2)])) return null;

  // Fit a line through all tap times so a noisy first or last tap has less influence.
  const mid = (taps.length - 1) / 2;
  const first = taps[0].at;
  let slope = 0;
  let weight = 0;
  for (const [index, tap] of taps.entries()) {
    const distance = index - mid;
    slope += distance * (tap.at - first);
    weight += distance * distance;
  }
  const bpm = Math.round(6000000 / (slope / weight * playbackRate)) / 100;
  return bpm >= 40 && bpm <= 240 ? fitOffset(taps, bpm, referenceOffsetMs) : null;
}
