/**
 * Renders pixel-data frame groups to a PNG contact sheet at 4× for visual QA.
 * Usage: node scripts/renderSheet.mjs <dataFile.ts> <exportName> <out.png>
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , file, exportName, out] = process.argv;
const mod = await import('file://' + resolve(file));
const groups = mod[exportName];
if (!groups) throw new Error('no export ' + exportName);

const PAL = {
  K: '#2A1F1B', B: '#4A362B', b: '#7A5A3E', t: '#B58B5E', c: '#E6C79A', W: '#F7E6C4',
  G: '#3E5A2E', g: '#5F7D34', l: '#8FA84A', y: '#C2C56B',
  D: '#F2B98C', e: '#E8846B', A: '#A9C6D6', a: '#DCEAF0',
  p: '#7E6A9E', P: '#C88BA0', I: '#243049', i: '#3C5068',
  O: '#F2A03D', o: '#E8622C', R: '#C7402B', d: '#8A2F22',
  S: '#5A5450', s: '#7C7A72', v: '#8FA39B', x: '#B0663F',
};
const BG = [90, 110, 90]; // muted green so warm sprites and outlines both read
const SCALE = 4;
const PAD = 2;

const entries = Object.entries(groups);
const rowsMeta = entries.map(([name, frames]) => ({
  name,
  frames,
  fw: frames[0][0].length,
  fh: frames[0].length,
}));
const sheetW = Math.max(...rowsMeta.map((r) => (r.fw + PAD) * r.frames.length + PAD));
const sheetH = rowsMeta.reduce((a, r) => a + r.fh + PAD, PAD);

const W = sheetW * SCALE;
const H = sheetH * SCALE;
const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = BG[0]; px[i * 3 + 1] = BG[1]; px[i * 3 + 2] = BG[2];
}
function put(x, y, hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  for (let dy = 0; dy < SCALE; dy++) for (let dx = 0; dx < SCALE; dx++) {
    const i = ((y * SCALE + dy) * W + x * SCALE + dx) * 3;
    px[i] = r; px[i + 1] = g; px[i + 2] = b;
  }
}

let cy = PAD;
for (const r of rowsMeta) {
  let cx = PAD;
  for (const f of r.frames) {
    for (let y = 0; y < r.fh; y++) for (let x = 0; x < f[y].length; x++) {
      const hex = PAL[f[y][x]];
      if (hex) put(cx + x, cy + y, hex);
    }
    cx += r.fw + PAD;
  }
  cy += r.fh + PAD;
}

function crc32(buf) {
  const T = []; let c;
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  let crc = 0xffffffff;
  for (const b of buf) crc = T[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
const raw = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 3);
  px.subarray(y * W * 3, (y + 1) * W * 3).forEach((v, i) => (row[1 + i] = v));
  raw.push(row);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(out, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(Buffer.concat(raw))),
  chunk('IEND', Buffer.alloc(0)),
]));
console.log('wrote', out, W + 'x' + H, '| rows:', rowsMeta.map((r) => r.name).join(', '));
