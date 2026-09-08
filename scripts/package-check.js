import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { dirname, basename, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check with npm run test:package');
const temporary = await mkdtemp(join(tmpdir(), 'chordlens-package-'));
const runNpm = (args, cwd) => execFileSync(process.execPath, [npmCli, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
try {
  const [packed] = JSON.parse(runNpm(['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], root));
  assert.ok(packed.files.length > 10);
  for (const file of packed.files) assert.ok(!/(^|\/)(ChordFlow|tests|scripts|examples|node_modules|\.env|\.github)(\/|$)/i.test(file.path), file.path);
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0, 'Keep the runtime dependency-free');
  for (const target of Object.values(manifest.exports)) {
    for (const file of Object.values(target)) assert.ok(packed.files.some(entry => entry.path === file.slice(2)), `Missing export ${file}`);
  }
  await writeFile(join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--offline', join(temporary, packed.filename)], temporary);
  await writeFile(join(temporary, 'smoke.js'), `
    import assert from 'node:assert/strict';
    import ChordAnalyzer, { CHORD_TEMPLATES } from 'chordlens';
    import { parsePitch } from 'chordlens/notes';
    import { parseChordSymbol } from 'chordlens/symbols';
    import { TEMPLATES, compileTemplate } from 'chordlens/templates';
    const a = new ChordAnalyzer();
    assert.equal(a.detectMidi([60, 64, 67])[0].name, 'C');
    assert.equal(a.noteToKey('B#', 3), 40);
    assert.equal(a.parseChord('Cmaj7/E').inversion, 1);
    assert.equal(a.generateVoicings('Cmaj9').length, 3);
    assert.equal(a.analyzeProgression(['Dm7','G7','Cmaj7'], {key:'C'}).patterns[0].name, 'ii–V–I');
    assert.equal(parsePitch('C4').midi, 60);
    assert.equal(parseChordSymbol('C6/9').symbol, '6/9');
    assert.equal(TEMPLATES, CHORD_TEMPLATES);
    assert.equal(typeof compileTemplate, 'function');
  `);
  execFileSync(process.execPath, ['smoke.js'], { cwd: temporary, stdio: 'pipe' });
  await copyFile(join(root, 'tests/types/consumer.ts'), join(temporary, 'consumer.ts'));
  await writeFile(join(temporary, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'NodeNext',
    moduleResolution: 'NodeNext', strict: true, noUncheckedIndexedAccess: true, noEmit: true, types: [], lib: ['ES2022', 'DOM'] }, include: ['consumer.ts'] }));
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(temporary, 'tsconfig.json')], { cwd: temporary, stdio: 'pipe' });
  console.log(`Installed-package checks passed: ${packed.entryCount} files, ${(packed.size / 1024).toFixed(1)} KiB packed, runtime exports and TypeScript consumer verified.`);
} catch (error) {
  if (error.stdout) console.error(String(error.stdout));
  if (error.stderr) console.error(String(error.stderr));
  throw error;
} finally {
  // Delete only this exact, freshly created temporary directory.
  const target = resolve(temporary);
  if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('chordlens-package-')) throw new Error('Unexpected temporary directory');
  await rm(target, { recursive: true, force: true });
}
