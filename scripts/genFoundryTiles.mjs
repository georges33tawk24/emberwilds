/**
 * One-shot generator for the COGLAR FOUNDRY tileset: reads tileSpritesAsh.ts
 * (the Cinderpeaks set — already industrial rock) and hardens it to worked
 * iron: browns die, ember seams burn hotter, timber becomes grating. Then
 * appends the hand-authored conveyor groups (belt_l / belt_r — molten-lit
 * chevrons show the drag direction at a glance). Same pipeline as every
 * world sheet: generated, then hand-checked. Run: node scripts/genFoundryTiles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../src/gfx/data/tileSpritesAsh.ts', import.meta.url).pathname;
const out = new URL('../src/gfx/data/tileSpritesFoundry.ts', import.meta.url).pathname;

/** cinder -> foundry: kill the last warm browns, heat the seams. */
const DEFAULT_MAP = { B: 'S', b: 'S', d: 'o' };
// charred timber -> iron grating
const GRATE_MAP = { b: 'S', B: 'K', t: 's', s: 's' };
const GROUP_MAPS = { oneway: GRATE_MAP, crack: GRATE_MAP };

const text = readFileSync(src, 'utf8');
const lines = text.split('\n');
let group = '';
const outLines = lines.map((line) => {
  const g = line.match(/^  (\w+): \[/);
  if (g) group = g[1];
  const row = line.match(/^(\s*)(["'])([^"']*)\2,?$/);
  if (!row) return line;
  const map = GROUP_MAPS[group] ?? DEFAULT_MAP;
  const remapped = [...row[3]].map((ch) => map[ch] ?? ch).join('');
  return `${row[1]}'${remapped}',`;
});

let result = outLines.join('\n');
result = result.replace(/export const TILE_FRAMES_ASH\b/, 'export const TILE_FRAMES_FOUNDRY');
result = result.replace(/\/\*\*[\s\S]*?\*\//, `/**
 * COGLAR FOUNDRY tileset — the Rust's heart (World 6). Worked iron and
 * brick, ember seams burning hot, timber replaced by grating, and the
 * conveyor groups (belt_l / belt_r) whose molten chevrons point the drag.
 * Generated from tileSpritesAsh.ts, then hand-tuned.
 */`);

const BELTS = `  belt_l: [
    [
      'KKKKKKKKKKKKKKKK',
      'soKKsoKKsoKKsoKK',
      'oKKsoKKsoKKsoKKs',
      'KKKKKKKKKKKKKKKK',
      'SSKSSSSSSKSSSSSK',
      'SKSSSSSKSSSSSKSS',
      'SSSSKSSSSSSKSSSS',
      'SSKSSSSSKSSSSSKS',
      'SSSSSKSSSSSKSSSS',
      'SKSSSSSKSSSSSSKS',
      'SSSKSSSSSSKSSSSS',
      'SSSSSSKSSSSSKSSS',
      'SSKSSSSSKSSSSSSK',
      'SSSSKSSSSSSKSSSS',
      'KSSSSSKSSSSSSKSS',
      'KKKKKKKKKKKKKKKK',
    ],
    [
      'KKKKKKKKKKKKKKKK',
      'KsoKKsoKKsoKKsoK',
      'KKsoKKsoKKsoKKso',
      'KKKKKKKKKKKKKKKK',
      'SSKSSSSSSKSSSSSK',
      'SKSSSSSKSSSSSKSS',
      'SSSSKSSSSSSKSSSS',
      'SSKSSSSSKSSSSSKS',
      'SSSSSKSSSSSKSSSS',
      'SKSSSSSKSSSSSSKS',
      'SSSKSSSSSSKSSSSS',
      'SSSSSSKSSSSSKSSS',
      'SSKSSSSSKSSSSSSK',
      'SSSSKSSSSSSKSSSS',
      'KSSSSSKSSSSSSKSS',
      'KKKKKKKKKKKKKKKK',
    ],
  ],
  belt_r: [
    [
      'KKKKKKKKKKKKKKKK',
      'KKosKKosKKosKKos',
      'sKKosKKosKKosKKo',
      'KKKKKKKKKKKKKKKK',
      'KSSSSSKSSSSSSKSS',
      'SSKSSSSSKSSSSSSK',
      'SSSSKSSSSSSKSSSS',
      'SKSSSSSKSSSSSKSS',
      'SSSSSKSSSSSKSSSS',
      'SKSSSSSSKSSSSSKS',
      'SSSSKSSSSSSKSSSS',
      'SSKSSSSSKSSSSSSK',
      'SSSSSSKSSSSSKSSS',
      'SSSKSSSSSSKSSSSS',
      'KSSSSSKSSSSSSKSS',
      'KKKKKKKKKKKKKKKK',
    ],
    [
      'KKKKKKKKKKKKKKKK',
      'osKKosKKosKKosKK',
      'KosKKosKKosKKosK',
      'KKKKKKKKKKKKKKKK',
      'KSSSSSKSSSSSSKSS',
      'SSKSSSSSKSSSSSSK',
      'SSSSKSSSSSSKSSSS',
      'SKSSSSSKSSSSSKSS',
      'SSSSSKSSSSSKSSSS',
      'SKSSSSSSKSSSSSKS',
      'SSSSKSSSSSSKSSSS',
      'SSKSSSSSKSSSSSSK',
      'SSSSSSKSSSSSKSSS',
      'SSSKSSSSSSKSSSSS',
      'KSSSSSKSSSSSSKSS',
      'KKKKKKKKKKKKKKKK',
    ],
  ],
`;
result = result.replace(/\n\};\s*$/, `\n${BELTS}};\n`);
writeFileSync(out, result);
console.log('wrote', out);
