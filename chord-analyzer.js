import { parseNote, parsePitch, noteToMidi, midiToNote, mod12, popcount, spellChordNote, parseInterval } from './notes.js';
import { normalizeSymbol, parseChordSymbol } from './symbols.js';
import { TEMPLATES } from './templates.js';
import { compileTemplate } from './template-utils.js';
import { parseKey, contextName, analyzeHarmony } from './harmony.js';
import { objectOptions, integer, boolean, choice } from './options.js';
import { createVoicings } from './voicings.js';

const DEFAULTS = Object.freeze({
  useFlats: false,
  maxResults: 10,
  order: 'pitch',
  ranking: 'balanced',
  allowRootless: false,
  allowIncomplete: false,
  maxExtraNotes: 0,
  rootHint: null,
  key: null,
  ambiguityThreshold: 6,
});
const DETECT_OPTIONS = Object.keys(DEFAULTS);
const BUILDER_OPTIONS = ['useFlats', 'order', 'spelling'];
const rotate = (bits, root) => ((bits >>> root) | (bits << (12 - root))) & 4095;

function detectionOptions(options, defaults) {
  objectOptions(options, DETECT_OPTIONS);
  const validated = { ...defaults, ...Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined)) };
  boolean(validated.useFlats, 'useFlats');
  integer(validated.maxResults, 'maxResults', 0);
  integer(validated.maxExtraNotes, 'maxExtraNotes', 0, 2);
  integer(validated.ambiguityThreshold, 'ambiguityThreshold', 0, 100);
  boolean(validated.allowRootless, 'allowRootless');
  boolean(validated.allowIncomplete, 'allowIncomplete');
  choice(validated.order, 'order', ['pitch', 'degree']);
  choice(validated.ranking, 'ranking', ['balanced', 'bass', 'simple']);
  if (validated.rootHint !== null && !parseNote(validated.rootHint)) throw new RangeError('rootHint must be a note name or null');
  validated.hint = validated.rootHint === null ? null : parseNote(validated.rootHint);
  validated.context = validated.key === null ? null : parseKey(validated.key);
  return validated;
}

function builderOptions(options, defaults) {
  objectOptions(options, BUILDER_OPTIONS);
  return {
    useFlats: boolean(options.useFlats === undefined ? defaults.useFlats : options.useFlats, 'useFlats'),
    order: choice(options.order === undefined ? defaults.order : options.order, 'order', ['pitch', 'degree']),
    spelling: choice(options.spelling === undefined ? 'preserve' : options.spelling, 'spelling', ['preserve', 'simplify']),
  };
}

function inputMidi(values, format) {
  if (!Array.isArray(values)) throw new TypeError('Notes must be an array');
  const midi = Array.from(values, value => {
    if (format === 'notes') {
      const note = parsePitch(value);
      if (!note) throw new RangeError(`Invalid note with octave: ${String(value)}`);
      return note.midi;
    }
    integer(value, format === 'keys' ? 'Piano key' : 'MIDI note', format === 'keys' ? 1 : 0, format === 'keys' ? 88 : 127);
    return format === 'keys' ? value + 20 : value;
  });
  return [...new Set(midi)].sort((a, b) => a - b);
}

function noteRecords(root, template, order) {
  return (order === 'degree' ? template._degreeSorted : template._sorted).map(iv => ({
    name: spellChordNote(root, template.labels[iv]), pitchClass: mod12(root.pitch + iv), interval: template.labels[iv],
  }));
}

function inversionInfo(label, slash) {
  if (slash) return { inversion: -1, inversionName: 'Slash', bassDegree: null };
  if (label === 'R') return { inversion: 0, inversionName: 'Root Position', bassDegree: 'R' };
  const degree = parseInterval(label)?.degree;
  const index = degree === 3 ? 1 : degree === 5 ? 2 : degree === 7 ? 3 : 4;
  const text = degree === 3 ? '1st Inversion' : degree === 5 ? '2nd Inversion' : degree === 7 ? '3rd Inversion' : `${label} in bass`;
  return { inversion: index, inversionName: text, bassDegree: label };
}

