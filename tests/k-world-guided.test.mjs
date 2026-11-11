import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDED_EDITIONS, emptyGuidedScore, validateGuidedScore, parseGuidedScore, resolveGuidedCue, cueKey, guidedTrackUrl } from '../public/k-world/guided.js';

const cue = (overrides = {}) => ({ id: 'opening-song', edition: 'f', startPage: 3, endPage: 8, title: 'Chosen song', url: 'https://soundcloud.com/raikouno/chosen-song', ...overrides });
const scoreWith = (...cues) => validateGuidedScore({ ...emptyGuidedScore(), cues });
const at = (page, edition = 'f', revision = GUIDED_EDITIONS[edition].revision) => ({ edition, page, revision });

test('The published score follows the approved Iona scenes in the Full collection', () => {
  const score = parseGuidedScore(readFileSync(new URL('../public/k-world/guided-cues.json', import.meta.url), 'utf8'));
  assert.deepEqual(score.cues.map(({ edition, startPage, endPage, title }) => [edition, startPage, endPage, title]), [
    ['g', 55, 55, 'Time Crumbles'],
    ['g', 56, 56, 'RIDE OR DIE'],
    ['g', 57, 57, 'Somewhere Deep Down Below'],
    ['g', 117, 119, 'AGAMEMNON'],
    ['g', 137, 138, 'The Mercy I Buried'],
    ['g', 207, 211, 'RIDE OR DIE'],
  ]);
  assert.equal(resolveGuidedCue(score, at(137, 'g')).id, 'iona-building-blast');
  for (const page of [54, 58, 116, 120, 136, 139, 206, 212]) {
    assert.equal(resolveGuidedCue(score, at(page, 'g')), null);
  }
  assert.equal(resolveGuidedCue(score, at(137, 'g', 'future-revision')), null);
});

test('Current edition limits bind to the publication; archived scores retain their original stamps', () => {
  const json = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
  for (const [id, book] of Object.entries(json('comic-current-editions').books)) {
    assert.equal(GUIDED_EDITIONS[id].pageCount, book.pageCount);
    assert.equal(GUIDED_EDITIONS[id].revision, book.revision);
  }
  const historicalF = JSON.parse(readFileSync(new URL('../docs/COMIC_CURRENT_RELEASE.json', import.meta.url), 'utf8'));
  assert.equal(GUIDED_EDITIONS.f.pageCount, json('comic-revision-f').pageCount);
  assert.equal(GUIDED_EDITIONS.f.revision, historicalF.reader_revision);
  assert.equal(GUIDED_EDITIONS.xiii.pageCount, json('comic-volume-thirteen').pageCount);
  assert.equal(GUIDED_EDITIONS.xiii.revision, json('comic-volume-thirteen').artRevision);
  assert.equal(GUIDED_EDITIONS.legacy.pageCount, json('comic-descriptions').length + json('comic-volume-five').descriptions.length);
  assert.equal(GUIDED_EDITIONS.legacy.revision, '11.2');
});

test('Soundtrack creation offers current books only and never silently remaps retired cues', () => {
  const source = readFileSync(new URL('../src/components/GuidedScoreDialog.tsx', import.meta.url), 'utf8');
  assert.ok(source.includes("edition: 'g' as GuidedEdition"));
  assert.ok(source.includes('Object.entries(displayLabels).map'));
  assert.ok(!source.includes('Object.entries(GUIDED_EDITIONS).map'));
  assert.ok(source.includes('if (!Object.prototype.hasOwnProperty.call(displayLabels, cue.edition))'));
  const historical = scoreWith(cue());
  assert.equal(resolveGuidedCue(historical, at(3, 'g')), null);
  assert.equal(resolveGuidedCue(historical, at(3, 'xiii-r')), null);
});

test('One cue stays stable across its inclusive range; unassigned pages are silent', () => {
  const score = scoreWith(cue());
  const first = resolveGuidedCue(score, at(3));
  assert.ok(first);
  for (let page = 3; page <= 8; page++) assert.equal(cueKey(resolveGuidedCue(score, at(page))), cueKey(first));
  for (const page of [0, 1, 2, 9, 317]) assert.equal(resolveGuidedCue(score, at(page)), null);
});

