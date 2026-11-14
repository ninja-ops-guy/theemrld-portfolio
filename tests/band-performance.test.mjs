import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`;
const timingUrl = moduleUrl(await readFile(new URL('../src/lib/bandTiming.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../src/lib/bandPerformance.ts', import.meta.url), 'utf8')).replace("'./bandTiming'", JSON.stringify(timingUrl));
const { resolvePerformance, readArrangement, playablePerformance, performanceCell, guitarRiffPose, isPlayableClip, katrinDanceAt, GROUP_SHUFFLE, groupShuffleFrame, groupDanceAt, groupDancePose, soloDancePose } = await import(moduleUrl(source));
const { BAND_CLIPS } = await import(moduleUrl(await readFile(new URL('../src/data/bandPerformances.ts', import.meta.url), 'utf8')));
const ids = value => value.map(member => member.id);
const clip = { atlas: 'assets/reviewed-performance.webp', columns: 12, rows: 5, firstCell: 24, frameCount: 12, beatsPerLoop: 2 };

test('unknown songs preserve the ensemble without making up instruments', () => {
  assert.deepEqual(ids(resolvePerformance()), ['k-guitar', 'iona-drums', 'felicia-dance', 'waldo-dance', 'katrin-backswing', 'manchez-drum-dance']);
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
  assert.deepEqual(ids(result), ['k-guitar', 'iona-drums', 'felicia-synth', 'waldo-mixing', 'mike-bass', 'katrin-backswing', 'manchez-drum-dance']);
  assert.equal(new Set(result.map(member => member.actor)).size, 7);
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
    ['k-guitar', 'iona-drums', 'felicia-dance', 'waldo-dance', 'katrin-backswing', 'manchez-drum-dance']);
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
test('Katrin alternates complete four-beat phrases using the current tempo and offset', () => {
  assert.equal(katrinDanceAt(1999, 120, 0), 'katrin-backswing');
  assert.equal(katrinDanceAt(2000, 120, 0), 'katrin-marmot');
  assert.equal(katrinDanceAt(3999, 120, 0), 'katrin-marmot');
  assert.equal(katrinDanceAt(4000, 120, 0), 'katrin-backswing');
  assert.equal(katrinDanceAt(1749, 160, 250), 'katrin-backswing');
  assert.equal(katrinDanceAt(1750, 160, 250), 'katrin-marmot');
  assert.equal(katrinDanceAt(0, 120, 3000), 'katrin-backswing');
  assert.equal(katrinDanceAt(2250, 120, 0, true), 'katrin-backswing');
  assert.equal(katrinDanceAt(NaN, 120, 0), 'katrin-backswing');
  const march = BAND_CLIPS['katrin-marmot'];
  assert.ok(isPlayableClip(march));
  assert.equal(performanceCell(2000, 120, 0, march), 0);
  assert.equal(performanceCell(2250, 120, 0, march), 6);
  assert.equal(performanceCell(3999, 120, 0, march), 47);
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

test('Manchez alternates four active beats with four resting beats on the playback clock', () => {
  const guest = BAND_CLIPS['manchez-drum-dance'];
  assert.equal(isPlayableClip(guest), true);
  assert.equal(isPlayableClip({ ...guest, rotation: { ...guest.rotation, restCell: 4 } }), false);
  assert.equal(isPlayableClip({ ...guest, rotation: { ...guest.rotation, intervalBeats: 4 } }), false);
  assert.equal(performanceCell(99, 120, 100, guest), 0);
  assert.deepEqual([100, 150, 195, 225].map(ms => performanceCell(ms, 120, 100, guest)), [1, 2, 3, 1]);
  assert.equal(performanceCell(2099, 120, 100, guest), 3);
  assert.equal(performanceCell(2100, 120, 100, guest), 0);
  assert.equal(performanceCell(4100, 120, 100, guest), 1);
  assert.equal(performanceCell(4100, 60, 100, guest), 0);
  assert.equal(performanceCell(150, 120, 100, guest, true), 0);
});

test('the group shuffle covers each band member and cycles for two beats', () => {
  const fullBand = resolvePerformance({ instruments: ['bass'] });
  assert.deepEqual(Object.keys(GROUP_SHUFFLE.rowByActor).sort(), fullBand.map(member => member.actor).sort());
  assert.deepEqual(Object.values(GROUP_SHUFFLE.rowByActor), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual([999, 1000, 1500, 1999, 2000, 9000].map(ms => groupShuffleFrame(ms, 120, 0)),
    [null, 0, 10, 19, null, 0]);
});
test('the group shuffle respects the beat offset, seeks and reduced motion', () => {
  assert.equal(groupShuffleFrame(200, 60, 1000), null);
  assert.equal(groupShuffleFrame(3000, 60, 1000), 0);
  assert.equal(groupShuffleFrame(4500, 60, 1000), 15);
  assert.equal(groupShuffleFrame(5000, 60, 1000), null);
  assert.equal(groupShuffleFrame(1250, 120, 0, true), null);
  assert.equal(groupShuffleFrame(NaN, 120, 0), null);
  assert.equal(groupShuffleFrame(1250, 300, 0), null);
});

test('solo routines alternate across four-beat phrases and exclude instrument players', () => {
  assert.equal(soloDancePose('felicia-dance', 250, 120, 0).name, 'scissor-kick');
  assert.equal(soloDancePose('felicia-dance', 2250, 120, 0).name, 'kick-and-hold');
  assert.equal(soloDancePose('waldo-dance', 250, 120, 0).name, 'low-sweep');
  assert.equal(soloDancePose('waldo-dance', 2250, 120, 0).name, 'one-arm-freeze');
  assert.equal(soloDancePose('waldo-dance', 2550, 120, 0).frame, 3);
  assert.equal(soloDancePose('waldo-mixing', 2550, 120, 0), null);
  assert.equal(soloDancePose('felicia-dance', 49, 120, 50), null);
});

test('ensemble routines use the same beat grid and alternate the response across actors', () => {
  assert.deepEqual([1000, 3999, 4000, 4999, 5000, 7000, 7999, 8000].map(position => groupDanceAt(position, 120, 0)?.name),
    ['skeleton-shuffle', undefined, 'two-step', 'two-step', undefined, 'call-and-response', 'call-and-response', undefined]);
  const twoStep = groupDanceAt(4250, 120, 0);
  assert.deepEqual(groupDanceAt(3450, 150, 50), twoStep);
  assert.equal(groupDancePose(twoStep, 'K').cell, 5);
  const response = groupDanceAt(7000, 120, 0);
  assert.equal(groupDancePose(response, 'K').cell, 0);
  assert.equal(groupDancePose(response, 'IONA').cell, GROUP_SHUFFLE.columns + 8);
  assert.equal(groupDancePose(groupDanceAt(7500, 120, 0), 'IONA').cell, GROUP_SHUFFLE.columns);
});
