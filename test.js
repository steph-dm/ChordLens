import { ChordAnalyzer } from './chord-analyzer.js';

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

// Helper: convert note name + octave to piano key number
function k(noteName, octave) {
  const key = analyzer.noteToKey(noteName, octave);
  if (key === null) throw new Error(`Invalid note: ${noteName}${octave}`);
  return key;
}

console.log('\n=== 1. Key / Note Mapping ===');

// Key 1 = A0
let note = analyzer.keyToNote(1);
assert(note.name === 'A' && note.octave === 0, 'Key 1 = A0');

// Key 88 = C8
note = analyzer.keyToNote(88);
assert(note.name === 'C' && note.octave === 8, 'Key 88 = C8');

// Key 40 = C4 (Middle C)
note = analyzer.keyToNote(40);
assert(note.name === 'C' && note.octave === 4, 'Key 40 = C4 (Middle C)');

// Key 49 = A4 (concert pitch)
note = analyzer.keyToNote(49);
assert(note.name === 'A' && note.octave === 4, 'Key 49 = A4');

// Flat mode
note = analyzerFlats.keyToNote(42);
assert(note.name === 'D' && note.octave === 4, 'Key 42 = D4 (flat mode)');

note = analyzerFlats.keyToNote(41);
assert(note.name === 'Db' && note.octave === 4, 'Key 41 = Db4 (flat mode)');

note = analyzer.keyToNote(41);
assert(note.name === 'C#' && note.octave === 4, 'Key 41 = C#4 (sharp mode)');

// noteToKey round-trip
assert(analyzer.noteToKey('A', 0) === 1, 'noteToKey(A, 0) = 1');
assert(analyzer.noteToKey('C', 8) === 88, 'noteToKey(C, 8) = 88');
assert(analyzer.noteToKey('C', 4) === 40, 'noteToKey(C, 4) = 40');
assert(analyzer.noteToKey('A', 4) === 49, 'noteToKey(A, 4) = 49');

// Out of range
assert(analyzer.noteToKey('G', 0) === null, 'noteToKey(G, 0) out of range');


console.log('\n=== 2. Basic Triads ===');

// C major: C4-E4-G4
let r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4)]);
assert(topName(r) === 'C', 'C major (C-E-G)');
assert(r[0].inversion === 0, 'C major root position');

