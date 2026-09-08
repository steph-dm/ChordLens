import { ChordAnalyzer } from '../chord-analyzer.js';

const analyzer = new ChordAnalyzer();
const analyzerFlats = new ChordAnalyzer({ useFlats: true });

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, description) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(description);
    console.log(`  FAIL: ${description}`);
  }
}

function topName(results) {
  return results.length > 0 ? results[0].name : null;
}

function topSymbol(results) {
  return results.length > 0 ? results[0].symbol : null;
}

function topRoot(results) {
  return results.length > 0 ? results[0].root : null;
}

function hasCandidate(results, name) {
  return results.some(r => r.name === name);
}

function pianoKey(noteName, octave) {
  const key = analyzer.noteToKey(noteName, octave);
  if (key === null) throw new Error(`Invalid note: ${noteName}${octave}`);
  return key;
}

console.log('\n=== 1. Key / Note Mapping ===');

let note = analyzer.keyToNote(1);
assert(note.name === 'A' && note.octave === 0, 'Key 1 = A0');

note = analyzer.keyToNote(88);
assert(note.name === 'C' && note.octave === 8, 'Key 88 = C8');

note = analyzer.keyToNote(40);
assert(note.name === 'C' && note.octave === 4, 'Key 40 = C4 (Middle C)');

note = analyzer.keyToNote(49);
assert(note.name === 'A' && note.octave === 4, 'Key 49 = A4');

note = analyzerFlats.keyToNote(42);
assert(note.name === 'D' && note.octave === 4, 'Key 42 = D4 (flat mode)');

note = analyzerFlats.keyToNote(41);
assert(note.name === 'Db' && note.octave === 4, 'Key 41 = Db4 (flat mode)');

note = analyzer.keyToNote(41);
assert(note.name === 'C#' && note.octave === 4, 'Key 41 = C#4 (sharp mode)');

assert(analyzer.noteToKey('A', 0) === 1, 'noteToKey(A, 0) = 1');
assert(analyzer.noteToKey('C', 8) === 88, 'noteToKey(C, 8) = 88');
assert(analyzer.noteToKey('C', 4) === 40, 'noteToKey(C, 4) = 40');
assert(analyzer.noteToKey('A', 4) === 49, 'noteToKey(A, 4) = 49');

assert(analyzer.noteToKey('G', 0) === null, 'noteToKey(G, 0) out of range');

console.log('\n=== 2. Basic Triads ===');

