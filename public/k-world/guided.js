/** Edition-bound soundtrack definitions. This module never starts audio. */
export const GUIDED_EDITIONS = Object.freeze({
  "g": Object.freeze({ label: "Revision G · Volumes I–XII", revision: "corrected-c18407af88e9", pageCount: 316 }),
  "xiii-r": Object.freeze({ label: "Volume XIII · Revised", revision: "corrected-85c2fbd8c80b", pageCount: 49 }),
  "xiv": Object.freeze({ label: "Volume XIV", revision: "corrected-97f16edf9df0", pageCount: 133 }),
  f: Object.freeze({ label: 'Revision F · Volumes I–XII', revision: 'continuity-hq-46943e14', pageCount: 316 }),
  xiii: Object.freeze({ label: 'Volume XIII', revision: 'reviewed-1c74863c', pageCount: 40 }),
  legacy: Object.freeze({ label: 'Legacy collection · Volumes I–V', revision: '11.2', pageCount: 161 }),
});
export const GUIDED_DRAFT_KEY = 'k-world:guided-score:draft:v1';
export const MAX_GUIDED_JSON_LENGTH = 150000;

export function emptyGuidedScore() {
  return {
    schemaVersion: 1,
    editions: Object.fromEntries(Object.entries(GUIDED_EDITIONS).map(([id, edition]) => [id, edition.revision])),
    cues: [],
  };
}

function text(value, field, limit) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) {
    throw Error(`${field} must contain 1–${limit} characters.`);
  }
  return value.trim();
}

/** Only the creator's individual public SoundCloud tracks are eligible. */
export function guidedTrackUrl(value) {
  if (typeof value !== 'string' || value.length > 1500) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !['soundcloud.com', 'www.soundcloud.com'].includes(url.hostname) || url.username || url.password || url.port) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 2 || parts[0] !== 'raikouno' || !/^[a-z0-9][a-z0-9_-]*$/i.test(parts[1])) return null;
    if (['sets', 'tracks', 'likes', 'reposts', 'popular-tracks', 'albums'].includes(parts[1].toLowerCase())) return null;
    return `https://soundcloud.com/raikouno/${parts[1]}`;
  } catch { return null; }
}

/** Return a clean copy, or reject the entire score. Invalid imports never partly apply. */
export function validateGuidedScore(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.schemaVersion !== 1) throw Error('Use a soundtrack with schemaVersion: 1.');
  if (!input.editions || typeof input.editions !== 'object' || Array.isArray(input.editions)) throw Error('The soundtrack needs edition revision stamps.');
  const editions = {};
  for (const id of Object.keys(input.editions)) {
    if (!Object.hasOwn(GUIDED_EDITIONS, id)) throw Error(`Unknown edition: ${id}.`);
    editions[id] = text(input.editions[id], `${id} revision`, 128);
  }
  if (!Array.isArray(input.cues) || input.cues.length > 500) throw Error('Use an array with no more than 500 cues.');
  const ids = new Set();
  const cues = input.cues.map((cue, index) => {
    const label = `Cue ${index + 1}`;
    if (!cue || typeof cue !== 'object' || Array.isArray(cue)) throw Error(`${label} must be an object.`);
    const id = text(cue.id, `${label} ID`, 80);
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) throw Error(`${label} ID must use letters, numbers, underscores or hyphens.`);
    if (ids.has(id)) throw Error(`Duplicate cue ID: ${id}.`);
    ids.add(id);
    const edition = cue.edition;
    if (typeof edition !== 'string' || !Object.hasOwn(GUIDED_EDITIONS, edition) || !Object.hasOwn(editions, edition)) throw Error(`${label} needs a known, revision-stamped edition.`);
    const { startPage, endPage } = cue;
    const maximum = GUIDED_EDITIONS[edition].pageCount;
    if (!Number.isInteger(startPage) || !Number.isInteger(endPage) || startPage < 1 || endPage < startPage || endPage > maximum) {
      throw Error(`${label}: choose a page range between 1 and ${maximum}, with the end at or after the start.`);
    }
    const title = text(cue.title, `${label} song title`, 250);
    const url = guidedTrackUrl(cue.url);
    if (!url) throw Error(`${label}: use an individual https://soundcloud.com/raikouno/track URL.`);
    return { id, edition, startPage, endPage, title, url };
  });
  cues.sort((a, b) => a.edition.localeCompare(b.edition) || a.startPage - b.startPage);
  for (let i = 1; i < cues.length; i++) {
    const previous = cues[i - 1], current = cues[i];
    if (previous.edition === current.edition && current.startPage <= previous.endPage) {
      throw Error(`Cues “${previous.title}” and “${current.title}” overlap in ${GUIDED_EDITIONS[current.edition].label}. Give each page one song.`);
    }
  }
  return { schemaVersion: 1, editions, cues };
}

export function parseGuidedScore(source) {
  if (typeof source !== 'string' || source.length > MAX_GUIDED_JSON_LENGTH) throw Error('The soundtrack JSON is too large. Use a file smaller than 150 KB.');
  let value;
  try { value = JSON.parse(source); } catch { throw Error('The soundtrack is not valid JSON. Check commas, quotes and brackets.'); }
  return validateGuidedScore(value);
}

/** A page jump or backwards turn resolves the visible page, not a replay of intervening cues. */
export function resolveGuidedCue(score, position) {
  if (!score || score.schemaVersion !== 1 || !position || !Object.hasOwn(GUIDED_EDITIONS, position.edition)) return null;
  const { edition, page, revision } = position;
  if (!Number.isInteger(page) || page < 1 || page > GUIDED_EDITIONS[edition].pageCount || typeof revision !== 'string' || !revision || score.editions?.[edition] !== revision) return null;
  return score.cues.find(cue => cue.edition === edition && page >= cue.startPage && page <= cue.endPage) || null;
}

/** Stable throughout a range; use this identity to avoid restarting on every page turn. */
export function cueKey(cue) {
  return cue ? `${cue.edition}:${cue.id}:${cue.startPage}:${cue.endPage}:${cue.url}` : null;
}
