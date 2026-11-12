export interface SearchSong { title: string; url: string; id?: string | number; slot?: number | null }
export function songQuery(value: unknown): string;
export function normalizeSongName(value: unknown): string;
export function findSongMatches<T extends SearchSong>(tracks: T[], value: string): T[];
export function resolveSong<T extends SearchSong>(tracks: T[], value: string, numberKey?: 'id' | 'slot'): { track: T | null; matches: T[] };
export function playSuggestions<T extends SearchSong>(tracks: T[], raw: string): T[];
export function completePlayCommand(track: SearchSong, tracks: SearchSong[]): string;
