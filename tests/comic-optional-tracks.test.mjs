import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

test('every archive catalogue track has a current guided cue or one valid optional scene', () => {
  const { books } = readJson('../src/data/comic-current-editions.json');
  const { cues, quietPages } = readJson('../public/k-world/guided-cues.json');
  const catalogue = readJson('../public/k-world/catalogue.json');
  const optional = readJson('../src/data/comic-optional-tracks.json');
  const guided = new Set(cues.filter(cue => books[cue.edition]).map(cue => cue.url));

  assert.deepEqual(
    optional.map(track => track.url).sort(),
    catalogue.filter(track => !guided.has(track.url)).map(track => track.url).sort()
  );
  for (const track of optional) {
    const book = books[track.edition];
    assert.equal(track.revision, book.revision, track.title);
    assert.ok(track.startPage >= 1 && track.startPage <= track.endPage &&
      track.endPage <= book.pageCount, track.title);
    assert.ok(!quietPages.some(page => page.edition === track.edition &&
      track.startPage <= page.number && page.number <= track.endPage), track.title);
  }
});
