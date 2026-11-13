import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const reader = readFileSync(new URL('../src/pages/LatestComicReader.tsx', import.meta.url), 'utf8');
const correction = readFileSync(new URL('../public/assets/comic/volume-xiii-029-grandfather.webp', import.meta.url));

test('Felicia grandfather artwork is the approved XIII 29 replacement', () => {
  assert.equal(correction.subarray(0, 4).toString(), 'RIFF');
  assert.equal(correction.subarray(8, 12).toString(), 'WEBP');
  assert.equal(createHash('sha256').update(correction).digest('hex'),
    '3428da2138356ed243b0a8419baed0efd4e25ad794990bea4879e359fd5c9e38');
});

test('only XIII page 29 redirects to the corrected local artwork', () => {
  assert.match(reader, /book\.id === 'xiii-r' && page === 29/);
  assert.match(reader, /grandfatherArtFix/);
  assert.match(reader, /\$\{book\.imageBase\}\$\{String\(page\)\.padStart\(3, '0'\)\}\.webp/);
});
