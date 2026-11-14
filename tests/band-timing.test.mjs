import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/bandTiming.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const {
  alignBeatTaps, bandFrame, bandPhraseOffset, bandPosition, estimateTempoTaps,
  markBandDownbeat, readBandClock, readBandTiming, updateBandClock,
} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('six poses follow BPM, offset and seeks directly', () => {
  assert.equal(bandFrame(0),0);assert.equal(bandFrame(250),3);assert.equal(bandFrame(500),0);
  assert.equal(bandFrame(350,120,100),3);assert.equal(bandFrame(250,60),1);
  assert.equal(bandFrame(0,120,250),3);assert.equal(bandFrame(10000),0);assert.equal(bandFrame(250),3);
});
test('pause freezes, stalled provider caps extrapolation and rate is respected', () => {
  assert.equal(bandPosition(1000,200,false),1000);assert.equal(bandPosition(1000,200,true),1200);
  assert.equal(bandPosition(1000,5000,true),1350);assert.equal(bandPosition(1000,200,true,2),1400);
  assert.equal(bandPosition(1000,-10,true),1000);
});
test('invalid preferences leave the track default available', () => {
  for (const raw of [null,'{','null','{"bpm":0,"offsetMs":0}','{"bpm":120,"offsetMs":900000}']) assert.equal(readBandTiming(raw), null);
  assert.deepEqual(readBandTiming('{"bpm":97.5,"offsetMs":230}'),{bpm:97.5,offsetMs:230});assert.equal(bandFrame(NaN),0);
});
function tapsAt(beatMs, firstBeat, count, rate = 1, jitter = []) {
  return Array.from({ length: count }, (_, index) => {
    const elapsed = index * beatMs + (jitter[index] ?? 0);
    return { at: 37 + elapsed / rate, position: firstBeat + elapsed };
  });
}

test('four taps align the phase at the original tempo without resetting the phrase clock', () => {
  const original = { bpm: 117.12, offsetMs: 185 };
  const beatMs = 60000 / original.bpm;
  for (const rate of [0.5, 1, 2]) {
    const taps = tapsAt(beatMs, 205 + 21 * beatMs, 4, rate, [25]);
    assert.deepEqual(alignBeatTaps(taps, rate, original), { bpm: 117.12, offsetMs: 211 });
  }
  const total = 60 * 60000 / original.bpm;
  const before = bandFrame(total + 300, original.bpm, original.offsetMs, 16, 64);
  const after = alignBeatTaps(tapsAt(beatMs, 205 + 21 * beatMs, 4), 1, original);
  assert.equal(bandFrame(total + 300, after.bpm, after.offsetMs, 16, 64), before);
});

test('phase calibration requires four consecutive taps matching the saved pulse and transport', () => {
  const original = { bpm: 152.4, offsetMs: 229 };
  const beatMs = 60000 / original.bpm;
  assert.equal(alignBeatTaps(tapsAt(beatMs, 229, 3), 1, original), null);
  assert.equal(alignBeatTaps(tapsAt(beatMs * 2, 229, 4), 1, original), null);
  assert.equal(alignBeatTaps(tapsAt(60000 / 59.5, 229, 4), 1, original), null);
  const staleTaps = tapsAt(beatMs, 229, 4).map(tap => ({ ...tap, position: 229 }));
  assert.equal(alignBeatTaps(staleTaps, 1, original), null);
});

test('explicit tempo estimate requires a longer, consistent sequence and accounts for playback rate', () => {
  for (const rate of [0.5, 1, 2]) {
    const taps = tapsAt(400, 752, 12, rate);
    assert.deepEqual(estimateTempoTaps(taps, rate, 0), { bpm: 150, offsetMs: -48 });
    assert.equal(estimateTempoTaps(taps.slice(0, 4), rate, 0), null);
    assert.equal(estimateTempoTaps(tapsAt(400, 752, 12, rate, [0, 100]), rate, 0), null);
    const jitterFit = estimateTempoTaps(tapsAt(400, 752, 12, rate, [25]), rate, 0);
    assert.ok(Math.abs(jitterFit.bpm - 150) < 0.4);
  }
});

