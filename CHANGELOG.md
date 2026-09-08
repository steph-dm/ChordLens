# Changelog

## Unreleased

### Added

- Full MIDI-range and named-pitch input; interval analysis.
- Rootless/incomplete interpretations, extra-note tolerance, key/root hints, and ranking explanations.
- Chord-name parsing, explicit omissions, 60 built-in types, and custom templates.
- Constrained voicings, movement scoring, progression analysis, and key estimates.
- Bounded caching, TypeScript declarations, documentation, and automated checks.

### Fixed

- Accidental octave boundaries, theoretical chord/bass spelling, and major/minor aliases.
- Input/option validation, duplicate pitches, octave-only input, and catalogue round-trips.
- Ranking now favors complete interpretations by default.

### Migration

- `detect()` takes piano keys 1–88. Use `detectMidi()` for MIDI 0–127.
- Invalid inputs/options throw; valid unmatched sets still return `[]`. `maxResults` must be a nonnegative integer; zero hides results.
- Single notes and octave-only inputs return note/octave candidates. Check `kind` when accepting only chords.
- Default ranking can change names: E♭–G–C prefers Cm/E♭. Use `ranking: 'bass'` for the earlier preference or `rootHint` for known context.
- Major's catalogue symbol is `''`; use `displaySymbol` for its readable label.
- Prefer structured `playedNotes` and `chordNotes`. Detection's legacy `notes`/`inputNotes` remain string arrays; builder `notes` remains an object array.
- Chord tones follow theoretical spelling. Builders preserve supplied roots; use `spelling: 'simplify'` with `useFlats` to respell them.
- Built-in arrays/templates are frozen. Use `registerTemplate()` to extend an analyzer.
