import { midiToNote, parsePitch, mod12 } from './notes.js';
import { objectOptions, integer, boolean } from './options.js';

const BEAM_WIDTH = 1024;

function pitch(value, label) {
  const midi = typeof value === 'string' ? parsePitch(value)?.midi : value;
  return integer(midi, label, 0, 127);
}

function totalMovement(pitches, previous) {
  return pitches.reduce((sum, midi, index) => sum + Math.abs(midi - previous[index]), 0);
}

function voicingCost(pitches, previous, center) {
  const span = pitches.at(-1) - pitches[0];
  const middle = pitches.reduce((sum, midi) => sum + midi, 0) / pitches.length;
  const movement = previous.length ? totalMovement(pitches, previous) : 0;
  const closeNeighbors = pitches.slice(1).filter((midi, index) => midi - pitches[index] < 3).length;
  return span + Math.abs(middle - center) * 0.5 + movement * 2 + closeNeighbors * 4;
}

export function createVoicings(chord, options = {}) {
  objectOptions(options, [
    'low', 'high', 'noteCount', 'maxResults', 'maxSpan', 'maxAdjacentSpan', 'rootless', 'bass', 'previous',
  ]);
  const low = pitch(options.low === undefined ? 'C3' : options.low, 'low');
  const high = pitch(options.high === undefined ? 'C5' : options.high, 'high');
  if (low > high) throw new RangeError('low must not exceed high');

  const maxResults = integer(options.maxResults === undefined ? 3 : options.maxResults, 'maxResults', 0, 100);
  const rootless = boolean(options.rootless === undefined ? false : options.rootless, 'rootless');
  const maxSpan = integer(options.maxSpan === undefined ? 24 : options.maxSpan, 'maxSpan', 1, 48);
  const maxAdjacentSpan = integer(options.maxAdjacentSpan === undefined ? 12 : options.maxAdjacentSpan, 'maxAdjacentSpan', 1, 24);
  const fixedBass = options.bass === undefined ? null : pitch(options.bass, 'bass');
  const hasSlashBass = chord.name.includes('/') && !/6\/9$/.test(chord.name);
  const bassPitchClass = fixedBass !== null ? fixedBass % 12 : hasSlashBass ? chord.bassPitchClass : null;
  if (rootless && bassPitchClass === chord.rootPitchClass) {
    throw new RangeError('Rootless voicing cannot have the root in the bass');
  }

  const tones = chord.chordNotes.filter(note => !rootless || note.interval !== 'R');
  const allowed = new Set(tones.map(note => note.pitchClass));
  const required = new Set(tones
    .filter(note => chord.requiredIntervals.includes(note.interval))
    .map(note => note.pitchClass));
  if (bassPitchClass !== null) {
    allowed.add(bassPitchClass);
    required.add(bassPitchClass);
  }
  const defaultNoteCount = Math.max(2, Math.min(allowed.size, 5));
  const noteCount = integer(options.noteCount === undefined ? defaultNoteCount : options.noteCount, 'noteCount', 2, 8);
  let previous = [];
  if (options.previous !== undefined) {
    if (!Array.isArray(options.previous)) throw new TypeError('previous must be an array of MIDI notes or pitches');
    previous = Array.from(options.previous, note => pitch(note, 'previous note')).sort((a, b) => a - b);
    if (previous.length !== noteCount) throw new RangeError('previous must contain noteCount notes');
  }
  const bassOutsideRange = fixedBass !== null && (fixedBass < low || fixedBass > high);
  if (!maxResults || noteCount < required.size || noteCount > allowed.size || bassOutsideRange) return [];

  const pitches = [];
  for (let midi = low; midi <= high; midi++) {
    if (allowed.has(midi % 12)) pitches.push(midi);
  }
  const requiredBits = [...required].reduce((bits, pitchClass) => bits | (1 << pitchClass), 0);
  const center = (low + high) / 2;
  let beam = [{ pitches: [], bits: 0, next: 0, cost: 0 }];

  for (let depth = 0; depth < noteCount; depth++) {
    const nextBeam = [];
    for (const state of beam) {
      for (let index = state.next; index < pitches.length; index++) {
        const midi = pitches[index];
        const pitchClass = midi % 12;
        if (state.bits & (1 << pitchClass)) continue;
        if (!depth && (fixedBass !== null ? midi !== fixedBass : bassPitchClass !== null && pitchClass !== bassPitchClass)) continue;
        if (depth && (midi - state.pitches[0] > maxSpan || midi - state.pitches.at(-1) > maxAdjacentSpan)) break;

        const nextPitches = [...state.pitches, midi];
        const bits = state.bits | (1 << pitchClass);
        const remaining = noteCount - nextPitches.length;
        const missing = [...required].filter(note => !(bits & (1 << note)));
        if (missing.length > remaining) continue;

        const availableBits = pitches.slice(index + 1)
          .filter(note => note - nextPitches[0] <= maxSpan)
          .reduce((mask, note) => mask | (1 << (note % 12)), 0);
        if (missing.some(note => !(availableBits & (1 << note)))) continue;
        if (!remaining && (bits & requiredBits) !== requiredBits) continue;

        nextBeam.push({
          pitches: nextPitches,
          bits,
          next: index + 1,
          cost: voicingCost(nextPitches, previous, center),
        });
      }
    }
    nextBeam.sort((a, b) => a.cost - b.cost || comparePitches(a.pitches, b.pitches));
    beam = nextBeam.slice(0, BEAM_WIDTH);
    if (!beam.length) return [];
  }

  return beam.slice(0, maxResults).map(state => {
    const notes = state.pitches.map(midi => {
      const tone = chord.chordNotes.find(note => note.pitchClass === midi % 12);
      const spelling = tone?.name ?? (midi % 12 === chord.bassPitchClass ? chord.bass : undefined);
      return { ...midiToNote(midi, false, spelling), interval: tone?.interval ?? null };
    });
    return {
      name: chord.name,
      midi: [...state.pitches],
      keys: notes.map(note => note.key),
      notes,
      span: state.pitches.at(-1) - state.pitches[0],
      score: -state.cost,
      movement: previous.length ? totalMovement(state.pitches, previous) : null,
      omittedNotes: chord.chordNotes
        .filter(note => !(state.bits & (1 << note.pitchClass)))
        .map(note => ({ ...note })),
      bassInterval: chord.chordNotes.find(note => note.pitchClass === mod12(state.pitches[0]))?.interval ?? null,
    };
  });
}

function comparePitches(a, b) {
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}
