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
async function loadModule(path) {
  const absolute = new URL(path, import.meta.url);
  const key = absolute.href;
  if (urls.has(key)) return urls.get(key);
  let source = await readFile(absolute, 'utf8');
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

test('unknown songs show Katrin with the ensemble and expose real instrument choices', async () => {
  const { default: Stage } = await import(await loadModule('../src/sections/KBandStage.tsx'));
  const html = renderToStaticMarkup(React.createElement(Stage, { isPlaying: false, positionMs: 0 }));
  assert.match(html, /data-members="5"/);
  assert.match(html, /data-performance="felicia-dance"/);
  assert.match(html, /data-performance="waldo-dance"/);
  assert.match(html, /Band arrangement/);
  assert.doesNotMatch(html, /<strong>MIKE|disabled|undefined|NaN/);
  assert.match(html, /\/test-base\/assets\/techops-band-ensemble-v1.webp/);
  assert.match(html, /data-performance="katrin-backswing"/);
  assert.match(html, /\/test-base\/assets\/techops-band-katrin-backswing.webp/);
});
test('saved arrangement renders all six performers and each Felicia instrument', async () => {
  const { default: Stage } = await import(await loadModule('../src/sections/KBandStage.tsx'));
  try {
    for (const felicia of ['violin', 'piano', 'synth']) {
      localStorage.getItem = key => key.startsWith('kt-band-arrangement-v1:') ? JSON.stringify({ waldo: 'mixing', felicia, mike: 'bass' }) : null;
      const html = renderToStaticMarkup(React.createElement(Stage, { isPlaying: false, positionMs: 0, trackId: 'test-song' }));
      assert.match(html, /data-members="6"/);
      for (const id of ['waldo-mixing', `felicia-${felicia}`, 'mike-bass', 'katrin-backswing']) assert.ok(html.includes(`data-performance="${id}"`));
      assert.match(html, /\/test-base\/assets\/techops-band-instruments-v1.webp/);
      assert.match(html, /<strong>MIKE<\/strong><small>BASS<\/small>/);
      assert.doesNotMatch(html, /disabled|undefined|NaN/);
    }
  } finally { localStorage.getItem = () => null; }
});
test('published electronic profile automatically switches Waldo without inventing bass guitar', async () => {
  const { default: Stage } = await import(await loadModule('../src/sections/KBandStage.tsx'));
  const html = renderToStaticMarkup(React.createElement(Stage, { isPlaying: false, positionMs: 0, trackId: 'https://soundcloud.com/raikouno/ghost-town' }));
  assert.match(html, /data-performance="waldo-mixing"/);
  assert.match(html, /data-performance="felicia-dance"/);
  assert.doesNotMatch(html, /data-performance="mike-bass"/);
});
test('single-cell sprite sheets produce finite coordinates', async () => {
  const { default: Sprite } = await import(await loadModule('../src/sections/KBandSprite.tsx'));
  const html = renderToStaticMarkup(React.createElement(Sprite, { cell: NaN, columns: 1, rows: 1 }));
  assert.match(html, /background-position:0% 0%/);
  assert.doesNotMatch(html, /NaN|Infinity/);
  const strip = { top: 0, height: 120, atlasHeight: 120, frameWidth: 240 };
  const cropped = renderToStaticMarkup(React.createElement(Sprite, { cell: 0, size: 100, columns: 1, rows: 1, strip }));
  assert.match(cropped, /height:50px/);
  assert.match(cropped, /background-position:0% 0%/);
  assert.doesNotMatch(cropped, /NaN|Infinity/);
});
