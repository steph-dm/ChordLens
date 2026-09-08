import ChordAnalyzer, { CHORD_TEMPLATES } from 'chordlens';
import type { Analysis, DetectionResult, ChordTone, Voicing, ProgressionAnalysis, TemplateDefinition } from 'chordlens';
import { parsePitch, parseNote, noteToMidi, spellChordNote, NOTES_SHARP } from 'chordlens/notes';
import { parseChordSymbol } from 'chordlens/symbols';
import { compileTemplate, TEMPLATES } from 'chordlens/templates';

const a = new ChordAnalyzer({ useFlats: true, maxResults: 3, cacheSize: 20 });
const result: DetectionResult | undefined = a.detectMidi([60, 64, 67] as const)[0];
const analysis: Analysis = a.analyzeNotes(['E3', 'G3', 'Bb3', 'D4'], { allowRootless: true, rootHint: 'C' });
const tone: ChordTone | undefined = a.parseChord('F#7/A#')?.chordNotes[0];
const voicings: Voicing[] = a.generateVoicings('Cmaj9', { previous: ['C3', 'E3', 'B3', 'D4'], noteCount: 4 });
const progression: ProgressionAnalysis = a.analyzeProgression(['Dm7', 'G7', 'Cmaj7'], { key: 'C' });
const custom: TemplateDefinition = { symbol: 'quartal', fullName: 'Quartal', intervals: [0, 5, 10], required: [0, 5, 10], labels: { 0: 'R', 5: '4', 10: 'b7' }, weight: 80 };
a.registerTemplate(compileTemplate(custom));
parsePitch('C4')?.midi;
const parsed = parseNote('F#');
if (parsed) spellChordNote(parsed, '3');
noteToMidi('B#', 3);
parseChordSymbol('C6/9')?.symbol;
a.keyToNote(40).key.toFixed();
a.noteToKey('C', 4)?.toFixed();
void [result, analysis, tone, voicings, progression];

// @ts-expect-error MIDI input cannot be note-name strings
a.detectMidi(['C4']);
// @ts-expect-error return may be null
a.parseChord('unknown').name;
// @ts-expect-error unsupported ranking
a.detect([], { ranking: 'random' });
// @ts-expect-error templates are immutable
CHORD_TEMPLATES[0]!.intervals.push(1);
// @ts-expect-error note-name tables are immutable
NOTES_SHARP[0] = 'broken';
// @ts-expect-error compiled template definitions are immutable
TEMPLATES[0]!.weight = 200;
// @ts-expect-error unknown option
new ChordAnalyzer({ ui: true });
