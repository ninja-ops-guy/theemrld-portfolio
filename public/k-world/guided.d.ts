export type GuidedEdition = 'f' | 'xiii' | 'legacy';
export interface GuidedCue { id: string; edition: GuidedEdition; startPage: number; endPage: number; title: string; url: string }
export interface GuidedScore { schemaVersion: 1; editions: Partial<Record<GuidedEdition, string>>; cues: GuidedCue[] }
export interface GuidedPosition { edition: GuidedEdition; page: number; revision: string }
export const GUIDED_EDITIONS: Readonly<Record<GuidedEdition, Readonly<{ label: string; revision: string; pageCount: number }>>>;
export const GUIDED_DRAFT_KEY: string;
export const MAX_GUIDED_JSON_LENGTH: number;
export function emptyGuidedScore(): GuidedScore;
export function guidedTrackUrl(value: unknown): string | null;
export function validateGuidedScore(input: unknown): GuidedScore;
export function parseGuidedScore(source: string): GuidedScore;
export function resolveGuidedCue(score: GuidedScore | null, position: GuidedPosition | null): GuidedCue | null;
export function cueKey(cue: GuidedCue | null): string | null;
