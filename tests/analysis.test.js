import test from 'node:test';
import assert from 'node:assert/strict';
import { ChordAnalyzer, CHORD_TEMPLATES } from '../chord-analyzer.js';
import { parseNote, mod12 } from '../notes.js';

test('input adapters distinguish piano keys, MIDI numbers, and named pitches', () => {
  const a = new ChordAnalyzer();
  assert.deepEqual(a.detect([40, 44, 47]), a.detectMidi([60, 64, 67]));
  assert.deepEqual(a.detect([40, 44, 47]), a.detectNotes(['C4', 'E4', 'G4']));
  assert.equal(a.detect([60, 64, 67])[0].rootPitchClass, 8);
  assert.equal(a.detectMidi([0, 4, 7])[0].bassKey, null);
  assert.equal(a.detectMidi([120, 124, 127])[0].name, 'C');
  for (const method of ['detect', 'detectMidi', 'detectNotes', 'analyze', 'analyzeMidi', 'analyzeNotes']) {
    for (const bad of [null, undefined, {}, 'C4', new Set([40])]) assert.throws(() => a[method](bad), TypeError);
  }
  for (const value of [-1, 128, 0.5, '60', null]) assert.throws(() => a.detectMidi([value]), RangeError);
  assert.throws(() => a.detectNotes(['C']), RangeError);
  assert.throws(() => a.detect([40, , 47]), RangeError);
  assert.throws(() => a.detectNotes(['C4', , 'G4']), RangeError);
});

test('duplicates, octaves, limits, and validation have consistent outcomes', () => {
  const a = new ChordAnalyzer();
  assert.deepEqual(a.detect([40, 40]), a.detect([40]));
  assert.equal(a.detect([28, 40, 52])[0].kind, 'octaves');
  assert.deepEqual(a.detect([40, 40, 44, 47]), a.detect([40, 44, 47]));
  for (const notes of [[], [40], [40, 40], [28, 40], [40, 44, 47]]) assert.deepEqual(a.detect(notes, { maxResults: 0 }), []);
  for (const maxResults of [-1, 1.5, '2', null, NaN, Infinity]) {
    assert.throws(() => a.detect([40], { maxResults }), RangeError);
    assert.throws(() => new ChordAnalyzer({ maxResults }), RangeError);
  }
  for (const bad of [{ useFlats: 'false' }, { allowRootless: 1 }, { ranking: 'anything' }, { maxExtraNotes: 3 },
    { ambiguityThreshold: -1 }, { rootHint: 'H' }, { key: 'X major' }, { maxResult: 1 }]) assert.throws(() => a.detect([], bad));
  assert.equal(new ChordAnalyzer({ maxResults: undefined }).detect([40], { useFlats: undefined })[0].name, 'C4');
  assert.throws(() => a.detect([], null), TypeError);
  assert.throws(() => new ChordAnalyzer({ templates: null }), TypeError);
  assert.throws(() => new ChordAnalyzer({ cacheSize: -1 }), RangeError);
  assert.throws(() => { a.useFlats = 1; }, TypeError);
  assert.throws(() => { a.maxResults = -1; }, RangeError);
  a.useFlats = true;
  a.maxResults = 1;
  assert.equal(a.detect([41, 45, 48])[0].name, 'Db');
});

test('complete simple interpretations win by default; bass and root hints remain available', () => {
  const a = new ChordAnalyzer({ useFlats: true });
  const notes = ['Eb3', 'G3', 'C4'];
  assert.equal(a.detectNotes(notes)[0].name, 'Cm/Eb');
  assert.equal(a.detectNotes(notes, { ranking: 'simple' })[0].name, 'Cm/Eb');
  assert.equal(a.detectNotes(notes, { ranking: 'bass' })[0].name, 'Eb6');
  assert.equal(a.detectNotes(notes, { rootHint: 'Eb' })[0].name, 'Eb6');
  const result = a.detectNotes(notes)[0];
  assert.equal(Object.values(result.scoreBreakdown).reduce((a, b) => a + b), result.score);
  assert.equal(result.exact, true);
  assert.equal(result.matchedCount, 3);
  assert.deepEqual(result.matchedIntervals, ['R', 'b3', '5']);
  assert.match(result.explanation, /b3 in bass/);
});