// C minor: C4-Eb4-G4
r = analyzer.detect([k('C', 4), k('D#', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm', 'C minor (C-Eb-G)');

// C diminished: C4-Eb4-Gb4
r = analyzer.detect([k('C', 4), k('D#', 4), k('F#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'dim', 'C diminished (C-Eb-Gb)');

// C augmented: C4-E4-G#4
r = analyzer.detect([k('C', 4), k('E', 4), k('G#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'aug', 'C augmented (C-E-G#)');

// C sus2: C4-D4-G4
r = analyzer.detect([k('C', 4), k('D', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'sus2', 'C sus2 (C-D-G)');

// C sus4: C4-F4-G4
r = analyzer.detect([k('C', 4), k('F', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'sus4', 'C sus4 (C-F-G)');

// Power chord: C4-G4
r = analyzer.detect([k('C', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '5', 'C5 power chord (C-G)');

// D major
r = analyzer.detect([k('D', 4), k('F#', 4), k('A', 4)]);
assert(topName(r) === 'D', 'D major (D-F#-A)');

// F# minor
r = analyzer.detect([k('F#', 3), k('A', 3), k('C#', 4)]);
assert(topRoot(r) === 'F#' && topSymbol(r) === 'm', 'F# minor (F#-A-C#)');

// Bb major (flat mode)
r = analyzerFlats.detect([k('A#', 3), k('D', 4), k('F', 4)]);
assert(topRoot(r) === 'Bb' && topSymbol(r) === '', 'Bb major (Bb-D-F) flat mode');

// Ab major (flat mode)
r = analyzerFlats.detect([k('G#', 3), k('C', 4), k('D#', 4)]);
assert(topRoot(r) === 'Ab' && topSymbol(r) === '', 'Ab major (Ab-C-Eb) flat mode');


console.log('\n=== 3. Seventh Chords ===');

// Cmaj7: C-E-G-B
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('B', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj7', 'Cmaj7 (C-E-G-B)');

// C7: C-E-G-Bb
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7', 'C7 (C-E-G-Bb)');

// Cm7: C-Eb-G-Bb
r = analyzer.detect([k('C', 4), k('D#', 4), k('G', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm7', 'Cm7 (C-Eb-G-Bb)');

// Cdim7: C-Eb-Gb-Bbb(=A)
r = analyzer.detect([k('C', 4), k('D#', 4), k('F#', 4), k('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'dim7', 'Cdim7 (C-Eb-Gb-A)');

// Cm7b5: C-Eb-Gb-Bb
r = analyzer.detect([k('C', 4), k('D#', 4), k('F#', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm7b5', 'Cm7b5 (C-Eb-Gb-Bb)');

// CmMaj7: C-Eb-G-B
r = analyzer.detect([k('C', 4), k('D#', 4), k('G', 4), k('B', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'mMaj7', 'CmMaj7 (C-Eb-G-B)');

// CaugMaj7: C-E-G#-B
r = analyzer.detect([k('C', 4), k('E', 4), k('G#', 4), k('B', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'augMaj7', 'CaugMaj7 (C-E-G#-B)');

// Caug7: C-E-G#-Bb
r = analyzer.detect([k('C', 4), k('E', 4), k('G#', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'aug7', 'Caug7 (C-E-G#-Bb)');

// C7b5: C-E-Gb-Bb
r = analyzer.detect([k('C', 4), k('E', 4), k('F#', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7b5', 'C7b5 (C-E-Gb-Bb)');

// C7sus4: C-F-G-Bb
r = analyzer.detect([k('C', 4), k('F', 4), k('G', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7sus4', 'C7sus4 (C-F-G-Bb)');

// C7sus2: C-D-G-Bb
r = analyzer.detect([k('C', 4), k('D', 4), k('G', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7sus2', 'C7sus2 (C-D-G-Bb)');

// Cmaj7 without 5th: C-E-B (should still detect Cmaj7)
r = analyzer.detect([k('C', 4), k('E', 4), k('B', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj7', 'Cmaj7 no 5th (C-E-B)');

// C7 without 5th: C-E-Bb
r = analyzer.detect([k('C', 4), k('E', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7', 'C7 no 5th (C-E-Bb)');

// Cm7 without 5th: C-Eb-Bb
r = analyzer.detect([k('C', 4), k('D#', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm7', 'Cm7 no 5th (C-Eb-Bb)');


console.log('\n=== 4. Sixth Chords ===');

// C6: C-E-G-A
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '6', 'C6 (C-E-G-A)');

// Cm6: C-Eb-G-A
r = analyzer.detect([k('C', 4), k('D#', 4), k('G', 4), k('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm6', 'Cm6 (C-Eb-G-A)');

// Am7 vs C6 ambiguity: when A is in bass → Am7
r = analyzer.detect([k('A', 3), k('C', 4), k('E', 4), k('G', 4)]);
assert(topRoot(r) === 'A' && topSymbol(r) === 'm7', 'Am7 when A in bass (A-C-E-G)');

// Am7 vs C6: when C is in bass → C6
r = analyzer.detect([k('C', 3), k('E', 4), k('G', 4), k('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '6', 'C6 when C in bass (C-E-G-A)');


console.log('\n=== 5. Add Chords ===');

// Cadd9: C-D-E-G
r = analyzer.detect([k('C', 4), k('D', 4), k('E', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'add9', 'Cadd9 (C-D-E-G)');

// Cmadd9: C-D-Eb-G
r = analyzer.detect([k('C', 4), k('D', 4), k('D#', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'madd9', 'Cmadd9 (C-D-Eb-G)');


console.log('\n=== 6. Ninth Chords ===');

// C9: C-E-G-Bb-D
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('A#', 4), k('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '9', 'C9 (C-E-G-Bb-D)');

// Cmaj9: C-E-G-B-D
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('B', 4), k('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj9', 'Cmaj9 (C-E-G-B-D)');

// Cm9: C-Eb-G-Bb-D
r = analyzer.detect([k('C', 4), k('D#', 4), k('G', 4), k('A#', 4), k('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm9', 'Cm9 (C-Eb-G-Bb-D)');

// C7b9: C-E-G-Bb-Db
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('A#', 4), k('C#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7b9', 'C7b9 (C-E-G-Bb-Db)');

// C7#9 (Hendrix): C-E-G-Bb-D#
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('A#', 4), k('D#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7#9', 'C7#9 Hendrix (C-E-G-Bb-D#)');

// C9 without 5th: C-E-Bb-D (should still detect C9)
r = analyzer.detect([k('C', 4), k('E', 4), k('A#', 4), k('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '9', 'C9 no 5th (C-E-Bb-D)');

// C6/9: C-E-G-A-D
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('A', 4), k('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '6/9', 'C6/9 (C-E-G-A-D)');


console.log('\n=== 7. Eleventh Chords ===');

// C11: C-E-G-Bb-D-F  (full voicing)
r = analyzer.detect([k('C', 3), k('E', 4), k('G', 4), k('A#', 4), k('D', 5), k('F', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '11', 'C11 full (C-E-G-Bb-D-F)');

// C11 without 3rd (common voicing): C-G-Bb-D-F
// Without the 3rd, this is exactly C9sus4 — a more precise name.
// C11 should still appear as a candidate.
r = analyzer.detect([k('C', 3), k('G', 4), k('A#', 4), k('D', 5), k('F', 5)]);
assert(topRoot(r) === 'C' && (topSymbol(r) === '9sus4' || topSymbol(r) === '11'),
  'C11 no 3rd → C9sus4 or C11');
assert(hasCandidate(r, 'C11'), 'C11 is a candidate for C-G-Bb-D-F');

// Cm11: C-Eb-G-Bb-D-F
r = analyzer.detect([k('C', 3), k('D#', 4), k('G', 4), k('A#', 4), k('D', 5), k('F', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm11', 'Cm11 (C-Eb-G-Bb-D-F)');

// Cm11 without 5th and 9th: C-Eb-Bb-F (root, b3, b7, 11)
r = analyzer.detect([k('C', 3), k('D#', 4), k('A#', 4), k('F', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm11', 'Cm11 minimal (C-Eb-Bb-F)');

// Cmaj11: C-E-G-B-D-F
r = analyzer.detect([k('C', 3), k('E', 4), k('G', 4), k('B', 4), k('D', 5), k('F', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj11', 'Cmaj11 (C-E-G-B-D-F)');


console.log('\n=== 8. Thirteenth Chords ===');

// C13 full: C-E-G-Bb-D-F-A
r = analyzer.detect([k('C', 3), k('E', 4), k('G', 4), k('A#', 4), k('D', 5), k('F', 5), k('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13', 'C13 full voicing');

// C13 practical voicing (omit 5, 9, 11): C-E-Bb-A
r = analyzer.detect([k('C', 3), k('E', 4), k('A#', 4), k('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13', 'C13 minimal (C-E-Bb-A)');

// C13 omit 5 and 11: C-E-Bb-D-A
r = analyzer.detect([k('C', 3), k('E', 4), k('A#', 4), k('D', 5), k('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13', 'C13 omit 5,11 (C-E-Bb-D-A)');

// Cmaj13 practical: C-E-B-A
r = analyzer.detect([k('C', 3), k('E', 4), k('B', 4), k('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj13', 'Cmaj13 minimal (C-E-B-A)');

// Cm13: C-Eb-G-Bb-D-F-A
r = analyzer.detect([k('C', 3), k('D#', 4), k('G', 4), k('A#', 4), k('D', 5), k('F', 5), k('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm13', 'Cm13 full voicing');

// Cm13 minimal: C-Eb-Bb-A
r = analyzer.detect([k('C', 3), k('D#', 4), k('A#', 4), k('A', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'm13', 'Cm13 minimal (C-Eb-Bb-A)');


console.log('\n=== 9. Altered Chords ===');

// C7#11: C-E-F#-G-Bb
r = analyzer.detect([k('C', 4), k('E', 4), k('F#', 4), k('G', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7#11', 'C7#11 (C-E-F#-G-Bb)');

// C7b13: C-E-G-Ab-Bb
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4), k('G#', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7b13', 'C7b13 (C-E-G-Ab-Bb)');

// C7#5b9: C-E-G#-Bb-Db
r = analyzer.detect([k('C', 4), k('E', 4), k('G#', 4), k('A#', 4), k('C#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7#5b9', 'C7#5b9 (C-E-G#-Bb-Db)');

// C7#5#9: C-E-G#-Bb-D#
r = analyzer.detect([k('C', 4), k('E', 4), k('G#', 4), k('A#', 4), k('D#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7#5#9', 'C7#5#9 (C-E-G#-Bb-D#)');

// C7b5b9: C-E-Gb-Bb-Db
r = analyzer.detect([k('C', 4), k('E', 4), k('F#', 4), k('A#', 4), k('C#', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '7b5b9', 'C7b5b9 (C-E-Gb-Bb-Db)');


console.log('\n=== 10. Inversions ===');

// C/E (C major, 1st inversion)
r = analyzer.detect([k('E', 3), k('G', 4), k('C', 5)]);
assert(topRoot(r) === 'C' && r[0].inversion === 1, 'C/E first inversion');
assert(r[0].slash === 'C/E', 'C/E slash notation');

// C/G (C major, 2nd inversion)
r = analyzer.detect([k('G', 3), k('C', 4), k('E', 4)]);
assert(topRoot(r) === 'C' && r[0].inversion === 2, 'C/G second inversion');

// Cmaj7/B (3rd inversion)
r = analyzer.detect([k('B', 3), k('C', 4), k('E', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj7' && r[0].inversion === 3,
  'Cmaj7/B third inversion');

// Am/C (first inversion of Am) — bass is C
r = analyzer.detect([k('C', 3), k('A', 3), k('E', 4)]);
// Should detect Am with C in bass (Am/C or C6-like)
assert(hasCandidate(r, 'Am/C') || (topRoot(r) === 'A' && r[0].bass === 'C'),
  'Am/C detected');

// D major in all inversions
// Root: D-F#-A
r = analyzer.detect([k('D', 4), k('F#', 4), k('A', 4)]);
assert(topName(r) === 'D' && r[0].inversion === 0, 'D major root position');

// 1st inv: F#-A-D
r = analyzer.detect([k('F#', 3), k('A', 3), k('D', 4)]);
assert(topRoot(r) === 'D' && r[0].inversion === 1, 'D/F# first inversion');

// 2nd inv: A-D-F#
r = analyzer.detect([k('A', 3), k('D', 4), k('F#', 4)]);
assert(topRoot(r) === 'D' && r[0].inversion === 2, 'D/A second inversion');


console.log('\n=== 11. Slash Chords ===');

// C/F# — C major triad with F# bass (not a chord tone)
r = analyzer.detect([k('F#', 3), k('C', 4), k('E', 4), k('G', 4)]);
// Should have a slash chord candidate: C/F#
const slashResult = r.find(c => c.root === 'C' && c.symbol === '' && c.bass === 'F#');
assert(slashResult !== undefined, 'C/F# slash chord detected');


console.log('\n=== 12. Various Keys ===');

// G major: G-B-D
r = analyzer.detect([k('G', 4), k('B', 4), k('D', 5)]);
assert(topName(r) === 'G', 'G major');

// Eb major (flat mode): Eb-G-Bb
r = analyzerFlats.detect([k('D#', 4), k('G', 4), k('A#', 4)]);
assert(topRoot(r) === 'Eb' && topSymbol(r) === '', 'Eb major');

// F#m7: F#-A-C#-E
r = analyzer.detect([k('F#', 4), k('A', 4), k('C#', 5), k('E', 5)]);
assert(topRoot(r) === 'F#' && topSymbol(r) === 'm7', 'F#m7');

// Bbmaj7 (flat mode): Bb-D-F-A
r = analyzerFlats.detect([k('A#', 3), k('D', 4), k('F', 4), k('A', 4)]);
assert(topRoot(r) === 'Bb' && topSymbol(r) === 'maj7', 'Bbmaj7');

// E7: E-G#-B-D
r = analyzer.detect([k('E', 4), k('G#', 4), k('B', 4), k('D', 5)]);
assert(topRoot(r) === 'E' && topSymbol(r) === '7', 'E7');

// Ab diminished (flat mode): Ab-Cb-Ebb → Ab-B-D
r = analyzerFlats.detect([k('G#', 4), k('B', 4), k('D', 5)]);
assert(topRoot(r) === 'Ab' && topSymbol(r) === 'dim', 'Ab dim (flat mode)');


console.log('\n=== 13. Symmetrical Chords ===');

// Augmented: C-E-G# is symmetrical.
// With C in bass → C aug preferred
r = analyzer.detect([k('C', 4), k('E', 4), k('G#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'aug', 'C aug (C in bass)');

// With E in bass → E aug preferred
r = analyzer.detect([k('E', 3), k('G#', 3), k('C', 4)]);
assert(topRoot(r) === 'E' && topSymbol(r) === 'aug', 'E aug (E in bass)');

// Diminished 7th is symmetrical: C-Eb-Gb-A
// With C in bass → Cdim7
r = analyzer.detect([k('C', 4), k('D#', 4), k('F#', 4), k('A', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'dim7', 'Cdim7 (C in bass)');

// With D#/Eb in bass → Ebdim7 (or D#dim7 in sharp mode)
r = analyzer.detect([k('D#', 3), k('F#', 3), k('A', 3), k('C', 4)]);
assert(topSymbol(r) === 'dim7' && r[0].inversion === 0, 'dim7 with D# in bass = root position');


console.log('\n=== 14. Note Spelling ===');

// Cmaj7 notes should be C, E, G, B
r = analyzer.getChordNotes('C', 'maj7');
assert(r !== null, 'getChordNotes returns result for Cmaj7');
assert(r.notes.map(n => n.name).join('-') === 'C-E-G-B', 'Cmaj7 notes = C-E-G-B');

// Cm notes: C, Eb, G
r = analyzer.getChordNotes('C', 'm');
assert(r.notes.map(n => n.name).join('-') === 'C-Eb-G', 'Cm notes = C-Eb-G');

// F#maj7: F#, A#, C#, E#
r = analyzer.getChordNotes('F#', 'maj7');
assert(r.notes.map(n => n.name).join('-') === 'F#-A#-C#-E#', 'F#maj7 notes = F#-A#-C#-E#');

// Db major (flat mode): Db, F, Ab
r = analyzerFlats.getChordNotes('Db', '');
assert(r.notes.map(n => n.name).join('-') === 'Db-F-Ab', 'Db major notes = Db-F-Ab');

// C7#9 notes: C, E, G, Bb, D#
r = analyzer.getChordNotes('C', '7#9');
const noteNames = r.notes.map(n => n.name);
assert(noteNames.includes('C') && noteNames.includes('E') && noteNames.includes('D#'),
  'C7#9 includes C, E, D# (#9)');

// C diminished 7th: C, Eb, Gb, Bbb
r = analyzer.getChordNotes('C', 'dim7');
const dim7Notes = r.notes.map(n => n.name);
assert(dim7Notes[0] === 'C' && dim7Notes[1] === 'Eb' && dim7Notes[2] === 'Gb',
  'Cdim7 spelling: C-Eb-Gb-...');


console.log('\n=== 15. Edge Cases ===');

// Single note
r = analyzer.detect([k('C', 4)]);
assert(r.length === 1 && r[0].root === 'C', 'Single note returns note info');

// Duplicate octaves (C3 + C4 + E4 + G4)
r = analyzer.detect([k('C', 3), k('C', 4), k('E', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '', 'Duplicate C → still C major');

// Very wide voicing (C2 + E4 + G5)
r = analyzer.detect([k('C', 2), k('E', 4), k('G', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '', 'Wide voicing C major');

// Empty input
r = analyzer.detect([]);
assert(r.length === 0, 'Empty input returns empty');

// Two notes not a 5th apart
r = analyzer.detect([k('C', 4), k('E', 4)]);
// Should not crash; may return limited results
assert(r.length >= 0, 'Two notes (major 3rd) does not crash');

// Extreme range: lowest two keys
r = analyzer.detect([1, 2]);
assert(r.length >= 0, 'Lowest keys do not crash');

// Extreme range: highest keys
r = analyzer.detect([87, 88]);
assert(r.length >= 0, 'Highest keys do not crash');


console.log('\n=== 16. Sus Extensions ===');

// C9sus4: C-D-F-G-Bb
r = analyzer.detect([k('C', 4), k('D', 4), k('F', 4), k('G', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '9sus4', 'C9sus4 (C-D-F-G-Bb)');

// C13sus4: C-D-F-G-A-Bb
r = analyzer.detect([k('C', 3), k('D', 4), k('F', 4), k('G', 4), k('A', 4), k('A#', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13sus4', 'C13sus4 (C-D-F-G-A-Bb)');


console.log('\n=== 17. Utility Methods ===');

const types = analyzer.getChordTypes();
assert(types.length > 40, `getChordTypes returns ${types.length} types (expected > 40)`);
assert(types.some(t => t.symbol === 'maj7'), 'Types include maj7');
assert(types.some(t => t.symbol === '13'), 'Types include 13');
assert(types.some(t => t.symbol === '7#9'), 'Types include 7#9');


console.log('\n=== 18. Jazz Voicings ===');

// Bill Evans-style Cmaj9 voicing: E3-B3-D4-G4 (rootless, but let's test with root)
// C-E-G-B-D
r = analyzer.detect([k('C', 3), k('E', 3), k('B', 3), k('D', 4), k('G', 4)]);
assert(topRoot(r) === 'C' && topSymbol(r) === 'maj9', 'Cmaj9 jazz voicing');

// Dm9 voicing: D-F-A-C-E
r = analyzer.detect([k('D', 3), k('F', 3), k('A', 3), k('C', 4), k('E', 4)]);
assert(topRoot(r) === 'D' && topSymbol(r) === 'm9', 'Dm9 jazz voicing');

// G13 shell voicing: G-B-F-E (root, 3, b7, 13; omit 5, 9, 11)
r = analyzer.detect([k('G', 3), k('B', 3), k('F', 4), k('E', 5)]);
assert(topRoot(r) === 'G' && topSymbol(r) === '13', 'G13 shell voicing (G-B-F-E)');

// Bbmaj7#11 (flat mode): Bb-D-F-A-E
r = analyzerFlats.detect([k('A#', 3), k('D', 4), k('F', 4), k('A', 4), k('E', 5)]);
assert(topRoot(r) === 'Bb' && topSymbol(r) === 'maj7#11', 'Bbmaj7#11');

// A7b9 (altered dominant): A-C#-E-G-Bb
r = analyzer.detect([k('A', 3), k('C#', 4), k('E', 4), k('G', 4), k('A#', 4)]);
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

// 1. Enharmonic root: G#m in sharp mode, Abm in flat mode
r = analyzer.detect([k('G#', 4), k('B', 4), k('D#', 5)]);
assert(topRoot(r) === 'G#' && topSymbol(r) === 'm', 'G#m detected in sharp mode');
r = analyzerFlats.detect([k('G#', 4), k('B', 4), k('D#', 5)]);
assert(topRoot(r) === 'Ab' && topSymbol(r) === 'm', 'Abm detected in flat mode');

// 2. Cdim7 getChordNotes includes Bbb (double-flat)
r = analyzer.getChordNotes('C', 'dim7');
const cdim7Notes = r.notes.map(n => n.name);
assert(cdim7Notes[3] === 'Bbb', 'Cdim7 seventh note = Bbb (double flat)');

// 3. F#7 notes: F#-A#-C#-E, not F#-Bb-Db-E
r = analyzer.getChordNotes('F#', '7');
assert(r.notes.map(n => n.name).join('-') === 'F#-A#-C#-E', 'F#7 sharp-key spelling: F#-A#-C#-E');

// 4. Bb7 in flat mode: Bb-D-F-Ab
r = analyzerFlats.getChordNotes('Bb', '7');
assert(r.notes.map(n => n.name).join('-') === 'Bb-D-F-Ab', 'Bb7 flat-key spelling: Bb-D-F-Ab');

// 5. Tritone substitution: Db7 detects cleanly
r = analyzerFlats.detect([k('C#', 4), k('F', 4), k('G#', 4), k('B', 4)]);
assert(topRoot(r) === 'Db' && topSymbol(r) === '7', 'Db7 detected (tritone sub context)');

// 6. All-white-key cluster: should not crash
r = analyzer.detect([k('C', 4), k('D', 4), k('E', 4), k('F', 4), k('G', 4), k('A', 4), k('B', 4)]);
assert(r.length > 0, 'All white keys C-B returns candidates without crash');

// 7. Chromatic cluster C-C#-D: should not crash
r = analyzer.detect([k('C', 4), k('C#', 4), k('D', 4)]);
assert(r.length >= 0, 'Chromatic cluster C-C#-D does not crash');

// 8. Single black key round-trip: key 42 = D4
assert(analyzer.noteToKey('D', 4) === 42, 'noteToKey(D, 4) = 42');
note = analyzer.keyToNote(42);
assert(note.name === 'D' && note.octave === 4, 'keyToNote(42) = D4');

// 9. Gb major triad in flat mode: Gb-Bb-Db
r = analyzerFlats.getChordNotes('Gb', '');
assert(r.notes.map(n => n.name).join('-') === 'Gb-Bb-Db', 'Gb major notes = Gb-Bb-Db');

// 10. Augmented inversion: G#-C-E → some aug chord
r = analyzer.detect([k('G#', 3), k('C', 4), k('E', 4)]);
assert(topSymbol(r) === 'aug', 'G#-C-E detects augmented');

// 11. C/Bb slash: C major over Bb bass
r = analyzer.detect([k('A#', 3), k('C', 4), k('E', 4), k('G', 4)]);
const cBbSlash = r.find(c => c.root === 'C' && c.symbol === '' && c.bass === 'A#');
assert(cBbSlash !== undefined || r.some(c => c.root === 'C'), 'C over Bb bass produces C-rooted result');

// 12. Same note different octaves: C2 + C5 → no crash (only 1 unique PC, so no chord)
r = analyzer.detect([k('C', 2), k('C', 5)]);
assert(r.length >= 0, 'Same pitch class across octaves does not crash');

// 13. '-7' alias resolves to m7
chord = analyzer.getChordNotes('C', '-7');
assert(chord?.symbol === 'm7', "'-7' alias resolves to m7");

// 14. 'ø' alone resolves to half-diminished
chord = analyzer.getChordNotes('C', 'ø');
assert(chord?.symbol === 'm7b5', "'ø' alias resolves to m7b5");

// 15. Emaj7 spelling: E-G#-B-D#
r = analyzer.getChordNotes('E', 'maj7');
assert(r.notes.map(n => n.name).join('-') === 'E-G#-B-D#', 'Emaj7 spelling = E-G#-B-D#');

// 16. Detect Db major in flat mode
r = analyzerFlats.detect([k('C#', 4), k('F', 4), k('G#', 4)]);
assert(topRoot(r) === 'Db' && topSymbol(r) === '', 'Db major detected in flat mode');

// 17. 13#11 detection: C-E-F#-G-A-Bb-D
r = analyzer.detect([k('C', 3), k('E', 4), k('F#', 4), k('G', 4), k('A', 4), k('A#', 4), k('D', 5)]);
assert(topRoot(r) === 'C' && topSymbol(r) === '13#11', 'C13#11 detected from full voicing');

// 18. Two-note minor 3rd (C-Eb): no crash
r = analyzer.detect([k('C', 4), k('D#', 4)]);
assert(r.length >= 0, 'Two notes (minor 3rd) does not crash');

// 19. maxResults=1 limits output
r = analyzer.detect([k('C', 4), k('E', 4), k('G', 4)], { maxResults: 1 });
assert(r.length === 1, 'maxResults=1 returns exactly 1 result');

// 20. Duplicate key numbers: [40, 40, 44, 47] → still C major
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
