export const NOTES_SHARP = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
export const NOTES_FLAT = Object.freeze(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
export const LETTERS = Object.freeze(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
export const LETTER_TO_PITCH = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 });
const DIATONIC = [0, 2, 4, 5, 7, 9, 11];
export const mod12 = n => ((n % 12) + 12) % 12;

export function normalizeAccidentals(text, expandX = true) {
  if (typeof expandX !== 'boolean') throw new TypeError('expandX must be a boolean');
  const normalized = String(text ?? '').trim().replace(/\s+/g, '')
    .replace(/♯/g, '#').replace(/♭/g, 'b').replace(/([A-Ga-g])♮/g, '$1')
    .replace(/\u{1D12A}/gu, '##').replace(/\u{1D12B}/gu, 'bb');
  return expandX ? normalized.replace(/x/g, '##') : normalized;
}

export function parseNote(name) {
  if (typeof name !== 'string') return null;
  const m = normalizeAccidentals(name).match(/^([A-Ga-g])(#+|b+)?$/);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const accidental = m[2] ?? '';
  const alteration = accidental.length * (accidental.startsWith('b') ? -1 : 1);
  const naturalPitch = LETTER_TO_PITCH[letter];
  return { letter, accidental, alteration, naturalPitch, name: letter + accidental,
    pitch: mod12(naturalPitch + alteration), letterIndex: LETTERS.indexOf(letter) };
}

// Apply accidentals after computing the natural pitch's octave: B#3 is C4.
export function noteToMidi(name, octave) {
  const n = parseNote(name);
  if (!n || !Number.isInteger(octave)) return null;
  const midi = (octave + 1) * 12 + n.naturalPitch + n.alteration;
  return Number.isInteger(midi) && midi >= 0 && midi <= 127 ? midi : null;
}

export function parsePitch(value) {
  if (typeof value !== 'string') return null;
  const m = normalizeAccidentals(value).match(/^([A-Ga-g](?:#+|b+)?)(-?\d+)$/);
  if (!m) return null;
  const octave = Number(m[2]);
  const midi = noteToMidi(m[1], octave);
  if (midi === null) return null;
  const n = parseNote(m[1]);
  return { name: n.name, pitchClass: n.pitch, octave, fullName: n.name + octave,
    midi, key: midi >= 21 && midi <= 108 ? midi - 20 : null, interval: null };
}

export function midiToNote(midi, useFlats = false, spelling) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) throw new RangeError('MIDI note must be an integer from 0 to 127');
  if (typeof useFlats !== 'boolean') throw new TypeError('useFlats must be a boolean');
  const n = parseNote(spelling ?? rootName(midi % 12, useFlats));
  if (!n || n.pitch !== midi % 12) throw new RangeError('Spelling must match the MIDI pitch');
  const octave = (midi - n.naturalPitch - n.alteration) / 12 - 1;
  return { name: n.name, pitchClass: n.pitch, octave, fullName: n.name + octave,
    midi, key: midi >= 21 && midi <= 108 ? midi - 20 : null, interval: null };
}

export function noteNames(flat = false) { return flat ? NOTES_FLAT : NOTES_SHARP; }
export function rootName(pitch, flat = false) { return noteNames(flat)[pitch]; }
export function rootLetterIndex(pitch, flat = false) { return LETTERS.indexOf(rootName(pitch, flat)?.[0]); }

export function parseInterval(label) {
  if (label === 'R') return { degree: 1, alteration: 0, semitones: 0 };
  if (typeof label !== 'string') return null;
  const m = label.match(/^(#+|b+)?([1-9]\d?)$/);
  if (!m) return null;
  const degree = Number(m[2]);
  if (degree > 13) return null;
  const alteration = (m[1]?.length ?? 0) * (m[1]?.startsWith('b') ? -1 : 1);
  return { degree, alteration, semitones: DIATONIC[(degree - 1) % 7] + 12 * Math.floor((degree - 1) / 7) + alteration };
}

function accidentalText(diff) { return diff < 0 ? 'b'.repeat(-diff) : '#'.repeat(diff); }

export function spellNote(rootLetterIdx, targetPitch, label) {
  const iv = parseInterval(label);
  if (!iv || !Number.isInteger(rootLetterIdx) || rootLetterIdx < 0 || rootLetterIdx > 6 ||
      !Number.isInteger(targetPitch) || targetPitch < 0 || targetPitch > 11) throw new RangeError('Invalid spelling arguments');
  const letter = LETTERS[(rootLetterIdx + iv.degree - 1) % 7];
  let diff = mod12(targetPitch - LETTER_TO_PITCH[letter]);
  if (diff > 6) diff -= 12;
  return letter + accidentalText(diff);
}

// Keep the root's actual accidental count, including theoretical triple accidentals.
export function spellChordNote(root, label) {
  const n = typeof root === 'string' ? parseNote(root) : root;
  const iv = parseInterval(label);
  if (!n || !iv) throw new RangeError('Invalid root or interval');
  const index = n.letterIndex + iv.degree - 1;
  const letter = LETTERS[index % 7];
  const naturalTarget = LETTER_TO_PITCH[letter] + 12 * Math.floor(index / 7);
  return letter + accidentalText(n.naturalPitch + n.alteration + iv.semitones - naturalTarget);
}

export function popcount(n) {
  n >>>= 0;
  let count = 0;
  while (n) { count++; n &= n - 1; }
  return count;
}