function match(bits, template, options, slash) {
  const extraBits = bits & ~template._ivBits;
  const extraCount = popcount(extraBits);
  if (extraCount > options.maxExtraNotes || (slash && extraCount > 0)) return null;
  const rootMissing = !(bits & 1);
  let required = template._reqBits;
  if (rootMissing) {
    const hasThird = [3, 4].some(iv => template.labels[iv]?.endsWith('3') && (bits & (1 << iv)));
    const hasSeventh = [9, 10, 11].some(iv =>
      ['7', 'b7', 'bb7'].includes(template.labels[iv]) && (bits & (1 << iv)));
    if (slash || !options.allowRootless || !hasThird || !hasSeventh) return null;
    required &= ~1;
  }
  const missingRequired = required & ~bits;
  let incomplete = false;
  if (missingRequired) {
    const isMajorOrMinorTriad = ['', 'm'].includes(template.symbol);
    const missingOnlyFifth = missingRequired === (1 << 7);
    if (!options.allowIncomplete || rootMissing || !isMajorOrMinorTriad || !missingOnlyFifth) return null;
    incomplete = true;
  }
  const matchedCount = popcount(bits & template._ivBits);
  if (matchedCount < (rootMissing || extraCount ? 3 : 2)) return null;
  const omittedBits = template._ivBits & ~bits;
  return { omittedBits, omittedCount: popcount(omittedBits), matchedCount,
    exact: omittedBits === 0 && extraCount === 0, rootMissing, incomplete, extraBits, extraCount };
}

function scoreMatch(root, bass, template, match, slash, options) {
  const bassIv = mod12(bass - root);
  const label = template.labels[bassIv] ?? null;
  const inv = inversionInfo(label, slash || label === null);
  const rootBass = options.ranking === 'bass' ? 40 : options.ranking === 'simple' ? 10 : 24;
  const exactBonus = options.ranking === 'bass' ? 25 : options.ranking === 'simple' ? 50 : 40;
  const context = options.context ? -template.intervals.filter(iv => !options.context.pitchClasses.includes(mod12(root + iv))).length * 2 : 0;
  const breakdown = {
    bass: slash ? 2 : bassIv === 0 ? rootBass : options.ranking === 'simple' ? 10 : [0, 18, 12, 8, 5][inv.inversion] ?? 0,
    completeness: match.exact ? exactBonus : 15,
    commonness: 10 + template._weightScore,
    omissions: -match.omittedCount * template._omitPenalty,
    rootHint: options.hint?.pitch === root ? 60 : 0,
    context, rootless: match.rootMissing ? -18 : 0,
    incomplete: match.incomplete ? -12 : 0,
    extraNotes: -match.extraCount * 28, slash: slash ? -20 : 0,
    complexity: options.ranking === 'simple' ? -template._size : 0,
  };
  return { score: Object.values(breakdown).reduce((sum, value) => sum + value, 0), breakdown };
}

function describe(result) {
  if (result.kind === 'note') return `Single note ${result.playedNotes[0].fullName}.`;
  if (result.kind === 'octaves') return `${result.root} played in ${result.playedNotes.length} octaves.`;
  const parts = [`${result.name}: ${result.matchedIntervals.join(', ')} present`];
  if (result.omittedNotes.length) parts.push(`${result.omittedNotes.map(n => n.interval).join(', ')} omitted`);
  if (result.rootMissing) parts.push('root inferred, not played');
  if (result.incomplete) parts.push('possible incomplete triad');
  if (result.extraNotes.length) parts.push(`${result.extraNotes.map(n => n.fullName).join(', ')} outside this chord`);
  if (result.bassDegree && result.bassDegree !== 'R') parts.push(`${result.bassDegree} in bass`);
  if (result.inversion === -1) parts.push(`non-chord bass ${result.bass}`);
  if (result.ambiguous) parts.push('another interpretation scores similarly');
  return parts.join('; ') + '.';
}

