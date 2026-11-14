export function bandFrame(positionMs: number, bpm = 120, offsetMs = 0, beatsPerLoop = 1, frameCount = 6): number {
  if (![positionMs, bpm, offsetMs].every(Number.isFinite) || bpm < 40 || bpm > 240) return 0;
  const cycleMs = 60000 / bpm * beatsPerLoop;
  // Keep an exact beat boundary on its new frame, even at fractional BPM.
  const frame = Math.floor((positionMs - offsetMs) / cycleMs * frameCount + 1e-8);
  return ((frame % frameCount) + frameCount) % frameCount;
}
export const MAX_POSITION_AGE_MS = 350;
// Stop extrapolating when provider progress stalls.
export function bandPosition(positionMs: number, elapsedMs: number, playing: boolean, rate = 1): number {
  return Math.max(0, positionMs) + (playing ? Math.max(0, Math.min(MAX_POSITION_AGE_MS, elapsedMs)) * rate : 0);
}
const CLOCK_CORRECTION_MS = 200;
type BandClockSample = {
  positionMs: number;
  sampledAt: number;
  playing: boolean;
  rate: number;
  epoch?: number;
};
export type BandClock = BandClockSample & { correctionMs: number };

export function readBandClock(clock: BandClock, now: number): number {
  const elapsed = Math.max(0, now - clock.sampledAt);
  const correction = clock.playing ? clock.correctionMs * Math.max(0, 1 - elapsed / CLOCK_CORRECTION_MS) : 0;
  return Math.max(0, bandPosition(clock.positionMs, elapsed, clock.playing, clock.rate) + correction);
}

export function updateBandClock(previous: BandClock | null, sample: BandClockSample): BandClock {
  const next = { ...sample, correctionMs: 0 };
  if (!previous?.playing || !sample.playing || previous.epoch !== sample.epoch || previous.rate !== sample.rate) return next;
  // Repeated positions cannot keep a stalled playhead moving.
  if (sample.sampledAt < previous.sampledAt || sample.positionMs === previous.positionMs) return previous;
  if (sample.sampledAt - previous.sampledAt >= MAX_POSITION_AGE_MS) return next;
  const correctionMs = readBandClock(previous, sample.sampledAt) - sample.positionMs;
  // Ease small delivery jitters without reversing motion. Larger jumps re-anchor immediately.
  const limit = Math.min(85, CLOCK_CORRECTION_MS * sample.rate / 2);
  return Math.abs(correctionMs) <= limit ? { ...next, correctionMs } : next;
}

export type BandTiming = { bpm: number; offsetMs: number; downbeatMs?: number };
export const BAND_PHRASE_BEATS = 16;
export const PREVIEW_TIMING: BandTiming = { bpm: 120, offsetMs: 0 };

export function readBandTiming(raw: string | null): BandTiming | null {
  try {
    const v = JSON.parse(raw || 'null');
    if (v && Number.isFinite(v.bpm) && v.bpm >= 40 && v.bpm <= 240 && Number.isFinite(v.offsetMs) && Math.abs(v.offsetMs) <= 600000) {
      const timing: BandTiming = { bpm: v.bpm, offsetMs: v.offsetMs };
      if (Number.isSafeInteger(v.downbeatMs) && v.downbeatMs >= 0) timing.downbeatMs = v.downbeatMs;
      return timing;
    }
  } catch { /* Use the track default when the saved settings cannot be parsed. */ }
  return null;
}

export function markBandDownbeat(positionMs: number, bpm: number): BandTiming {
  const downbeatMs = Math.round(positionMs);
  const beatMs = 60000 / bpm;
  const offsetMs = Math.round(downbeatMs - Math.round(downbeatMs / beatMs) * beatMs) || 0;
  return { bpm, offsetMs, downbeatMs };
}

export function bandPhraseOffset({ bpm, offsetMs, downbeatMs }: BandTiming): number {
  if (downbeatMs === undefined) return offsetMs;
  const beatMs = 60000 / bpm;
  const phraseMs = BAND_PHRASE_BEATS * beatMs;
  const beat = offsetMs + Math.round((downbeatMs - offsetMs) / beatMs) * beatMs;
  // Honor the exact mark within the integer offset's rounding error.
  const start = Math.abs(beat - downbeatMs) <= 0.5 + 1e-8 ? downbeatMs : beat;
  // Count backward so seeks before the mark stay in the phrase grid.
  return start - Math.ceil(start / phraseMs) * phraseMs;
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
  const aligned = fitOffset(taps, timing.bpm, timing.offsetMs);
  return aligned ? { ...timing, ...aligned } : null;
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
