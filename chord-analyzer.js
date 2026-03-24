import { parseNote, rootName, rootLetterIndex, noteNames, spellNote, popcount } from './notes.js';
import { normalizeSymbol } from './symbols.js';
import { TEMPLATES } from './templates.js';

const MIDI_OFFSET = 20;

class ChordAnalyzer {

  constructor({ useFlats = false, maxResults = 10 } = {}) {
    this.useFlats = useFlats;
    this.maxResults = maxResults;
  }


  detect(keyNumbers, opts = {}) {
    const flat = opts.useFlats ?? this.useFlats;
    const limit = opts.maxResults ?? this.maxResults;

    if (!Array.isArray(keyNumbers) || keyNumbers.length === 0) return [];

    for (const k of keyNumbers) {
      if (!Number.isInteger(k) || k < 1 || k > 88) {
        throw new RangeError(`Key must be 1–88, got ${k}`);
      }
    }

    const notes = keyNumbers.map(k => keyToMidi(k)).sort((a, b) => a.midi - b.midi);

    if (notes.length === 1) return [singleNote(notes[0], flat)];

    const pcs = [...new Set(notes.map(n => n.pc))];
    const bassPC = notes[0].pc;
    const bassKey = notes[0].key;
    const candidates = [];

    for (const root of pcs) {
      let bits = 0;
      for (const pc of pcs) bits |= 1 << ((pc - root + 12) % 12);

      for (const t of TEMPLATES) {
        const m = matchChord(bits, pcs.length, t);
        if (m) candidates.push(buildResult(root, bassPC, bassKey, t, m, false, flat, notes));
      }
    }

    // slash chords: bass isn't part of the upper chord
    if (pcs.length > 2) {
      const upper = pcs.filter(pc => pc !== bassPC);
      if (upper.length < pcs.length) {
        for (const root of upper) {
          let bits = 0;
          for (const pc of upper) bits |= 1 << ((pc - root + 12) % 12);

          for (const t of TEMPLATES) {
            const m = matchChord(bits, upper.length, t);
            if (m) candidates.push(buildResult(root, bassPC, bassKey, t, m, true, flat, notes));
          }
        }
      }
    }

    const seen = new Set();
    const unique = [];
    for (const c of candidates) {
      const id = c.root + c.symbol + '/' + c.bass;
      if (!seen.has(id)) { seen.add(id); unique.push(c); }
    }

    unique.sort((a, b) => b.score - a.score || b.weight - a.weight);
    return unique.slice(0, limit);
  }


  keyToNote(keyNumber, opts = {}) {
    if (!Number.isInteger(keyNumber) || keyNumber < 1 || keyNumber > 88) {
      throw new RangeError(`Key must be 1–88, got ${keyNumber}`);
    }
    const flat = opts.useFlats ?? this.useFlats;
    const { key, midi, pc, octave } = keyToMidi(keyNumber);
    const names = noteNames(flat);
    return { key, midi, name: names[pc], octave, fullName: names[pc] + octave, pitchClass: pc };
  }


  noteToKey(name, octave) {
    const parsed = parseNote(name);
    if (!parsed) return null;
    const key = (octave + 1) * 12 + parsed.pitch - MIDI_OFFSET;
    return (key >= 1 && key <= 88) ? key : null;
  }


  getChordNotes(root, type, opts = {}) {
    const flat = opts.useFlats ?? this.useFlats;
    const parsed = parseNote(root);
    if (!parsed) return null;

    const sym = normalizeSymbol(type);
    const tpl = TEMPLATES.find(t => t.symbol === sym);
    if (!tpl) return null;

    const notes = tpl.intervals.map(iv => {
      const pc = (parsed.pitch + iv) % 12;
      const label = tpl.labels[iv];
      return { name: spellNote(parsed.letterIndex, pc, label), pitchClass: pc, interval: label };
    });

    return {
      root: parsed.name,
      symbol: tpl.symbol,
      name: parsed.name + tpl.symbol,
      fullName: parsed.name + ' ' + tpl.fullName,
      notes,
    };
  }


  getChordTypes() {
    return TEMPLATES.map(t => ({
      symbol: t.symbol || '(major)',
      fullName: t.fullName,
      intervalCount: t.intervals.length,
    }));
  }
}


