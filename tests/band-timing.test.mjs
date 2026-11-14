import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/bandTiming.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { alignBeatTaps, bandFrame, bandPosition, estimateTempoTaps, readBandTiming } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
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
