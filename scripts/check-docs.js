import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderCatalogue } from './generate-catalogue.js';

const root = new URL('../', import.meta.url);
const docs = ['README.md', ...(await readdir(new URL('docs/', root))).filter(path => path.endsWith('.md')).map(path => 'docs/' + path)];
let count = 0;
for (const path of docs) {
  const content = await readFile(new URL(path, root), 'utf8');
  for (const [index, match] of [...content.matchAll(/```js\r?\n([\s\S]*?)\r?\n```/g)].entries()) {
    try {
      execFileSync(process.execPath, ['--input-type=module'], { input: match[1], cwd: fileURLToPath(root), encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] });
      count++;
    } catch (error) {
      console.error(`Failed JavaScript example ${index + 1} in ${path}`);
      if (error.stderr) console.error(String(error.stderr));
      throw error;
    }
  }
}
assert.equal(await readFile(new URL('docs/CHORDS.md', root), 'utf8'), renderCatalogue(), 'Run npm run docs:chords after editing templates');
console.log(`Documentation checks passed: ${count} executable examples and an up-to-date chord catalogue.`);
