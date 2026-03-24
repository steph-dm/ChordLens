// symbol:    suffix after root name (empty = major)
// intervals: semitones above root
// required:  must be present, the rest can be omitted
// labels:    interval function names
// weight:    common chords rank higher

const TEMPLATES = [

  { symbol: '5', fullName: 'Power Chord',
    intervals: [0, 7], required: [0, 7],
    labels: { 0: 'R', 7: '5' }, weight: 55 },

  { symbol: '', fullName: 'Major',
    intervals: [0, 4, 7], required: [0, 4, 7],
    labels: { 0: 'R', 4: '3', 7: '5' }, weight: 100 },

  { symbol: 'm', fullName: 'Minor',
    intervals: [0, 3, 7], required: [0, 3, 7],
    labels: { 0: 'R', 3: 'b3', 7: '5' }, weight: 100 },

  { symbol: 'dim', fullName: 'Diminished',
    intervals: [0, 3, 6], required: [0, 3, 6],
    labels: { 0: 'R', 3: 'b3', 6: 'b5' }, weight: 85 },

  { symbol: 'aug', fullName: 'Augmented',
    intervals: [0, 4, 8], required: [0, 4, 8],
    labels: { 0: 'R', 4: '3', 8: '#5' }, weight: 85 },

  { symbol: 'sus2', fullName: 'Suspended 2nd',
    intervals: [0, 2, 7], required: [0, 2, 7],
    labels: { 0: 'R', 2: '2', 7: '5' }, weight: 88 },

  { symbol: 'sus4', fullName: 'Suspended 4th',
    intervals: [0, 5, 7], required: [0, 5, 7],
    labels: { 0: 'R', 5: '4', 7: '5' }, weight: 88 },

  { symbol: 'maj7', fullName: 'Major 7th',
    intervals: [0, 4, 7, 11], required: [0, 4, 11],
    labels: { 0: 'R', 4: '3', 7: '5', 11: '7' }, weight: 80 },

  { symbol: '7', fullName: 'Dominant 7th',
    intervals: [0, 4, 7, 10], required: [0, 4, 10],
    labels: { 0: 'R', 4: '3', 7: '5', 10: 'b7' }, weight: 80 },

  { symbol: 'm7', fullName: 'Minor 7th',
    intervals: [0, 3, 7, 10], required: [0, 3, 10],
    labels: { 0: 'R', 3: 'b3', 7: '5', 10: 'b7' }, weight: 80 },

  { symbol: 'dim7', fullName: 'Diminished 7th',
    intervals: [0, 3, 6, 9], required: [0, 3, 6, 9],
    labels: { 0: 'R', 3: 'b3', 6: 'b5', 9: 'bb7' }, weight: 75 },

  { symbol: 'm7b5', fullName: 'Half-Diminished 7th',
    intervals: [0, 3, 6, 10], required: [0, 3, 6, 10],
    labels: { 0: 'R', 3: 'b3', 6: 'b5', 10: 'b7' }, weight: 75 },

  { symbol: 'mMaj7', fullName: 'Minor-Major 7th',
    intervals: [0, 3, 7, 11], required: [0, 3, 11],
    labels: { 0: 'R', 3: 'b3', 7: '5', 11: '7' }, weight: 68 },

  { symbol: 'augMaj7', fullName: 'Augmented Major 7th',
    intervals: [0, 4, 8, 11], required: [0, 4, 8, 11],
    labels: { 0: 'R', 4: '3', 8: '#5', 11: '7' }, weight: 65 },

  { symbol: 'aug7', fullName: 'Augmented 7th',
    intervals: [0, 4, 8, 10], required: [0, 4, 8, 10],
    labels: { 0: 'R', 4: '3', 8: '#5', 10: 'b7' }, weight: 65 },

  { symbol: '7b5', fullName: 'Dominant 7th Flat 5',
    intervals: [0, 4, 6, 10], required: [0, 4, 6, 10],
    labels: { 0: 'R', 4: '3', 6: 'b5', 10: 'b7' }, weight: 65 },

  { symbol: '7sus4', fullName: 'Dominant 7th Suspended 4th',
    intervals: [0, 5, 7, 10], required: [0, 5, 10],
    labels: { 0: 'R', 5: '4', 7: '5', 10: 'b7' }, weight: 72 },

  { symbol: '7sus2', fullName: 'Dominant 7th Suspended 2nd',
    intervals: [0, 2, 7, 10], required: [0, 2, 10],
    labels: { 0: 'R', 2: '2', 7: '5', 10: 'b7' }, weight: 70 },

  { symbol: 'maj7b5', fullName: 'Major 7th Flat 5',
    intervals: [0, 4, 6, 11], required: [0, 4, 6, 11],
    labels: { 0: 'R', 4: '3', 6: 'b5', 11: '7' }, weight: 58 },

  { symbol: '6', fullName: 'Major 6th',
    intervals: [0, 4, 7, 9], required: [0, 4, 9],
    labels: { 0: 'R', 4: '3', 7: '5', 9: '6' }, weight: 74 },

  { symbol: 'm6', fullName: 'Minor 6th',
    intervals: [0, 3, 7, 9], required: [0, 3, 9],
    labels: { 0: 'R', 3: 'b3', 7: '5', 9: '6' }, weight: 74 },

  { symbol: 'add9', fullName: 'Major Add 9',
    intervals: [0, 2, 4, 7], required: [0, 2, 4, 7],
    labels: { 0: 'R', 2: '9', 4: '3', 7: '5' }, weight: 76 },

  { symbol: 'madd9', fullName: 'Minor Add 9',
    intervals: [0, 2, 3, 7], required: [0, 2, 3, 7],
    labels: { 0: 'R', 2: '9', 3: 'b3', 7: '5' }, weight: 76 },

  { symbol: 'add11', fullName: 'Major Add 11',
    intervals: [0, 4, 5, 7], required: [0, 4, 5, 7],
    labels: { 0: 'R', 4: '3', 5: '11', 7: '5' }, weight: 64 },

  { symbol: '9', fullName: 'Dominant 9th',
    intervals: [0, 2, 4, 7, 10], required: [0, 4, 10, 2],
    labels: { 0: 'R', 2: '9', 4: '3', 7: '5', 10: 'b7' }, weight: 62 },

  { symbol: 'maj9', fullName: 'Major 9th',
    intervals: [0, 2, 4, 7, 11], required: [0, 4, 11, 2],
    labels: { 0: 'R', 2: '9', 4: '3', 7: '5', 11: '7' }, weight: 62 },

  { symbol: 'm9', fullName: 'Minor 9th',
    intervals: [0, 2, 3, 7, 10], required: [0, 3, 10, 2],
    labels: { 0: 'R', 2: '9', 3: 'b3', 7: '5', 10: 'b7' }, weight: 62 },

  { symbol: '6/9', fullName: 'Major 6/9',
    intervals: [0, 2, 4, 7, 9], required: [0, 2, 4, 9],
    labels: { 0: 'R', 2: '9', 4: '3', 7: '5', 9: '6' }, weight: 60 },

  { symbol: 'm6/9', fullName: 'Minor 6/9',
    intervals: [0, 2, 3, 7, 9], required: [0, 2, 3, 9],
    labels: { 0: 'R', 2: '9', 3: 'b3', 7: '5', 9: '6' }, weight: 60 },

  { symbol: '7b9', fullName: 'Dominant 7th Flat 9',
    intervals: [0, 1, 4, 7, 10], required: [0, 1, 4, 10],
    labels: { 0: 'R', 1: 'b9', 4: '3', 7: '5', 10: 'b7' }, weight: 58 },

  { symbol: '7#9', fullName: 'Dominant 7th Sharp 9',
    intervals: [0, 3, 4, 7, 10], required: [0, 3, 4, 10],
    labels: { 0: 'R', 3: '#9', 4: '3', 7: '5', 10: 'b7' }, weight: 58 },

  { symbol: 'mMaj9', fullName: 'Minor-Major 9th',
    intervals: [0, 2, 3, 7, 11], required: [0, 2, 3, 11],
    labels: { 0: 'R', 2: '9', 3: 'b3', 7: '5', 11: '7' }, weight: 52 },

  { symbol: '9sus4', fullName: 'Dominant 9th Suspended 4th',
    intervals: [0, 2, 5, 7, 10], required: [0, 2, 5, 10],
    labels: { 0: 'R', 2: '9', 5: '4', 7: '5', 10: 'b7' }, weight: 56 },

  { symbol: '11', fullName: 'Dominant 11th',
    intervals: [0, 2, 4, 5, 7, 10],
    required: [0, 10, 5], // 3rd usually dropped (clashes with 11th)
    labels: { 0: 'R', 2: '9', 4: '3', 5: '11', 7: '5', 10: 'b7' }, weight: 42 },

  { symbol: 'maj11', fullName: 'Major 11th',
    intervals: [0, 2, 4, 5, 7, 11], required: [0, 4, 11, 5],
    labels: { 0: 'R', 2: '9', 4: '3', 5: '11', 7: '5', 11: '7' }, weight: 42 },

  { symbol: 'm11', fullName: 'Minor 11th',
    intervals: [0, 2, 3, 5, 7, 10], required: [0, 3, 10, 5],
    labels: { 0: 'R', 2: '9', 3: 'b3', 5: '11', 7: '5', 10: 'b7' }, weight: 42 },

  { symbol: '7#11', fullName: 'Dominant 7th Sharp 11',
    intervals: [0, 4, 6, 7, 10], required: [0, 4, 6, 10],
    labels: { 0: 'R', 4: '3', 6: '#11', 7: '5', 10: 'b7' }, weight: 50 },

  { symbol: 'maj7#11', fullName: 'Major 7th Sharp 11',
    intervals: [0, 4, 6, 7, 11], required: [0, 4, 6, 11],
    labels: { 0: 'R', 4: '3', 6: '#11', 7: '5', 11: '7' }, weight: 50 },

  { symbol: '9#11', fullName: 'Dominant 9th Sharp 11',
    intervals: [0, 2, 4, 6, 7, 10], required: [0, 2, 4, 6, 10],
    labels: { 0: 'R', 2: '9', 4: '3', 6: '#11', 7: '5', 10: 'b7' }, weight: 44 },

  { symbol: '13', fullName: 'Dominant 13th',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    required: [0, 4, 10, 9],
    labels: { 0: 'R', 2: '9', 4: '3', 5: '11', 7: '5', 9: '13', 10: 'b7' }, weight: 32 },

  { symbol: 'maj13', fullName: 'Major 13th',
    intervals: [0, 2, 4, 5, 7, 9, 11], required: [0, 4, 11, 9],
    labels: { 0: 'R', 2: '9', 4: '3', 5: '11', 7: '5', 9: '13', 11: '7' }, weight: 32 },

  { symbol: 'm13', fullName: 'Minor 13th',
    intervals: [0, 2, 3, 5, 7, 9, 10], required: [0, 3, 10, 9],
    labels: { 0: 'R', 2: '9', 3: 'b3', 5: '11', 7: '5', 9: '13', 10: 'b7' }, weight: 32 },

  { symbol: '13sus4', fullName: 'Dominant 13th Suspended 4th',
    intervals: [0, 2, 5, 7, 9, 10], required: [0, 5, 10, 9],
    labels: { 0: 'R', 2: '9', 5: '4', 7: '5', 9: '13', 10: 'b7' }, weight: 30 },

  { symbol: '13b9', fullName: 'Dominant 13th Flat 9',
    intervals: [0, 1, 4, 7, 9, 10], required: [0, 1, 4, 10, 9],
    labels: { 0: 'R', 1: 'b9', 4: '3', 7: '5', 9: '13', 10: 'b7' }, weight: 30 },

  { symbol: '13#11', fullName: 'Dominant 13th Sharp 11',
    intervals: [0, 2, 4, 6, 7, 9, 10], required: [0, 4, 6, 10, 9],
    labels: { 0: 'R', 2: '9', 4: '3', 6: '#11', 7: '5', 9: '13', 10: 'b7' }, weight: 28 },

  { symbol: '7#5b9', fullName: 'Dominant 7th Sharp 5 Flat 9',
    intervals: [0, 1, 4, 8, 10], required: [0, 1, 4, 8, 10],
    labels: { 0: 'R', 1: 'b9', 4: '3', 8: '#5', 10: 'b7' }, weight: 48 },

  { symbol: '7#5#9', fullName: 'Dominant 7th Sharp 5 Sharp 9',
    intervals: [0, 3, 4, 8, 10], required: [0, 3, 4, 8, 10],
    labels: { 0: 'R', 3: '#9', 4: '3', 8: '#5', 10: 'b7' }, weight: 48 },

  { symbol: '7b5b9', fullName: 'Dominant 7th Flat 5 Flat 9',
    intervals: [0, 1, 4, 6, 10], required: [0, 1, 4, 6, 10],
    labels: { 0: 'R', 1: 'b9', 4: '3', 6: 'b5', 10: 'b7' }, weight: 48 },

  { symbol: '7b5#9', fullName: 'Dominant 7th Flat 5 Sharp 9',
    intervals: [0, 3, 4, 6, 10], required: [0, 3, 4, 6, 10],
    labels: { 0: 'R', 3: '#9', 4: '3', 6: 'b5', 10: 'b7' }, weight: 48 },

  { symbol: '7b13', fullName: 'Dominant 7th Flat 13',
    intervals: [0, 4, 7, 8, 10], required: [0, 4, 8, 10],
    labels: { 0: 'R', 4: '3', 7: '5', 8: 'b13', 10: 'b7' }, weight: 50 },

  { symbol: '7b9b13', fullName: 'Dominant 7th Flat 9 Flat 13',
    intervals: [0, 1, 4, 7, 8, 10], required: [0, 1, 4, 8, 10],
    labels: { 0: 'R', 1: 'b9', 4: '3', 7: '5', 8: 'b13', 10: 'b7' }, weight: 40 },

  { symbol: '7#9b13', fullName: 'Dominant 7th Sharp 9 Flat 13',
    intervals: [0, 3, 4, 7, 8, 10], required: [0, 3, 4, 8, 10],
    labels: { 0: 'R', 3: '#9', 4: '3', 7: '5', 8: 'b13', 10: 'b7' }, weight: 40 },
];


// precompute bitmasks so matching is just bitwise AND, no loops
for (const t of TEMPLATES) {
  t._ivBits = 0;
  for (const iv of t.intervals) t._ivBits |= 1 << iv;
  t._reqBits = 0;
  for (const iv of t.required) t._reqBits |= 1 << iv;
  t._size = t.intervals.length;
  t._sorted = [...t.intervals].sort((a, b) => a - b);
  t._weightScore = Math.round(t.weight / 10);
  // big chords lose less points for dropped tones
  t._omitPenalty = t._size >= 6 ? 1 : t._size >= 5 ? 2 : 3;
}

export { TEMPLATES };
