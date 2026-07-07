/**
 * One-shot generator for the RIMEFELL tileset: reads tileSprites.ts (the
 * Thornwood set — its organic shapes fit a snowfield) and remaps palette
 * codes inside the frame strings, same pipeline as canyon/cinder. Greens
 * become snow (pale blues + warm-white sparkle) over dark frozen earth;
 * the crack block recolors to FRAGILE ICE (it breaks under a pound — the
 * mechanic was always waiting for this world). Output is literal, lintable
 * data, then hand-tuned: a new 'ice' block group and icicle spikes are
 * appended by hand in the emitted file.
 * Run: node scripts/genRimeTiles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../src/gfx/data/tileSprites.ts', import.meta.url).pathname;
const out = new URL('../src/gfx/data/tileSpritesRime.ts', import.meta.url).pathname;

/** thornwood -> rimefell. Fire codes (O o R d) stay warm everywhere. */
const DEFAULT_MAP = { G: 'A', g: 'a', l: 'a', y: 'W', t: 's', b: 'i' };
// cracked block -> fragile ice sheet
const CRACK_MAP = { G: 'A', g: 'a', l: 'a', y: 'W', t: 'a', b: 'A', B: 'i', K: 'i' };
// thorn spikes -> icicles (rime-blue with white cores)
const SPIKE_MAP = { b: 'A', B: 'i', K: 'i', t: 'W', G: 'A', g: 'a', l: 'a', y: 'W' };
const GROUP_MAPS = { crack: CRACK_MAP, spike: SPIKE_MAP };

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
result = result.replace(/export const TILE_FRAMES\b/, 'export const TILE_FRAMES_RIME');
result = result.replace(/\/\*\*[\s\S]*?\*\//, `/**
 * RIMEFELL tileset — the snowfield (World 5). Snow caps over dark frozen
 * earth, fragile-ice crack blocks, icicle spikes, and the 'ice' block group
 * ('I' tiles — the slippery ground). Generated from tileSprites.ts, then
 * hand-tuned.
 */`);

// append the hand-authored groups before the closing brace of the object
const ICE_GROUPS = `  ice: [
    [
      'aaaaaaaaaaaaaaaW',
      'aWWaaaaaaAaaaaaa',
      'aaWWaaaaaaaaaAaa',
      'aaaWaaaaAaaaaaaa',
      'aaaaaaaaaaaWWaaa',
      'aAaaaaaaaaWWaaaa',
      'aaaaaAaaaWaaaaAa',
      'aaaaaaaaaaaaaaaa',
      'aaAaaaaaaaaaAaaa',
      'aaaaaaWaaaaaaaaa',
      'aaaaaWaaaaAaaaaa',
      'aAaaaaaaaaaaaaaa',
      'aaaaaaaaAaaaaWWa',
      'aaaAaaaaaaaaWaaa',
      'AaaaaaaAaaaaaaaA',
      'AAiAAAAAAAiAAAAA',
    ],
    [
      'aaaaaaaWaaaaaaaa',
      'aaAaaaWaaaaaAaaa',
      'aaaaaWaaaaaaaaaa',
      'aWaaaaaaaAaaaaaa',
      'aaaaaAaaaaaaWWaa',
      'aaaaaaaaaaaWaaaa',
      'aAaaaaaaaaaaaaAa',
      'aaaaaaaAaaaaaaaa',
      'aaaaWaaaaaaaAaaa',
      'aaaWWaaaaaaaaaaa',
      'aaWaaaaaAaaaaaaa',
      'aaaaaaaaaaaaWaaa',
      'aAaaaAaaaaaWaaaa',
      'aaaaaaaaaaaaaaaa',
      'AaaAaaaaaAaaaaaA',
      'AAAAAiAAAAAAAiAA',
    ],
  ],
`;
result = result.replace(/\n\};\s*$/, `\n${ICE_GROUPS}};\n`);
writeFileSync(out, result);
console.log('wrote', out);
