import test from 'node:test';
import assert from 'node:assert/strict';
import { ChordAnalyzer, CHORD_TEMPLATES } from '../chord-analyzer.js';
import { parseKey } from '../harmony.js';
import { parsePitch, parseNote } from '../notes.js';

const a = new ChordAnalyzer();

test('progressions identify major and minor ii–V–I, roles and inversions', () => {
  const major = a.analyzeProgression(['Dm7', 'G7', 'Cmaj7/E'], { key: 'C major' });
  assert.deepEqual(major.chords.map(c => c.romanNumeral), ['ii7', 'V7', 'Imaj7']);
  assert.deepEqual(major.chords.map(c => c.function), ['predominant', 'dominant', 'tonic']);
  assert.deepEqual(major.patterns, [{ name: 'ii–V–I', start: 0, end: 2 }]);
  assert.equal(major.chords[2].inversion, 1);
  const minor = a.analyzeProgression(['Bm7b5', 'E7', 'Am'], { key: 'A minor' });
  assert.deepEqual(minor.chords.map(c => c.romanNumeral), ['iiø7', 'V7', 'i']);
  assert.equal(minor.chords[1].harmonicCompatible, true);
  assert.equal(minor.chords[1].diatonic, false);
  assert.equal(minor.patterns[0].name, 'ii–V–i');
  assert.equal(a.analyzeProgression(['G#dim7', 'Am'], { key: 'Am' }).chords[0].romanNumeral, 'vii°7');
});