test('Direct jumps and backwards navigation select the visible range', () => {
  const score = scoreWith(cue(), cue({ id: 'later-song', startPage: 20, endPage: 25, url: 'https://soundcloud.com/raikouno/later-song' }));
  assert.equal(resolveGuidedCue(score, at(23)).id, 'later-song');
  assert.equal(resolveGuidedCue(score, at(6)).id, 'opening-song');
  assert.equal(resolveGuidedCue(score, at(15)), null);
});

test('Same page numbers in another edition never trigger a cue', () => {
  const score = scoreWith(cue());
  assert.equal(resolveGuidedCue(score, at(3, 'xiii')), null);
  assert.equal(resolveGuidedCue(score, at(3, 'legacy')), null);
});

test('Revision mismatch fails silent until the score is consciously rebound', () => {
  const score = scoreWith(cue());
  assert.equal(resolveGuidedCue(score, at(3, 'f', 'different-reordered-edition')), null);
  const older = validateGuidedScore({ ...score, editions: { ...score.editions, f: 'older-revision' } });
  assert.equal(resolveGuidedCue(older, at(3)), null);
  assert.equal(resolveGuidedCue(older, at(3, 'f', 'older-revision')).id, 'opening-song');
});

test('Reject overlapping cues and duplicate identity without rejecting adjacent ranges', () => {
  assert.throws(() => scoreWith(cue(), cue({ id: 'second', startPage: 8, endPage: 11 })), /overlap/);
  assert.throws(() => scoreWith(cue(), cue({ startPage: 9, endPage: 11 })), /Duplicate/);
  assert.equal(scoreWith(cue(), cue({ id: 'second', startPage: 9, endPage: 11 })).cues.length, 2);
  assert.equal(scoreWith(cue(), cue({ id: 'another-edition', edition: 'xiii' })).cues.length, 2);
});

test('Malformed, inverted and out-of-range pages cannot apply', () => {
  for (const pages of [{ startPage: '3' }, { startPage: 0 }, { startPage: 3.5 }, { endPage: 2 }, { endPage: 317 }, { edition: 'xiii', endPage: 41 }]) {
    assert.throws(() => scoreWith(cue(pages)), /page range/);
  }
  assert.throws(() => scoreWith(cue({ edition: 'future' })), /edition/);
  assert.throws(() => validateGuidedScore({ schemaVersion: 1, editions: {}, cues: [cue()] }), /revision-stamped/);
});

test('Only creator track URLs pass; spoofed hosts, credentials and nontrack links fail', () => {
  for (const url of ['javascript:alert(1)', 'http://soundcloud.com/raikouno/song', 'https://soundcloud.com.evil.test/raikouno/song', 'https://soundcloud.com/other/song', 'https://soundcloud.com/raikouno', 'https://soundcloud.com/raikouno/sets/album', 'https://soundcloud.com/raikouno/tracks', 'https://evil@soundcloud.com/raikouno/song', 'https://soundcloud.com:8080/raikouno/song', 'https://soundcloud.com/raikouno/song%2fextra']) {
    assert.equal(guidedTrackUrl(url), null, url);
    assert.throws(() => scoreWith(cue({ url })), /individual/);
  }
  assert.equal(guidedTrackUrl('https://www.soundcloud.com/raikouno/song?utm_source=test#fragment'), 'https://soundcloud.com/raikouno/song');
});

test('Import is bounded, atomic, and copies rather than mutating its input', () => {
  assert.throws(() => parseGuidedScore('{invalid}'), /valid JSON/);
  assert.throws(() => parseGuidedScore(' '.repeat(150001)), /too large/);
  assert.throws(() => validateGuidedScore({ ...emptyGuidedScore(), cues: Array(501).fill(cue()) }), /500/);
  assert.throws(() => validateGuidedScore({ ...emptyGuidedScore(), schemaVersion: 2 }), /schemaVersion/);
  const source = { ...emptyGuidedScore(), cues: [cue()] }, checked = validateGuidedScore(source);
  checked.cues[0].title = 'Changed';
  assert.equal(source.cues[0].title, 'Chosen song');
});

test('Cue identity changes when a song or its scope changes', () => {
  assert.equal(cueKey(null), null);
  assert.notEqual(cueKey(cue()), cueKey(cue({ url: 'https://soundcloud.com/raikouno/replacement' })));
  assert.notEqual(cueKey(cue()), cueKey(cue({ endPage: 9 })));
});
