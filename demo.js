import { ChordAnalyzer } from './chord-analyzer.js';

const analyzer = new ChordAnalyzer();
const analyzerFlats = new ChordAnalyzer({ useFlats: true });

function k(note, octave) { return analyzer.noteToKey(note, octave); }

function demo(label, keys, opts) {
  const a = opts?.useFlats ? analyzerFlats : analyzer;
  const results = a.detect(keys, opts);
  console.log(`\n--- ${label} ---`);
  console.log(`Keys: [${keys.join(', ')}]`);
  if (results.length === 0) { console.log('  No chords detected.'); return; }
  results.slice(0, 3).forEach((r, i) => {
    const inv = r.inversion === 0 ? '' : ` (${r.inversionName})`;
    const omit = r.omittedNotes.length > 0
      ? ` [omitted: ${r.omittedNotes.map(n => n.name).join(', ')}]`
      : '';
    console.log(`  ${i + 1}. ${r.name}  —  ${r.fullName}${inv}${omit}`);
    console.log(`     Notes: ${r.notes.join(' - ')}   |  Intervals: ${r.intervals.join(' ')}`);
    console.log(`     Score: ${r.score}   Input: ${r.inputNotes.join(' ')}`);
  });
}

console.log('='.repeat(60));
console.log('  CHORD ANALYZER DEMO');
console.log('='.repeat(60));

// Triads
demo('C Major', [k('C', 4), k('E', 4), k('G', 4)]);
demo('A Minor', [k('A', 3), k('C', 4), k('E', 4)]);
demo('F# Diminished', [k('F#', 4), k('A', 4), k('C', 5)]);

// Seventh chords
demo('Cmaj7', [k('C', 4), k('E', 4), k('G', 4), k('B', 4)]);
demo('G7 (dominant)', [k('G', 3), k('B', 3), k('D', 4), k('F', 4)]);
demo('Dm7', [k('D', 4), k('F', 4), k('A', 4), k('C', 5)]);

// Inversions
demo('C/E (1st inversion)', [k('E', 3), k('G', 3), k('C', 4)]);

// Extended
demo('C9', [k('C', 3), k('E', 4), k('G', 4), k('A#', 4), k('D', 5)]);
demo('G13 shell voicing', [k('G', 3), k('B', 3), k('F', 4), k('E', 5)]);

// Altered
demo('C7#9 (Hendrix chord)', [k('C', 4), k('E', 4), k('G', 4), k('A#', 4), k('D#', 5)]);

// Flat mode
demo('Bbmaj7 (flat mode)', [k('A#', 3), k('D', 4), k('F', 4), k('A', 4)], { useFlats: true });

// Ambiguity: C6 vs Am7
demo('C-E-G-A with C in bass → C6', [k('C', 3), k('E', 4), k('G', 4), k('A', 4)]);
demo('A-C-E-G with A in bass → Am7', [k('A', 3), k('C', 4), k('E', 4), k('G', 4)]);

// Slash with non-chord bass
demo('C/F# (slash)', [k('F#', 3), k('C', 4), k('E', 4), k('G', 4)]);

// Shell voicing: no 5th
demo('Cmaj7 (no 5th): C-E-B', [k('C', 4), k('E', 4), k('B', 4)]);

// Edge: symmetrical augmented
demo('C aug (symmetrical)', [k('C', 4), k('E', 4), k('G#', 4)]);

// getChordNotes
console.log('\n--- getChordNotes ---');
const cn = analyzer.getChordNotes('Db', 'maj7', { useFlats: true });
console.log(`  ${cn.name}: ${cn.notes.map(n => `${n.name}(${n.interval})`).join('  ')}`);

const cn2 = analyzer.getChordNotes('F#', '7#9');
console.log(`  ${cn2.name}: ${cn2.notes.map(n => `${n.name}(${n.interval})`).join('  ')}`);

// keyToNote
console.log('\n--- keyToNote ---');
[1, 40, 49, 88].forEach(key => {
  const n = analyzer.keyToNote(key);
  console.log(`  Key ${key} = ${n.fullName} (MIDI ${n.midi})`);
});

console.log('\n' + '='.repeat(60));