test('secondary dominants, borrowed roots, and key estimation stay explicit', () => {
  const progression = a.analyzeProgression(['D7', 'G7', 'C'], { key: 'C' });
  assert.deepEqual(progression.chords.map(c => c.romanNumeral), ['V7/V', 'V7', 'I']);
  assert.equal(progression.chords[0].secondaryDominantOf, 'V');
  const borrowed = a.analyzeProgression(['Ab', 'G7', 'C'], { key: 'C major' });
  assert.equal(borrowed.chords[0].romanNumeral, 'bVI');
  assert.equal(borrowed.chords[0].diatonic, false);
  const inferred = a.analyzeProgression(['Dm7', 'G7', 'Cmaj7']);
  assert.equal(inferred.key.name, 'C major');
  assert.equal(inferred.key.source, 'estimated');
  assert.equal(inferred.keyCandidates.length, 5);
  assert.match(inferred.explanation, /other interpretations/);
  assert.equal(a.analyzeProgression(['Am', 'Dm', 'E7', 'Am']).key.name, 'A minor');
  assert.deepEqual(parseKey('F# major').notes, ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
  assert.equal(parseKey('C MAJOR').mode, 'major');
  assert.equal(parseKey('CM').mode, 'major');
});

test('progression input and parser omissions are validated', () => {
  const detected = a.detectNotes(['D4', 'F4', 'A4', 'C5'])[0];
  assert.equal(a.analyzeProgression([detected, 'G7', 'C'], { key: 'C' }).chords[0].romanNumeral, 'ii7');
  assert.deepEqual(a.parseChord('C(no5)').notes.map(n => n.name), ['C', 'E']);
  assert.deepEqual(a.getChordNotes('C', '7(omit5)').notes.map(n => n.name), ['C', 'E', 'Bb']);
  assert.equal(a.parseChord('Cm(no5)/Eb').name, 'Cm(no5)/Eb');
  assert.equal(a.parseChord('Cmajor(no5)').name, 'C(no5)');
  assert.equal(a.parseChord('CM(no5)').name, 'C(no5)');
  assert.equal(a.parseChord('C7#5(no5)').name, 'Caug7(no5)');
  assert.throws(() => a.parseChord('garbage', { useFlats: null }), TypeError);
  assert.equal(a.parseChord('C5(no3)'), null);
  assert.equal(a.analyzeProgression([], { key: 'C' }).chords.length, 0);
  for (const input of [[null], ['garbage'], [a.detect([40])[0]]]) assert.throws(() => a.analyzeProgression(input, { key: 'C' }), RangeError);
  assert.throws(() => a.analyzeProgression(null), TypeError);
  assert.throws(() => a.analyzeProgression([, 'C']), RangeError);
  assert.throws(() => a.analyzeProgression([]), RangeError);
  assert.throws(() => a.analyzeProgression(['C'], { key: 'H' }), RangeError);
  assert.throws(() => a.analyzeProgression(['C'], { nonsense: true }), TypeError);
});

test('voicings respect range, note count, spans, required tones, spelling, and deterministic ordering', () => {
  const options = { low: 'C3', high: 'C5', noteCount: 4, maxResults: 5, maxSpan: 19, maxAdjacentSpan: 12 };
  const voicings = a.generateVoicings('Cmaj9', options);
  assert.equal(voicings.length, 5);
  assert.deepEqual(voicings, a.generateVoicings('Cmaj9', options));
  for (const v of voicings) {
    assert.equal(v.notes.length, 4);
    assert.ok(v.midi.every(n => n >= 48 && n <= 72));
    assert.ok(v.span <= 19);
    assert.ok(v.midi.slice(1).every((n, i) => n - v.midi[i] <= 12));
    assert.deepEqual([...v.notes.map(n => n.interval)].sort(), ['3', '7', '9', 'R']);
    assert.deepEqual(v.omittedNotes.map(n => n.name), ['G']);
    assert.deepEqual(v.keys, v.midi.map(n => n - 20));
    assert.ok(v.notes.every(n => parsePitch(n.fullName).midi === n.midi));
  }
  assert.ok(voicings.every((v, i) => !i || v.score <= voicings[i - 1].score));
});

test('voicing generation supports explicit bass, rootless chords and previous-voicing movement', () => {
  const slash = a.generateVoicings('Cmaj7/E', { low: 'C3', high: 'C5' });
  assert.ok(slash.length > 0);
  assert.ok(slash.every(v => v.midi[0] % 12 === 4));
  const nonChordBass = a.generateVoicings('C/F#', { low: 'C3', high: 'C5' });
  assert.ok(nonChordBass.length > 0);
  assert.ok(nonChordBass.every(v => v.notes[0].name === 'F#' && v.notes[0].interval === null));
  const fixed = a.generateVoicings('Cmaj7', { bass: 'D3', low: 'C3', high: 'C5' });
  assert.ok(fixed.length > 0);
  assert.ok(fixed.every(v => v.midi[0] === 50));
  const rootless = a.generateVoicings('C9', { rootless: true, noteCount: 4 });
  assert.ok(rootless.length > 0);
  assert.ok(rootless.every(v => !v.midi.some(n => n % 12 === 0)));
  const previous = [48, 52, 59, 62];
  const close = a.generateVoicings('Cmaj9', { noteCount: 4, previous })[0];
  assert.deepEqual(close.midi, previous);
  assert.equal(close.movement, 0);
  const sixNine = a.generateVoicings('C6/9', { maxResults: 5 });
  assert.ok(sixNine.some(v => v.midi[0] % 12 !== 0));
});

test('impossible voicings return an empty array and malformed constraints throw', () => {
  assert.deepEqual(a.generateVoicings('Cmaj9', { noteCount: 3 }), []);
  assert.deepEqual(a.generateVoicings('C', { low: 'C4', high: 'D4' }), []);
  assert.deepEqual(a.generateVoicings('C', { bass: 'C2', low: 'C3' }), []);
  assert.deepEqual(a.generateVoicings('C', { maxResults: 0 }), []);
  assert.deepEqual(a.generateVoicings('C5', { rootless: true }), []);
  for (const options of [{ low: 'H4' }, { low: 'C5', high: 'C3' }, { noteCount: 1 }, { maxSpan: 0 },
    { maxResults: -1 }, { rootless: true, bass: 'C3' }, { previous: [60] }, { previous: null }, { invalid: true },
    { rootless: null }, { low: null }, { noteCount: null }]) assert.throws(() => a.generateVoicings('C', options));
  assert.throws(() => a.generateVoicings('C7unknown'), RangeError);
  assert.throws(() => a.generateVoicings('C', { previous: [48, , 55] }), RangeError);
});

test('every built-in chord generates valid full voicings across all roots', () => {
  for (const root of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) for (const t of CHORD_TEMPLATES) {
    const result = a.generateVoicings(root + t.symbol, { low: 'C3', high: 'C6', noteCount: t.intervals.length, maxResults: 1, maxSpan: 24 });
    assert.ok(result.length > 0, root + t.symbol);
    const expected = t.intervals.map(iv => (parseNote(root).pitch + iv) % 12).sort((a, b) => a - b);
    assert.deepEqual(result[0].midi.map(n => n % 12).sort((a, b) => a - b), expected);
    assert.ok(result[0].notes.every(n => parseNote(n.name).pitch === n.pitchClass));
    assert.equal(result[0].omittedNotes.length, 0);
  }
});
