export interface NoteRecord {
  name: string;
  pitchClass: number;
  /** Chord role, or null for a non-chord tone / unclassified pitch. */
  interval: string | null;
}
export interface ChordTone extends NoteRecord { interval: string }
export interface PlayedNote extends NoteRecord {
  midi: number;
  /** 1–88 piano key, or null for MIDI notes outside A0–C8. */
  key: number | null;
  octave: number;
  fullName: string;
}
export interface ParsedNote {
  letter: string; accidental: string; alteration: number; naturalPitch: number;
  name: string; pitch: number; letterIndex: number;
}
export interface DetectionOptions {
  useFlats?: boolean;
  maxResults?: number;
  order?: 'pitch' | 'degree';
  ranking?: 'balanced' | 'bass' | 'simple';
  allowRootless?: boolean;
  /** Infer a major/minor triad from root + third with an omitted fifth. */
  allowIncomplete?: boolean;
  /** Number of unexpected pitch classes to tolerate, 0–2. */
  maxExtraNotes?: number;
  rootHint?: string | null;
  /** Explicit major/minor key, e.g. "Db major", "A minor", "Am". */
  key?: string | null;
  ambiguityThreshold?: number;
}
export interface AnalyzerOptions extends DetectionOptions {
  /** Maximum cached pitch-set/bass matches, 0–4096; default 256. */
  cacheSize?: number;
  templates?: readonly TemplateDefinition[];
}
export interface BuilderOptions {
  useFlats?: boolean;
  order?: 'pitch' | 'degree';
  /** Preserve supplied root spelling by default; simplify honors useFlats. */
  spelling?: 'preserve' | 'simplify';
}
export interface SpellingOptions { useFlats?: boolean }
export interface Inversion {
  /** 0 root, 1 third, 2 fifth, 3 seventh, 4 other degree, -1 non-chord bass. */
  inversion: number;
  inversionName: string;
  bassDegree: string | null;
}
export interface DetectionResult extends Inversion {
  kind: 'chord' | 'note' | 'octaves';
  name: string;
  fullName: string;
  symbol: string;
  root: string;
  rootPitchClass: number;
  bass: string;
  bassPitchClass: number;
  bassKey: number | null;
  slash: string | null;
  /** Compatibility field: theoretical note-name strings. Prefer chordNotes. */
  notes: string[];
  chordNotes: ChordTone[];
  playedNotes: PlayedNote[];
  matchedNotes: PlayedNote[];
  omittedNotes: ChordTone[];
  extraNotes: PlayedNote[];
  intervals: string[];
  matchedIntervals: string[];
  /** Compatibility field: generic pitch names with octaves. */
  inputNotes: string[];
  omittedCount: number;
  matchedCount: number;
  exact: boolean;
  rootMissing: boolean;
  incomplete: boolean;
  /** Relative ranking value, never a probability or percentage. */
  score: number;
  scoreBreakdown: Record<string, number>;
  weight: number;
  rank: number;
  ambiguous: boolean;
  /** Distance below the top candidate's score. */
  scoreGap: number;
  explanation: string;
}
export interface IntervalAnalysis {
  name: string; semitones: number; simpleSemitones: number; octaves: number;
  lower: PlayedNote; upper: PlayedNote;
}
export interface Analysis {
  status: 'empty' | 'single-note' | 'octaves' | 'interval' | 'chord' | 'unknown';
  results: DetectionResult[];
  playedNotes: PlayedNote[];
  interval: IntervalAnalysis | null;
  ambiguous: boolean;
  /** Top score minus runner-up score, calculated before truncation. */
  scoreGap: number | null;
  explanation: string;
}
export interface ChordDefinition extends Inversion {
  root: string; rootPitchClass: number; symbol: string; name: string; fullName: string;
  notes: ChordTone[]; chordNotes: ChordTone[]; omittedNotes: ChordTone[];
  requiredIntervals: string[]; bass: string; bassPitchClass: number;
}
export interface TemplateDefinition {
  symbol: string; fullName: string; category?: string;
  intervals: readonly number[]; required: readonly number[];
  labels: Readonly<Record<number, string>>; weight: number;
}
export interface ChordTemplate extends TemplateDefinition {
  readonly symbol: string; readonly fullName: string; readonly category: string;
  readonly weight: number; readonly intervals: readonly number[]; readonly required: readonly number[];
  readonly labels: Readonly<Record<number, string>>;
  readonly _ivBits: number; readonly _reqBits: number; readonly _size: number;
  readonly _sorted: readonly number[]; readonly _degreeSorted: readonly number[];
  readonly _weightScore: number; readonly _omitPenalty: number;
}
export interface ChordType {
  symbol: string; displaySymbol: string; fullName: string; category: string;
  intervalCount: number; intervals: string[]; requiredIntervals: string[];
}
export interface VoicingOptions {
  /** Bounds are MIDI numbers or full pitches, e.g. C3. Defaults C3–C5. */
  low?: number | string; high?: number | string;
  noteCount?: number; maxResults?: number; maxSpan?: number; maxAdjacentSpan?: number;
  rootless?: boolean;
  /** Fixed bass MIDI note or full pitch. Overrides the slash bass. */
  bass?: number | string;
  /** Previous voicing, ascending or unordered; must have noteCount notes. */
  previous?: readonly (number | string)[];
}
export interface Voicing {
  name: string; midi: number[]; keys: (number | null)[]; notes: PlayedNote[];
  span: number; score: number; movement: number | null; omittedNotes: ChordTone[];
  bassInterval: string | null;
}
export interface KeyContext {
  tonic: string; mode: 'major' | 'minor'; name: string; pitchClasses: number[]; notes: string[];
}
export interface ProgressionOptions { key?: string; useFlats?: boolean }
export interface ProgressionChord {
  name: string; root: string; degree: number; alteration: number;
  quality: 'major' | 'minor' | 'diminished' | 'half-diminished' | 'augmented' | 'suspended' | 'other';
  romanNumeral: string; diatonic: boolean; harmonicCompatible: boolean;
  function: 'tonic' | 'predominant' | 'dominant' | 'secondary-dominant' | 'other';
  inversion: number; bassDegree: number; secondaryDominantOf: string | null;
}
export interface ProgressionAnalysis {
  key: KeyContext & { source: 'provided' | 'estimated' };
  keyCandidates: (KeyContext & { score: number })[];
  chords: ProgressionChord[];
  patterns: { name: string; start: number; end: number }[];
  explanation: string;
}
export interface CacheStats { size: number; capacity: number; hits: number; misses: number }

