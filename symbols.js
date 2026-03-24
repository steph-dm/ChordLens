import { normalizeAccidentals } from './notes.js';

// maps all the different ways people write chord symbols to our canonical forms
const ALIASES = new Map([
  ['', ''],       ['maj', ''],     ['major', ''],
  ['m', 'm'],     ['min', 'm'],    ['minor', 'm'],
  ['sus', 'sus4'],                 ['7sus', '7sus4'],
  ['dim', 'dim'], ['o', 'dim'],    ['diminished', 'dim'],
  ['dim7', 'dim7'],                ['o7', 'dim7'],     ['diminished7', 'dim7'],
  ['aug', 'aug'],  ['+', 'aug'],   ['augmented', 'aug'],
  ['aug7', 'aug7'], ['+7', 'aug7'], ['augmented7', 'aug7'],
  ['augmaj7', 'augMaj7'], ['+maj7', 'augMaj7'],
  ['+m7', 'augMaj7'],     ['+major7', 'augMaj7'],
  ['half-diminished', 'm7b5'], ['halfdiminished', 'm7b5'],
  ['halfdiminished7', 'm7b5'],
  ['ø', 'm7b5'],   ['ø7', 'm7b5'],
  ['m7b5', 'm7b5'], ['min7b5', 'm7b5'], ['minor7b5', 'm7b5'],
  ['mmaj7', 'mMaj7'],   ['minmaj7', 'mMaj7'],
  ['minormaj7', 'mMaj7'], ['minormajor7', 'mMaj7'],
]);


// splits "minMaj7" into 'm' + 'Maj7', keeping the Maj casing
function resolveMinorSuffix(tail) {
  if (!tail) return '';
  if (/^major/i.test(tail)) return 'Maj' + tail.slice(5);
  if (/^maj/i.test(tail))   return 'Maj' + tail.slice(3);
  if (/^M(?!in)/.test(tail)) return 'Maj' + tail.slice(1);
  return tail;
}


export function normalizeSymbol(raw) {
  let sym = normalizeAccidentals(raw);
  if (!sym) return '';

  sym = sym.replace(/[Δ△]/g, 'maj').replace(/Ø/g, 'ø').replace(/°/g, 'o');

  const lower = sym.toLowerCase();
  if (ALIASES.has(lower)) return ALIASES.get(lower);

  const majPrefix = sym.match(/^major/i) ?? sym.match(/^maj/i);
  if (majPrefix) {
    const rest = sym.slice(majPrefix[0].length);
    return rest ? 'maj' + rest : '';
  }
  // M7 = maj7, but Min7 = m7
  if (/^M(?!in)/.test(sym)) {
    const rest = sym.slice(1);
    return rest ? 'maj' + rest : '';
  }

  const minPrefix = sym.match(/^minor/i) ?? sym.match(/^min/i);
  if (minPrefix) return 'm' + resolveMinorSuffix(sym.slice(minPrefix[0].length));
  if (sym.startsWith('-')) return 'm' + resolveMinorSuffix(sym.slice(1));

  if (sym.startsWith('+')) {
    const rest = sym.slice(1);
    if (!rest) return 'aug';
    if (/^major/i.test(rest)) return 'augMaj' + rest.slice(5);
    if (/^maj/i.test(rest))   return 'augMaj' + rest.slice(3);
    if (/^M(?!in)/.test(rest)) return 'augMaj' + rest.slice(1);
    return 'aug' + rest;
  }

  if (/^diminished/i.test(sym)) return 'dim' + sym.slice(10);
  if (/^dim/i.test(sym))        return 'dim' + sym.slice(3);
  if (/^o/.test(sym))            return 'dim' + sym.slice(1);

  return sym;
}
