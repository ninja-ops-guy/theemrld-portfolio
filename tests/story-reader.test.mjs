import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDED_EDITIONS, emptyGuidedScore } from '../public/k-world/guided.js';
import { BOOKMARK_KEYS, READER_POSITION_KEY, normalizeReaderPosition, readReaderPosition, writeReaderPosition, comicHref, sceneForPosition, soundtrackCue, soundtrackHref, resolveSoundtrackLink, resolveStoryCommand } from '../public/k-world/story.js';

const pos = (page, edition = 'f') => ({ edition, page, revision: GUIDED_EDITIONS[edition].revision });
const store = (entries = {}) => {
  const values = new Map(Object.entries(entries));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
// Synthetic data only. This test does not assign a public song to the comic.
const score = () => ({ ...emptyGuidedScore(), cues: [{ id: 'iona-take', edition: 'f', startPage: 197, endPage: 200, title: 'Ride or Die', url: 'https://soundcloud.com/raikouno/synthetic-test-track' }] });

test('current editions accept their final page', () => {
  for (const [edition, book] of Object.entries(GUIDED_EDITIONS)) assert.deepEqual(normalizeReaderPosition(pos(book.pageCount, edition)), pos(book.pageCount, edition));
});
for (const page of [0, -1, 317, 1.5, NaN, Infinity, '197', null]) test(`reject invalid page ${page}`, () => assert.equal(normalizeReaderPosition({ ...pos(1), page }), null));
test('reject stale revisions and prototype edition keys', () => {
  assert.equal(normalizeReaderPosition({ ...pos(197), revision: 'old' }), null);
  for (const edition of ['__proto__', 'constructor', 'unknown']) assert.equal(normalizeReaderPosition({ ...pos(1), edition }), null);
});
test('saved current position wins over old edition bookmarks', () => {
  const storage = store({ [BOOKMARK_KEYS.f]: '212' });
  assert.equal(writeReaderPosition(storage, pos(12, 'xiii')), true);
  assert.deepEqual(readReaderPosition(storage), pos(12, 'xiii'));
});
for (const [before, after] of [[33, 33], [34, 35], [315, 316]]) test(`migrate old Revision F bookmark ${before} exactly once`, () => {
  const storage = store({ 'techops-hero:revision-f:page': String(before) });
  assert.deepEqual(readReaderPosition(storage), pos(after));
  writeReaderPosition(storage, pos(after));
  assert.deepEqual(readReaderPosition(storage), pos(after));
});
test('current 316-page key is never shifted', () => assert.deepEqual(readReaderPosition(store({ [BOOKMARK_KEYS.f]: '34' })), pos(34)));
test('old invalid bookmarks do not become valid pages', () => {
  for (const raw of ['0', '316', '-1', '1e2', 'NaN', '']) assert.equal(readReaderPosition(store({ 'techops-hero:revision-f:page': raw })), null);
});
test('malformed and oversized new records preserve legacy fallback', () => {
  for (const raw of ['{', 'x'.repeat(1025), JSON.stringify({ schemaVersion: 99, position: pos(3) })]) assert.deepEqual(readReaderPosition(store({ [READER_POSITION_KEY]: raw, [BOOKMARK_KEYS.legacy]: '150' })), pos(150, 'legacy'));
});
test('denied storage is nonfatal and invalid writes never mutate storage', () => {
  const denied = { getItem() { throw Error('Denied'); }, setItem() { throw Error('Denied'); } };
  assert.equal(readReaderPosition(denied), null);
  assert.equal(writeReaderPosition(denied, pos(197)), false);
  assert.equal(writeReaderPosition(null, pos(197)), false);
  const storage = store();
  assert.equal(writeReaderPosition(storage, pos(317)), false);
  assert.equal(storage.getItem(READER_POSITION_KEY), null);
});
test('links always carry an edition and reject invalid positions', () => {
  assert.equal(comicHref(pos(197)), '/comic?edition=f&page=197');
  assert.equal(comicHref(pos(12, 'xiii')), '/comic?edition=xiii&page=12');
  assert.equal(comicHref({ ...pos(1), edition: '//evil.test' }), null);
});
test('requested scene ranges are exact and edition scoped', () => {
  for (const page of [196, 197, 216]) assert.equal(sceneForPosition(pos(page))?.id, 'recording-session');
  for (const page of [195, 217, 313]) assert.equal(sceneForPosition(pos(page)), null);
  for (const page of [314, 315, 316]) assert.equal(sceneForPosition(pos(page))?.id, 'finale');
  assert.equal(sceneForPosition(pos(88))?.id, 'iona-set');
  assert.equal(sceneForPosition(pos(88, 'legacy')), null);
});
test('numeric command addresses Revision F, not the last edition', () => {
  assert.deepEqual(resolveStoryCommand('  COMIC 197  ', { position: pos(12, 'xiii') }), { kind: 'navigate', href: '/comic?edition=f&page=197' });
  assert.equal(resolveStoryCommand('comic xiii 12').href, '/comic?edition=xiii&page=12');
  assert.equal(resolveStoryCommand('comic legacy 150').href, '/comic?edition=legacy&page=150');
});
test('invalid numeric commands do not silently clamp or open another edition', () => {
  for (const raw of ['comic 0', 'comic 317', 'comic 1.5', 'comic 1e2', 'comic -1', 'comic xiii 41']) assert.equal(resolveStoryCommand(raw).kind, 'message');
});
test('resume follows the saved edition and does not invent a bookmark', () => {
  assert.equal(resolveStoryCommand('comic resume', { position: pos(12, 'xiii') }).href, '/comic?edition=xiii&page=12');
  assert.equal(resolveStoryCommand('comic resume').kind, 'message');
  assert.equal(resolveStoryCommand('comic').href, '/comic?edition=f');
});
test('register opens the already-published reader key', () => assert.equal(resolveStoryCommand('register').href, '/comic?edition=f&page=2'));
test('unverified operator commands stay locked even at the final page', () => {
  for (const raw of ['verify', 'cutoff']) {
    const result = resolveStoryCommand(raw, { position: pos(316), score: score() });
    assert.equal(result.kind, 'message');
    assert.match(result.text, /locked/);
  }
});
test('music and comment commands remain untouched', () => {
  for (const raw of ['play 1', 'background on', 'guided on', 'comment', 'pause', 'latest', 'help', '', 'x'.repeat(257), null]) assert.equal(resolveStoryCommand(raw), null);
});
test('scene aliases navigate but assign no music', () => {
  assert.equal(resolveStoryCommand('comic iona-set').href, '/comic?edition=f&page=88');
  assert.equal(resolveStoryCommand('comic recording-session').href, '/comic?edition=f&page=196');
  assert.equal(resolveStoryCommand('comic finale').href, '/comic?edition=f&page=314');
  assert.equal(soundtrackCue(emptyGuidedScore(), pos(88)), null);
});
test('song aliases work only from current validated cue data', () => {
  assert.equal(resolveStoryCommand('comic ride-or-die', { score: score() }).href, '/comic?edition=f&page=197');
  assert.equal(resolveStoryCommand('comic iona-take', { score: score() }).href, '/comic?edition=f&page=197');
  assert.equal(resolveStoryCommand('comic ride-or-die', { score: emptyGuidedScore() }).kind, 'message');
  const stale = score(); stale.editions.f = 'old';
  assert.equal(resolveStoryCommand('comic ride-or-die', { score: stale }).kind, 'message');
});
test('ambiguous song names require a unique cue ID', () => {
  const repeated = score(); repeated.cues.push({ ...repeated.cues[0], id: 'second-take', startPage: 205, endPage: 206 });
  assert.equal(resolveStoryCommand('comic ride-or-die', { score: repeated }).kind, 'message');
  assert.equal(resolveStoryCommand('comic second-take', { score: repeated }).href, '/comic?edition=f&page=205');
});
test('soundtrack handoff is bound to page, edition, revision, cue and track', () => {
  const href = soundtrackHref(score(), pos(198));
  assert.ok(href.startsWith('/terminal?'));
  assert.deepEqual(resolveSoundtrackLink(score(), href.split('?')[1]), { cue: score().cues[0], position: pos(198) });
  for (const [key, value] of [['edition', 'legacy'], ['page', '201'], ['revision', 'old'], ['cue', 'wrong'], ['track', 'https://evil.test/song']]) {
    const params = new URLSearchParams(href.split('?')[1]); params.set(key, value);
    assert.equal(resolveSoundtrackLink(score(), params.toString()), null);
  }
});
test('reusing a cue ID for another song cannot retarget a saved link', () => {
  const href = soundtrackHref(score(), pos(197));
  const changed = score(); changed.cues[0].url = 'https://soundcloud.com/raikouno/other-synthetic-track';
  assert.equal(resolveSoundtrackLink(changed, href.split('?')[1]), null);
});
test('unknown, malformed and unsafe score data never gets a Listen link', () => {
  for (const input of [null, {}, emptyGuidedScore(), { ...score(), cues: [{ ...score().cues[0], url: 'javascript:alert(1)' }] }]) assert.equal(soundtrackHref(input, pos(197)), null);
  assert.equal(resolveSoundtrackLink(score(), ''), null);
  assert.equal(soundtrackHref(score(), pos(201)), null);
});
