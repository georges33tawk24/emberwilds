/**
 * Level authoring toolkit — a drawing canvas over the ASCII grid plus a
 * validator that mirrors tests/levelLint.test.ts EXACTLY (same BFS movement
 * model: walk ±1, jump 4 up / 6 across — 3 across when climbing more than 2,
 * fall any depth with ±3 drift, springs & water grant 8 lift, doors/gates
 * assumed openable). Design in a build script, iterate until validate()
 * prints PASS, then writeLevel() emits the .ts.
 *
 * The craft lives in the build scripts — this file only holds the brushes.
 * Gotcha from HANDOFF §7: carve pits AFTER filling ground, or they floor over.
 */
import { writeFileSync } from 'node:fs';

export class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill('.'));
    this.water = [];
  }

  set(x, y, ch) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) throw new Error(`set OOB ${x},${y}`);
    this.g[y][x] = ch;
  }

  get(x, y) {
    return this.g[y]?.[x] ?? '#';
  }

  rect(x0, y0, x1, y1, ch) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, ch);
  }

  /** solid earth from `top` to the bottom of the map */
  ground(x0, x1, top) {
    this.rect(x0, y0Clamp(top), x1, this.h - 1, '#');
    function y0Clamp(v) { return Math.max(0, v); }
  }

  /** carve air (use AFTER ground fills — pits carved first get floored over) */
  carve(x0, y0, x1, y1) {
    this.rect(x0, y0, x1, y1, '.');
  }

  /** one-way wooden platform */
  oneway(x, y, len) {
    for (let i = 0; i < len; i++) this.set(x + i, y, '=');
  }

  /** a horizontal run of any tile (X stone, C cracked, ^ spikes...) */
  run(x, y, len, ch) {
    for (let i = 0; i < len; i++) this.set(x + i, y, ch);
  }

  /** gem trail along a row */
  gems(x, y, n, step = 2) {
    for (let i = 0; i < n; i++) this.set(x + i * step, y, '*');
  }

  /** gem arc over a gap (rises then falls one tile) */
  gemArc(x, y, n) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const dy = Math.round(-Math.sin(t * Math.PI) * 2);
      this.set(x + i, y + dy, '*');
    }
  }

  /** the topmost solid/standable tile top in a column (or h if none) */
  topAt(x) {
    for (let y = 0; y < this.h; y++) {
      if ('#XCI='.includes(this.g[y][x])) return y;
    }
    return this.h;
  }

  /** place an entity standing on the current floor of column x */
  onFloor(x, ch) {
    const top = this.topAt(x);
    if (top >= this.h) throw new Error(`onFloor(${x}): no floor`);
    this.set(x, top - 1, ch);
  }

  addWater(x0, y0, x1, y1) {
    this.water.push([x0, y0, x1, y1]);
    return this;
  }

  rows() {
    return this.g.map((r) => r.join(''));
  }
}

// ---------------------------------------------------------------------------
// validator — a faithful clone of tests/levelLint.test.ts
// ---------------------------------------------------------------------------

const SOLID = new Set(['#', 'X', 'C', 'I']);
const STANDABLE = new Set(['#', 'X', 'C', '=']);
const ENTITY_CHARS = 'PKFSETOA*BMWezhjn';

function parse(rows, water = []) {
  const height = rows.length;
  const width = rows[0].length;
  const grid = rows.map((r) => r.split(''));
  const entities = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = grid[y][x];
      if (ENTITY_CHARS.includes(ch)) {
        entities.push({ type: ch, tx: x, ty: y });
        grid[y][x] = '.';
      }
    }
  }
  const waterSet = new Set();
  for (const [x0, y0, x1, y1] of water) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) waterSet.add(y * width + x);
  }
  return { width, height, grid, entities, waterSet };
}

