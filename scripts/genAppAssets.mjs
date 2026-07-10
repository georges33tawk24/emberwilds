/**
 * Generate the source app-icon + splash images for @capacitor/assets from the
 * Emberwilds mark. Produces assets/{icon,icon-foreground,icon-background,
 * splash,splash-dark}.png; then `npx @capacitor/assets generate` fans them out
 * to every Android/iOS size. Pixel-art mark is upscaled nearest-neighbour so it
 * stays crisp. Run: node scripts/genAppAssets.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const MARK = new URL('../release/logo/emberwilds-mark-512.png', import.meta.url).pathname;
const OUT = new URL('../assets/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const WARM = { r: 20, g: 16, b: 13, alpha: 1 };      // #14100d — game background
const WOOD = { r: 42, g: 31, b: 27, alpha: 1 };      // #2A1F1B — carved-wood, icon bg

const solid = (w, h, bg) => sharp({ create: { width: w, height: h, channels: 4, background: bg } });
const mark = async (px) =>
  sharp(MARK).resize(px, px, { kernel: sharp.kernel.nearest, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

async function run() {
  // ---- app icon (1024): warm wood field, mark at ~66% ----
  await solid(1024, 1024, WOOD)
    .composite([{ input: await mark(676), gravity: 'center' }])
    .png().toFile(`${OUT}icon.png`);

  // ---- Android adaptive: transparent foreground (safe zone ~62%) + solid bg ----
  await solid(1024, 1024, { r: 0, g: 0, b: 0, alpha: 0 })
    .composite([{ input: await mark(632), gravity: 'center' }])
    .png().toFile(`${OUT}icon-foreground.png`);
  await solid(1024, 1024, WOOD).png().toFile(`${OUT}icon-background.png`);

  // ---- splash (2732 square, warm field, small centered mark) — light + dark ----
  for (const name of ['splash.png', 'splash-dark.png']) {
    await solid(2732, 2732, WARM)
      .composite([{ input: await mark(720), gravity: 'center' }])
      .png().toFile(`${OUT}${name}`);
  }
  console.log('wrote assets/{icon,icon-foreground,icon-background,splash,splash-dark}.png');
}
run();