test('bass and played-note spellings agree with chord roles, including octave boundaries', () => {
  const a = new ChordAnalyzer();
  const seventh = a.detectNotes(['Bb3', 'C4', 'E4', 'G4'])[0];
  assert.equal(seventh.name, 'C7/Bb');
  assert.equal(seventh.playedNotes[0].name, 'Bb');
  assert.equal(seventh.playedNotes[0].interval, 'b7');
  const f = a.detectNotes(['F4', 'F#4', 'A#4', 'C#5'], { rootHint: 'F#' })[0];
  assert.equal(f.name, 'F#maj7/E#');
  assert.equal(f.playedNotes[0].fullName, 'E#4');
  const augmented = a.detectNotes(['C4', 'E4', 'G#4'], { rootHint: 'E' })[0];
  assert.equal(augmented.playedNotes[0].fullName, 'B#3');
  const ninth = a.detectNotes(['D3', 'C4', 'E4', 'G4', 'Bb4'], { rootHint: 'C' })[0];
  assert.equal(ninth.inversionName, '9 in bass');
  assert.equal(ninth.bassDegree, '9');
});

test('played, theoretical, matched, omitted, and extra tones stay distinct', () => {
  const a = new ChordAnalyzer();
  const shell = a.detectNotes(['C4', 'E4', 'B4'])[0];
  assert.equal(shell.name, 'Cmaj7');
  assert.deepEqual(shell.chordNotes.map(n => n.name), ['C', 'E', 'G', 'B']);
  assert.deepEqual(shell.playedNotes.map(n => n.name), ['C', 'E', 'B']);
  assert.deepEqual(shell.omittedNotes, [{ name: 'G', pitchClass: 7, interval: '5' }]);
  assert.equal(shell.exact, false);
  assert.equal(shell.omittedCount, 1);
  assert.match(shell.explanation, /5 omitted/);
  const cluster = ['C4', 'Db4', 'E4', 'G4'];
  assert.ok(!a.detectNotes(cluster).some(c => c.symbol === '' && c.root === 'C'));
  const tolerant = a.detectNotes(cluster, { maxExtraNotes: 1, rootHint: 'C', useFlats: true }).find(c => c.symbol === '' && c.root === 'C');
  assert.deepEqual(tolerant.extraNotes.map(n => n.fullName), ['Db4']);
  assert.equal(tolerant.matchedCount, 3);
  assert.equal(tolerant.exact, false);
  assert.match(tolerant.explanation, /outside this chord/);
});

test('rootless inference is opt-in, constrained by guide tones, and respects context', () => {
  const a = new ChordAnalyzer();
  const notes = ['E3', 'G3', 'Bb3', 'D4'];
  assert.ok(!a.detectNotes(notes).some(c => c.root === 'C'));
  assert.equal(a.detectNotes(notes, { allowRootless: true })[0].name, 'Em7b5');
  const result = a.detectNotes(notes, { allowRootless: true, rootHint: 'C' })[0];
  assert.equal(result.name, 'C9/E');
  assert.equal(result.rootMissing, true);
  assert.ok(result.omittedNotes.some(n => n.interval === 'R'));
  assert.match(result.explanation, /root inferred, not played/);
  assert.ok(!a.detectNotes(['E4', 'G4'], { allowRootless: true }).some(c => c.rootMissing));
  assert.ok(!a.detectNotes(['D4', 'F4', 'Bb4'], { allowRootless: true }).some(c => c.root === 'C'));
  assert.equal(a.detectNotes(['Db4', 'F4', 'Ab4'], { key: 'Db major' })[0].root, 'Db');
});

test('analysis distinguishes silence, single notes, octaves, intervals, incomplete chords, and unknown clusters', () => {
  const a = new ChordAnalyzer();
  assert.equal(a.analyze([]).status, 'empty');
  assert.equal(a.analyze([40]).status, 'single-note');
  assert.equal(a.analyze([28, 40]).status, 'octaves');
  assert.equal(a.analyzeNotes(['C4', 'E4']).interval.name, 'Major 3rd');
  assert.equal(a.analyzeNotes(['C4', 'E4']).status, 'interval');
  assert.equal(a.analyzeNotes(['C4', 'D5']).interval.name, 'Major 2nd + 1 octave');
  assert.equal(a.analyzeNotes(['C4', 'C6']).interval.name, '2 octaves');
  assert.equal(a.analyzeNotes(['C4', 'Db4', 'D4']).status, 'unknown');
  const result = a.analyzeNotes(['C4', 'E4'], { allowIncomplete: true }).results[0];
  assert.equal(result.name, 'C(no5)');
  assert.equal(result.incomplete, true);
  assert.equal(result.exact, false);
  assert.equal(a.detectNotes(['C4', 'Eb4'], { allowIncomplete: true })[0].name, 'Cm(no5)');
  assert.equal(a.analyze([40, 44, 47], { maxResults: 0 }).status, 'chord');
});

