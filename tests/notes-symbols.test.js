import test from 'node:test';
import assert from 'node:assert/strict';
import { ChordAnalyzer, CHORD_TEMPLATES } from '../chord-analyzer.js';
import { parseNote, parsePitch, midiToNote, noteToMidi, LETTER_TO_PITCH, NOTES_SHARP, noteNames, spellNote, spellChordNote, popcount } from '../notes.js';
import { normalizeSymbol, parseChordSymbol } from '../symbols.js';
import { compileTemplate, compileTemplates } from '../template-utils.js';

const a = new ChordAnalyzer();

test('all piano keys and MIDI notes round-trip in both spelling modes', () => {
  for (let midi = 0; midi <= 127; midi++) for (const useFlats of [true, false]) {
    const n = a.midiToNote(midi, { useFlats });
    assert.equal(a.noteToMidi(n.name, n.octave), midi);
    assert.equal(parsePitch(n.fullName).midi, midi);
    assert.equal(n.key, midi >= 21 && midi <= 108 ? midi - 20 : null);
    if (n.key !== null) assert.equal(a.noteToKey(a.keyToNote(n.key, { useFlats }).name, n.octave), n.key);
  }
});

test('accidentals preserve the natural letter octave, including piano boundaries', () => {
  for (const letter of 'CDEFGAB') for (const accidental of ['', '#', '##', '###', 'b', 'bb', 'bbb']) for (let octave = -1; octave <= 9; octave++) {
    const delta = accidental.length * (accidental.startsWith('b') ? -1 : 1);
    const expected = (octave + 1) * 12 + LETTER_TO_PITCH[letter] + delta;
    assert.equal(a.noteToMidi(letter + accidental, octave), expected >= 0 && expected <= 127 ? expected : null);
    assert.equal(a.noteToKey(letter + accidental, octave), expected >= 21 && expected <= 108 ? expected - 20 : null);
  }
  assert.equal(a.noteToKey('B#', 3), 40);
  assert.equal(a.noteToKey('Cb', 4), 39);
  assert.equal(a.noteToKey('Cb', 8), 87);
  assert.equal(midiToNote(60, false, 'B#').fullName, 'B#3');
  assert.equal(parsePitch('C♭4').midi, 59);
  assert.equal(parsePitch('F𝄪4').midi, 67);
  assert.equal(parsePitch('E𝄫4').midi, 62);
});

test('invalid converters cannot coerce values into playable notes', () => {
  for (const octave of [null, undefined, false, true, '4', 4.1, NaN, Infinity, {}, []]) assert.equal(a.noteToKey('C', octave), null);
  for (const note of [null, 5, 'H', 'C#b', 'C#♮', 'C4', '', {}, []]) assert.equal(parseNote(note), null);
  assert.equal(parseNote('C♮').pitch, 0);
  for (const pitch of ['C', 'C4.1', 'H4', 'C99', 'G#9', null, 60]) assert.equal(parsePitch(pitch), null);
  for (const key of [0, 89, 4.5, '40', NaN]) assert.throws(() => a.keyToNote(key), RangeError);
  assert.throws(() => midiToNote(128), RangeError);
  assert.throws(() => midiToNote(60, false, 'D'), RangeError);
  assert.throws(() => midiToNote(60, 'false'), TypeError);
  assert.equal(noteToMidi('C', 10), null);
});

test('aliases retain major/minor meaning and parse grouped alterations', () => {
  const cases = { M: '', m: 'm', M7: 'maj7', MIN7: 'm7', Min7: 'm7', min7: 'm7',
    mM7: 'mMaj7', mM9: 'mMaj9', mMaj9: 'mMaj9', minMaj9: 'mMaj9', minormajor7: 'mMaj7',
    'Δ7': 'maj7', 'ø7': 'm7b5', '°7': 'dim7', '−7': 'm7', '-7': 'm7', '+': 'aug', '+M7': 'augMaj7',
    '7#5': 'aug7', 'maj7#5': 'augMaj7', 'augmentedMaj7': 'augMaj7', augmentedmajor7: 'augMaj7', augmented9: '9#5', '7(b9)': '7b9', '7(♭9)': '7b9',
    '7(#9,b5)': '7b5#9', '7(b13,b9)': '7b9b13', '69': '6/9', m69: 'm6/9', madd4: 'madd11',
    'half-diminished7': 'm7b5', '(major)': '' };
  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(normalizeSymbol(input), expected, input);
    assert.equal(a.getChordNotes('C', input)?.symbol, expected, input);
  }
  for (const bad of ['7(', '7)', '7()', '7((b9))', '7(b9)junk', 'nonsense']) assert.equal(a.getChordNotes('C', bad), null);
  assert.throws(() => normalizeSymbol(null), TypeError);
  for (const t of CHORD_TEMPLATES) assert.equal(a.getChordNotes('C', t.symbol)?.symbol, t.symbol);
});

