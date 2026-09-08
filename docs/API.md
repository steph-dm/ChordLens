# ChordLens API

Import `ChordAnalyzer` from `chordlens`. The default export is also `ChordAnalyzer`. The package is ESM; CommonJS callers can use `await import('chordlens')` from an async function. All runtime operations are synchronous and run locally.

## Input and conversion

| Method | Input | Output |
| --- | --- | --- |
| `detect(keys, options?)` | Array of integer piano keys, 1–88 | Ranked `DetectionResult[]` |
| `detectMidi(notes, options?)` | Array of integer MIDI notes, 0–127 | Same result shape |
| `detectNotes(notes, options?)` | Array of full pitch strings, e.g. `Bb3`, `F#4` | Same result shape |
| `analyze`, `analyzeMidi`, `analyzeNotes` | Corresponding input format | Analysis summary and ranked results |
| `keyToNote(key, { useFlats? }?)` | Integer piano key | Structured played note |
| `midiToNote(midi, { useFlats? }?)` | Integer MIDI number | Structured played note |
| `noteToKey(name, octave)` | Note name and integer octave | Piano key, or `null` |
| `noteToMidi(name, octave)` | Note name and integer octave | MIDI number, or `null` |

Arrays may be unordered. Repeated identical keys are deduplicated. Octave doublings preserve their actual pitches, but matching uses distinct pitch classes and the lowest sounding note as bass. For example, `C3, E4, G5` and `C3, E3, G3` have the same harmonic candidates.

MIDI covers C−1 through G9. Piano converters cover A0 through C8. The structured `key`/`bassKey` field is `null` outside the piano range, even when the MIDI note itself is valid.

Note names support lowercase letters, ASCII/Unicode sharps and flats, `x` and the double-accidental characters, and repeated accidentals for theoretical spellings. The octave belongs to the natural letter: B♯3 is C4, and C♭4 is B3. `parsePitch()` in `chordlens/notes` parses the combined name and octave.

## Detection options

Constructor defaults apply to every detection/analysis call. A per-call option overrides that default. Only `rootHint` and `key` accept `null`, which clears the hint/context. Unknown option names throw rather than being silently ignored.

| Option | Default | Meaning |
| --- | --- | --- |
| `useFlats` | `false` | Generic pitch spelling; chord-tone spelling always follows its theoretical role |
| `maxResults` | `10` | Nonnegative safe integer; `0` returns no candidates |
| `order` | `'pitch'` | `'pitch'` orders chord tones by semitones above root; `'degree'` uses R–3–5–7–9–11–13 |
| `ranking` | `'balanced'` | `'balanced'`, `'bass'`, or `'simple'`; see below |
| `allowRootless` | `false` | Consider roots not present, with the safeguards below |
| `allowIncomplete` | `false` | Interpret root + major/minor third as a possible triad missing its fifth |
| `maxExtraNotes` | `0` | Tolerate 0–2 unexpected pitch classes; report their played notes explicitly |
| `rootHint` | `null` | Preferred spelled root, e.g. `'C'`; strong preference, not a hard filter |
| `key` | `null` | Major/minor key, e.g. `'Db major'`, `'A minor'`, `'Am'`; aids spelling and ranking |
| `ambiguityThreshold` | `6` | Score distance, 0–100, within which competing interpretations are flagged |

The constructor additionally accepts `cacheSize` (default 256, integer 0–4096) and `templates` (additional custom definitions). The legacy `analyzer.useFlats` and `analyzer.maxResults` properties remain writable with validation.

### Ranking and inference

`balanced` favors complete interpretations while still rewarding a root in the bass. E♭–G–C prefers Cm/E♭ over E♭6 with a missing fifth. `bass` preserves the previous strong bass-root preference. `simple` favors completeness and smaller chord definitions. See `scoreBreakdown` for ranking contributions.

Rootless inference requires at least three matched pitch classes, a played third, a played seventh, and every other required tone of the template. Thus E–G–B♭–D is primarily Em7♭5 without context; with `allowRootless: true, rootHint: 'C'`, C9/E becomes preferred. Its missing root remains explicit. A two-note guide-tone pair is reported as an interval rather than enough evidence for rootless inference.

Extra-note tolerance is conservative: at least three chord tones must match. A tolerated note is a possible passing/foreign note, not proof that it was played accidentally. The separate slash-bass search excludes the bass pitch class from the upper chord, including any octave copies of that pitch.

## Result fields

`DetectionResult` uses the same shape for chords, single notes, and octaves. `kind` distinguishes them. Type declarations give the full schema.

