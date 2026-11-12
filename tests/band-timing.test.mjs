import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/bandTiming.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { bandFrame, bandPosition, readBandTiming } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
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
test('invalid preferences safely fall back', () => {
  for (const raw of [null,'{','null','{"bpm":0,"offsetMs":0}','{"bpm":120,"offsetMs":900000}']) assert.deepEqual(readBandTiming(raw),{bpm:120,offsetMs:0});
  assert.deepEqual(readBandTiming('{"bpm":97.5,"offsetMs":230}'),{bpm:97.5,offsetMs:230});assert.equal(bandFrame(NaN),0);
});
