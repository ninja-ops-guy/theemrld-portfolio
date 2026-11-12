import test from 'node:test';
import assert from 'node:assert/strict';
import { songQuery, findSongMatches, resolveSong, playSuggestions, completePlayCommand } from '../public/k-world/song-search.js';

const song = (id, title, slug = String(id)) => ({ id, slot: id + 100, title, url: `https://soundcloud.com/raikouno/${slug}` });
const tracks = [song(1, 'Two cups'), song(2, 'BLACK BSIDE'), song(3, 'BLACK'),
  song(4, '3 valentines'), song(5, "When It’s All Done"), song(6, 'When It’s All Done (Minor Dream Mix)'),
  song(7, 'RIDE OR DIE'), song(8, 'Érosion of the Self')];

test('full titles win over partial matches without choosing an ambiguous title', () => {
  assert.equal(resolveSong(tracks, 'black').track.id, 3);
  assert.equal(resolveSong(tracks, 'when').track, null);
  assert.equal(resolveSong(tracks, 'when').matches.length, 2);
  assert.equal(resolveSong(tracks, 'cups').track.id, 1);
});

test('title search ignores case, accents and punctuation and supports multiple words', () => {
  assert.equal(resolveSong(tracks, '  "TWO CUPS" ').track.id, 1);
  assert.equal(resolveSong(tracks, "when it's all done").track.id, 5);
  assert.equal(resolveSong(tracks, 'ride-or-die').track.id, 7);
  assert.equal(resolveSong(tracks, 'erosion self').track.id, 8);
  assert.equal(resolveSong(tracks, 'minor done').track.id, 6);
});

test('number parsing cannot accidentally play an unrelated song for a numeric title prefix', () => {
  assert.equal(resolveSong(tracks, '3').track.id, 3);
  assert.equal(resolveSong(tracks, '3 valentines').track.id, 4);
  assert.equal(resolveSong(tracks, '3garbage').track, null);
  assert.equal(resolveSong(tracks, '999').track, null);
  assert.equal(resolveSong(tracks, '103', 'slot').track.id, 3);
});

test('no matches and duplicate titles leave playback unresolved', () => {
  assert.deepEqual(resolveSong(tracks, 'unknown'), { track: null, matches: [] });
  const duplicates = [song(1, 'Same title'), song(2, 'Same title')];
  assert.equal(resolveSong(duplicates, 'same title').track, null);
  assert.equal(completePlayCommand(duplicates[1], duplicates), 'play '+duplicates[1].url);
});

test('autocomplete is contextual, ordered and bounded', () => {
  assert.deepEqual(playSuggestions(tracks, 'pause'), []);
  assert.deepEqual(playSuggestions(tracks, 'playlist cups'), []);
  assert.deepEqual(playSuggestions(tracks, 'play https://soundcloud.com/raikouno/two-cups'), []);
  assert.equal(playSuggestions(tracks, 'PLAY black')[0].id, 3);
  assert.equal(playSuggestions(tracks, 'play "two c')[0].id, 1);
  assert.equal(playSuggestions(tracks, 'song cups')[0].id, 1);
  assert.equal(playSuggestions(tracks, 'track cups')[0].id, 1);
  assert.equal(playSuggestions([...tracks, song(9, 'Extra')], 'play ').length, 8);
});

test('autocomplete preserves complete names and uses URLs for reserved or numeric titles', () => {
  assert.equal(completePlayCommand(tracks[3], tracks), 'play 3 valentines');
  for (const title of ['123', 'latest']) {
    const track = song(10, title);
    assert.equal(completePlayCommand(track, [track]), 'play '+track.url);
  }
  assert.equal(songQuery("'When It's All Done'"), "When It's All Done");
});

test('catalogue additions are immediately searchable and duplicate URLs are collapsed', () => {
  const newest = song(99, 'New arrival');
  assert.deepEqual(playSuggestions(tracks, 'play arrival'), []);
  assert.deepEqual(playSuggestions([...tracks, newest, newest], 'play arrival'), [newest]);
  assert.equal(findSongMatches([null, {}, ...tracks], 'two').length, 1);
});