function reachable(level, fromE, toE, springs) {
  const { width, height, grid } = level;
  const at = (x, y) => (x < 0 || x >= width || y < 0 || y >= height ? 'X' : grid[y][x]);
  const open = (x, y) => !SOLID.has(at(x, y)) && at(x, y) !== '^';
  const inWater = (x, y) => level.waterSet.has(y * width + x);
  const standing = (x, y) => open(x, y) && (STANDABLE.has(at(x, y + 1)) || inWater(x, y) || y + 1 >= height);

  const seen = new Set([`${fromE.tx},${fromE.ty}`]);
  const queue = [[fromE.tx, fromE.ty]];
  const tryAdd = (x, y) => {
    const k = `${x},${y}`;
    if (seen.has(k) || !standing(x, y)) return;
    seen.add(k);
    queue.push([x, y]);
  };
  const drop = (x, y) => {
    for (let dy = 0; y + dy < height; dy++) {
      if (!open(x, y + dy)) return;
      if (standing(x, y + dy)) return tryAdd(x, y + dy);
    }
  };

  let guard = 0;
  while (queue.length && guard++ < 200000) {
    const [x, y] = queue.shift();
    if (Math.abs(x - toE.tx) <= 1 && Math.abs(y - toE.ty) <= 2) return true;
    const lift = springs.has(`${x},${y}`) || inWater(x, y) ? 8 : 4;
    for (let dy = 0; dy >= -lift; dy--) {
      const maxDx = dy < -2 ? 3 : 6;
      for (let dx = -maxDx; dx <= maxDx; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (!open(nx, ny)) continue;
        if (standing(nx, ny)) tryAdd(nx, ny);
        else drop(nx, ny);
      }
    }
  }
  return false;
}

/** Phase-2 floor: ≥220×40 for standard levels (the lint's own minimum is
 *  lower until every world is reworked — this tool holds the NEW bar). */
export function validate(rows, { water = [], boss = false, minW = 220, minH = 40 } = {}) {
  const issues = [];
  const width = rows[0].length;
  rows.forEach((r, i) => {
    if (r.length !== width) issues.push(`row ${i} width ${r.length} != ${width}`);
  });
  const level = parse(rows, water);
  const count = (t) => level.entities.filter((e) => e.type === t).length;

  if (width < (boss ? 48 : minW)) issues.push(`width ${width} < ${minW}`);
  if (rows.length < (boss ? 24 : minH)) issues.push(`height ${rows.length} < ${minH}`);
  if (count('P') !== 1) issues.push(`P count ${count('P')}`);
  if (count('F') !== 1) issues.push(`F count ${count('F')}`);
  if (count('K') !== 1) issues.push(`K count ${count('K')}`);
  if (!boss && count('M') !== 4) issues.push(`M tokens ${count('M')} != 4`);
  const gems = count('*');
  if (!boss && (gems < 40 || gems > 90)) issues.push(`gems ${gems} outside 40..90`);

  for (const e of level.entities) {
    if (!'KFSETAY'.includes(e.type)) continue;
    let ok = false;
    for (let dy = 1; dy <= 2; dy++) {
      const ch = level.grid[e.ty + dy]?.[e.tx];
      if (ch && '#X=CI'.includes(ch)) ok = true;
    }
    if (!ok) issues.push(`${e.type} at ${e.tx},${e.ty} is floating`);
  }

  const springs = new Set(level.entities.filter((e) => e.type === 'S').map((e) => `${e.tx},${e.ty}`));
  const start = level.entities.find((e) => e.type === 'P');
  const goal = level.entities.find((e) => e.type === 'F');
  const check = level.entities.find((e) => e.type === 'K');
  if (start && goal && !reachable(level, start, goal, springs)) issues.push('GOAL not reachable');
  if (start && check && !reachable(level, start, check, springs)) issues.push('CHECKPOINT not reachable');

  return { ok: issues.length === 0, issues, gems, tokens: count('M') };
}

/** Emit the level .ts in the house style. */
export function writeLevel(path, { name, theme, daypart, boss, rows, water, header }) {
  const lines = [];
  if (header) lines.push(...header.split('\n').map((l) => `// ${l}`.trimEnd()));
  lines.push('export const LEVEL = {');
  lines.push(`  name: '${name.replace(/'/g, "\\'")}',`);
  lines.push(`  theme: '${theme}',`);
  lines.push(`  daypart: '${daypart}',`);
  if (boss) lines.push('  boss: true,');
  lines.push('  rows: [');
  for (const r of rows) lines.push(`    '${r}',`);
  lines.push('  ],');
  if (water?.length) {
    lines.push(`  water: [${water.map((w) => `[${w.join(', ')}]`).join(', ')}],`);
  }
  lines.push('}');
  lines.push('');
  writeFileSync(path, lines.join('\n'));
}
