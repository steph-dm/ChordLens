import { normalizeAccidentals, parseNote } from './notes.js';

const ALIASES = new Map([
  ['', ''], ['maj', ''], ['major', ''], ['(major)', ''],
  ['m', 'm'], ['min', 'm'], ['minor', 'm'],
  ['sus', 'sus4'], ['7sus', '7sus4'], ['9sus', '9sus4'], ['13sus', '13sus4'],
  ['dim', 'dim'], ['o', 'dim'], ['diminished', 'dim'],
  ['dim7', 'dim7'], ['o7', 'dim7'], ['diminished7', 'dim7'],
  ['aug', 'aug'], ['+', 'aug'], ['augmented', 'aug'],
  ['aug7', 'aug7'], ['+7', 'aug7'], ['augmented7', 'aug7'], ['7#5', 'aug7'],
  ['augmaj7', 'augMaj7'], ['augmajor7', 'augMaj7'], ['+maj7', 'augMaj7'], ['maj7#5', 'augMaj7'],
  ['aug9', '9#5'], ['augmaj9', 'maj9#5'],
  ['augmentedmaj7', 'augMaj7'], ['augmentedmajor7', 'augMaj7'], ['+major7', 'augMaj7'],
  ['half-diminished', 'm7b5'], ['halfdiminished', 'm7b5'],
  ['half-diminished7', 'm7b5'], ['halfdiminished7', 'm7b5'], ['ø', 'm7b5'], ['ø7', 'm7b5'],
  ['69', '6/9'], ['m69', 'm6/9'], ['add2', 'add9'], ['madd2', 'madd9'],
  ['add4', 'add11'], ['madd4', 'madd11'],
]);

export function normalizeSymbol(raw = '') {
  if (typeof raw !== 'string') throw new TypeError('Chord symbol must be a string');
  let sym = normalizeAccidentals(raw, false).replace(/[Δ△]/g, 'maj').replace(/Ø/g, 'ø')
    .replace(/°/g, 'o').replace(/−/g, '-');
  if (sym === '(major)') return '';
  // Parentheses group alterations; reject unmatched/nested or empty groups.
  if (/[()]/.test(sym)) {
    if (!/^[^()]+(?:\([^()]+\))+$/.test(sym)) return sym;
    sym = sym.replace(/[(),]/g, '');
  }
  // M and m carry meaning; word aliases are case insensitive.
  if (sym === 'M') return '';
  if (/^minor/i.test(sym)) sym = 'm' + sym.slice(5);
  else if (/^min/i.test(sym)) sym = 'm' + sym.slice(3);
  else if (sym.startsWith('-')) sym = 'm' + sym.slice(1);
  else if (/^major/i.test(sym)) sym = 'maj' + sym.slice(5);
  else if (/^maj/i.test(sym)) sym = 'maj' + sym.slice(3);
  else if (sym.startsWith('M')) sym = 'maj' + sym.slice(1);
  if (/^m(?:major|maj)/i.test(sym) && !/^maj/i.test(sym)) sym = sym.replace(/^m(?:major|maj)/i, 'mMaj');
  else if (/^mM/.test(sym)) sym = sym.replace(/^mM/, 'mMaj');
  if (/^\+(?:major|maj)/i.test(sym)) sym = sym.replace(/^\+(?:major|maj)/i, 'augMaj');
  else if (/^\+M/.test(sym)) sym = sym.replace(/^\+M/, 'augMaj');
  if (/^augmented/i.test(sym)) sym = 'aug' + sym.slice(9);
  if (/^diminished/i.test(sym)) sym = 'dim' + sym.slice(10);
  const alias = ALIASES.get(sym.toLowerCase());
  if (alias !== undefined) return alias;
  // Canonicalize alteration order: 7(#9,b5) -> 7b5#9.
  const altered = sym.match(/^((?:mMaj|maj|m)?(?:7|9|11|13))((?:[#b](?:5|9|11|13))+)$/);
  if (altered) {
    const parts = altered[2].match(/[#b](?:13|11|9|5)/g);
    if (new Set(parts).size !== parts.length) return sym;
    parts.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)) || a.localeCompare(b));
    sym = altered[1] + parts.join('');
  }
  return ALIASES.get(sym.toLowerCase()) ?? sym;
}

// The final slash is a bass only when followed by a note: C6/9 remains intact.
export function parseChordSymbol(value) {
  if (typeof value !== 'string') return null;
  const clean = normalizeAccidentals(value, false);
  const m = clean.match(/^([A-Ga-g](?:#+|b+|x)?)(.*)$/);
  if (!m) return null;
  const root = parseNote(m[1]);
  let suffix = m[2];
  let bass = null;
  const slash = suffix.match(/\/([A-Ga-g](?:#+|b+|x)?)$/);
  if (slash) { bass = parseNote(slash[1]); suffix = suffix.slice(0, slash.index); }
  const symbol = normalizeSymbol(suffix);
  return { root: root.name, rootPitchClass: root.pitch, symbol,
    bass: bass?.name ?? null, bassPitchClass: bass?.pitch ?? null,
    name: root.name + symbol + (bass ? '/' + bass.name : '') };
}
