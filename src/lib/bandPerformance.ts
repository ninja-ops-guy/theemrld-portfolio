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
export type PerformanceId = 'k-guitar' | 'iona-drums' | 'iona-drums-fast' | 'felicia-dance' | 'waldo-dance'
  | 'waldo-mixing' | 'felicia-violin' | 'felicia-piano' | 'felicia-synth' | 'mike-bass' | 'katrin-backswing';
export type Performer = { id: PerformanceId; actor: 'K' | 'IONA' | 'FELICIA' | 'WALDO' | 'MIKE' | 'KATRIN'; role: string };
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
  'iona-drums-fast': { id: 'iona-drums-fast', actor: 'IONA', role: 'DRUMS' },
  'felicia-dance': { id: 'felicia-dance', actor: 'FELICIA', role: 'BREAKDANCE' },
  'waldo-dance': { id: 'waldo-dance', actor: 'WALDO', role: 'BREAKDANCE' },
  'waldo-mixing': { id: 'waldo-mixing', actor: 'WALDO', role: 'MIXING BOARD' },
  'felicia-violin': { id: 'felicia-violin', actor: 'FELICIA', role: 'VIOLIN' },
  'felicia-piano': { id: 'felicia-piano', actor: 'FELICIA', role: 'PIANO' },
  'felicia-synth': { id: 'felicia-synth', actor: 'FELICIA', role: 'SYNTHESIZER' },
  'mike-bass': { id: 'mike-bass', actor: 'MIKE', role: 'BASS' },
  'katrin-backswing': { id: 'katrin-backswing', actor: 'KATRIN', role: 'BACKSWING STEP' },
};
const FAST_DRUMS_MIN_BPM = 150;
const FALLBACK_PERFORMANCES: Partial<Record<Performer['actor'], PerformanceId>> = {
  IONA: 'iona-drums',
  FELICIA: 'felicia-dance',
  WALDO: 'waldo-dance',
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

export function resolvePerformance(profile: TrackPerformance = {}, choice: Arrangement = DEFAULT_ARRANGEMENT, bpm = 120): Performer[] {
  const instruments = new Set(profile.instruments || []);
  const keys = ['violin', 'piano', 'synth'] as const;
  const presentKeys = keys.filter(key => instruments.has(key));
  // Multiple Felicia instruments need a curated lead or an explicit selection.
  const lead = profile.feliciaLead && instruments.has(profile.feliciaLead)
    ? profile.feliciaLead : presentKeys.length === 1 ? presentKeys[0] : 'dance';
  const felicia = choice.felicia === 'auto' ? lead : choice.felicia;
  const waldo = choice.waldo === 'auto' ? (instruments.has('electronic') ? 'mixing' : 'dance') : choice.waldo;
  const bass = choice.mike === 'bass' || (choice.mike === 'auto' && instruments.has('bass'));
  const drums = bpm >= FAST_DRUMS_MIN_BPM && bpm <= 240 ? 'iona-drums-fast' : 'iona-drums';
  return [PERFORMERS['k-guitar'], PERFORMERS[drums], PERFORMERS[`felicia-${felicia}`],
    PERFORMERS[`waldo-${waldo}`], ...(bass ? [PERFORMERS['mike-bass']] : []), PERFORMERS['katrin-backswing']];
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
    const fallback = FALLBACK_PERFORMANCES[performer.actor];
    return fallback && isPlayableClip(clips[fallback]) ? [PERFORMERS[fallback]] : [];
  });
}

export function performanceCell(positionMs: number, bpm: number, offsetMs: number, clip: SpriteClip, reducedMotion = false): number {
  if (!isPlayableClip(clip)) return 0;
  if (reducedMotion) return clip.firstCell;
  return clip.firstCell + bandFrame(positionMs, bpm, offsetMs, clip.beatsPerLoop, clip.frameCount);
}

// Each group is one beat. Frame numbers refer to K's existing guitar row.
const GUITAR_RIFF_POSES = [
  // Downstroke into the neck lift.
  { frame: 0, lean: 0 }, { frame: 3, lean: -1 }, { frame: 2, lean: -3 },
  { frame: 1, lean: -7 }, { frame: 0, lean: -13 }, { frame: 3, lean: -17 },
  // Hold the guitar high for two beats of fast picking.
  { frame: 2, lean: -17 }, { frame: 4, lean: -18 }, { frame: 5, lean: -18 },
  { frame: 3, lean: -17 }, { frame: 2, lean: -16 }, { frame: 4, lean: -17 },
  { frame: 5, lean: -18 }, { frame: 3, lean: -19 }, { frame: 2, lean: -18 },
  { frame: 4, lean: -19 }, { frame: 5, lean: -16 }, { frame: 3, lean: -14 },
  // Dip and lift once more before returning to the regular strum.
  { frame: 2, lean: -9 }, { frame: 0, lean: -3 }, { frame: 1, lean: -9 },
  { frame: 2, lean: -14 }, { frame: 3, lean: -8 }, { frame: 5, lean: -3 },
] as const;

export function guitarRiffPose(positionMs: number, bpm: number, offsetMs: number, reducedMotion = false) {
  if (reducedMotion || positionMs < offsetMs) return null;
  const rotationBeats = 8;
  const rotationFrames = rotationBeats * 6;
  const frame = bandFrame(positionMs, bpm, offsetMs, rotationBeats, rotationFrames);
  return GUITAR_RIFF_POSES[frame - (rotationFrames - GUITAR_RIFF_POSES.length)] ?? null;
}