test('complete chord parser distinguishes 6/9 from an explicit slash bass', () => {
  for (const [input, name, bass] of [['C6/9', 'C6/9', 'C'], ['Cm6/9/Eb', 'Cm6/9/Eb', 'Eb'],
    ['F♯7/A♯', 'F#7/A#', 'A#'], ['Cmaj7/E', 'Cmaj7/E', 'E'], ['C7(b9)/G', 'C7b9/G', 'G']]) {
    const chord = a.parseChord(input);
    assert.equal(chord.name, name);
    assert.equal(chord.bass, bass);
  }
  assert.equal(a.parseChord('Cmaj7/E').inversion, 1);
  assert.equal(a.parseChord('C/F#').inversion, -1);
  assert.equal(parseChordSymbol('C6/9').bass, null);
  assert.equal(a.parseChord('Fx7/Ax').name, 'F##7/A##');
  for (const bad of ['', 'H7', 'C7/', 'C/9', 'C/E/G', null, 12]) assert.equal(a.parseChord(bad), null);
});

test('theoretical spelling, ordering, and explicit simplification', () => {
  assert.deepEqual(a.getChordNotes('C##', 'aug').notes.map(n => n.name), ['C##', 'E##', 'G###']);
  assert.equal(spellChordNote('C##', '#9'), 'D###');
  assert.equal(spellNote(0, 10, '#5'), 'G###');
  assert.throws(() => spellNote(0, 12, '3'), RangeError);
  assert.deepEqual(a.getChordNotes('C', '9', { order: 'degree' }).notes.map(n => n.name), ['C', 'E', 'G', 'Bb', 'D']);
  assert.deepEqual(a.getChordNotes('C', '9').notes.map(n => n.name), ['C', 'D', 'E', 'G', 'Bb']);
  assert.equal(a.getChordNotes('F#', 'maj7', { useFlats: true }).root, 'F#');
  assert.equal(a.getChordNotes('F#', 'maj7', { useFlats: true, spelling: 'simplify' }).root, 'Gb');
  assert.throws(() => a.getChordNotes('C', '', { order: 'random' }), RangeError);
});

test('catalogue values round-trip and shared built-ins cannot be changed', () => {
  for (const type of a.getChordTypes()) assert.equal(a.getChordNotes('C', type.symbol)?.symbol, type.symbol);
  assert.equal(a.getChordTypes().find(t => t.symbol === '').displaySymbol, '(major)');
  for (const target of [NOTES_SHARP, noteNames(true), CHORD_TEMPLATES, CHORD_TEMPLATES[0].intervals, CHORD_TEMPLATES[0].labels]) assert.ok(Object.isFrozen(target));
  assert.throws(() => { NOTES_SHARP[0] = 'bad'; }, TypeError);
  assert.throws(() => { CHORD_TEMPLATES[0].labels[7] = 'bad'; }, TypeError);
  assert.equal(popcount(-1), 32);
});

const quartal = { symbol: 'quartal', fullName: 'Quartal', category: 'quartal', intervals: [0, 5, 10], required: [0, 5, 10], labels: { 0: 'R', 5: '4', 10: 'b7' }, weight: 90 };
test('custom templates are validated, isolated, immutable, and invalidate matching cache', () => {
  const custom = structuredClone(quartal);
  const analyzer = new ChordAnalyzer();
  analyzer.detectNotes(['C4', 'F4', 'Bb4']);
  assert.ok(analyzer.getCacheStats().size > 0);
  analyzer.registerTemplate(custom);
  assert.equal(analyzer.getCacheStats().size, 0);
  custom.intervals.push(1);
  custom.labels[5] = 'bad';
  assert.equal(analyzer.detectNotes(['C4', 'F4', 'Bb4'])[0].name, 'Cquartal');
  assert.equal(a.parseChord('Cquartal'), null);
  assert.equal(new ChordAnalyzer({ templates: [quartal] }).parseChord('Cquartal').notes.length, 3);
  assert.throws(() => analyzer.registerTemplate(quartal), RangeError);
  assert.throws(() => compileTemplates([quartal, quartal]), RangeError);
  for (const bad of [{ intervals: [0, 5, 5] }, { required: [0, 1] }, { labels: { 0: 'R', 5: '3', 10: 'b7' } },
    { weight: NaN }, { weight: 101 }, { symbol: null }, { fullName: '' }, { category: 3 }, { required: [5] }]) {
    assert.throws(() => compileTemplate({ ...quartal, ...bad }));
  }
  assert.throws(() => analyzer.registerTemplate({ ...quartal, symbol: 'M' }), RangeError);
  assert.throws(() => analyzer.registerTemplate({ ...quartal, symbol: 'quartalno5' }), RangeError);
  assert.throws(() => compileTemplate({ ...quartal, intervals: [0, , 10] }), RangeError);
  assert.throws(() => compileTemplate({ ...quartal, labels: Object.assign(Object.create(quartal.labels), { a: 'R', b: '4', c: 'b7' }) }), RangeError);
  assert.throws(() => compileTemplates([, quartal]), TypeError);
  analyzer.registerTemplate({ ...quartal, symbol: 'extended' });
  assert.equal(analyzer.parseChord('Cextended').symbol, 'extended');
});
