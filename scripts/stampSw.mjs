/**
 * Post-build step: stamp dist/sw.js with a unique build id so the service
 * worker's cache name changes on every deploy. Without this, the worker file
 * never byte-changes between builds and browsers never install the update —
 * players stay pinned to the first build they ever loaded.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const swPath = new URL('../dist/sw.js', import.meta.url);
let sha = 'local';
try {
  sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // not a git checkout (or git unavailable) — timestamp alone still guarantees uniqueness
}
const stamp = `${sha}-${Date.now().toString(36)}`;

const src = readFileSync(swPath, 'utf8');
if (!src.includes('__BUILD__')) {
  console.error('stampSw: __BUILD__ placeholder missing from dist/sw.js');
  process.exit(1);
}
writeFileSync(swPath, src.replace('__BUILD__', stamp));
console.log(`sw.js stamped: emberwilds-${stamp}`);
