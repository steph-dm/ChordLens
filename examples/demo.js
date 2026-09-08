import { ChordAnalyzer } from '../chord-analyzer.js';

const analyzer = new ChordAnalyzer({ useFlats: true });

for (const pitches of [
  ['C4', 'E4', 'G4'],
  ['E3', 'G3', 'C4'],
  ['C4', 'E4', 'B4'],
  ['C4', 'E4'],
]) {
  const analysis = analyzer.analyzeNotes(pitches);
  console.log(pitches.join(' ') + ': ' + analysis.explanation);
}

console.log(analyzer.detectMidi([60, 64, 67])[0].name);
console.log(analyzer.detectNotes(['E3', 'G3', 'Bb3', 'D4'], {
  allowRootless: true, rootHint: 'C',
})[0].explanation);
console.log(analyzer.detectNotes(['C4', 'E4'], {
  allowIncomplete: true,
})[0].explanation);

console.log(analyzer.parseChord('F#7/A#').chordNotes);
console.log(analyzer.getChordTypes().length + ' supported chord types');

const voicings = analyzer.generateVoicings('F', {
  previous: ['C4', 'E4', 'G4'], noteCount: 3, low: 'C4', high: 'C5',
});
for (const voicing of voicings) {
  console.log(voicing.notes.map(note => note.fullName).join(' '), 'movement:', voicing.movement);
}

console.log(analyzer.analyzeProgression(['Dm7', 'G7', 'Cmaj7'], {
  key: 'C major',
}).explanation);
