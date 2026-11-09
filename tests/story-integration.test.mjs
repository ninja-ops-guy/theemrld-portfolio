// Static integration contracts, not a substitute for browser interaction tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('classic terminal is wrapped without replacing the persistent music host', () => {
  const app = source('src/App.tsx');
  assert.match(app, /<StoryTerminal><KTerminal \/><\/StoryTerminal>/);
  assert.match(app, /<AsciiCityWorld><Routes>/);
  assert.match(app, /<FourBeatPulse label="Opening TechOps Hero" repeat \/>/);
});
test('only terminal text input receives book-command interception', () => {
  const terminal = source('src/components/StoryTerminal.tsx');
  assert.match(terminal, /input\.matches\('\.kt-input'\)/);
  assert.match(terminal, /event\.nativeEvent\.isComposing/);
  assert.match(terminal, /if \(!result\) return/);
  assert.doesNotMatch(terminal, /useEffect|playTrack\(target\.cue, false\)/);
  assert.match(terminal, /else playTrack\(target\.cue, true\)/);
  assert.match(terminal, /sendCommand\('resume'\)/);
});
test('bookmarks are written only after successful page-image load', () => {
  const reader = source('src/pages/TechOpsComic.tsx');
  const callback = reader.slice(reader.indexOf('const markPageLoaded'), reader.indexOf('const alternateEdition'));
  assert.match(callback, /currentPage\.current !== pageKey/);
  assert.match(callback, /rememberReaderPosition/);
  assert.equal((reader.match(/localStorage\.setItem\(bookmarkKey/g) || []).length, 1);
  assert.equal((reader.match(/onLoad=\{markPageLoaded\}/g) || []).length, 2);
  assert.match(reader, /aria-busy=\{loadedPage !== pageKey\}/);
});
test('page cues use the existing active score and mark local previews', () => {
  const bar = source('src/components/ComicMusicBar.tsx');
  assert.match(bar, /api\?\.soundtrackHref\(score, position\)/);
  assert.match(bar, /Listen in K Terminal/);
  assert.match(bar, /Local preview · this device only/);
  assert.match(bar, /no assigned track yet/);
});
test('silent four-beat motif has a reduced-motion fallback', () => {
  const component = source('src/components/FourBeatPulse.tsx');
  assert.match(component, /\['One\.', 'Two\.', 'Three—', 'Four\.'\]/);
  assert.match(component, /aria-hidden="true"/);
  assert.doesNotMatch(component, /setTimeout|AudioContext|\.play\(/);
  assert.match(source('src/components/FourBeatPulse.css'), /prefers-reduced-motion: reduce/);
});
test('public JavaScript uses a runtime import, not a Vite public-directory import', () => {
  assert.match(source('src/hooks/useStoryApi.ts'), /import\(\/\* @vite-ignore \*\//);
  for (const file of ['src/components/StoryTerminal.tsx','src/components/ComicMusicBar.tsx','src/hooks/useReaderPosition.ts']) {
    assert.doesNotMatch(source(file), /^import (?!type).*from ['"].*public\//m);
  }
});
