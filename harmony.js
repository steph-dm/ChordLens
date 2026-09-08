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

function degreeInfo(name, key) {
  const root = parseNote(name);
  const tonic = parseNote(key.tonic);
  const index = (root.letterIndex - tonic.letterIndex + 7) % 7;
  const scale = key.mode === 'minor' ? MINOR : MAJOR;
  let alteration = mod12(root.pitch - tonic.pitch - scale[index]);
  if (alteration > 6) alteration -= 12;
  return { degree: index + 1, alteration };
}

function quality(chord) {
  const intervals = chord.chordNotes.map(n => n.interval);
  if (intervals.includes('b3') && intervals.includes('b5')) return intervals.includes('b7') ? 'half-diminished' : 'diminished';
  if (intervals.includes('b3')) return 'minor';
  if (intervals.includes('#5')) return 'augmented';
  if (intervals.includes('3')) return 'major';
  return intervals.some(iv => iv === '2' || iv === '4') ? 'suspended' : 'other';
}

function roman(chord, key) {
  const { degree, alteration } = degreeInfo(chord.root, key);
  const chordQuality = quality(chord);
  let stem = ROMANS[degree - 1];
  if (['minor', 'diminished', 'half-diminished'].includes(chordQuality)) stem = stem.toLowerCase();
  if (chordQuality === 'diminished') stem += '°';
  if (chordQuality === 'half-diminished') stem += 'ø';
  if (chordQuality === 'augmented') stem += '+';
  // In minor, raised leading-tone diminished chords conventionally use vii°.
  const conventionalLeadingTone = key.mode === 'minor' && degree === 7 && alteration === 1 && chordQuality === 'diminished';
  const prefix = conventionalLeadingTone ? '' : alteration < 0 ? 'b'.repeat(-alteration) : '#'.repeat(alteration);
  let suffix = chord.symbol.replace(/^m(?!aj)|^dim|^aug/, '');
  if (chordQuality === 'half-diminished') suffix = suffix.replace('b5', '');
  const diatonic = chord.chordNotes.every(n => key.pitchClasses.includes(n.pitchClass));
  const minorHarmonic = new Set([...key.pitchClasses, mod12(parseNote(key.tonic).pitch + 11)]);
  const harmonicCompatible = key.mode === 'minor' && chord.chordNotes.every(n => minorHarmonic.has(n.pitchClass));
  let harmonicFunction = 'other';
  if (diatonic || harmonicCompatible) {
    if ([1, 3, 6].includes(degree)) harmonicFunction = 'tonic';
    if ([2, 4].includes(degree)) harmonicFunction = 'predominant';
    if ([5, 7].includes(degree)) harmonicFunction = 'dominant';
  }
  return { name: chord.name, root: chord.root, degree, alteration, quality: chordQuality,
    romanNumeral: prefix + stem + suffix, diatonic, harmonicCompatible, function: harmonicFunction,
    inversion: chord.inversion, bassDegree: chord.bass ? degreeInfo(chord.bass, key).degree : degree,
    secondaryDominantOf: null };
}

export function analyzeHarmony(chords, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Progression options must be an object');
  for (const key of Object.keys(options)) if (!['key', 'useFlats'].includes(key)) throw new TypeError(`Unknown progression option: ${key}`);
  if (options.useFlats !== undefined && typeof options.useFlats !== 'boolean') throw new TypeError('useFlats must be a boolean');
  if (!chords.length && options.key === undefined) throw new RangeError('An empty progression needs an explicit key');
  const candidates = [];
  for (let pitchClass = 0; pitchClass < 12; pitchClass++) {
    for (const mode of ['major', 'minor']) {
      const key = parseKey(`${rootName(pitchClass, options.useFlats ?? true)} ${mode}`);
      let score = 0;
      for (const chord of chords) {
        for (const note of chord.chordNotes) {
          score += key.pitchClasses.includes(note.pitchClass) ? 2 : -4;
        }
        if (chord.rootPitchClass === pitchClass && quality(chord) === mode) score += 4;
      }
      const last = chords.at(-1);
      if (last?.rootPitchClass === pitchClass && quality(last) === mode) score += 8;
      candidates.push({ ...key, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const key = options.key === undefined ? parseKey(candidates[0].name) : parseKey(options.key);
  const entries = chords.map(chord => roman(chord, key));
  for (let i = 0; i < chords.length - 1; i++) {
    const chord = chords[i];
    const next = chords[i + 1];
    const isDominant = chord.chordNotes.some(n => n.interval === '3') && !chord.chordNotes.some(n => n.interval === '7');
    if (isDominant && mod12(chord.rootPitchClass - next.rootPitchClass) === 7 &&
        next.rootPitchClass !== parseNote(key.tonic).pitch && ['major', 'minor'].includes(quality(next))) {
      const target = roman({ ...next, symbol: quality(next) === 'minor' ? 'm' : '' }, key).romanNumeral;
      entries[i].secondaryDominantOf = target;
      entries[i].romanNumeral = 'V' + chord.symbol + '/' + target;
      entries[i].function = 'secondary-dominant';
    }
  }
  const patterns = [];
  for (let i = 0; i < entries.length - 2; i++) {
    const slice = entries.slice(i, i + 3);
    const hasDegrees = slice.map(chord => chord.degree).join() === '2,5,1'
      && slice.every(chord => chord.alteration === 0);
    const hasQualities = ['minor', 'half-diminished', 'diminished'].includes(slice[0].quality)
      && slice[1].quality === 'major'
      && ['major', 'minor'].includes(slice[2].quality);
    if (hasDegrees && hasQualities) {
      patterns.push({ name: key.mode === 'minor' ? 'ii–V–i' : 'ii–V–I', start: i, end: i + 2 });
    }
  }
  return { key: { ...key, source: options.key === undefined ? 'estimated' : 'provided' },
    keyCandidates: candidates.slice(0, 5), chords: entries, patterns,
    explanation: `${entries.map(chord => chord.romanNumeral).join(' – ')} in ${key.name}.` +
      (options.key === undefined ? ' Key estimated from chord tones and ending; other interpretations may fit.' : '') };
}
