export function normalizeSymbol(raw?: string): string;
export interface ParsedChordSymbol {
  root: string; rootPitchClass: number; symbol: string;
  bass: string | null; bassPitchClass: number | null; name: string;
}
/** Parses syntax; use ChordAnalyzer.parseChord to validate supported chord types. */
export function parseChordSymbol(value: unknown): ParsedChordSymbol | null;
