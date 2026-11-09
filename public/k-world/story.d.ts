export { GUIDED_EDITIONS } from './guided.js';
import type { GuidedCue, GuidedEdition, GuidedPosition } from './guided.js';
export interface ReaderStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface StoryScene { id: string; edition: GuidedEdition; revision: string; startPage: number; endPage: number }
export type StoryCommand = { kind: 'navigate'; href: string } | { kind: 'message'; text: string };
export const READER_POSITION_KEY: string;
export const READER_POSITION_EVENT: string;
export const BOOKMARK_KEYS: Readonly<Record<GuidedEdition, string>>;
export const STORY_SCENES: ReadonlyArray<Readonly<StoryScene>>;
export function normalizeReaderPosition(value: unknown): GuidedPosition | null;
export function readReaderPosition(storage: ReaderStorage | null): GuidedPosition | null;
export function writeReaderPosition(storage: ReaderStorage | null, value: unknown): boolean;
export function comicHref(value: unknown): string | null;
export function sceneForPosition(value: unknown): StoryScene | null;
export function soundtrackCue(score: unknown, value: unknown): GuidedCue | null;
export function soundtrackHref(score: unknown, value: unknown): string | null;
export function resolveSoundtrackLink(score: unknown, search: string): { cue: GuidedCue; position: GuidedPosition } | null;
export function resolveStoryCommand(raw: unknown, options?: { score?: unknown; position?: unknown }): StoryCommand | null;
