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
export function readBandTiming(raw: string | null): { bpm: number; offsetMs: number } {
  try {
    const v = JSON.parse(raw || 'null');
    if (v && Number.isFinite(v.bpm) && v.bpm >= 40 && v.bpm <= 240 && Number.isFinite(v.offsetMs) && Math.abs(v.offsetMs) <= 600000) return { bpm: v.bpm, offsetMs: v.offsetMs };
  } catch { /* Invalid preferences use preview tempo. */ }
  return { bpm: 120, offsetMs: 0 };
}
