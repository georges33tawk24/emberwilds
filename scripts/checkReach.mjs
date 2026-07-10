/**
 * Reachability audit — the piece validate() is missing. It BFS-reaches from P
 * with the exact movement model the lint enforces (jump 4 up / 6 across, only 3
 * across when climbing >2; springs & water lift 8; fall any depth with drift;
 * below-map is open void so it is never standable), modelling 'C' cracked lids
 * as OPEN so pound-cellar tokens count as reachable. It then reports which 'M'
 * tokens are actually EARNABLE and the highest reachable row (lane ceiling) per
 * horizontal band — the "stranded decorative lane" defect the reviewers found.
 *
 * This is a REPORT, not a hard gate: some exemplar skill tokens are reachable
 * only by wall-kick/glide, which the BFS can't model, so a handful of
 * unreachable tokens on the exemplars is expected. Use it to spot whole lanes
 * that no player can travel.  Run: node scripts/checkReach.mjs [levelPrefixes...]
 */
import { readFileSync } from 'node:fs';

const SOLID = new Set(['#', 'X', 'I', '<', '>']);        // NB: 'C' modelled open
const STANDABLE = new Set(['#', 'X', 'I', '<', '>', '=']); // NB: 'C' modelled open
const ENTITY = 'PKFSETOA*BMWezhjnL';

const out = (f) => new URL(`../src/data/levels/${f}.ts`, import.meta.url).pathname;

function loadLevel(prefix) {
  const src = readFileSync(out(prefix), 'utf8');
  const rowsM = src.match(/rows:\s*\[([\s\S]*?)\],/);
  const rows = [...rowsM[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  const waterM = src.match(/water:\s*\[([\s\S]*?)\]\s*,?\s*\n?\}/);
  const water = waterM ? [...waterM[1].matchAll(/\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]/g)].map((m) => m.slice(1, 5).map(Number)) : [];
  return { rows, water };
}

function audit(prefix) {
  const { rows, water } = loadLevel(prefix);
  const H = rows.length, W = rows[0].length;
  const grid = rows.map((r) => r.split(''));
  const tokens = [], springs = new Set();
  let start = null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = grid[y][x];
    if (ENTITY.includes(ch)) {
      if (ch === 'P') start = { x, y };
      if (ch === 'M') tokens.push({ x, y });
      if (ch === 'S') springs.add(`${x},${y}`);
      grid[y][x] = '.'; // entities become air (as the engine parses them)
    }
  }
  const waterSet = new Set();
  for (const [x0, y0, x1, y1] of water) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) waterSet.add(y * W + x);

  const at = (x, y) => (y >= H ? '.' : x < 0 || x >= W || y < 0 ? 'X' : grid[y][x]);
  const open = (x, y) => !SOLID.has(at(x, y)) && at(x, y) !== '^';
  const inWater = (x, y) => waterSet.has(y * W + x);
  const standing = (x, y) => open(x, y) && (STANDABLE.has(at(x, y + 1)) || inWater(x, y));

  const seen = new Set([`${start.x},${start.y}`]);
  const q = [[start.x, start.y]];
  const add = (x, y) => { const k = `${x},${y}`; if (!seen.has(k) && standing(x, y)) { seen.add(k); q.push([x, y]); } };
  const drop = (x, y) => { for (let dy = 0; y + dy < H; dy++) { if (!open(x, y + dy)) return; if (standing(x, y + dy)) return add(x, y + dy); } };
  let guard = 0;
  while (q.length && guard++ < 400000) {
    const [x, y] = q.shift();
    const lift = springs.has(`${x},${y}`) || inWater(x, y) ? 8 : 4;
    for (let dy = 0; dy >= -lift; dy--) { const maxDx = dy < -2 ? 3 : 6; for (let dx = -maxDx; dx <= maxDx; dx++) { const nx = x + dx, ny = y + dy; if (!open(nx, ny)) continue; if (standing(nx, ny)) add(nx, ny); else drop(nx, ny); } }
  }

  // a token is earnable if any standing cell within 1 col and 2 rows is reachable
  const reach = (tx, ty) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -2; dy <= 2; dy++) if (seen.has(`${tx + dx},${ty + dy}`)) return true; return false; };
  const earnable = tokens.map((t) => ({ ...t, ok: reach(t.x, t.y) }));
  // highest reachable row in each 40-wide band (lane ceiling)
  const bands = [];
  for (let bx = 0; bx < W; bx += 40) { let top = H; for (const k of seen) { const [sx, sy] = k.split(',').map(Number); if (sx >= bx && sx < bx + 40 && sy < top) top = sy; } bands.push(top); }
  return { prefix, reachCells: seen.size, tokens: earnable, bands };
}

const args = process.argv.slice(2);
const prefixes = args.length ? args : ['thornwood1', 'thornwood2', 'thornwood3', 'canyon1', 'canyon2', 'canyon3', 'canyon4', 'moss1', 'moss2', 'moss3', 'moss4', 'cinder1', 'cinder2', 'cinder3', 'cinder4', 'rime1', 'rime2', 'rime3', 'rime4', 'foundry1', 'foundry2', 'foundry3', 'foundry4'];
for (const p of prefixes) {
  const r = audit(p);
  const bad = r.tokens.filter((t) => !t.ok);
  const tag = bad.length === 0 ? 'ALL EARNABLE' : `${bad.length}/${r.tokens.length} STRANDED`;
  console.log(`${p.padEnd(11)} tokens ${r.tokens.length - bad.length}/${r.tokens.length} earnable  ceilings[${r.bands.join(',')}]  ${tag}`);
  for (const b of bad) console.log(`    stranded token @ ${b.x},${b.y}`);
}
