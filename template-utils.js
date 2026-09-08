import { mod12, parseInterval } from './notes.js';

export function compileTemplate(definition) {
  if (!definition || typeof definition !== 'object') throw new TypeError('Template must be an object');
  const { symbol, fullName, intervals, required, labels, weight } = definition;
  if (typeof symbol !== 'string' || /[\s()]/.test(symbol) || typeof fullName !== 'string' || !fullName.trim()) {
    throw new TypeError('Template needs a symbol and a fullName');
  }
  for (const [name, values] of [['intervals', intervals], ['required', required]]) {
    if (!Array.isArray(values) || values.length === 0 || new Set(values).size !== values.length ||
        Array.from(values).some(iv => !Number.isInteger(iv) || iv < 0 || iv > 11)) throw new RangeError(`Invalid template ${name}`);
  }
  if (intervals.length < 2 || !intervals.includes(0) || !required.includes(0) || required.some(iv => !intervals.includes(iv))) {
    throw new RangeError('Required tones must include the root and be a subset of at least two chord tones');
  }
  if (!labels || typeof labels !== 'object' || labels[0] !== 'R' || Object.keys(labels).length !== intervals.length ||
      intervals.some(iv => !Object.hasOwn(labels, iv) || !parseInterval(labels[iv]) || mod12(parseInterval(labels[iv]).semitones) !== iv)) {
    throw new RangeError('Every interval needs a theoretically consistent label; root label must be R');
  }
  if (!Number.isFinite(weight) || weight < 0 || weight > 100) throw new RangeError('Template weight must be from 0 to 100');
  const sorted = [...intervals].sort((a, b) => a - b);
  const category = definition.category === undefined ? (intervals.length <= 3 ? 'triad' : 'extended') : definition.category;
  if (typeof category !== 'string' || !category) throw new TypeError('Category must be a nonempty string');
  return Object.freeze({ symbol, fullName, category, weight,
    intervals: Object.freeze([...intervals]), required: Object.freeze([...required]), labels: Object.freeze({ ...labels }),
    _ivBits: intervals.reduce((bits, iv) => bits | (1 << iv), 0),
    _reqBits: required.reduce((bits, iv) => bits | (1 << iv), 0),
    _size: intervals.length, _sorted: Object.freeze(sorted),
    _degreeSorted: Object.freeze([...intervals].sort((a, b) => parseInterval(labels[a]).degree - parseInterval(labels[b]).degree || a - b)),
    _weightScore: Math.round(weight / 10), _omitPenalty: intervals.length >= 6 ? 1 : intervals.length >= 5 ? 2 : 3,
  });
}

export function compileTemplates(definitions) {
  if (!Array.isArray(definitions)) throw new TypeError('Templates must be an array');
  const seen = new Set();
  return Object.freeze(Array.from(definitions, t => {
    if (seen.has(t?.symbol)) throw new RangeError(`Duplicate template symbol: ${t.symbol}`);
    const compiled = compileTemplate(t);
    seen.add(compiled.symbol);
    return compiled;
  }));
}