export class ChordAnalyzer {
  constructor(options?: AnalyzerOptions);
  useFlats: boolean;
  maxResults: number;
  readonly templates: readonly ChordTemplate[];
  detect(keys: readonly number[], options?: DetectionOptions): DetectionResult[];
  detectMidi(notes: readonly number[], options?: DetectionOptions): DetectionResult[];
  detectNotes(notes: readonly string[], options?: DetectionOptions): DetectionResult[];
  analyze(keys: readonly number[], options?: DetectionOptions): Analysis;
  analyzeMidi(notes: readonly number[], options?: DetectionOptions): Analysis;
  analyzeNotes(notes: readonly string[], options?: DetectionOptions): Analysis;
  keyToNote(key: number, options?: SpellingOptions): PlayedNote & { key: number };
  midiToNote(midi: number, options?: SpellingOptions): PlayedNote;
  noteToMidi(name: string, octave: number): number | null;
  noteToKey(name: string, octave: number): number | null;
  getChordNotes(root: string, type?: string, options?: BuilderOptions): ChordDefinition | null;
  parseChord(chord: string, options?: BuilderOptions): ChordDefinition | null;
  getChordTypes(): ChordType[];
  registerTemplate(template: TemplateDefinition): this;
  clearCache(): void;
  getCacheStats(): CacheStats;
  generateVoicings(chord: string, options?: VoicingOptions): Voicing[];
  analyzeProgression(chords: readonly (string | DetectionResult)[], options?: ProgressionOptions): ProgressionAnalysis;
}

export const CHORD_TEMPLATES: readonly ChordTemplate[];
export default ChordAnalyzer;
