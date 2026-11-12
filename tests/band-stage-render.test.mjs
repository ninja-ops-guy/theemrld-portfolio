import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const urls = new Map();
const mockedClips = new Set();
async function loadModule(path) {
  const absolute = new URL(path, import.meta.url);
  const key = absolute.href;
  if (urls.has(key)) return urls.get(key);
  let source = await readFile(absolute, 'utf8');
  if (path.endsWith('/bandPerformances.ts') && mockedClips.size) {
    source += `\n${[...mockedClips].map(id => `BAND_CLIPS[${JSON.stringify(id)}] = { atlas: 'assets/test-only.webp', columns: 12, rows: 1, firstCell: 0, frameCount: 12, beatsPerLoop: 2 };`).join('\n')}`;
    source += "\nTRACK_PERFORMANCES['test-song'] = { instruments: ['electronic', 'violin', 'bass'] };";
  }
  let output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  output = output.replaceAll('import.meta.env.BASE_URL', JSON.stringify('/test-base/'));
  const imports = [...output.matchAll(/from ["']([^"']+)["']/g)];
  for (const match of imports) {
    const specifier = match[1];
    let replacement;
    if (specifier.startsWith('.')) {
      const extension = specifier.endsWith('KBandSprite') ? '.tsx' : '.ts';
      replacement = await loadModule(new URL(specifier + extension, absolute).href);
    } else replacement = pathToFileURL(require.resolve(specifier)).href;
    output = output.replace(match[0], `from ${JSON.stringify(replacement)}`);
  }
  const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
  urls.set(key, url);
  return url;
}
globalThis.window = { matchMedia: () => ({ matches: true }) };
globalThis.localStorage = { getItem: () => null };

test('actual stage keeps current performers and hides unavailable instrument choices', async () => {
  const { default: Stage } = await import(await loadModule('../src/sections/KBandStage.tsx'));
  const html = renderToStaticMarkup(React.createElement(Stage, { isPlaying: false, positionMs: 0 }));
  assert.match(html, /data-members="4"/);
  assert.match(html, /data-performance="felicia-dance"/);
  assert.match(html, /data-performance="waldo-dance"/);
  assert.doesNotMatch(html, /Band arrangement|MIKE|undefined|NaN/);
  assert.match(html, /\/test-base\/assets\/techops-band-ensemble-v1.webp/);
});
test('actual stage renders five distinct performers when test clips and a profile are registered', async () => {
  urls.clear();
  for (const id of ['waldo-mixing', 'felicia-violin', 'mike-bass']) mockedClips.add(id);
  const { default: Stage } = await import(await loadModule('../src/sections/KBandStage.tsx'));
  const html = renderToStaticMarkup(React.createElement(Stage, { isPlaying: false, positionMs: 0, trackId: 'test-song' }));
  assert.match(html, /data-members="5"/);
  for (const id of mockedClips) assert.ok(html.includes(`data-performance="${id}"`));
  assert.match(html, /Band arrangement/);
  assert.match(html, /<option value="piano" disabled=""/);
  assert.match(html, /<strong>MIKE<\/strong><small>BASS<\/small>/);
  assert.doesNotMatch(html, /undefined|NaN/);
});
test('single-cell sprite sheets produce finite coordinates', async () => {
  const { default: Sprite } = await import(await loadModule('../src/sections/KBandSprite.tsx'));
  const html = renderToStaticMarkup(React.createElement(Sprite, { cell: NaN, columns: 1, rows: 1 }));
  assert.match(html, /background-position:0% 0%/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
