import { performance } from 'node:perf_hooks';
import { ChordAnalyzer } from '../chord-analyzer.js';

const workloads = [
  ['triad', [40, 44, 47], {}],
  ['seventh inversion', [38, 40, 44, 47], {}],
  ['full 13th', [28, 44, 47, 50, 54, 57, 61], {}],
  ['rootless with hint', [32, 35, 38, 42], { allowRootless: true, rootHint: 'C' }],
  ['all piano keys', Array.from({ length: 88 }, (_, i) => i + 1), {}],
];
const rows = [];
for (const cacheSize of [0, 256]) for (const maxResults of [1, 10]) {
  const a = new ChordAnalyzer({ cacheSize, maxResults });
  for (const [name, keys, options] of workloads) {
    for (let i = 0; i < 2000; i++) a.detect(keys, options);
    const samples = [];
    for (let batch = 0; batch < 7; batch++) {
      const start = performance.now();
      for (let i = 0; i < 5000; i++) a.detect(keys, options);
      samples.push((performance.now() - start) / 5000);
    }
    samples.sort((a, b) => a - b);
    rows.push({ workload: name, cache: cacheSize ? 'warm' : 'off', maxResults,
      medianMs: Number(samples[3].toFixed(4)), slowestBatchMs: Number(samples.at(-1).toFixed(4)) });
  }
}
console.log(`Node ${process.version}; milliseconds per call, median of 7 batches of 5,000 after warm-up.`);
console.table(rows);
