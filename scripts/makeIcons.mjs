/**
 * Generates public/icon-192.png and public/icon-512.png from a 16×16
 * pixel-art fox mark, scaled with nearest-neighbor. Zero dependencies —
 * minimal PNG encoder over node:zlib.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PAL = {
  '.': null,
  K: '#2A1F1B', B: '#4A362B', R: '#C7402B', d: '#8A2F22',
  o: '#E8622C', O: '#F2A03D', W: '#F7E6C4', c: '#E6C79A',
};

// 16×16 fox head with amber scarf on warm dark ground
const MARK = [
  '.K..........K...',
  'KRK........KRK..',
  'KRRK......KRRK..',
  'KRdRKKKKKKRdRK..',
  'KRRRRRRRRRRRRK..',
  'KRRWWRRRRWWRRK..',
  'KRWKWRRRRWKWRK..',
  'KRRWWRRRRWWRRK..',
  'KRRRRRddRRRRRK..',
  '.KRRWWWWWWRRK...',
  '.KRRWWKKWWRRK...',
  '..KRRWWWWRRK....',
  '..KOOOOOOOOK....',
  '.KOoOOOOOOoOK...',
  '.KOOK....KOOK...',
  '..KK......KK....',
];

const BG = '#4A362B';

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function hexRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function makePng(size) {
  const scale = Math.floor((size * 0.82) / 16);
  const off = Math.floor((size - 16 * scale) / 2);
  const [br, bg2, bb] = hexRgb(BG);
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let [r, g, b] = [br, bg2, bb];
      const mx = Math.floor((x - off) / scale);
      const my = Math.floor((y - off) / scale);
      if (mx >= 0 && mx < 16 && my >= 0 && my < 16) {
        const code = MARK[my][mx];
        const hex = PAL[code];
        if (hex) [r, g, b] = hexRgb(hex);
      }
      row[1 + x * 3] = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(join(root, 'public'), { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(root, 'public', `icon-${size}.png`), makePng(size));
  console.log(`icon-${size}.png written`);
}