test('small playback delivery jitter eases in both directions without a frame jump', () => {
  const sample = (positionMs, sampledAt) => ({ positionMs, sampledAt, playing: true, rate: 1, epoch: 1 });
  const first = updateBandClock(null, sample(1000, 100));
  const late = updateBandClock(first, sample(1135, 250));
  assert.equal(readBandClock(late, 250), readBandClock(first, 250));
  assert.equal(readBandClock(late, 450), 1335);
  const early = updateBandClock(late, sample(1275, 350));
  assert.equal(readBandClock(early, 350), readBandClock(late, 350));
  assert.equal(readBandClock(early, 550), 1475);
  const positions = Array.from({ length: 21 }, (_, index) => readBandClock(early, 350 + index * 10));
  assert.ok(positions.every((position, i) => i === 0 || position > positions[i - 1]));
});

test('duplicate positions expire while seeks, pauses, rate changes, and stall recovery re-anchor', () => {
  const sample = { positionMs: 1000, sampledAt: 100, playing: true, rate: 1, epoch: 1 };
  const clock = updateBandClock(null, sample);
  assert.equal(updateBandClock(clock, { ...sample, positionMs: 900, sampledAt: 90 }), clock);
  const repeat = updateBandClock(clock, { ...sample, sampledAt: 550 });
  assert.equal(repeat, clock);
  assert.equal(readBandClock(repeat, 900), 1350);

  const recovered = updateBandClock(repeat, { ...sample, positionMs: 1410, sampledAt: 600 });
  assert.equal(readBandClock(recovered, 600), 1410);
  const seek = updateBandClock(clock, { ...sample, positionMs: 1110, sampledAt: 150, epoch: 2 });
  assert.equal(readBandClock(seek, 150), 1110);
  const paused = updateBandClock(seek, { ...seek, positionMs: 1140, sampledAt: 195, playing: false });
  assert.equal(readBandClock(paused, 1000), 1140);
  const resumed = updateBandClock(paused, { ...paused, sampledAt: 1000, playing: true });
  assert.equal(readBandClock(resumed, 1100), 1240);
  const faster = updateBandClock(resumed, { ...resumed, positionMs: 1245, sampledAt: 1100, rate: 2 });
  assert.equal(readBandClock(faster, 1200), 1445);
});

test('marking a phrase aligns the pulse and counts backward from the marked downbeat', () => {
  const timing = markBandDownbeat(5250, 120);
  assert.deepEqual(timing, { bpm: 120, offsetMs: -250, downbeatMs: 5250 });
  assert.deepEqual(readBandTiming(JSON.stringify(timing)), timing);
  assert.deepEqual(readBandTiming(JSON.stringify({ ...timing, downbeatMs: -1 })), { bpm: 120, offsetMs: -250 });
  const origin = bandPhraseOffset(timing);
  assert.equal(origin, -2750);
  assert.equal(bandFrame(5250, 120, origin, 16, 64), 0);
  assert.equal(bandFrame(1250, 120, origin, 16, 64), 32);
  assert.equal(bandFrame(9250, 120, origin, 16, 64), 32);

  const aligned = alignBeatTaps(tapsAt(500, 5275, 4), 1, timing);
  assert.deepEqual(aligned, { ...timing, offsetMs: -225 });
  assert.equal(bandFrame(5275, 120, bandPhraseOffset(aligned), 16, 64), 0);
  assert.equal(bandPhraseOffset({ bpm: 152.4, offsetMs: 229 }), 229);
});

test('an exact bar boundary lands on the next frame at fractional tempos', () => {
  for (const bpm of [117.12, 152.4]) {
    const beatMs = 60000 / bpm;
    const offsetMs = bandPhraseOffset(markBandDownbeat(45000, bpm));
    for (let loop = 0; loop < 48; loop++) {
      const boundary = offsetMs + loop * 16 * beatMs;
      assert.equal(bandFrame(boundary, bpm, offsetMs, 16, 64), 0);
      assert.equal(bandFrame(boundary - 1, bpm, offsetMs, 16, 64), 63);
    }
  }
});