| Field | Meaning |
| --- | --- |
| `name`, `fullName`, `symbol` | Short name with slash bass/explicit incomplete suffix, descriptive name, canonical chord type |
| `root`, `rootPitchClass` | Spelled root and its pitch class |
| `bass`, `bassPitchClass`, `bassKey` | Actual lowest note; `bassKey` may be null |
| `inversion`, `inversionName`, `bassDegree` | Root/third/fifth/seventh/other/slash position and the exact bass role |
| `slash` | Full slash name, or null in root position |
| `chordNotes` | Full theoretical chord tones, including permitted omitted tones |
| `playedNotes` | Actual distinct pitches with chord-aware spelling and octaves |
| `matchedNotes` | Played notes belonging to the theoretical chord, including octave doublings |
| `omittedNotes` | Theoretical chord tones that were not played |
| `extraNotes` | Actual unexpected pitches in tolerant mode; the separate slash bass is not an extra tone |
| `intervals`, `matchedIntervals` | Theoretical and present roles, once per pitch class |
| `matchedCount`, `omittedCount` | Distinct pitch-class counts |
| `exact` | No omitted or unexpected tones in the matched chord; an exact upper chord may have a separate slash bass |
| `rootMissing`, `incomplete` | Explicit inference markers |
| `score`, `scoreBreakdown`, `weight`, `rank` | Ranking details; scores are not calibrated confidence percentages |
| `ambiguous` | This candidate is close to the top and another interpretation is also close |
| `scoreGap` | Top score minus this candidate's score; the top candidate has gap zero |
| `explanation` | Short explanation of matched, omitted, inferred, extra, and bass tones |

Every structured note has `name`, `pitchClass`, and `interval`. Played notes also have `midi`, `key`, `octave`, and `fullName`. An unknown/non-chord role is `interval: null`. Returned objects can be changed by callers without corrupting cached results or built-ins.

Legacy fields: detection `notes` contains theoretical names; `inputNotes` contains generic pitch strings with octaves. Builder `notes` contains objects equivalent to `chordNotes`. Prefer the structured fields.

### Analysis summary

`analyze*()` returns `status`, `results`, `playedNotes`, `interval`, `ambiguous`, `scoreGap`, and `explanation`. Its `scoreGap` is the top score minus the runner-up score, or null if there is no runner-up. Status and ambiguity are computed even when `maxResults: 0` hides candidates.

Possible statuses are `empty`, `single-note`, `octaves`, `interval`, `chord`, and `unknown`. For exactly two distinct pitches, `interval` describes their chromatic distance, including additional octaves. It is a semitone-based interval description; it does not infer whether an enharmonic tritone was intended as an augmented fourth or diminished fifth.

## Chord construction and parsing

`getChordNotes(root, type = '', options?)` builds a supported chord. `parseChord(name, options?)` reads root, type, grouped alterations, optional `no3`/`no5` (or `omit3`/`omit5`), and slash bass. Both return a chord definition or `null` for an unsupported name. For example, `C6/9` has no slash bass, while `C6/9/E` does.

Definitions include the root, symbol, names, chord tones, omitted tones, required intervals, bass, and inversion fields. Explicit omissions are removed from `chordNotes` and listed in `omittedNotes`. Use `generateVoicings()` to assign actual pitches; parsing a slash chord does not arrange its tones.

| Builder option | Default | Meaning |
| --- | --- | --- |
| `order` | Analyzer's order | `'pitch'` or `'degree'` |
| `spelling` | `'preserve'` | Preserve the supplied root and slash spelling, or `'simplify'` to respell the root |
| `useFlats` | Analyzer's preference | Used by root simplification and generic bass spelling |

```js
import { ChordAnalyzer } from 'chordlens';
const analyzer = new ChordAnalyzer();
console.log(analyzer.parseChord('C7(b9)/G').name); // C7b9/G
console.log(analyzer.parseChord('C6/9').bass);    // C
console.log(analyzer.parseChord('Cm(no5)/Eb').notes.map(n => n.name)); // C, Eb
console.log(analyzer.getChordNotes('C##', 'aug').notes.map(n => n.name)); // C##, E##, G###
console.log(analyzer.getChordNotes('F#', '7', {
  spelling: 'simplify', useFlats: true,
}).root); // Gb
```

## Voicing generation

`generateVoicings(chordName, options?)` returns MIDI pitches, piano keys, structured notes, omitted tones, span, bass interval, and ranking cost (`score`, larger is better).

| Option | Default | Constraints |
| --- | --- | --- |
| `low`, `high` | `'C3'`, `'C5'` | Full pitch or MIDI number; inclusive 0–127 |
| `noteCount` | Up to 5 available distinct chord tones | Integer 2–8; all required tones must fit |
| `maxResults` | `3` | Integer 0–100 |
| `maxSpan` | `24` | Total semitone span, integer 1–48 |
| `maxAdjacentSpan` | `12` | Largest adjacent-note gap, integer 1–24 |
| `rootless` | `false` | Remove the root from both allowed and required tones |
| `bass` | Slash bass when specified, otherwise any chord tone | Fixed full pitch or MIDI number; overrides a slash bass |
| `previous` | Absent | Previous pitches, unordered or ordered; same length as noteCount |

