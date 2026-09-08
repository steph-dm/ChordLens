import { mod12, parseNote, rootName, spellChordNote } from './notes.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function parseKey(value) {
  if (typeof value !== 'string') throw new TypeError('Key must be a string such as C major or A minor');
  const match = value.trim().match(/^([A-Ga-g](?:[#b♯♭]+)?)(?:\s*(major|minor|maj|min|m))?$/i);
  if (!match) throw new RangeError(`Invalid key: ${value}`);
  const tonic = parseNote(match[1]);
  const mode = match[2] !== 'M' && ['minor', 'min', 'm'].includes(match[2]?.toLowerCase()) ? 'minor' : 'major';
  const steps = mode === 'minor' ? MINOR : MAJOR;
  const labels = mode === 'minor' ? ['R', '2', 'b3', '4', '5', 'b6', 'b7'] : ['R', '2', '3', '4', '5', '6', '7'];
  const notes = labels.map(label => spellChordNote(tonic, label));
  const pitchClasses = steps.map(iv => mod12(tonic.pitch + iv));
  return { tonic: tonic.name, mode, name: `${tonic.name} ${mode}`, pitchClasses, notes };
}

export function contextName(pc, key, flat) {
  return key?.notes[key.pitchClasses.indexOf(pc)] ?? rootName(pc, flat);
}
