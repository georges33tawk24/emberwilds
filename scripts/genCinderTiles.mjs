/**
 * One-shot generator for the Cinderpeaks tileset: reads tileSpritesCanyon.ts
 * as text and remaps palette codes inside the frame strings (per group), the
 * same pipeline that produced the canyon set from Thornwood's ("generated,
 * then hand-checked"). Output is literal data — no runtime cost, fully
 * lintable — and is then hand-tuned (decor especially).
 * Run: node scripts/genCinderTiles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../src/gfx/data/tileSpritesCanyon.ts', import.meta.url).pathname;
const out = new URL('../src/gfx/data/tileSpritesAsh.ts', import.meta.url).pathname;

/**
 * Canyon -> Cinderpeaks code maps. Fire/UI codes (O o R d W c) are never
 * remapped — beacon flames, checkpoint embers and spring brass stay warm.
 * default: sandstone -> ash rock (pale-ash grit over iron-grey body,
 *          charred-black seams, burnt-brown relief specks)
 * wood (oneway/crack): sun-bleached planks -> charred timber
 */
const DEFAULT_MAP = { y: 's', x: 'K', b: 'S', t: 's' };
const WOOD_MAP = { t: 'b', b: 'B', B: 'K', y: 's', x: 'K' };
const GROUP_MAPS = {
  oneway: WOOD_MAP,
  crack: WOOD_MAP,
};

const text = readFileSync(src, 'utf8');
const lines = text.split('\n');
let group = '';
const outLines = lines.map((line) => {
  const g = line.match(/^  (\w+): \[/);
  if (g) group = g[1];
  const row = line.match(/^(\s*)'([^']*)',?$/);
  if (!row) return line;
  const map = GROUP_MAPS[group] ?? DEFAULT_MAP;
  const remapped = [...row[2]].map((ch) => map[ch] ?? ch).join('');
  return `${row[1]}'${remapped}',`;
});

let result = outLines.join('\n');
result = result.replace(/export const TILE_FRAMES_CANYON/, 'export const TILE_FRAMES_ASH');
result = result.replace(/\/\*\*[\s\S]*?\*\//, `/**
 * THE CINDERPEAKS tileset — ash-grey volcanic highlands under foundry smoke
 * (World 4). Same frame keys and dimensions as every world sheet so the
 * engine swaps by theme. Generated from tileSpritesCanyon.ts (pale-ash grit
 * over iron-grey rock, charred seams, burnt-timber planks), then hand-tuned:
 * decor swapped for ember blossoms, cinder shards and slag vents.
 */`);
writeFileSync(out, result);
console.log('wrote', out);