function keyToMidi(k) {
  const midi = k + MIDI_OFFSET;
  return { key: k, midi, pc: midi % 12, octave: Math.floor(midi / 12) - 1 };
}



function matchChord(inputBits, inputSize, tpl) {
  if (inputBits & ~tpl._ivBits) return null;
  if ((tpl._reqBits & inputBits) !== tpl._reqBits) return null;

  const missed = tpl._ivBits & ~inputBits;
  const missCount = popcount(missed);
  if (tpl._size - missCount < 2) return null;

  return {
    omitted: missCount > 0 ? tpl.intervals.filter(iv => !(inputBits & (1 << iv))) : [],
    omittedCount: missCount,
    matchedCount: tpl._size - missCount,
    exact: missCount === 0 && inputSize === tpl._size,
  };
}


function buildResult(root, bassPC, bassKey, tpl, match, slash, flat, inputNotes) {
  const rName = rootName(root, flat);
  const rLetterIdx = rootLetterIndex(root, flat);
  const names = noteNames(flat);
  const bassName = names[bassPC];
  const bassIv = (bassPC - root + 12) % 12;
  const bassLabel = tpl.labels[bassIv] ?? null;

  let inv = 0, invName = 'Root Position';
  if (slash) {
    inv = -1; invName = 'Slash';
  } else if (bassIv !== 0) {
    if (bassLabel === '3' || bassLabel === 'b3')                            { inv = 1; invName = '1st Inversion'; }
    else if (bassLabel === '5' || bassLabel === 'b5' || bassLabel === '#5') { inv = 2; invName = '2nd Inversion'; }
    else if (bassLabel === '7' || bassLabel === 'b7' || bassLabel === 'bb7'){ inv = 3; invName = '3rd Inversion'; }
    else                                                                    { inv = 4; invName = 'Other Inversion'; }
  }

  let score = slash ? 2 : bassIv === 0 ? 40 : [0, 18, 12, 8, 5][inv] ?? 5;
  score += match.exact ? 25 : 15 - match.omittedCount * tpl._omitPenalty;
  score += 10 + tpl._weightScore;
  if (slash) score -= 20;

  const chordNotes = [];
  const intervals = [];
  for (const iv of tpl._sorted) {
    const label = tpl.labels[iv];
    chordNotes.push(spellNote(rLetterIdx, (root + iv) % 12, label));
    intervals.push(label);
  }

  const omittedNotes = match.omitted.map(iv => ({
    name: spellNote(rLetterIdx, (root + iv) % 12, tpl.labels[iv]),
    interval: tpl.labels[iv],
  }));

  const inputNoteNames = inputNotes.map(n => names[n.pc] + n.octave);
  const slashName = (slash || bassIv !== 0) ? rName + tpl.symbol + '/' + bassName : null;
  const displayName = (slashName && bassIv !== 0) ? slashName : rName + tpl.symbol;

  return {
    name: displayName,
    fullName: rName + ' ' + tpl.fullName,
    symbol: tpl.symbol,
    root: rName,
    rootPitchClass: root,
    bass: bassName,
    bassPitchClass: bassPC,
    bassKey,
    inversion: inv,
    inversionName: invName,
    slash: slashName,
    notes: chordNotes,
    intervals,
    omittedNotes,
    inputNotes: inputNoteNames,
    score,
    weight: tpl.weight,
  };
}


function singleNote(n, flat) {
  const names = noteNames(flat);
  const name = names[n.pc];
  return {
    name: name + n.octave,
    fullName: 'Single Note: ' + name + n.octave,
    symbol: '',
    root: name,
    rootPitchClass: n.pc,
    bass: name,
    bassPitchClass: n.pc,
    bassKey: n.key,
    inversion: 0,
    inversionName: 'N/A',
    slash: null,
    notes: [name],
    intervals: ['R'],
    omittedNotes: [],
    inputNotes: [name + n.octave],
    score: 0,
    weight: 0,
  };
}


export { ChordAnalyzer, TEMPLATES as CHORD_TEMPLATES };
export default ChordAnalyzer;
