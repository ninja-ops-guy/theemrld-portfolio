import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`;
const timingUrl = moduleUrl(await readFile(new URL('../src/lib/bandTiming.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../src/lib/bandPerformance.ts', import.meta.url), 'utf8')).replace("'./bandTiming'", JSON.stringify(timingUrl));
const { resolvePerformance, readArrangement, playablePerformance, performanceCell, isPlayableClip } = await import(moduleUrl(source));
const ids = value => value.map(member => member.id);
const clip = { atlas: 'assets/reviewed-performance.webp', columns: 12, rows: 5, firstCell: 24, frameCount: 12, beatsPerLoop: 2 };

test('unknown songs preserve the ensemble without making up instruments', () => {
  assert.deepEqual(ids(resolvePerformance()), ['k-guitar', 'iona-drums', 'felicia-dance', 'waldo-dance']);
  assert.equal(ids(resolvePerformance({ instruments: ['synth'] })).includes('waldo-mixing'), false);
});
test('electronic, keys and bass can perform together with distinct actor identities', () => {
  const result = resolvePerformance({ instruments: ['electronic', 'synth', 'bass'] });
  assert.deepEqual(ids(result), ['k-guitar', 'iona-drums', 'felicia-synth', 'waldo-mixing', 'mike-bass']);
  assert.equal(new Set(result.map(member => member.actor)).size, 5);
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
    ['k-guitar', 'iona-drums', 'felicia-dance', 'waldo-dance']);
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
test('invalid atlas geometry and unsafe paths cannot activate a clip', () => {
  for (const invalid of [undefined, { ...clip, firstCell: 55 }, { ...clip, columns: 0 }, { ...clip, frameCount: 1.5 },
    { ...clip, beatsPerLoop: 0 }, { ...clip, atlas: 'https://example.com/a.png' }, { ...clip, atlas: 'assets/../a.png' }]) {
    assert.equal(isPlayableClip(invalid), false);
  }
  assert.equal(isPlayableClip(clip), true);
});
