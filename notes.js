const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_TO_PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// pitch class -> letter index for sharp/flat contexts
const SHARP_LETTER_IDX = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const FLAT_LETTER_IDX  = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];

// degree -> letter offset (9 maps to 2nd, 11 to 4th, etc)
const DEGREE_OFFSETS = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 9: 1, 11: 3, 13: 5 };


function normalizeAccidentals(text) {
  return String(text ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/x/g, '##')
    .replace(/\u{1D12A}/gu, '##')
    .replace(/\u{1D12B}/gu, 'bb');
}


function parseNote(name) {
  const clean = normalizeAccidentals(name);
  const m = clean.match(/^([A-Ga-g])(#{1,2}|b{1,2}|)?$/);
  if (!m) return null;

  const letter = m[1].toUpperCase();
  const accidental = m[2] || '';
  let pitch = LETTER_TO_PITCH[letter];
  if (pitch === undefined) return null;

  for (const ch of accidental) {
    pitch = ch === '#' ? (pitch + 1) % 12 : (pitch + 11) % 12;
  }

  return { letter, accidental, name: letter + accidental, pitch, letterIndex: LETTERS.indexOf(letter) };
}


function rootName(pitch, flat) {
  return (flat ? NOTES_FLAT : NOTES_SHARP)[pitch];
}

function rootLetterIndex(pitch, flat) {
  return (flat ? FLAT_LETTER_IDX : SHARP_LETTER_IDX)[pitch];
}

function noteNames(flat) {
  return flat ? NOTES_FLAT : NOTES_SHARP;
}


function labelToLetterOffset(label) {
  if (label === 'R') return 0;
  const degree = parseInt(label.match(/\d+/)?.[0], 10);
  return DEGREE_OFFSETS[degree] ?? 0;
}


// The tricky part: the 3rd of F# must be spelled A# (not Bb),
// and the b7 of C must be Bb (not A#). We find the correct letter
// by stepping through the alphabet, then sharp/flat to hit the pitch.
function spellNote(rootLetterIdx, targetPitch, label) {
  const offset = labelToLetterOffset(label);
  const idx = (rootLetterIdx + offset) % 7;
  const letter = LETTERS[idx];
  const diff = (targetPitch - LETTER_TO_PITCH[letter] + 12) % 12;

  if (diff === 0)  return letter;
  if (diff === 1)  return letter + '#';
  if (diff === 2)  return letter + '##';
  if (diff === 11) return letter + 'b';
  if (diff === 10) return letter + 'bb';

  return NOTES_SHARP[targetPitch];
}


function popcount(n) {
  let c = 0;
  while (n) { c++; n &= n - 1; }
  return c;
}


export {
  NOTES_SHARP, NOTES_FLAT, LETTERS, LETTER_TO_PITCH,
  normalizeAccidentals, parseNote,
  rootName, rootLetterIndex, noteNames,
  spellNote, popcount,
};
