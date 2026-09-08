import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const modules = new Set(manifest.files.filter(path => path.endsWith('.js')));
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname.slice(1);
  if (path === '') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><title>ChordLens module test</title>'); return; }
  if (!modules.has(path)) { response.writeHead(404); response.end(); return; }
  try {
    const source = await readFile(fileURLToPath(new URL(path, root)));
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    response.end(source);
  } catch { response.writeHead(500); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const result = await page.evaluate(async () => {
    const { ChordAnalyzer } = await import('/chord-analyzer.js');
    const analyzer = new ChordAnalyzer();
    const workerSource = `import { ChordAnalyzer } from ${JSON.stringify(location.origin + '/chord-analyzer.js')};
      self.onmessage = event => self.postMessage(new ChordAnalyzer().detectMidi(event.data)[0].name);`;
    const workerURL = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    let worker;
    let workerChord;
    try {
      worker = new Worker(workerURL, { type: 'module' });
      workerChord = await new Promise((resolve, reject) => {
        worker.onmessage = event => resolve(event.data);
        worker.onerror = reject;
        worker.postMessage([60, 64, 67]);
      });
    } finally { worker?.terminate(); URL.revokeObjectURL(workerURL); }
    return {
      chord: analyzer.detectMidi([60, 64, 67])[0].name,
      correctedKey: analyzer.noteToKey('B#', 3),
      rootless: analyzer.detectNotes(['E3', 'G3', 'Bb3', 'D4'], { allowRootless: true, rootHint: 'C' })[0].name,
      voicings: analyzer.generateVoicings('Cmaj9', { noteCount: 4 }).length,
      romans: analyzer.analyzeProgression(['Dm7', 'G7', 'Cmaj7'], { key: 'C' }).chords.map(c => c.romanNumeral),
      workerChord,
    };
  });
  assert.deepEqual(result, { chord: 'C', correctedKey: 40, rootless: 'C9/E',
    voicings: 3, romans: ['ii7', 'V7', 'Imaj7'], workerChord: 'C' });
  console.log('Browser and module-worker checks passed: native ES modules, MIDI-note analysis, voicings and progressions.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
