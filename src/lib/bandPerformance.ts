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
  | 'waldo-mixing' | 'felicia-violin' | 'felicia-piano' | 'felicia-synth' | 'mike-bass'
  | 'katrin-backswing' | 'katrin-marmot' | 'manchez-drum-dance';
export type Performer = { id: PerformanceId; actor: 'K' | 'IONA' | 'FELICIA' | 'WALDO' | 'MIKE' | 'KATRIN' | 'MANCHEZ'; role: string };
export const GROUP_SHUFFLE = {
  atlas: 'assets/techops-band-skeleton-shuffle-v1.webp',
  columns: 20,
  rows: 7,
  rowByActor: { K: 0, IONA: 1, FELICIA: 2, WALDO: 3, MIKE: 4, KATRIN: 5, MANCHEZ: 6 } satisfies Record<Performer['actor'], number>,
} as const;

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
  rotation?: { activeBeats: number; intervalBeats: number; restCell: number };
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
  'katrin-marmot': { id: 'katrin-marmot', actor: 'KATRIN', role: 'MARMOT MARCH' },
  'manchez-drum-dance': { id: 'manchez-drum-dance', actor: 'MANCHEZ', role: 'DRUM DANCE' },
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
    PERFORMERS[`waldo-${waldo}`], ...(bass ? [PERFORMERS['mike-bass']] : []),
    PERFORMERS['katrin-backswing'], PERFORMERS['manchez-drum-dance']];
}

export function isPlayableClip(clip: SpriteClip | undefined): clip is SpriteClip {
  if (!clip || !/^assets\/[a-zA-Z0-9/_-]+\.(?:webp|png)$/.test(clip.atlas) || clip.atlas.includes('..')) return false;
  const { columns, rows, firstCell, frameCount, beatsPerLoop, strip, rotation } = clip;
  const validRotation = !rotation || (
    Number.isFinite(rotation.activeBeats) && Number.isFinite(rotation.intervalBeats)
    && rotation.activeBeats > 0 && rotation.activeBeats < rotation.intervalBeats
    && Number.isSafeInteger(rotation.restCell) && rotation.restCell >= 0 && rotation.restCell < columns * rows
    && (!strip || Math.floor(rotation.restCell / columns) === Math.floor(firstCell / columns))
  );
  return validRotation && (!strip || (isSpriteStrip(strip) && firstCell % columns + frameCount <= columns))
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

export function isPerformanceActive(positionMs: number, bpm: number, offsetMs: number, clip: SpriteClip, reducedMotion = false): boolean {
  if (reducedMotion || ![positionMs, bpm, offsetMs].every(Number.isFinite) || bpm < 40 || bpm > 240) return false;
  const { rotation } = clip;
  if (!rotation) return true;
  const elapsedBeats = (positionMs - offsetMs) / (60000 / bpm);
  return elapsedBeats >= 0 && elapsedBeats % rotation.intervalBeats < rotation.activeBeats;
}

export function performanceCell(positionMs: number, bpm: number, offsetMs: number, clip: SpriteClip, reducedMotion = false): number {
  if (!isPlayableClip(clip)) return 0;
  if (!isPerformanceActive(positionMs, bpm, offsetMs, clip, reducedMotion)) return clip.rotation?.restCell ?? clip.firstCell;
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

export function katrinDanceAt(positionMs: number, bpm: number, offsetMs: number, reducedMotion = false): 'katrin-backswing' | 'katrin-marmot' {
  if (reducedMotion || positionMs < offsetMs) return 'katrin-backswing';
  return bandFrame(positionMs, bpm, offsetMs, 8, 2) === 1 ? 'katrin-marmot' : 'katrin-backswing';
}

export function groupShuffleFrame(positionMs: number, bpm: number, offsetMs: number, reducedMotion = false): number | null {
  if (reducedMotion || positionMs < offsetMs) return null;
  // The shuffle runs on beats 3 and 4 of a 16-beat rotation.
  const framesPerBeat = GROUP_SHUFFLE.columns / 2;
  const firstFrame = framesPerBeat * 2;
  const frame = bandFrame(positionMs, bpm, offsetMs, 16, framesPerBeat * 16);
  return frame >= firstFrame && frame < firstFrame + GROUP_SHUFFLE.columns ? frame - firstFrame : null;
}