let r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4)]);
assert(topName(r) === 'C', 'C major (C-E-G)');
assert(r[0].inversion === 0, 'C major root position');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm', 'C minor (C-Eb-G)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('F#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'dim', 'C diminished (C-Eb-Gb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'aug', 'C augmented (C-E-G#)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'sus2', 'C sus2 (C-D-G)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('F', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'sus4', 'C sus4 (C-F-G)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '5', 'C5 power chord (C-G)');

r = analyzer.detect([pianoKey('D', 4), pianoKey('F#', 4), pianoKey('A', 4)]);
assert(topName(r) === 'D', 'D major (D-F#-A)');

r = analyzer.detect([pianoKey('F#', 3), pianoKey('A', 3), pianoKey('C#', 4)]);
assert(topRoot(r) === 'F#' && topSymbol(r) === 'm', 'F# minor (F#-A-C#)');

r = analyzerFlats.detect([pianoKey('A#', 3), pianoKey('D', 4), pianoKey('F', 4)]);
assert(topRoot(r) === 'Bb' && topSymbol(r) === '', 'Bb major (Bb-D-F) flat mode');

r = analyzerFlats.detect([pianoKey('G#', 3), pianoKey('C', 4), pianoKey('D#', 4)]);
assert(topRoot(r) === 'Ab' && topSymbol(r) === '', 'Ab major (Ab-C-Eb) flat mode');

console.log('\n=== 3. Seventh Chords ===');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('B', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj7', 'Cmaj7 (C-E-G-B)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7', 'C7 (C-E-G-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('G', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm7', 'Cm7 (C-Eb-G-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('F#', 4), pianoKey('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'dim7', 'Cdim7 (C-Eb-Gb-A)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('F#', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm7b5', 'Cm7b5 (C-Eb-Gb-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('G', 4), pianoKey('B', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'mMaj7', 'CmMaj7 (C-Eb-G-B)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G#', 4), pianoKey('B', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'augMaj7', 'CaugMaj7 (C-E-G#-B)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G#', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'aug7', 'Caug7 (C-E-G#-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('F#', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7b5', 'C7b5 (C-E-Gb-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('F', 4), pianoKey('G', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7sus4', 'C7sus4 (C-F-G-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D', 4), pianoKey('G', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7sus2', 'C7sus2 (C-D-G-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('B', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj7', 'Cmaj7 no 5th (C-E-B)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7', 'C7 no 5th (C-E-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm7', 'Cm7 no 5th (C-Eb-Bb)');

console.log('\n=== 4. Sixth Chords ===');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '6', 'C6 (C-E-G-A)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('G', 4), pianoKey('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm6', 'Cm6 (C-Eb-G-A)');

r = analyzer.detect([pianoKey('A', 3), pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'A' && topSymbol(r) === 'm7', 'Am7 when A in bass (A-C-E-G)');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '6', 'C6 when C in bass (C-E-G-A)');

console.log('\n=== 5. Add Chords ===');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D', 4), pianoKey('E', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'add9', 'Cadd9 (C-D-E-G)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D', 4), pianoKey('D#', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'madd9', 'Cmadd9 (C-D-Eb-G)');

console.log('\n=== 6. Ninth Chords ===');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '9', 'C9 (C-E-G-Bb-D)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('B', 4), pianoKey('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj9', 'Cmaj9 (C-E-G-B-D)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm9', 'Cm9 (C-Eb-G-Bb-D)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('C#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7b9', 'C7b9 (C-E-G-Bb-Db)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('D#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7#9', 'C7#9 Hendrix (C-E-G-Bb-D#)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('A#', 4), pianoKey('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '9', 'C9 no 5th (C-E-Bb-D)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A', 4), pianoKey('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '6/9', 'C6/9 (C-E-G-A-D)');

console.log('\n=== 7. Eleventh Chords ===');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('D', 5), pianoKey('F', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '11', 'C11 full (C-E-G-Bb-D-F)');

r = analyzer.detect([pianoKey('C', 3), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('D', 5), pianoKey('F', 5)]);
assert(topRoot(r) === 'C' && (topSymbol(r) === '9sus4' || topSymbol(r) === '11'),
  'C11 no 3rd → C9sus4 or C11');
assert(hasCandidate(r, 'C11'), 'C11 is a candidate for C-G-Bb-D-F');

r = analyzer.detect([pianoKey('C', 3), pianoKey('D#', 4), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('D', 5), pianoKey('F', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm11', 'Cm11 (C-Eb-G-Bb-D-F)');

r = analyzer.detect([pianoKey('C', 3), pianoKey('D#', 4), pianoKey('A#', 4), pianoKey('F', 5)]);
assert(topName(r) === 'F7sus4/C' && hasCandidate(r, 'Cm11'), 'Cm11 shell also forms a complete F7sus4/C');
assert(analyzer.detect([pianoKey('C', 3), pianoKey('D#', 4), pianoKey('A#', 4), pianoKey('F', 5)], { ranking: 'bass' })[0].name === 'Cm11',
  'Bass ranking preserves Cm11 shell interpretation');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 4), pianoKey('G', 4), pianoKey('B', 4), pianoKey('D', 5), pianoKey('F', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj11', 'Cmaj11 (C-E-G-B-D-F)');

console.log('\n=== 8. Thirteenth Chords ===');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('D', 5), pianoKey('F', 5), pianoKey('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13', 'C13 full voicing');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 4), pianoKey('A#', 4), pianoKey('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13', 'C13 minimal (C-E-Bb-A)');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 4), pianoKey('A#', 4), pianoKey('D', 5), pianoKey('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13', 'C13 omit 5,11 (C-E-Bb-D-A)');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 4), pianoKey('B', 4), pianoKey('A', 5)]);
assert(topName(r) === 'Amadd9/C' && hasCandidate(r, 'Cmaj13'), 'Cmaj13 shell also forms a complete Amadd9/C');
assert(analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('B', 4), pianoKey('A', 5)], { ranking: 'bass' })[0].name === 'Cmaj13',
  'Bass ranking preserves Cmaj13 shell interpretation');

r = analyzer.detect([pianoKey('C', 3), pianoKey('D#', 4), pianoKey('G', 4), pianoKey('A#', 4), pianoKey('D', 5), pianoKey('F', 5), pianoKey('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm13', 'Cm13 full voicing');

r = analyzer.detect([pianoKey('C', 3), pianoKey('D#', 4), pianoKey('A#', 4), pianoKey('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm13', 'Cm13 minimal (C-Eb-Bb-A)');

console.log('\n=== 9. Altered Chords ===');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('F#', 4), pianoKey('G', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7#11', 'C7#11 (C-E-F#-G-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('G#', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7b13', 'C7b13 (C-E-G-Ab-Bb)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G#', 4), pianoKey('A#', 4), pianoKey('C#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7#5b9', 'C7#5b9 (C-E-G#-Bb-Db)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G#', 4), pianoKey('A#', 4), pianoKey('D#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7#5#9', 'C7#5#9 (C-E-G#-Bb-D#)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('F#', 4), pianoKey('A#', 4), pianoKey('C#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7b5b9', 'C7b5b9 (C-E-Gb-Bb-Db)');

console.log('\n=== 10. Inversions ===');

r = analyzer.detect([pianoKey('E', 3), pianoKey('G', 4), pianoKey('C', 5)]);
assert(topRoot(r) === 'C' && r[0].inversion === 1, 'C/E first inversion');
assert(r[0].slash === 'C/E', 'C/E slash notation');

r = analyzer.detect([pianoKey('G', 3), pianoKey('C', 4), pianoKey('E', 4)]);
assert(topRoot(r) === 'C' && r[0].inversion === 2, 'C/G second inversion');

r = analyzer.detect([pianoKey('B', 3), pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj7' && r[0].inversion === 3,
  'Cmaj7/B third inversion');

r = analyzer.detect([pianoKey('C', 3), pianoKey('A', 3), pianoKey('E', 4)]);
assert(hasCandidate(r, 'Am/C') || (topRoot(r) === 'A' && r[0].bass === 'C'),
  'Am/C detected');

r = analyzer.detect([pianoKey('D', 4), pianoKey('F#', 4), pianoKey('A', 4)]);
assert(topName(r) === 'D' && r[0].inversion === 0, 'D major root position');

r = analyzer.detect([pianoKey('F#', 3), pianoKey('A', 3), pianoKey('D', 4)]);
assert(topRoot(r) === 'D' && r[0].inversion === 1, 'D/F# first inversion');

r = analyzer.detect([pianoKey('A', 3), pianoKey('D', 4), pianoKey('F#', 4)]);
assert(topRoot(r) === 'D' && r[0].inversion === 2, 'D/A second inversion');

console.log('\n=== 11. Slash Chords ===');

r = analyzer.detect([pianoKey('F#', 3), pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4)]);
const slashResult = r.find(c => c.root === 'C' && c.symbol === '' && c.bass === 'F#');
assert(slashResult !== undefined, 'C/F# slash chord detected');

console.log('\n=== 12. Various Keys ===');

r = analyzer.detect([pianoKey('G', 4), pianoKey('B', 4), pianoKey('D', 5)]);
assert(topName(r) === 'G', 'G major');

r = analyzerFlats.detect([pianoKey('D#', 4), pianoKey('G', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'Eb' && topSymbol(r) === '', 'Eb major');

r = analyzer.detect([pianoKey('F#', 4), pianoKey('A', 4), pianoKey('C#', 5), pianoKey('E', 5)]);
assert(topRoot(r) === 'F#' && topSymbol(r) === 'm7', 'F#m7');

r = analyzerFlats.detect([pianoKey('A#', 3), pianoKey('D', 4), pianoKey('F', 4), pianoKey('A', 4)]);
assert(topRoot(r) === 'Bb' && topSymbol(r) === 'maj7', 'Bbmaj7');

r = analyzer.detect([pianoKey('E', 4), pianoKey('G#', 4), pianoKey('B', 4), pianoKey('D', 5)]);
assert(topRoot(r) === 'E' && topSymbol(r) === '7', 'E7');

r = analyzerFlats.detect([pianoKey('G#', 4), pianoKey('B', 4), pianoKey('D', 5)]);
assert(topRoot(r) === 'Ab' && topSymbol(r) === 'dim', 'Ab dim (flat mode)');

console.log('\n=== 13. Symmetrical Chords ===');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'aug', 'C aug (C in bass)');

r = analyzer.detect([pianoKey('E', 3), pianoKey('G#', 3), pianoKey('C', 4)]);
assert(topRoot(r) === 'E' && topSymbol(r) === 'aug', 'E aug (E in bass)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4), pianoKey('F#', 4), pianoKey('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'dim7', 'Cdim7 (C in bass)');

r = analyzer.detect([pianoKey('D#', 3), pianoKey('F#', 3), pianoKey('A', 3), pianoKey('C', 4)]);
assert(topSymbol(r) === 'dim7' && r[0].inversion === 0, 'dim7 with D# in bass = root position');

console.log('\n=== 14. Note Spelling ===');

r = analyzer.getChordNotes('C', 'maj7');
assert(r !== null, 'getChordNotes returns result for Cmaj7');
assert(r.notes.map(n => n.name).join('-') === 'C-E-G-B', 'Cmaj7 notes = C-E-G-B');

r = analyzer.getChordNotes('C', 'm');
assert(r.notes.map(n => n.name).join('-') === 'C-Eb-G', 'Cm notes = C-Eb-G');

r = analyzer.getChordNotes('F#', 'maj7');
assert(r.notes.map(n => n.name).join('-') === 'F#-A#-C#-E#', 'F#maj7 notes = F#-A#-C#-E#');

r = analyzerFlats.getChordNotes('Db', '');
assert(r.notes.map(n => n.name).join('-') === 'Db-F-Ab', 'Db major notes = Db-F-Ab');

r = analyzer.getChordNotes('C', '7#9');
const noteNames = r.notes.map(n => n.name);
assert(noteNames.includes('C') && noteNames.includes('E') && noteNames.includes('D#'),
  'C7#9 includes C, E, D# (#9)');

r = analyzer.getChordNotes('C', 'dim7');
const dim7Notes = r.notes.map(n => n.name);
assert(dim7Notes[0] === 'C' && dim7Notes[1] === 'Eb' && dim7Notes[2] === 'Gb',
  'Cdim7 spelling: C-Eb-Gb-...');

console.log('\n=== 15. Edge Cases ===');

r = analyzer.detect([pianoKey('C', 4)]);
assert(r.length === 1 && r[0].root === 'C', 'Single note returns note info');

r = analyzer.detect([pianoKey('C', 3), pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '', 'Duplicate C → still C major');

r = analyzer.detect([pianoKey('C', 2), pianoKey('E', 4), pianoKey('G', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '', 'Wide voicing C major');

r = analyzer.detect([]);
assert(r.length === 0, 'Empty input returns empty');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4)]);
assert(r.length === 0, 'Major third alone is not a complete chord');

r = analyzer.detect([1, 2]);
assert(r.length === 0, 'Lowest adjacent keys have no chord match');

r = analyzer.detect([87, 88]);
assert(r.length === 0, 'Highest adjacent keys have no chord match');

console.log('\n=== 16. Sus Extensions ===');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D', 4), pianoKey('F', 4), pianoKey('G', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '9sus4', 'C9sus4 (C-D-F-G-Bb)');

r = analyzer.detect([pianoKey('C', 3), pianoKey('D', 4), pianoKey('F', 4), pianoKey('G', 4), pianoKey('A', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13sus4', 'C13sus4 (C-D-F-G-A-Bb)');

console.log('\n=== 17. Utility Methods ===');

const types = analyzer.getChordTypes();
assert(types.length > 40, `getChordTypes returns ${types.length} types (expected > 40)`);
assert(types.some(t => t.symbol === 'maj7'), 'Types include maj7');
assert(types.some(t => t.symbol === '13'), 'Types include 13');
assert(types.some(t => t.symbol === '7#9'), 'Types include 7#9');

console.log('\n=== 18. Jazz Voicings ===');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 3), pianoKey('B', 3), pianoKey('D', 4), pianoKey('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj9', 'Cmaj9 jazz voicing');

r = analyzer.detect([pianoKey('D', 3), pianoKey('F', 3), pianoKey('A', 3), pianoKey('C', 4), pianoKey('E', 4)]);
assert(topRoot(r) === 'D' && topSymbol(r) === 'm9', 'Dm9 jazz voicing');

r = analyzer.detect([pianoKey('G', 3), pianoKey('B', 3), pianoKey('F', 4), pianoKey('E', 5)]);
assert(topRoot(r) === 'G' && topSymbol(r) === '13', 'G13 shell voicing (G-B-F-E)');

r = analyzerFlats.detect([pianoKey('A#', 3), pianoKey('D', 4), pianoKey('F', 4), pianoKey('A', 4), pianoKey('E', 5)]);
assert(topRoot(r) === 'Bb' && topSymbol(r) === 'maj7#11', 'Bbmaj7#11');

r = analyzer.detect([pianoKey('A', 3), pianoKey('C#', 4), pianoKey('E', 4), pianoKey('G', 4), pianoKey('A#', 4)]);
assert(topRoot(r) === 'A' && topSymbol(r) === '7b9', 'A7b9');

console.log('\n=== 19. Parsing and Alias Support ===');

assert(analyzer.noteToKey('B♭', 3) === analyzer.noteToKey('A#', 3), 'Unicode flat parsing (B♭3 = A#3)');
assert(analyzer.noteToKey('Fx', 4) === analyzer.noteToKey('G', 4), 'Double-sharp parsing (Fx4 = G4)');
assert(analyzer.noteToKey('E𝄫', 4) === analyzer.noteToKey('D', 4), 'Double-flat parsing (E𝄫4 = D4)');

let chord = analyzer.getChordNotes('B♭', 'maj7');
assert(chord?.name === 'Bbmaj7', 'Unicode root parsing in getChordNotes');

chord = analyzer.getChordNotes('C', 'sus');
assert(chord?.symbol === 'sus4', 'sus alias resolves to sus4');

chord = analyzer.getChordNotes('C', 'M7');
assert(chord?.symbol === 'maj7', 'M7 alias resolves to maj7');

chord = analyzer.getChordNotes('C', 'Δ7');
assert(chord?.symbol === 'maj7', 'Δ7 alias resolves to maj7');

chord = analyzer.getChordNotes('C', 'major13');
assert(chord?.symbol === 'maj13', 'major13 alias resolves to maj13');

chord = analyzer.getChordNotes('C', 'min7');
assert(chord?.symbol === 'm7', 'min7 alias resolves to m7');

chord = analyzer.getChordNotes('C', 'ø7');
assert(chord?.symbol === 'm7b5', 'ø7 alias resolves to m7b5');

chord = analyzer.getChordNotes('C', '°7');
assert(chord?.symbol === 'dim7', '°7 alias resolves to dim7');

chord = analyzer.getChordNotes('C', '+');
assert(chord?.symbol === 'aug', '+ alias resolves to augmented');

chord = analyzer.getChordNotes('C', '7♭9');
assert(chord?.symbol === '7b9', 'Unicode accidental alias resolves in chord types');

console.log('\n=== 20. Theory Edge Cases ===');

r = analyzer.detect([pianoKey('G#', 4), pianoKey('B', 4), pianoKey('D#', 5)]);
assert(topRoot(r) === 'G#' && topSymbol(r) === 'm', 'G#m detected in sharp mode');
r = analyzerFlats.detect([pianoKey('G#', 4), pianoKey('B', 4), pianoKey('D#', 5)]);
assert(topRoot(r) === 'Ab' && topSymbol(r) === 'm', 'Abm detected in flat mode');

r = analyzer.getChordNotes('C', 'dim7');
const cdim7Notes = r.notes.map(n => n.name);
assert(cdim7Notes[3] === 'Bbb', 'Cdim7 seventh note = Bbb (double flat)');

r = analyzer.getChordNotes('F#', '7');
assert(r.notes.map(n => n.name).join('-') === 'F#-A#-C#-E', 'F#7 sharp-key spelling: F#-A#-C#-E');

r = analyzerFlats.getChordNotes('Bb', '7');
assert(r.notes.map(n => n.name).join('-') === 'Bb-D-F-Ab', 'Bb7 flat-key spelling: Bb-D-F-Ab');

r = analyzerFlats.detect([pianoKey('C#', 4), pianoKey('F', 4), pianoKey('G#', 4), pianoKey('B', 4)]);
assert(topRoot(r) === 'Db' && topSymbol(r) === '7', 'Db7 detected (tritone sub context)');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D', 4), pianoKey('E', 4), pianoKey('F', 4), pianoKey('G', 4), pianoKey('A', 4), pianoKey('B', 4)]);
assert(r.length > 0, 'All white keys C-B returns candidates without crash');

r = analyzer.detect([pianoKey('C', 4), pianoKey('C#', 4), pianoKey('D', 4)]);
assert(r.length === 0, 'Chromatic cluster C-C#-D has no strict chord match');

assert(analyzer.noteToKey('D', 4) === 42, 'noteToKey(D, 4) = 42');
note = analyzer.keyToNote(42);
assert(note.name === 'D' && note.octave === 4, 'keyToNote(42) = D4');

r = analyzerFlats.getChordNotes('Gb', '');
assert(r.notes.map(n => n.name).join('-') === 'Gb-Bb-Db', 'Gb major notes = Gb-Bb-Db');

r = analyzer.detect([pianoKey('G#', 3), pianoKey('C', 4), pianoKey('E', 4)]);
assert(topSymbol(r) === 'aug', 'G#-C-E detects augmented');

r = analyzer.detect([pianoKey('A#', 3), pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4)]);
assert(r.some(c => c.name === 'C/A#' && c.inversion === -1), 'Non-chord slash bass follows the global spelling preference');

r = analyzer.detect([pianoKey('C', 2), pianoKey('C', 5)]);
assert(r.length === 1 && r[0].kind === 'octaves' && r[0].playedNotes.length === 2, 'Octaves retain both played pitches');

chord = analyzer.getChordNotes('C', '-7');
assert(chord?.symbol === 'm7', "'-7' alias resolves to m7");

chord = analyzer.getChordNotes('C', 'ø');
assert(chord?.symbol === 'm7b5', "'ø' alias resolves to m7b5");

r = analyzer.getChordNotes('E', 'maj7');
assert(r.notes.map(n => n.name).join('-') === 'E-G#-B-D#', 'Emaj7 spelling = E-G#-B-D#');

r = analyzerFlats.detect([pianoKey('C#', 4), pianoKey('F', 4), pianoKey('G#', 4)]);
assert(topRoot(r) === 'Db' && topSymbol(r) === '', 'Db major detected in flat mode');

r = analyzer.detect([pianoKey('C', 3), pianoKey('E', 4), pianoKey('F#', 4), pianoKey('G', 4), pianoKey('A', 4), pianoKey('A#', 4), pianoKey('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13#11', 'C13#11 detected from full voicing');

r = analyzer.detect([pianoKey('C', 4), pianoKey('D#', 4)]);
assert(r.length === 0, 'Minor third alone is not a complete chord');

r = analyzer.detect([pianoKey('C', 4), pianoKey('E', 4), pianoKey('G', 4)], { maxResults: 1 });
assert(r.length === 1, 'maxResults=1 returns exactly 1 result');

r = analyzer.detect([40, 40, 44, 47]);
assert(topRoot(r) === 'C' && topSymbol(r) === '', 'Duplicate keys still detect C major');

console.log('\n' + '='.repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failures.length > 0) {
  console.log('\nFailed tests:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
}
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
