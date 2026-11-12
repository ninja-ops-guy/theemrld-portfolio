import { bandFrame } from './bandTiming';

export type Instrument = 'electronic' | 'violin' | 'piano' | 'synth' | 'bass';
export type Arrangement = {
  waldo: 'auto' | 'dance' | 'mixing';
  felicia: 'auto' | 'dance' | 'violin' | 'piano' | 'synth';
  mike: 'auto' | 'off' | 'bass';
};
export type TrackPerformance = {
  // Curated data only: these are not inferred from titles or an audio spectrum.
  instruments?: readonly Instrument[];
  feliciaLead?: 'violin' | 'piano' | 'synth';
};
export type PerformanceId = 'k-guitar' | 'iona-drums' | 'felicia-dance' | 'waldo-dance'
  | 'waldo-mixing' | 'felicia-violin' | 'felicia-piano' | 'felicia-synth' | 'mike-bass';
export type Performer = { id: PerformanceId; actor: 'K' | 'IONA' | 'FELICIA' | 'WALDO' | 'MIKE'; role: string };
export type SpriteStrip = { top: number; height: number; atlasHeight: number; frameWidth: number };
export function isSpriteStrip(strip: SpriteStrip | undefined): strip is SpriteStrip {
  return !!strip && [strip.top, strip.height, strip.atlasHeight, strip.frameWidth].every(Number.isSafeInteger)
    && strip.top >= 0 && strip.height > 0 && strip.frameWidth > 0
    && strip.atlasHeight > 0 && strip.top + strip.height <= strip.atlasHeight;
}
export type SpriteClip = {
  atlas: string;
  columns: number;
  rows: number;
  firstCell: number;
  frameCount: number;
  beatsPerLoop: number;
  strip?: SpriteStrip;
};
export const DEFAULT_ARRANGEMENT: Arrangement = { waldo: 'auto', felicia: 'auto', mike: 'auto' };
export const PERFORMERS: Record<PerformanceId, Performer> = {
  'k-guitar': { id: 'k-guitar', actor: 'K', role: 'GUITAR' },
  'iona-drums': { id: 'iona-drums', actor: 'IONA', role: 'DRUMS' },
  'felicia-dance': { id: 'felicia-dance', actor: 'FELICIA', role: 'BREAKDANCE' },
  'waldo-dance': { id: 'waldo-dance', actor: 'WALDO', role: 'BREAKDANCE' },
  'waldo-mixing': { id: 'waldo-mixing', actor: 'WALDO', role: 'MIXING BOARD' },
  'felicia-violin': { id: 'felicia-violin', actor: 'FELICIA', role: 'VIOLIN' },
  'felicia-piano': { id: 'felicia-piano', actor: 'FELICIA', role: 'PIANO' },
  'felicia-synth': { id: 'felicia-synth', actor: 'FELICIA', role: 'SYNTHESIZER' },
  'mike-bass': { id: 'mike-bass', actor: 'MIKE', role: 'BASS' },
};

export function readArrangement(raw: string | null): Arrangement {
  try {
    const value = JSON.parse(raw || 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_ARRANGEMENT };
    return {
      waldo: ['auto', 'dance', 'mixing'].includes(value.waldo) ? value.waldo : 'auto',
      felicia: ['auto', 'dance', 'violin', 'piano', 'synth'].includes(value.felicia) ? value.felicia : 'auto',
      mike: ['auto', 'off', 'bass'].includes(value.mike) ? value.mike : 'auto',
    };
  } catch { return { ...DEFAULT_ARRANGEMENT }; }
}

export function resolvePerformance(profile: TrackPerformance = {}, choice: Arrangement = DEFAULT_ARRANGEMENT): Performer[] {
  const instruments = new Set(profile.instruments || []);
  const keys = ['violin', 'piano', 'synth'] as const;
  const presentKeys = keys.filter(key => instruments.has(key));
  // Multiple Felicia instruments need a curated lead or an explicit selection.
  const lead = profile.feliciaLead && instruments.has(profile.feliciaLead)
    ? profile.feliciaLead : presentKeys.length === 1 ? presentKeys[0] : 'dance';
  const felicia = choice.felicia === 'auto' ? lead : choice.felicia;
  const waldo = choice.waldo === 'auto' ? (instruments.has('electronic') ? 'mixing' : 'dance') : choice.waldo;
  const bass = choice.mike === 'bass' || (choice.mike === 'auto' && instruments.has('bass'));
  return [PERFORMERS['k-guitar'], PERFORMERS['iona-drums'], PERFORMERS[`felicia-${felicia}`],
    PERFORMERS[`waldo-${waldo}`], ...(bass ? [PERFORMERS['mike-bass']] : [])];
}

export function isPlayableClip(clip: SpriteClip | undefined): clip is SpriteClip {
  if (!clip || !/^assets\/[a-zA-Z0-9/_-]+\.(?:webp|png)$/.test(clip.atlas) || clip.atlas.includes('..')) return false;
  const { columns, rows, firstCell, frameCount, beatsPerLoop } = clip;
  return (!clip.strip || (isSpriteStrip(clip.strip) && firstCell % columns + frameCount <= columns))
    && [columns, rows, firstCell, frameCount].every(Number.isSafeInteger)
    && columns > 0 && rows > 0 && firstCell >= 0 && frameCount > 0
    && firstCell + frameCount <= columns * rows && Number.isFinite(beatsPerLoop) && beatsPerLoop > 0;
}

export function playablePerformance(requested: readonly Performer[], clips: Partial<Record<PerformanceId, SpriteClip>>): Performer[] {
  return requested.flatMap(performer => {
    if (isPlayableClip(clips[performer.id])) return [performer];
    const fallback = performer.actor === 'FELICIA' ? 'felicia-dance' : performer.actor === 'WALDO' ? 'waldo-dance' : null;
    return fallback && isPlayableClip(clips[fallback]) ? [PERFORMERS[fallback]] : [];
  });
}

export function performanceCell(positionMs: number, bpm: number, offsetMs: number, clip: SpriteClip, reducedMotion = false): number {
  if (!isPlayableClip(clip)) return 0;
  if (reducedMotion || ![positionMs, bpm, offsetMs].every(Number.isFinite) || bpm < 40 || bpm > 240) return clip.firstCell;
  // Preserve the existing six-pose timing exactly for the original ensemble.
  if (clip.frameCount === 6 && clip.beatsPerLoop === 1) return clip.firstCell + bandFrame(positionMs, bpm, offsetMs);
  const cycleMs = 60000 / bpm * clip.beatsPerLoop;
  const phase = ((positionMs - offsetMs) % cycleMs + cycleMs) % cycleMs;
  return clip.firstCell + Math.min(clip.frameCount - 1, Math.floor(phase / cycleMs * clip.frameCount));
}
