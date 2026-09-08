# Chord catalogue

ChordLens includes 60 immutable built-in templates. This table is generated from the actual definitions with `npm run docs:chords`.

Required roles must be played in strict mode; other roles may be omitted. Rootless and incomplete modes have explicit additional rules described in the [API](API.md). Example notes use C and musical degree order, not a prescribed voicing.

| Symbol | Name | Roles | Required | Example notes |
| --- | --- | --- | --- | --- |
| `5` | Power Chord | R 5 | R 5 | C G |
| `""` (major) | Major | R 3 5 | R 3 5 | C E G |
| `m` | Minor | R b3 5 | R b3 5 | C Eb G |
| `dim` | Diminished | R b3 b5 | R b3 b5 | C Eb Gb |
| `aug` | Augmented | R 3 #5 | R 3 #5 | C E G# |
| `sus2` | Suspended 2nd | R 2 5 | R 2 5 | C D G |
| `sus4` | Suspended 4th | R 4 5 | R 4 5 | C F G |
| `maj7` | Major 7th | R 3 5 7 | R 3 7 | C E G B |
| `7` | Dominant 7th | R 3 5 b7 | R 3 b7 | C E G Bb |
| `m7` | Minor 7th | R b3 5 b7 | R b3 b7 | C Eb G Bb |
| `dim7` | Diminished 7th | R b3 b5 bb7 | R b3 b5 bb7 | C Eb Gb Bbb |
| `m7b5` | Half-Diminished 7th | R b3 b5 b7 | R b3 b5 b7 | C Eb Gb Bb |
| `mMaj7` | Minor-Major 7th | R b3 5 7 | R b3 7 | C Eb G B |
| `augMaj7` | Augmented Major 7th | R 3 #5 7 | R 3 #5 7 | C E G# B |
| `aug7` | Augmented 7th | R 3 #5 b7 | R 3 #5 b7 | C E G# Bb |
| `7b5` | Dominant 7th Flat 5 | R 3 b5 b7 | R 3 b5 b7 | C E Gb Bb |
| `7sus4` | Dominant 7th Suspended 4th | R 4 5 b7 | R 4 b7 | C F G Bb |
| `7sus2` | Dominant 7th Suspended 2nd | R 2 5 b7 | R 2 b7 | C D G Bb |
| `maj7b5` | Major 7th Flat 5 | R 3 b5 7 | R 3 b5 7 | C E Gb B |
| `6` | Major 6th | R 3 5 6 | R 3 6 | C E G A |
| `m6` | Minor 6th | R b3 5 6 | R b3 6 | C Eb G A |
| `add9` | Major Add 9 | R 3 5 9 | R 9 3 5 | C E G D |
| `madd9` | Minor Add 9 | R b3 5 9 | R 9 b3 5 | C Eb G D |
| `add11` | Major Add 11 | R 3 5 11 | R 3 11 5 | C E G F |
| `9` | Dominant 9th | R 3 5 b7 9 | R 3 b7 9 | C E G Bb D |
| `maj9` | Major 9th | R 3 5 7 9 | R 3 7 9 | C E G B D |
| `m9` | Minor 9th | R b3 5 b7 9 | R b3 b7 9 | C Eb G Bb D |
| `6/9` | Major 6/9 | R 3 5 6 9 | R 9 3 6 | C E G A D |
| `m6/9` | Minor 6/9 | R b3 5 6 9 | R 9 b3 6 | C Eb G A D |
| `7b9` | Dominant 7th Flat 9 | R 3 5 b7 b9 | R b9 3 b7 | C E G Bb Db |
| `7#9` | Dominant 7th Sharp 9 | R 3 5 b7 #9 | R #9 3 b7 | C E G Bb D# |
| `mMaj9` | Minor-Major 9th | R b3 5 7 9 | R 9 b3 7 | C Eb G B D |
| `9sus4` | Dominant 9th Suspended 4th | R 4 5 b7 9 | R 9 4 b7 | C F G Bb D |
| `11` | Dominant 11th | R 3 5 b7 9 11 | R b7 11 | C E G Bb D F |
| `maj11` | Major 11th | R 3 5 7 9 11 | R 3 7 11 | C E G B D F |
| `m11` | Minor 11th | R b3 5 b7 9 11 | R b3 b7 11 | C Eb G Bb D F |
| `7#11` | Dominant 7th Sharp 11 | R 3 5 b7 #11 | R 3 #11 b7 | C E G Bb F# |
| `maj7#11` | Major 7th Sharp 11 | R 3 5 7 #11 | R 3 #11 7 | C E G B F# |
| `9#11` | Dominant 9th Sharp 11 | R 3 5 b7 9 #11 | R 9 3 #11 b7 | C E G Bb D F# |
| `13` | Dominant 13th | R 3 5 b7 9 11 13 | R 3 b7 13 | C E G Bb D F A |
| `maj13` | Major 13th | R 3 5 7 9 11 13 | R 3 7 13 | C E G B D F A |
| `m13` | Minor 13th | R b3 5 b7 9 11 13 | R b3 b7 13 | C Eb G Bb D F A |
| `13sus4` | Dominant 13th Suspended 4th | R 4 5 b7 9 13 | R 4 b7 13 | C F G Bb D A |
| `13b9` | Dominant 13th Flat 9 | R 3 5 b7 b9 13 | R b9 3 b7 13 | C E G Bb Db A |
| `13#11` | Dominant 13th Sharp 11 | R 3 5 b7 9 #11 13 | R 3 #11 b7 13 | C E G Bb D F# A |
| `7#5b9` | Dominant 7th Sharp 5 Flat 9 | R 3 #5 b7 b9 | R b9 3 #5 b7 | C E G# Bb Db |
| `7#5#9` | Dominant 7th Sharp 5 Sharp 9 | R 3 #5 b7 #9 | R #9 3 #5 b7 | C E G# Bb D# |
| `7b5b9` | Dominant 7th Flat 5 Flat 9 | R 3 b5 b7 b9 | R b9 3 b5 b7 | C E Gb Bb Db |
| `7b5#9` | Dominant 7th Flat 5 Sharp 9 | R 3 b5 b7 #9 | R #9 3 b5 b7 | C E Gb Bb D# |
| `7b13` | Dominant 7th Flat 13 | R 3 5 b7 b13 | R 3 b13 b7 | C E G Bb Ab |
| `7b9b13` | Dominant 7th Flat 9 Flat 13 | R 3 5 b7 b9 b13 | R b9 3 b13 b7 | C E G Bb Db Ab |
| `7#9b13` | Dominant 7th Sharp 9 Flat 13 | R 3 5 b7 #9 b13 | R #9 3 b13 b7 | C E G Bb D# Ab |
| `madd11` | Minor Add 11 | R b3 5 11 | R b3 11 5 | C Eb G F |
| `add#11` | Major Add Sharp 11 | R 3 5 #11 | R 3 #11 5 | C E G F# |
| `maj9#11` | Major 9th Sharp 11 | R 3 5 7 9 #11 | R 9 3 #11 7 | C E G B D F# |
| `maj13#11` | Major 13th Sharp 11 | R 3 5 7 9 #11 13 | R 3 #11 13 7 | C E G B D F# A |
| `9#5` | Dominant 9th Sharp 5 | R 3 #5 b7 9 | R 9 3 #5 b7 | C E G# Bb D |
| `9b5` | Dominant 9th Flat 5 | R 3 b5 b7 9 | R 9 3 b5 b7 | C E Gb Bb D |
| `maj9#5` | Major 9th Sharp 5 | R 3 #5 7 9 | R 9 3 #5 7 | C E G# B D |
| `7sus4b9` | Dominant 7th Suspended 4th Flat 9 | R 4 5 b7 b9 | R b9 4 b7 | C F G Bb Db |

