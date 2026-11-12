import type { SearchSong } from './song-search.js';
export interface PlayAutocomplete { refresh(): void; dismiss(): void; destroy(): void }
export function attachPlayAutocomplete(input: HTMLInputElement, container: HTMLElement, getTracks: () => SearchSong[], onComplete?: (value: string) => void): PlayAutocomplete;
