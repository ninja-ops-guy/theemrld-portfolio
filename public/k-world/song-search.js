// Shared by the classic and in-world terminals. Matching never starts playback.
export function songQuery(value) {
  const text = String(value ?? '').trim();
  return text.length > 1 && ['"', "'"].includes(text[0]) && text.at(-1) === text[0]
    ? text.slice(1, -1).trim() : text;
}

export function normalizeSongName(value) {
  return songQuery(value).normalize('NFKD').replace(/\p{M}/gu, '')
    .toLowerCase().replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function findSongMatches(tracks, value) {
  const query = normalizeSongName(value);
  const words = query.split(/\s+/);
  const seen = new Set();
  return tracks.filter(track => {
    if (!track?.title || !track?.url || seen.has(track.url)) return false;
    seen.add(track.url);
    return true;
  }).map((track, index) => {
    const title = normalizeSongName(track.title);
    const rank = title === query ? 0 : title.startsWith(query) ? 1
      : title.includes(query) ? 2 : words.every(word => title.includes(word)) ? 3 : 4;
    return { track, index, rank };
  }).filter(result => result.rank < 4)
    .sort((a, b) => a.rank - b.rank || a.index - b.index).map(result => result.track);
}

export function resolveSong(tracks, value, numberKey = 'id') {
  const query = songQuery(value);
  if (/^\d+$/.test(query)) {
    const track = tracks.find(track => track[numberKey] === Number(query));
    return { track: track ?? null, matches: track ? [track] : [] };
  }
  const matches = findSongMatches(tracks, query);
  const exact = matches.filter(track => normalizeSongName(track.title) === normalizeSongName(query));
  const choices = exact.length ? exact : matches;
  return { track: choices.length === 1 ? choices[0] : null, matches: choices };
}

export function playSuggestions(tracks, raw) {
  const match = /^\s*(play|song|track)(?:\s+([\s\S]*))?$/i.exec(raw);
  if (!match) return [];
  const query = songQuery(match[2] || '');
  if (/^https?:\/\//i.test(query)) return [];
  return findSongMatches(tracks, query).slice(0, 8);
}

export function completePlayCommand(track, tracks) {
  // Duplicate titles, numeric titles and the reserved latest command need an
  // unambiguous URL; never depend on IDs that a catalogue refresh can reorder.
  const query = songQuery(track.title);
  const unique = resolveSong(tracks, query).track;
  const value = /^\d+$/.test(query) || query.toLowerCase() === 'latest' || unique?.url !== track.url
    ? track.url : track.title;
  return `play ${value}`;
}
