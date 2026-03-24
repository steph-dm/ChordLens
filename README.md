# ChordLens

[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Figures out what chord you're playing on an 88-key piano. Give it key numbers, get back ranked chord names.

```js
import { ChordAnalyzer } from './chord-analyzer.js';
const a = new ChordAnalyzer();

a.detect([40, 44, 47]);        // C Major
a.detect([40, 44, 47, 50]);   // C7
a.detect([44, 47, 52]);       // C/E

a.getChordNotes('F#', '7');   // F# A# C# E (not Bb Db)
a.getChordNotes('C', 'Δ7');   // reads as maj7
a.getChordNotes('C', 'ø');    // half-dim

a.noteToKey('C', 4);          // 40
a.keyToNote(40);              // { name: "C", octave: 4, midi: 60 }
```

## What it covers

- 50+ chord types (triads, 7ths, 9ths, 11ths, 13ths, altered, sus, add, 6th)
- Inversions with slash notation
- Shell voicings where notes are dropped
- Correct enharmonic spelling (3rd of F# is A#, not Bb)
- Common shorthands (Δ7, ø, +, -, min, dim...)
- Sharp or flat display

## API

- `detect(keys, opts?)` - ranked chord matches
- `getChordNotes(root, symbol, opts?)` - build a chord from its name
- `getChordTypes()` - full list of supported types
- `keyToNote(key)` / `noteToKey(name, octave)`

opts: `{ useFlats: true, maxResults: 5 }`

## Project structure

```
chord-analyzer.js    detection + scoring
notes.js             pitch parsing, enharmonic spelling
symbols.js           chord symbol normalization
templates.js         chord definitions
```

## License

MIT
