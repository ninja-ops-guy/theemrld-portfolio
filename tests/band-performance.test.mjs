import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`;
const timingUrl = moduleUrl(await readFile(new URL('../src/lib/bandTiming.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../src/lib/bandPerformance.ts', import.meta.url), 'utf8')).replace("'./bandTiming'", JSON.stringify(timingUrl));
const { resolvePerformance, readArrangement, playablePerformance, performanceCell, guitarRiffPose, isPlayableClip } = await import(moduleUrl(source));
const { BAND_CLIPS } = await import(moduleUrl(await readFile(new URL('../src/data/bandPerformances.ts', import.meta.url), 'utf8')));
const ids = value => value.map(member => member.id);
const clip = { atlas: 'assets/reviewed-performance.webp', columns: 12, rows: 5, firstCell: 24, frameCount: 12, beatsPerLoop: 2 };

test('unknown songs preserve the ensemble without making up instruments', () => {
  assert.deepEqual(ids(resolvePerformance()), ['k-guitar', 'iona-drums', 'felicia-dance', 'waldo-dance', 'katrin-backswing']);
  assert.equal(ids(resolvePerformance({ instruments: ['synth'] })).includes('waldo-mixing'), false);
});
test('Iona switches at 150 BPM and uses the standard drum clip if the fast clip is unavailable', () => {
  const standard = ids(resolvePerformance({}, undefined, 149.9));
  const fast = resolvePerformance({}, undefined, 150);
  assert.deepEqual(ids(fast), standard.map(id => id === 'iona-drums' ? 'iona-drums-fast' : id));
  assert.deepEqual(ids(resolvePerformance({}, undefined, NaN)), standard);
  assert.deepEqual(ids(playablePerformance(fast, { ...BAND_CLIPS, 'iona-drums-fast': undefined })), standard);
});
test('Iona’s fast clip spans two beats and honors seeks, offset and reduced motion', () => {
  const fast = BAND_CLIPS['iona-drums-fast'];
  assert.ok(isPlayableClip(fast));
  assert.equal(performanceCell(50, 150, 0, fast), 1);
  assert.equal(performanceCell(400, 150, 0, fast), 8);
  assert.equal(performanceCell(799, 150, 0, fast), 15);
  assert.equal(performanceCell(800, 150, 0, fast), 0);
  assert.equal(performanceCell(500, 150, 100, fast), 8);
  assert.equal(performanceCell(400, 150, 0, fast, true), 0);
});
test('electronic, keys and bass can perform together with distinct actor identities', () => {
  const result = resolvePerformance({ instruments: ['electronic', 'synth', 'bass'] });
  assert.deepEqual(ids(result), ['k-guitar', 'iona-drums', 'felicia-synth', 'waldo-mixing', 'mike-bass', 'katrin-backswing']);
  assert.equal(new Set(result.map(member => member.actor)).size, 6);
  assert.equal(result.find(member => member.actor === 'MIKE').role, 'BASS');
});
test('Felicia has separate violin, piano and synth performances', () => {
  for (const instrument of ['violin', 'piano', 'synth']) {
    assert.equal(resolvePerformance({ instruments: [instrument] }).find(member => member.actor === 'FELICIA').id, `felicia-${instrument}`);
  }
});
test('multiple Felicia instruments require a curated lead or a song override', () => {
  assert.ok(ids(resolvePerformance({ instruments: ['violin', 'piano'] })).includes('felicia-dance'));
  assert.ok(ids(resolvePerformance({ instruments: ['violin', 'piano'], feliciaLead: 'piano' })).includes('felicia-piano'));
  assert.ok(ids(resolvePerformance({ instruments: ['violin', 'piano'], feliciaLead: 'synth' })).includes('felicia-dance'));
  assert.ok(ids(resolvePerformance({ instruments: ['violin', 'piano'] }, { waldo: 'dance', felicia: 'violin', mike: 'off' })).includes('felicia-violin'));
});
test('explicit dance and offstage selections override automatic assignments', () => {
  assert.deepEqual(ids(resolvePerformance({ instruments: ['electronic', 'violin', 'bass'] }, { waldo: 'dance', felicia: 'dance', mike: 'off' })),
    ['k-guitar', 'iona-drums', 'felicia-dance', 'waldo-dance', 'katrin-backswing']);
  assert.ok(ids(resolvePerformance({}, { waldo: 'mixing', felicia: 'piano', mike: 'bass' })).includes('mike-bass'));
});
test('bad saved preferences recover field by field without accepting arbitrary actors', () => {
  for (const raw of [null, 'null', '[]', '"bass"', '{']) assert.deepEqual(readArrangement(raw), { waldo: 'auto', felicia: 'auto', mike: 'auto' });
  assert.deepEqual(readArrangement('{"waldo":"mixing","felicia":"iona","mike":"off"}'), { waldo: 'mixing', felicia: 'auto', mike: 'off' });
});
test('missing artwork never relabels dance sprites as instrument performances', () => {
  const clips = Object.fromEntries(['k-guitar', 'iona-drums', 'felicia-dance', 'waldo-dance'].map(id => [id, clip]));
  const requested = resolvePerformance({ instruments: ['electronic', 'piano', 'bass'] });
  assert.deepEqual(ids(playablePerformance(requested, clips)), ['k-guitar', 'iona-drums', 'felicia-dance', 'waldo-dance']);
  assert.deepEqual(playablePerformance(requested, {}), []);
  clips['felicia-piano'] = clip; clips['mike-bass'] = clip;
  assert.deepEqual(ids(playablePerformance(requested, clips)), ['k-guitar', 'iona-drums', 'felicia-piano', 'waldo-dance', 'mike-bass']);
});
test('twelve poses occupy exactly two beats and seek directly into the loop', () => {
  assert.equal(performanceCell(0, 120, 0, clip), 24);
  assert.equal(performanceCell(500, 120, 0, clip), 30);
  assert.equal(performanceCell(999, 120, 0, clip), 35);
  assert.equal(performanceCell(1000, 120, 0, clip), 24);
  assert.equal(performanceCell(0, 120, 500, clip), 30);
  assert.equal(performanceCell(1000, 60, 0, clip), 30);
  assert.equal(performanceCell(500, 120, 0, clip, true), 24);
  assert.equal(performanceCell(NaN, 120, 0, clip), 24);
});
test('Katrin sweeps through 24 poses over two beats, with a still pose for reduced motion', () => {
  const katrin = BAND_CLIPS['katrin-backswing'];
  assert.ok(isPlayableClip(katrin));
  assert.equal(performanceCell(0, 120, 0, katrin), 0);
  assert.equal(performanceCell(500, 120, 0, katrin), 12);
  assert.equal(performanceCell(999, 120, 0, katrin), 23);
  assert.equal(performanceCell(1000, 120, 0, katrin), 0);
  assert.equal(performanceCell(1100, 60, 100, katrin), 12);
  assert.equal(performanceCell(750, 120, 0, katrin, true), 0);
});
test('K alternates four beats of regular guitar with a four-beat riff', () => {
  assert.equal(guitarRiffPose(1999, 120, 0), null);
  assert.deepEqual(guitarRiffPose(2000, 120, 0), { frame: 0, lean: 0 });
  assert.deepEqual(guitarRiffPose(2500, 120, 0), { frame: 2, lean: -17 });
  assert.deepEqual(guitarRiffPose(3999, 120, 0), { frame: 5, lean: -3 });
  assert.equal(guitarRiffPose(4000, 120, 0), null);
  assert.deepEqual(guitarRiffPose(6500, 120, 0), guitarRiffPose(2500, 120, 0));
});
test('K’s riff follows tempo and beat offset and respects reduced motion', () => {
  assert.equal(guitarRiffPose(0, 120, 250), null);
  assert.equal(guitarRiffPose(4499, 60, 500), null);
  assert.deepEqual(guitarRiffPose(5500, 60, 500), guitarRiffPose(2500, 120, 0));
  assert.equal(guitarRiffPose(2500, 120, 0, true), null);
  assert.equal(guitarRiffPose(NaN, 120, 0), null);
});
test('invalid atlas geometry and unsafe paths cannot activate a clip', () => {
  for (const invalid of [undefined, { ...clip, firstCell: 55 }, { ...clip, columns: 0 }, { ...clip, frameCount: 1.5 },
    { ...clip, beatsPerLoop: 0 }, { ...clip, atlas: 'https://example.com/a.png' }, { ...clip, atlas: 'assets/../a.png' },
    { ...clip, strip: { top: 900, height: 300, atlasHeight: 1145, frameWidth: 229 } },
    { ...clip, strip: { top: -1, height: 200, atlasHeight: 1145, frameWidth: 229 } },
    { ...clip, strip: { top: 0, height: 200, atlasHeight: 1145, frameWidth: 0 } }]) {
    assert.equal(isPlayableClip(invalid), false);
  }
  assert.equal(isPlayableClip(clip), true);
});