test('ambiguity is evaluated before truncating results', () => {
  const a = new ChordAnalyzer();
  const analysis = a.analyzeNotes(['C4', 'E4', 'G4', 'A4'], { maxResults: 1 });
  assert.equal(analysis.results.length, 1);
  assert.equal(analysis.ambiguous, true);
  assert.ok(analysis.scoreGap <= 6);
  assert.match(analysis.explanation, /another interpretation/);
  assert.equal(a.analyzeNotes(['C4', 'E4', 'G4']).ambiguous, false);
});

test('bounded matching cache ignores voicing, formatting and result count; returned objects are independent', () => {
  const a = new ChordAnalyzer({ cacheSize: 2 });
  const first = a.detectNotes(['C4', 'E4', 'G4']);
  first[0].chordNotes[0].name = 'broken';
  first[0].scoreBreakdown.bass = -999;
  const next = a.detectNotes(['C3', 'G3', 'E4'], { maxResults: 1, useFlats: true, order: 'degree' });
  assert.equal(next[0].chordNotes[0].name, 'C');
  assert.equal(next[0].playedNotes[0].fullName, 'C3');
  assert.equal(a.getCacheStats().hits, 1);
  assert.equal(next[0].scoreBreakdown.bass, 24);
  a.detectNotes(['D4', 'F#4', 'A4']);
  a.detectNotes(['E4', 'G#4', 'B4']);
  assert.equal(a.getCacheStats().size, 2);
  a.clearCache();
  assert.deepEqual(a.getCacheStats(), { size: 0, capacity: 2, hits: 0, misses: 0 });
  const uncached = new ChordAnalyzer({ cacheSize: 0 });
  uncached.detect([40, 44, 47]);
  assert.equal(uncached.getCacheStats().size, 0);
});

test('every template survives every transposition, bass position and permitted omission', () => {
  const a = new ChordAnalyzer({ maxResults: 1000 });
  let count = 0;
  for (let root = 0; root < 12; root++) for (const t of CHORD_TEMPLATES) {
    const optional = t.intervals.filter(iv => !t.required.includes(iv));
    for (let mask = 0; mask < (1 << optional.length); mask++) {
      const ivs = [...t.required, ...optional.filter((_, i) => mask & (1 << i))];
      for (const bass of ivs) {
        const keys = ivs.map(iv => 28 + root + iv + (iv < bass ? 12 : 0));
        const candidates = a.detect(keys);
        const candidate = candidates.find(c => c.rootPitchClass === root && c.symbol === t.symbol);
        assert.ok(candidate, `${root} ${t.symbol}, bass ${bass}, ${ivs}`);
        assert.equal(candidate.omittedCount, t.intervals.length - ivs.length);
        assert.equal(candidate.exact, ivs.length === t.intervals.length);
        for (const n of candidate.chordNotes) assert.equal(parseNote(n.name).pitch, n.pitchClass);
        count++;
      }
    }
  }
  assert.ok(count > 6432);
});

test('all 24,576 pitch-set/bass combinations are deterministic and structurally valid', () => {
  const a = new ChordAnalyzer({ maxResults: 2 });
  let count = 0;
  for (let mask = 1; mask < 4096; mask++) {
    const pcs = Array.from({ length: 12 }, (_, pc) => pc).filter(pc => mask & (1 << pc));
    for (const bass of pcs) {
      const midi = pcs.map(pc => 48 + pc + (pc < bass ? 12 : 0));
      const results = a.detectMidi(midi);
      assert.deepEqual(results, a.detectMidi([...midi].reverse()));
      for (const r of results) {
        assert.equal(r.bassPitchClass, bass);
        assert.ok(Number.isFinite(r.score));
        if (r.kind !== 'chord') continue;
        assert.ok(r.playedNotes.every(n => parseNote(n.name).pitch === n.pitchClass));
        assert.equal(r.omittedNotes.length, r.omittedCount);
        assert.ok(r.omittedNotes.every(n => !pcs.includes(n.pitchClass)));
        const t = CHORD_TEMPLATES.find(t => t.symbol === r.symbol);
        assert.ok(pcs.every(pc => t.intervals.includes(mod12(pc - r.rootPitchClass)) || pc === bass && r.inversion === -1));
      }
      count++;
    }
  }
  assert.equal(count, 24576);
});
