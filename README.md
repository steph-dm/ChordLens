# ChordLens

Analyze, explain, and explore chords from piano keys, MIDI note numbers, or named pitches.

**60 chord types · no runtime dependencies · TypeScript declarations · Node 22+ and modern browsers**

ChordLens accepts note sets and chord names. It returns interpretations, chord tones, voicing suggestions, and progression analysis. It does not manage MIDI events, devices, audio, or UI.

## Quick start

Install this checkout from a neighboring project:

```sh
npm install ../ChordLens
```

Save this as `example.mjs` in that project and run `node example.mjs`:

```js
import { ChordAnalyzer } from 'chordlens';

const analyzer = new ChordAnalyzer();
const analysis = analyzer.analyzeNotes(['C4', 'E4', 'B4']);
const chord = analysis.results[0];

console.log(analysis.status);                     // chord
console.log(chord?.name);                         // Cmaj7
console.log(chord?.playedNotes.map(n => n.name));  // ['C', 'E', 'B']
console.log(chord?.omittedNotes.map(n => n.name)); // ['G']
console.log(chord?.explanation);                  // Cmaj7: R, 3, 7 present; 5 omitted.
```

Here C–E–B fits C major seventh with G omitted. `R`, `3`, and `7` are the notes' roles relative to the root C. The octave in `C4` identifies the actual pitch; chord names such as `Cmaj7` do not prescribe octaves.

The package uses ES modules. For `.js` files, set `"type": "module"` in your application's package.json. In this checkout, import from `./chord-analyzer.js` or run `npm run demo`.

## Choose your input

| Input | Candidates only | Summary + candidates | Middle C |
| --- | --- | --- | --- |
| Named pitches, e.g. `['C4', 'E4', 'G4']` | `detectNotes()` | `analyzeNotes()` | `'C4'` |
| MIDI numbers, 0–127 | `detectMidi()` | `analyzeMidi()` | `60` |
| Piano key numbers, 1–88 | `detect()` | `analyze()` | `40` |

**MIDI and piano numbers are different:** MIDI = piano key + 20. Use the matching method; numbers are never auto-detected. Named pitches require an octave.

Input order does not matter. Duplicate pitches are ignored; octave doublings remain in the played notes. Matching uses note names regardless of octave, with the lowest sounding pitch as bass.

## Read the result

`detect*()` returns a ranked array, best first. `analyze*()` also returns `status`, `interval`, `ambiguous`, `scoreGap`, and `explanation`. Status is `empty`, `single-note`, `octaves`, `interval`, `chord`, or `unknown`.

| Candidate field | Meaning |
| --- | --- |
| `name`, `fullName` | Short and descriptive names |
| `root`, `bass`, `inversionName` | Chord root, lowest note, and its position; e.g. `C/E` is C major with E lowest |
| `playedNotes` | Actual pitches with names, octaves, MIDI numbers, and piano keys |
| `chordNotes` | Complete theoretical chord tones, without octaves |
| `matchedNotes`, `omittedNotes`, `extraNotes` | Played chord tones, missing chord tones, and tolerated foreign notes |
| `explanation`, `scoreBreakdown` | Why this interpretation fits and how it was ranked |

Scores express preference, **not confidence percentages**. Several names may fit. `ambiguous` flags close scores; the summary's `scoreGap` compares the top two candidates. `exact` means no missing or extra tones in the matched chord, not a uniquely correct name.

For arbitrary input, handle an empty result: `analysis.results[0]?.name ?? 'No match'`. See [result fields](docs/API.md#result-fields) for the full contract.

## Available tools

| Task | Method / option | Example |
| --- | --- | --- |
| Identify chords and inversions | Detection methods above | E3–G3–C4 → C/E |
| Describe two pitches | `analyzeNotes().interval` | C4–E4 → Major 3rd |
| Supply musical context | `key`, `rootHint` | Prefer interpretations in D major or rooted on D |
| Consider a missing root | `allowRootless` | E–G–Bb–D with a C hint → C9/E |
| Consider a missing fifth | `allowIncomplete` | C–E → C(no5) |
| Tolerate foreign notes | `maxExtraNotes` | Consider C–E–G with Db reported separately |
| Change ranking | `ranking` | `balanced` (default), `bass`, or `simple` |
| Read a chord name | `parseChord('F#7/A#')` | F#–A#–C#–E, with A# in bass |
| Build chord tones | `getChordNotes('C', 'm7')` | C–Eb–G–Bb |
| Suggest actual pitches | `generateVoicings()` | F major within C4–C5 |
| Compare note movement | Voicing option `previous` | Favor pitches near a previous voicing |
| Analyze a sequence | `analyzeProgression()` | Dm7–G7–Cmaj7 → ii7–V7–Imaj7 |
| Convert pitches | `noteToMidi`, `midiToNote`, `noteToKey`, `keyToNote` | C4 ↔ MIDI 60 ↔ piano key 40 |
| List or add chord types | `getChordTypes()`, `registerTemplate()` | Inspect supported types or define your own |

Set detection defaults in `new ChordAnalyzer({ useFlats: true, maxResults: 3 })`; override them per call. Optional omissions defined by a chord template already work by default. Rootless, incomplete, and extra-note interpretations require their respective options. See [options and inference rules](docs/API.md#detection-options).

## Voicings and progressions

A **voicing** chooses actual pitches for a chord. You specify the target chord; the generator does not choose the next chord for you.

```js
import { ChordAnalyzer } from 'chordlens';
const analyzer = new ChordAnalyzer();

const next = analyzer.generateVoicings('F', {
  previous: ['C4', 'E4', 'G4'],
  noteCount: 3,
  low: 'C4', high: 'C5',
})[0];
console.log(next.notes.map(n => n.fullName)); // ['C4', 'F4', 'A4']
console.log(next.movement);                  // 3 semitones in total

const progression = analyzer.analyzeProgression(['Dm7', 'G7', 'Cmaj7'], {
  key: 'C major',
});
console.log(progression.chords.map(c => c.romanNumeral)); // ['ii7', 'V7', 'Imaj7']
```

In the voicing example, C stays, E rises 1 semitone, and G rises 2. Spacing also affects ranking. Suggestions do not model hand size or fingering.

Roman numerals describe chords relative to a key. Omit `key` to estimate it and inspect five candidates. Progression analysis covers major/minor functions, secondary dominants, and ii–V–I patterns; it does not analyze melody, rhythm, or modulation.

## Integration and reference

All methods are synchronous. Reuse an analyzer to benefit from its bounded matching cache (256 entries by default). TypeScript declarations ship with the package.

A browser bundler can import `chordlens`. For native modules, serve the runtime `.js` files together and import `chord-analyzer.js` from a module script or worker.

- [API](docs/API.md): options, return values, custom templates, and errors.
- [Chord catalogue](docs/CHORDS.md): all supported types and aliases.
- [Development](docs/DEVELOPMENT.md): file layout, checks, and design rules.
- [Changelog](CHANGELOG.md): behavior changes for existing callers.

```sh
npm ci
npm run check
npm run demo
```

`check` runs tests, types, documentation examples, and an installed-package check. Browser checks and benchmarks are documented in the development guide.

[MIT license](LICENSE)
