# Development

## Layout

Runtime modules stay at the package root so direct browser imports and existing file imports continue to work. Only the runtime, declarations, documentation, and license are packaged.

| Location | Responsibility |
| --- | --- |
| `chord-analyzer.js` | Public API, matching, ranking, results, registry, and cache |
| `notes.js`, `symbols.js` | Pitch conversion, spelling, and chord-name parsing |
| `templates.js`, `template-utils.js` | Chord definitions, validation, and compiled interval masks |
| `options.js` | Shared input-option validation |
| `harmony.js` | Key context and progression analysis |
| `voicings.js` | Constrained voicing search |
| `*.d.ts` | Public TypeScript contracts |
| `examples/` | Runnable usage demonstration |
| `tests/` | Musical regressions, systematic tests, and TypeScript consumers |
| `scripts/` | Documentation, package/browser checks, and benchmarks |
| `docs/` | API reference and generated chord catalogue |
| `.github/workflows/` | Windows/Linux checks on Node 22/24 and Chromium |

ChordFlow is excluded from inspection, packaging, and CI checkout. ChordLens has no runtime dependencies or MIDI event, device, audio, or UI layer.

## Checks

```sh
npm ci
npm run check
npm run demo
npm run test:coverage
npm run benchmark
```

`check` runs musical regressions, systematic tests, TypeScript checks, documentation examples, and an npm tarball installed in a temporary project. Tests cover all MIDI pitches, all chord templates/transpositions/omissions, 24,576 pitch-set/bass combinations, voicings, progression rules, and invalid inputs.

For browser compatibility:

```sh
npx playwright install chromium
npm run test:browser
```

This small check serves only packaged runtime files and exercises native modules and a module worker. Browser tooling is development-only. CI runs these checks; `prepublishOnly` also runs `check`.

## Design rules

- Convert input to sorted MIDI pitches; match distinct pitch classes with the lowest pitch as bass.
- Keep required tones, optional omissions, and interval labels explicit in templates.
- Rank numeric matches before formatting results. Scores and key estimates are heuristics, not probabilities.
- Cache matching descriptors, not mutable output objects. Changes to spelling, octaves, or result count must produce fresh output.
- Preserve theoretical spelling, including accidental octave boundaries: B#3 = C4, Cb4 = B3.
- Keep voicing search bounded to 1,024 partial candidates per step. It suggests spacing, not fingering.

Musical references: [pitch notation](https://open-musictheory.github.io/docs/fundamentals/pitches/), [Roman numerals](https://viva.pressbooks.pub/openmusictheory/chapter/roman-numerals/), [tonicization](https://viva.pressbooks.pub/openmusictheory/chapter/tonicization/).

The benchmark compares cached/uncached detection over seven batches of 5,000 calls after warm-up. It reports local throughput, not a real-time latency guarantee.

## Changing the library

Keep public declarations and the API reference aligned with behavior. For a chord definition change, run `npm run docs:chords` to regenerate the catalogue and add a musical regression when ranking changes. Run `npm run check`; run the browser check for runtime changes.
