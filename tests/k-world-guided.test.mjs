import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GUIDED_EDITIONS, emptyGuidedScore, validateGuidedScore, parseGuidedScore, resolveGuidedCue, cueKey, guidedTrackUrl } from '../public/k-world/guided.js';

const cue = (overrides = {}) => ({ id: 'opening-song', edition: 'f', startPage: 3, endPage: 8, title: 'Chosen song', url: 'https://soundcloud.com/raikouno/chosen-song', ...overrides });
const scoreWith = (...cues) => validateGuidedScore({ ...emptyGuidedScore(), cues });
const at = (page, edition = 'f', revision = GUIDED_EDITIONS[edition].revision) => ({ edition, page, revision });

test('The published score makes no unsolicited music placements', () => {
  const score = parseGuidedScore(readFileSync(new URL('../public/k-world/guided-cues.json', import.meta.url), 'utf8'));
  assert.deepEqual(score.cues, []);
  assert.equal(resolveGuidedCue(score, at(3)), null);
});

test('Edition limits and stamps match the actual reader sources', () => {
  const json = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
  const reader = readFileSync(new URL('../src/pages/TechOpsComic.tsx', import.meta.url), 'utf8');
  assert.equal(GUIDED_EDITIONS.f.pageCount, json('comic-revision-f').pageCount);
  assert.equal(GUIDED_EDITIONS.f.revision, reader.match(/const revisionFArtRevision = '([^']+)'/)[1]);
  assert.equal(GUIDED_EDITIONS.xiii.pageCount, json('comic-volume-thirteen').pageCount);
  assert.equal(GUIDED_EDITIONS.xiii.revision, json('comic-volume-thirteen').artRevision);
  assert.equal(GUIDED_EDITIONS.legacy.pageCount, json('comic-descriptions').length + json('comic-volume-five').descriptions.length);
  assert.equal(GUIDED_EDITIONS.legacy.revision, reader.match(/const revision = '([^']+)'/)[1]);
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
