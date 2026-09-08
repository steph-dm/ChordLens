import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../templates.js';
import { spellChordNote } from '../notes.js';

export function renderCatalogue() {
  const lines = [
    '# Chord catalogue', '',
    `ChordLens includes ${TEMPLATES.length} immutable built-in templates. This table is generated from the actual definitions with \`npm run docs:chords\`.`, '',
    'Required roles must be played in strict mode; other roles may be omitted. Rootless and incomplete modes have explicit additional rules described in the [API](API.md). Example notes use C and musical degree order, not a prescribed voicing.', '',
    '| Symbol | Name | Roles | Required | Example notes |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const template of TEMPLATES) {
    const labels = template._degreeSorted.map(iv => template.labels[iv]);
    lines.push(`| ${template.symbol ? '`' + template.symbol + '`' : '`""` (major)'} | ${template.fullName} | ${labels.join(' ')} | ${template.required.map(iv => template.labels[iv]).join(' ')} | ${labels.map(iv => spellChordNote('C', iv)).join(' ')} |`);
  }
  lines.push('', '## Common aliases', '',
    '| Input | Canonical symbol |', '| --- | --- |',
    '| `M`, `maj`, `major`, `Δ`, `(major)` | `""` |',
    '| `m`, `min`, `minor`, `-`, `−` | `m` |',
    '| `M7`, `Δ7`, `major7` | `maj7` |',
    '| `min7`, `MIN7`, `-7` | `m7` |',
    '| `mM7`, `minMaj7`, `minorMajor7` | `mMaj7` |',
    '| `mM9`, `minMaj9` | `mMaj9` |',
    '| `ø`, `ø7`, `half-diminished` | `m7b5` |',
    '| `°`, `o`, `diminished` | `dim` |',
    '| `°7`, `o7`, `diminished7` | `dim7` |',
    '| `+`, `augmented` | `aug` |',
    '| `+7`, `7#5` | `aug7` |',
    '| `+M7`, `maj7#5`, `augmentedMaj7` | `augMaj7` |',
    '| `aug9`, `augmented9` | `9#5` |',
    '| `69`, `m69` | `6/9`, `m6/9` |',
    '| `sus`, `7sus`, `9sus`, `13sus` | corresponding `sus4` types |',
    '| `add2`, `madd2`, `add4`, `madd4` | `add9`, `madd9`, `add11`, `madd11` |',
    '| `7(b9)`, `7(♭9)` | `7b9` |',
    '| `7(#9,b5)` | `7b5#9` |', '',
    'Major/minor abbreviations retain meaningful case. Word prefixes are case-insensitive. The parser accepts grouped alterations only when the resulting type exists in the catalogue. Ambiguous collections such as `7alt` do not designate one template and are not silently expanded.', '',
    'A slash followed by a note names the bass: `Cmaj7/E`, `C6/9/E`. Explicit `no3`/`no5` (or `omit3`/`omit5`) removes that degree during construction. Custom templates can extend the catalogue per analyzer without mutating the shared definitions.', '');
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writeFile(new URL('../docs/CHORDS.md', import.meta.url), renderCatalogue());
  console.log(`Generated reference for ${TEMPLATES.length} chord types.`);
}