Each pitch class appears once. Required chord tones are preserved, except an explicitly omitted/rootless root. A non-chord bass adds one required pitch class. Without enough room or notes, the method returns `[]`. Invalid constraints throw. Returned `movement` is null without a previous voicing, otherwise the total semitone movement between ordered voices.

Search retains up to 1,024 partial voicings per step. Ranking favors compact spans, the range center, fewer close clusters, and less movement from `previous`. It does not model fingering, hand size, or force extensions into higher octaves. See the [voicing example](../README.md#voicings-and-progressions).

## Progression analysis

`analyzeProgression(chords, { key?, useFlats? }?)` accepts chord-name strings or detection results with `kind: 'chord'`. Provide a key for a known tonal context; otherwise the method estimates major/minor keys from chord tones, tonic quality, and the ending. It returns five scored key candidates so the estimate remains inspectable.

Each entry includes Roman numeral, degree, chromatic alteration, chord quality, a provisional harmonic function, diatonic membership, compatibility with minor's raised leading tone, inversion, bass degree in the key, and any secondary-dominant target. Roman labels retain lead-sheet suffixes, e.g. `Imaj7`; inversion is a separate field, not figured-bass notation. Minor degrees are relative to natural minor, with conventional `vii°` for a raised-leading-tone diminished chord.

A dominant resolving down a fifth to a non-tonic major/minor chord can be marked as a secondary dominant. Major/minor ii–V–I patterns include zero-based start/end indices. This is a tonal heuristic without rhythmic, melodic, modulation, or phrase context; it does not prove a unique harmonic function.

```js
import { ChordAnalyzer } from 'chordlens';
const analyzer = new ChordAnalyzer();
console.log(analyzer.analyzeProgression(['D7', 'G7', 'C'], {
  key: 'C major',
}).chords.map(c => c.romanNumeral)); // V7/V, V7, I
console.log(analyzer.analyzeProgression(['Bm7b5', 'E7', 'Am'], {
  key: 'A minor',
}).chords.map(c => c.romanNumeral)); // iiø7, V7, i
```

## Catalogue and custom templates

`getChordTypes()` returns `symbol`, `displaySymbol`, `fullName`, `category`, `intervalCount`, `intervals`, and `requiredIntervals`. Major has `symbol: ''` and `displaySymbol: '(major)'`. Every returned symbol can be passed to the builder.

`registerTemplate(definition)` adds a definition only to that analyzer and clears its matching cache. The constructor also accepts a `templates` array. Custom symbols must be unique, canonical, and parseable without conflicting with root/bass/omission syntax. Definitions require distinct pitch-class intervals from 0–11, a root in both intervals and required tones, valid role labels, and weight 0–100. Every label's semitone value must agree with its pitch class. Supply a descriptive category for custom families.

```js
import { ChordAnalyzer } from 'chordlens';
const analyzer = new ChordAnalyzer();
analyzer.registerTemplate({
  symbol: 'quartal', fullName: 'Quartal', category: 'quartal',
  intervals: [0, 5, 10], required: [0, 5, 10],
  labels: { 0: 'R', 5: '4', 10: 'b7' }, weight: 90,
});
console.log(analyzer.detectNotes(['C4', 'F4', 'Bb4'])[0].name); // Cquartal
```

`CHORD_TEMPLATES`, `TEMPLATES` from `chordlens/templates`, and `analyzer.templates` are deeply frozen. The templates subpath also exports `compileTemplate()` and `compileTemplates()` for validation/compilation without registration. Registration additionally checks symbol uniqueness and parsing.

## Cache and errors

`getCacheStats()` returns size, capacity, hits, and misses. `clearCache()` clears entries and counters. The bounded LRU caches lightweight matching results by pitch set, bass, and analysis options. Octaves and display formatting are applied after matching, so changing voicing, spelling, or result count cannot return stale played notes. Set constructor `cacheSize: 0` to disable it.

- Detection/analysis require arrays. Wrong containers/options/types throw `TypeError`; invalid ranges, pitches, limits, or enum choices throw `RangeError`.
- Invalid or out-of-range `noteToKey`/`noteToMidi` conversions return `null`, including non-integer octaves.
- Unsupported names in `getChordNotes`/`parseChord` return `null`; invalid options always throw, even for an unsupported name.
- Generation and progression analysis throw `RangeError` for unsupported chord names. A valid but unsatisfiable voicing request returns `[]`.
- `analyzeProgression([])` needs an explicit key because silence cannot establish a key.

The standalone `parseChordSymbol()` export parses syntax and normalizes aliases; it does not check the catalogue. Use the analyzer's `parseChord()` when validation is required.
