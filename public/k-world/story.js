/** Reader/terminal navigation only. Never fetches, plays audio or grants story authority. */
import { GUIDED_EDITIONS, validateGuidedScore, resolveGuidedCue } from './guided.js';
export { GUIDED_EDITIONS } from './guided.js';

export const READER_POSITION_KEY = 'techops-hero:reader-position:v1';
export const READER_POSITION_EVENT = 'techops-hero:reader-position';
export const BOOKMARK_KEYS = Object.freeze({
  f: 'techops-hero:revision-f:waldo-continuity:page',
  xiii: 'techops-hero:volume-xiii:revised:page',
  legacy: 'techops-hero:r11:page',
});
// Navigation ranges requested by the creator in issue #62. These are NOT song assignments.
export const STORY_SCENES = Object.freeze([
  Object.freeze({ id: 'iona-set', edition: 'f', revision: 'continuity-hq-46943e14', startPage: 88, endPage: 88 }),
  Object.freeze({ id: 'recording-session', edition: 'f', revision: 'continuity-hq-46943e14', startPage: 196, endPage: 216 }),
  Object.freeze({ id: 'finale', edition: 'f', revision: 'continuity-hq-46943e14', startPage: 314, endPage: 316 }),
]);

export function normalizeReaderPosition(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { edition, page, revision } = value;
  if (typeof edition !== 'string' || !Object.hasOwn(GUIDED_EDITIONS, edition)) return null;
  const book = GUIDED_EDITIONS[edition];
  if (!Number.isInteger(page) || page < 1 || page > book.pageCount || revision !== book.revision) return null;
  return { edition, page, revision };
}

function pageNumber(value, maximum) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return 0;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= maximum ? number : 0;
}

export function readReaderPosition(storage) {
  try {
    const raw = storage?.getItem(READER_POSITION_KEY);
    if (raw && raw.length <= 1024) {
      try {
        const saved = JSON.parse(raw);
        const position = saved.schemaVersion === 1 ? normalizeReaderPosition(saved.position) : null;
        if (position) return position;
      } catch { /* A corrupt new record does not destroy older bookmarks. */ }
    }
    // Old keys have no timestamps. Prefer the current collection, not a guessed "latest".
    for (const edition of ['f', 'xiii', 'legacy']) {
      const book = GUIDED_EDITIONS[edition];
      const current = storage?.getItem(BOOKMARK_KEYS[edition]);
      let page = pageNumber(current, book.pageCount);
      if (edition === 'f' && current == null) {
        const old = pageNumber(storage?.getItem('techops-hero:revision-f:page'), 315);
        page = old >= 34 ? old + 1 : old;
      }
      if (page) return { edition, page, revision: book.revision };
    }
  } catch { /* Private browsing and denied storage are supported. */ }
  return null;
}

export function writeReaderPosition(storage, value) {
  const position = normalizeReaderPosition(value);
  if (!position) return false;
  try {
    if (!storage) return false;
    storage.setItem(READER_POSITION_KEY, JSON.stringify({ schemaVersion: 1, position }));
    return true;
  } catch { return false; }
}

export function comicHref(value) {
  const position = normalizeReaderPosition(value);
  return position ? `/comic?${new URLSearchParams({ edition: position.edition, page: String(position.page) })}` : null;
}

export function sceneForPosition(value) {
  const position = normalizeReaderPosition(value);
  if (!position) return null;
  return STORY_SCENES.find(scene => scene.edition === position.edition && scene.revision === position.revision && position.page >= scene.startPage && position.page <= scene.endPage) || null;
}

function safeScore(value) {
  try { return validateGuidedScore(value); } catch { return null; }
}

export function soundtrackCue(score, value) {
  const position = normalizeReaderPosition(value);
  const clean = safeScore(score);
  return position && clean ? resolveGuidedCue(clean, position) : null;
}

export function soundtrackHref(score, value) {
  const position = normalizeReaderPosition(value);
  const cue = soundtrackCue(score, position);
  if (!position || !cue) return null;
  // Bind the cue AND its track; replacing a cue cannot silently retarget an old link.
  return `/terminal?${new URLSearchParams({ cue: cue.id, edition: position.edition, page: String(position.page), revision: position.revision, track: cue.url })}`;
}

export function resolveSoundtrackLink(score, search) {
  const params = new URLSearchParams(search);
  const edition = params.get('edition');
  const page = pageNumber(params.get('page'), 10000);
  const position = normalizeReaderPosition({ edition, page, revision: params.get('revision') });
  const cue = soundtrackCue(score, position);
  if (!position || !cue || cue.id !== params.get('cue') || cue.url !== params.get('track')) return null;
  return { cue, position };
}

function alias(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Route only the small allowlist of book commands. Music commands pass through unchanged. */
export function resolveStoryCommand(raw, { score = null, position = null } = {}) {
  if (typeof raw !== 'string' || raw.length > 256) return null;
  const tokens = raw.trim().toLowerCase().split(/\s+/);
  const command = tokens.shift();
  const message = text => ({ kind: 'message', text });
  const go = value => ({ kind: 'navigate', href: comicHref(value) });
  if (command === 'register') {
    return tokens.length ? message('Use register to open the Revision F reader key.') : go({ edition: 'f', page: 2, revision: GUIDED_EDITIONS.f.revision });
  }
  if (command === 'verify' || command === 'cutoff') {
    return message('This story command is locked until its reveal-page mapping has been verified. No story state or audio has changed.');
  }
  if (command !== 'comic') return null;
  if (!tokens.length) return { kind: 'navigate', href: '/comic?edition=f' };
  if (tokens.length === 1 && tokens[0] === 'resume') {
    return normalizeReaderPosition(position) ? go(position) : message('No saved reading position yet. Use comic 1 to start Revision F.');
  }
  let edition = 'f';
  if (Object.hasOwn(GUIDED_EDITIONS, tokens[0])) edition = tokens.shift();
  if (!tokens.length || tokens.length > 1) return message('Use comic <page or cue-id>, comic resume, or comic <f|xiii|legacy> <page or cue-id>.');
  const target = tokens[0];
  const book = GUIDED_EDITIONS[edition];
  const page = pageNumber(target, book.pageCount);
  if (page) return go({ edition, page, revision: book.revision });
  if (/^[+-]?\d/.test(target)) return message(`Choose a whole page from 1 to ${book.pageCount} for ${book.label}.`);
  const scene = STORY_SCENES.find(item => item.id === target && item.edition === edition && item.revision === book.revision);
  if (scene) return go({ edition, page: scene.startPage, revision: scene.revision });
  const clean = safeScore(score);
  if (clean?.editions[edition] !== book.revision) return message(`No current soundtrack cue named “${target}” is mapped for this edition.`);
  const matching = clean.cues.filter(cue => cue.edition === edition && (cue.id.toLowerCase() === target || alias(cue.title) === target));
  if (matching.length > 1) return message('That song has more than one scene. Use its unique cue ID.');
  if (!matching.length) return message(`No current soundtrack cue named “${target}” is mapped for this edition.`);
  return go({ edition, page: matching[0].startPage, revision: book.revision });
}