## Common aliases

| Input | Canonical symbol |
| --- | --- |
| `M`, `maj`, `major`, `Δ`, `(major)` | `""` |
| `m`, `min`, `minor`, `-`, `−` | `m` |
| `M7`, `Δ7`, `major7` | `maj7` |
| `min7`, `MIN7`, `-7` | `m7` |
| `mM7`, `minMaj7`, `minorMajor7` | `mMaj7` |
| `mM9`, `minMaj9` | `mMaj9` |
| `ø`, `ø7`, `half-diminished` | `m7b5` |
| `°`, `o`, `diminished` | `dim` |
| `°7`, `o7`, `diminished7` | `dim7` |
| `+`, `augmented` | `aug` |
| `+7`, `7#5` | `aug7` |
| `+M7`, `maj7#5`, `augmentedMaj7` | `augMaj7` |
| `aug9`, `augmented9` | `9#5` |
| `69`, `m69` | `6/9`, `m6/9` |
| `sus`, `7sus`, `9sus`, `13sus` | corresponding `sus4` types |
| `add2`, `madd2`, `add4`, `madd4` | `add9`, `madd9`, `add11`, `madd11` |
| `7(b9)`, `7(♭9)` | `7b9` |
| `7(#9,b5)` | `7b5#9` |

Major/minor abbreviations retain meaningful case. Word prefixes are case-insensitive. The parser accepts grouped alterations only when the resulting type exists in the catalogue. Ambiguous collections such as `7alt` do not designate one template and are not silently expanded.

A slash followed by a note names the bass: `Cmaj7/E`, `C6/9/E`. Explicit `no3`/`no5` (or `omit3`/`omit5`) removes that degree during construction. Custom templates can extend the catalogue per analyzer without mutating the shared definitions.
