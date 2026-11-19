import type { PerformanceId, SpriteClip, TrackPerformance } from '../lib/bandPerformance';
import type { BandTiming } from '../lib/bandTiming';

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

// Repeating accents measured across the public waveform's 1,800 amplitude bins.
// Offset is relative to an audible pulse; the musical downbeat remains editable.
export const ESTIMATED_TRACK_TIMING: Readonly<Partial<Record<string, BandTiming>>> = {
  // https://wave.sndcdn.com/wMJXDNb5Z3JQ_m.json (89,130 ms)
  'https://soundcloud.com/raikouno/ghost-town': { bpm: 117.12, offsetMs: 185 },
  // https://wave.sndcdn.com/SEL6Haz4oqoa_m.json (247,327 ms)
  'https://soundcloud.com/raikouno/two-cups': { bpm: 152.4, offsetMs: 229 },
  // Additional grids use rising waveform accents. Fit on two thirds, then check
  // the held-out third; all three splits must agree within 55 ms and 0.12 beat.
  // https://wave.sndcdn.com/lovGf5VicqVM_m.json (213,406 ms)
  'https://soundcloud.com/raikouno/3-valentines': { bpm: 115.05, offsetMs: 143 },
  // https://wave.sndcdn.com/LNM7OdoyxNro_m.json (236,606 ms)
  'https://soundcloud.com/raikouno/3-valentines-2-mp3': { bpm: 146, offsetMs: 301 },
  // https://wave.sndcdn.com/BTgQtzDwSSHU_m.json (127,399 ms)
  'https://soundcloud.com/raikouno/404-beat-not-found': { bpm: 163.98, offsetMs: 42 },
  // https://wave.sndcdn.com/65XKuB39MEjy_m.json (24,738 ms)
  'https://soundcloud.com/raikouno/bored-ape': { bpm: 117.08, offsetMs: 110 },
  // https://wave.sndcdn.com/NGpiUBFQwO8F_m.json (196,846 ms)
  'https://soundcloud.com/raikouno/break-out-sequence-wav': { bpm: 118.45, offsetMs: 459 },
  // https://wave.sndcdn.com/Kp8drvnUzjc7_m.json (133,446 ms)
  'https://soundcloud.com/raikouno/came-up-mp3': { bpm: 164.03, offsetMs: 220 },
  // https://wave.sndcdn.com/xRpwlJluq4fZ_m.json (52,166 ms)
  'https://soundcloud.com/raikouno/chillin-mp3': { bpm: 150, offsetMs: 18 },
  // https://wave.sndcdn.com/u7fbkRQoqwLm_m.json (155,006 ms)
  'https://soundcloud.com/raikouno/chivita-mp3': { bpm: 95, offsetMs: 95 },
  // https://wave.sndcdn.com/WuS2f7Mhq2DV_m.json (126,846 ms)
  'https://soundcloud.com/raikouno/damn-robot': { bpm: 171.28, offsetMs: 75 },
  // https://wave.sndcdn.com/za1TqeynhjeV_m.json (149,806 ms)
  'https://soundcloud.com/raikouno/dont-say-sorry-mp3': { bpm: 127.4, offsetMs: 1 },
  // https://wave.sndcdn.com/nQCmf2fW9JdI_m.json (214,686 ms)
  'https://soundcloud.com/raikouno/down-there-again': { bpm: 119.95, offsetMs: 325 },
  // https://wave.sndcdn.com/mywu3E0JhvXo_m.json (187,326 ms)
  'https://soundcloud.com/raikouno/g2u': { bpm: 93.7, offsetMs: 174 },
  // https://wave.sndcdn.com/jlzmmsyitcTF_m.json (51,686 ms)
  'https://soundcloud.com/raikouno/gandala-3': { bpm: 134.05, offsetMs: 408 },
  // https://wave.sndcdn.com/N3mXZF0D6oVg_m.json (62,206 ms)
  'https://soundcloud.com/raikouno/green-mp3': { bpm: 120, offsetMs: 70 },
  // https://wave.sndcdn.com/0Ufuxy7Ad05J_m.json (174,926 ms)
  'https://soundcloud.com/raikouno/help-it-mp3': { bpm: 142.48, offsetMs: 232 },
  // https://wave.sndcdn.com/lmdFdzmSIDLm_m.json (61,166 ms)
  'https://soundcloud.com/raikouno/hunt-down-mp3': { bpm: 135.93, offsetMs: 21 },
  // https://wave.sndcdn.com/GOftCJbQp0iS_m.json (237,766 ms)
  'https://soundcloud.com/raikouno/im-an-alien': { bpm: 110, offsetMs: 183 },
  // https://wave.sndcdn.com/YLj9AuXRSXhN_m.json (67,944 ms)
  'https://soundcloud.com/raikouno/joe-mama': { bpm: 100.05, offsetMs: 66 },
  // https://wave.sndcdn.com/hbO0GsF0TS3Y_m.json (80,406 ms)
  'https://soundcloud.com/raikouno/knot-in-both-sides': { bpm: 155.5, offsetMs: 138 },
  // https://wave.sndcdn.com/W1jxlwUDwHPr_m.json (98,126 ms)
  'https://soundcloud.com/raikouno/male-floridan-my-intuition': { bpm: 138, offsetMs: 126 },
  // https://wave.sndcdn.com/uUK1sZRTUuO8_m.json (139,926 ms)
  'https://soundcloud.com/raikouno/midnight-ritual': { bpm: 165.95, offsetMs: 63 },
  // https://wave.sndcdn.com/73TpuUgCHFag_m.json (134,086 ms)
  'https://soundcloud.com/raikouno/musical-saw': { bpm: 179.95, offsetMs: 49 },
  // https://wave.sndcdn.com/dCkdJBmqqwMm_m.json (64,326 ms)
  'https://soundcloud.com/raikouno/my-song-4dadnm-aggressive': { bpm: 125.68, offsetMs: 322 },
  // https://wave.sndcdn.com/WGkt2W0SxwJM_m.json (166,446 ms)
  'https://soundcloud.com/raikouno/no-stal-juh': { bpm: 105.25, offsetMs: 309 },
  // https://wave.sndcdn.com/cno0PIekW5Iy_m.json (117,891 ms)
  'https://soundcloud.com/raikouno/omg-cool': { bpm: 109.98, offsetMs: 542 },
  // https://wave.sndcdn.com/Kt7ljn4tQgbT_m.json (113,406 ms)
  'https://soundcloud.com/raikouno/pause-bro': { bpm: 144, offsetMs: 75 },
  // https://wave.sndcdn.com/yGSh13nY1wVp_m.json (131,326 ms)
  'https://soundcloud.com/raikouno/present-tense-or-so-i-thought': { bpm: 173.98, offsetMs: 221 },
  // https://wave.sndcdn.com/ZtzvuAXG9G6u_m.json (144,926 ms)
  'https://soundcloud.com/raikouno/rf-geek': { bpm: 154.98, offsetMs: 47 },
  // https://wave.sndcdn.com/7GVvo6gLhlu6_m.json (97,926 ms)
  'https://soundcloud.com/raikouno/sandwich-2': { bpm: 151.05, offsetMs: 46 },
  // https://wave.sndcdn.com/FpIstwzks7qU_m.json (174,766 ms)
  'https://soundcloud.com/raikouno/saudade': { bpm: 78, offsetMs: 116 },
  // https://wave.sndcdn.com/8DaG8RZScbdD_m.json (155,366 ms)
  'https://soundcloud.com/raikouno/stay-out-of-my-city-mp3': { bpm: 165.95, offsetMs: 1 },
  // https://wave.sndcdn.com/93yvXK3MY2z4_m.json (130,606 ms)
  'https://soundcloud.com/raikouno/techops-mp3': { bpm: 124.98, offsetMs: 40 },
  // https://wave.sndcdn.com/vsUAO3abneiG_m.json (91,726 ms)
  'https://soundcloud.com/raikouno/telephone-mp3': { bpm: 179.95, offsetMs: 88 },
  // https://wave.sndcdn.com/h0moNiOkWrPC_m.json (196,686 ms)
  'https://soundcloud.com/raikouno/u-think-u-know-music-mp3': { bpm: 111, offsetMs: 45 },
  // https://wave.sndcdn.com/cBbbOCIxRXQt_m.json (66,325 ms)
  'https://soundcloud.com/raikouno/untitled-song-1': { bpm: 104.75, offsetMs: 543 },
  // https://wave.sndcdn.com/6lhmTESC4eyE_m.json (165,006 ms)
  'https://soundcloud.com/raikouno/waiting-patience-ay-mp3': { bpm: 165.05, offsetMs: 74 },
  // https://wave.sndcdn.com/HGVjaRUlVHO1_m.json (60,046 ms)
  'https://soundcloud.com/raikouno/winter-2-mp3': { bpm: 119.75, offsetMs: 52 },
  // https://wave.sndcdn.com/eGrbyTZrySMG_m.json (88,446 ms)
  'https://soundcloud.com/raikouno/woke-in-a-crypt': { bpm: 121.8, offsetMs: 78 },
  // https://wave.sndcdn.com/Rq7sW7dkxitK_m.json (72,406 ms)
  'https://soundcloud.com/raikouno/yassir-mp3': { bpm: 140.03, offsetMs: 39 },
};