function intervalAnalysis(played) {
  if (played.length !== 2) return null;
  const semitones = played[1].midi - played[0].midi;
  const names = ['Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th',
    'Tritone', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th'];
  const simpleSemitones = semitones % 12;
  const octaves = Math.floor(semitones / 12);
  const name = semitones === 12 ? 'Octave' : simpleSemitones === 0 && octaves > 0 ? `${octaves} octaves` :
    names[simpleSemitones] + (octaves ? ` + ${octaves} octave${octaves === 1 ? '' : 's'}` : '');
  return { name, semitones, simpleSemitones, octaves, lower: { ...played[0] }, upper: { ...played[1] } };
}

export class ChordAnalyzer {
  #defaults;
  #templates = [...TEMPLATES];
  #bySymbol = new Map(TEMPLATES.map(t => [t.symbol, t]));
  #cache = new Map();
  #cacheSize;
  #hits = 0;
  #misses = 0;

  constructor(options = {}) {
    objectOptions(options, [...DETECT_OPTIONS, 'cacheSize', 'templates']);
    const { cacheSize = 256, templates = [], ...defaults } = options;
    this.#cacheSize = integer(cacheSize, 'cacheSize', 0, 4096);
    detectionOptions(defaults, DEFAULTS);
    this.#defaults = { ...DEFAULTS, ...Object.fromEntries(Object.entries(defaults).filter(([, value]) => value !== undefined)) };
    if (!Array.isArray(templates)) throw new TypeError('templates must be an array');
    for (const template of templates) this.registerTemplate(template);
  }

  get useFlats() { return this.#defaults.useFlats; }
  set useFlats(value) { this.#defaults.useFlats = boolean(value, 'useFlats'); }
  get maxResults() { return this.#defaults.maxResults; }
  set maxResults(value) { this.#defaults.maxResults = integer(value, 'maxResults', 0); }
  get templates() { return Object.freeze([...this.#templates]); }

  registerTemplate(definition) {
    const template = compileTemplate(definition);
    if (normalizeSymbol(template.symbol) !== template.symbol || /(?:no|omit)[35]$/.test(template.symbol) || this.#bySymbol.has(template.symbol) ||
        parseChordSymbol('C' + template.symbol)?.symbol !== template.symbol) throw new RangeError('Custom symbol must be unique, canonical, and unambiguous');
    this.#templates.push(template);
    this.#bySymbol.set(template.symbol, template);
    this.clearCache();
    return this;
  }

  clearCache() { this.#cache.clear(); this.#hits = 0; this.#misses = 0; }
  getCacheStats() { return { size: this.#cache.size, capacity: this.#cacheSize, hits: this.#hits, misses: this.#misses }; }

  detect(keys, options = {}) { return this.#detect(inputMidi(keys, 'keys'), detectionOptions(options, this.#defaults)); }
  detectMidi(notes, options = {}) { return this.#detect(inputMidi(notes, 'midi'), detectionOptions(options, this.#defaults)); }
  detectNotes(notes, options = {}) { return this.#detect(inputMidi(notes, 'notes'), detectionOptions(options, this.#defaults)); }
  analyze(keys, options = {}) { return this.#analyze(inputMidi(keys, 'keys'), detectionOptions(options, this.#defaults)); }
  analyzeMidi(notes, options = {}) { return this.#analyze(inputMidi(notes, 'midi'), detectionOptions(options, this.#defaults)); }
  analyzeNotes(notes, options = {}) { return this.#analyze(inputMidi(notes, 'notes'), detectionOptions(options, this.#defaults)); }

  #analyze(midi, options) {
    const all = this.#detect(midi, { ...options, maxResults: Math.max(options.maxResults, 2) });
    const playedNotes = midi.map(n => midiToNote(n, options.useFlats));
    const interval = intervalAnalysis(playedNotes);
    const best = all[0];
    let status = 'unknown';
    if (!midi.length) status = 'empty';
    else if (best?.kind === 'note') status = 'single-note';
    else if (best?.kind === 'octaves') status = 'octaves';
    else if (best) status = 'chord';
    else if (interval) status = 'interval';
    return { status, results: all.slice(0, options.maxResults), playedNotes, interval,
      ambiguous: best?.ambiguous ?? false, scoreGap: all.length > 1 ? all[0].score - all[1].score : null,
      explanation: best?.explanation ?? (interval ? `${interval.name}; no supported chord matches.` :
        midi.length ? 'No supported chord matches these notes.' : 'No notes are sounding.') };
  }

  #detect(midi, options) {
    if (!midi.length || options.maxResults === 0) return [];
    const pitchClasses = [...new Set(midi.map(n => n % 12))];
    const bass = pitchClasses[0];
    if (pitchClasses.length === 1) {
      const played = midi.map(n => midiToNote(n, options.useFlats));
      const root = played[0].name;
      const result = { kind: played.length === 1 ? 'note' : 'octaves', name: played.length === 1 ? played[0].fullName : root + ' octaves',
        fullName: played.length === 1 ? 'Single Note: ' + played[0].fullName : root + ' in multiple octaves', symbol: '',
        root, rootPitchClass: bass, bass: root, bassPitchClass: bass, bassKey: played[0].key,
        inversion: 0, inversionName: 'N/A', bassDegree: 'R', slash: null,
        notes: [root], chordNotes: [{ name: root, pitchClass: bass, interval: 'R' }],
        playedNotes: played.map(n => ({ ...n, interval: 'R' })), matchedNotes: played.map(n => ({ ...n, interval: 'R' })),
        intervals: ['R'], matchedIntervals: ['R'], omittedNotes: [], extraNotes: [], inputNotes: played.map(n => n.fullName),
        omittedCount: 0, matchedCount: 1, exact: true, rootMissing: false, incomplete: false,
        score: 0, scoreBreakdown: {}, weight: 0, rank: 1, ambiguous: false, scoreGap: 0 };
      result.explanation = describe(result);
      return [result];
    }
    const mask = pitchClasses.reduce((bits, pc) => bits | (1 << pc), 0);
    const cacheKey = [mask, bass, options.ranking, options.allowRootless, options.allowIncomplete, options.maxExtraNotes,
      options.hint?.pitch ?? '', options.context?.name ?? ''].join('|');
    let candidates = this.#cache.get(cacheKey);
    if (candidates) {
      this.#hits++;
      this.#cache.delete(cacheKey);
      this.#cache.set(cacheKey, candidates);
    } else {
      this.#misses++;
      const unique = new Map();
      const roots = options.allowRootless ? Array.from({ length: 12 }, (_, i) => i) : pitchClasses;
      for (const slash of [false, true]) {
        if (slash && pitchClasses.length <= 2) continue;
        const inputMask = slash ? mask & ~(1 << bass) : mask;
        for (const root of roots) {
          if (slash && !(inputMask & (1 << root))) continue;
          const bits = rotate(inputMask, root);
          for (const template of this.#templates) {
            // A separate slash bass must not be a chord tone of this template.
            if (slash && (template._ivBits & (1 << mod12(bass - root)))) continue;
            const matchedChord = match(bits, template, options, slash);
            if (!matchedChord) continue;
            const scored = scoreMatch(root, bass, template, matchedChord, slash, options);
            const candidate = { root, template, match: matchedChord, slash, ...scored };
            const id = root + '|' + template.symbol;
            if (!unique.has(id) || unique.get(id).score < candidate.score) unique.set(id, candidate);
          }
        }
      }
      candidates = [...unique.values()].sort((a, b) => b.score - a.score || b.template.weight - a.template.weight ||
        a.template._size - b.template._size || mod12(a.root - bass) - mod12(b.root - bass) || a.template.symbol.localeCompare(b.template.symbol));
      if (this.#cacheSize) {
        if (this.#cache.size >= this.#cacheSize) this.#cache.delete(this.#cache.keys().next().value);
        this.#cache.set(cacheKey, candidates);
      }
    }
    if (!candidates.length) return [];
    const played = midi.map(n => midiToNote(n, options.useFlats));
    const ambiguous = candidates.length > 1 && candidates[0].score - candidates[1].score <= options.ambiguityThreshold;
    return candidates.slice(0, options.maxResults).map((candidate, index) => {
      const { template, match: matchedChord } = candidate;
      const rootName = options.hint?.pitch === candidate.root
        ? options.hint.name
        : contextName(candidate.root, options.context, options.useFlats);
      const root = parseNote(rootName);
      const chordNotes = noteRecords(root, template, options.order);
      const tonesByPitchClass = new Map(chordNotes.map(n => [n.pitchClass, n]));
      const bassNote = tonesByPitchClass.get(bass);
      const bassName = bassNote?.name ?? contextName(bass, options.context, options.useFlats);
      const inversion = inversionInfo(bassNote?.interval ?? null, candidate.slash || !bassNote);
      const omittedNotes = chordNotes.filter(n => matchedChord.omittedBits & (1 << mod12(n.pitchClass - candidate.root)));
      const matchedChordNotes = chordNotes.filter(n => !(matchedChord.omittedBits & (1 << mod12(n.pitchClass - candidate.root))));
      const playedNotes = played.map(note => {
        const tone = tonesByPitchClass.get(note.pitchClass);
        const spelling = tone?.name ?? contextName(note.pitchClass, options.context, options.useFlats);
        return { ...midiToNote(note.midi, options.useFlats, spelling), interval: tone?.interval ?? null };
      });
      const extraNotes = playedNotes.filter(n => matchedChord.extraBits & (1 << mod12(n.pitchClass - candidate.root)));
      const suffix = template.symbol + (matchedChord.incomplete ? '(no5)' : '');
      const slashName = bass !== candidate.root ? root.name + suffix + '/' + bassName : null;
      const scoreGap = candidates[0].score - candidate.score;
      const result = {
        kind: 'chord',
        name: slashName ?? root.name + suffix,
        fullName: root.name + ' ' + template.fullName,
        symbol: template.symbol,
        root: root.name,
        rootPitchClass: candidate.root,
        bass: bassName,
        bassPitchClass: bass,
        bassKey: played[0].key,
        ...inversion,
        slash: slashName,
        notes: chordNotes.map(note => note.name),
        chordNotes,
        playedNotes,
        matchedNotes: playedNotes.filter(note => note.interval !== null),
        intervals: chordNotes.map(note => note.interval),
        matchedIntervals: matchedChordNotes.map(note => note.interval),
        omittedNotes,
        extraNotes,
        inputNotes: played.map(note => note.fullName),
        omittedCount: matchedChord.omittedCount,
        matchedCount: matchedChord.matchedCount,
        exact: matchedChord.exact,
        rootMissing: matchedChord.rootMissing,
        incomplete: matchedChord.incomplete,
        score: candidate.score,
        scoreBreakdown: { ...candidate.breakdown },
        weight: template.weight,
        rank: index + 1,
        ambiguous: ambiguous && scoreGap <= options.ambiguityThreshold,
        scoreGap,
      };
      result.explanation = describe(result);
      return result;
    });
  }

  keyToNote(key, options = {}) {
    objectOptions(options, ['useFlats']);
    integer(key, 'Piano key', 1, 88);
    return midiToNote(key + 20, options.useFlats === undefined ? this.useFlats : options.useFlats);
  }
  midiToNote(midi, options = {}) {
    objectOptions(options, ['useFlats']);
    return midiToNote(midi, options.useFlats === undefined ? this.useFlats : options.useFlats);
  }
  noteToMidi(name, octave) { return noteToMidi(name, octave); }
  noteToKey(name, octave) {
    const midi = noteToMidi(name, octave);
    return midi !== null && midi >= 21 && midi <= 108 ? midi - 20 : null;
  }

  getChordNotes(root, type = '', options = {}) {
    const { useFlats, order, spelling } = builderOptions(options, this.#defaults);
    let parsed = parseNote(root);
    if (!parsed) return null;
    if (typeof type !== 'string') return null;
    let symbol = normalizeSymbol(type);
    const omissions = symbol.match(/^(.*?)(?:\(?((?:no|omit)[35])\)?)$/);
    let omitDegree = null;
    if (omissions) {
      symbol = normalizeSymbol(omissions[1]);
      omitDegree = Number(omissions[2].at(-1));
    }
    const template = this.#bySymbol.get(symbol);
    if (!template) return null;
    if (spelling === 'simplify') parsed = parseNote(contextName(parsed.pitch, null, useFlats));
    const allNotes = noteRecords(parsed, template, order);
    const omittedNotes = allNotes.filter(n => parseInterval(n.interval).degree === omitDegree);
    if (omitDegree !== null && !omittedNotes.length) return null;
    const notes = allNotes.filter(n => parseInterval(n.interval).degree !== omitDegree);
    const canonical = template.symbol + (omitDegree === null ? '' : `(no${omitDegree})`);
    return { root: parsed.name, rootPitchClass: parsed.pitch, symbol: canonical,
      name: parsed.name + canonical, fullName: parsed.name + ' ' + template.fullName,
      notes, chordNotes: notes.map(n => ({ ...n })), omittedNotes,
      requiredIntervals: template.required.filter(iv => parseInterval(template.labels[iv]).degree !== omitDegree).map(iv => template.labels[iv]),
      bass: parsed.name, bassPitchClass: parsed.pitch, ...inversionInfo('R', false) };
  }

  parseChord(value, options = {}) {
    options = builderOptions(options, this.#defaults);
    const parsed = parseChordSymbol(value);
    if (!parsed) return null;
    const chord = this.getChordNotes(parsed.root, parsed.symbol, options);
    if (!chord) return null;
    if (parsed.bass !== null) {
      const bassNote = chord.chordNotes.find(n => n.pitchClass === parsed.bassPitchClass);
      chord.bass = options.spelling === 'simplify'
        ? bassNote?.name ?? contextName(parsed.bassPitchClass, null, options.useFlats)
        : parsed.bass;
      chord.bassPitchClass = parsed.bassPitchClass;
      Object.assign(chord, inversionInfo(bassNote?.interval ?? null, !bassNote));
      chord.name += '/' + chord.bass;
    }
    return chord;
  }

  getChordTypes() {
    return this.#templates.map(t => ({ symbol: t.symbol, displaySymbol: t.symbol || '(major)', fullName: t.fullName,
      category: t.category, intervalCount: t.intervals.length, intervals: t._degreeSorted.map(iv => t.labels[iv]),
      requiredIntervals: t.required.map(iv => t.labels[iv]) }));
  }

  generateVoicings(chordName, options = {}) {
    const chord = this.parseChord(chordName, { order: 'degree' });
    if (!chord) throw new RangeError(`Unsupported chord: ${String(chordName)}`);
    return createVoicings(chord, options);
  }

  analyzeProgression(chords, options = {}) {
    if (!Array.isArray(chords)) throw new TypeError('Progression must be an array');
    const parsed = Array.from(chords, (c, index) => {
      const name = typeof c === 'string' ? c : c?.kind === 'chord' ? c.name : null;
      const chord = name === null ? null : this.parseChord(name);
      if (!chord) throw new RangeError(`Unsupported chord at progression index ${index}`);
      return chord;
    });
    return analyzeHarmony(parsed, options);
  }
}

export { TEMPLATES as CHORD_TEMPLATES };
export default ChordAnalyzer;
