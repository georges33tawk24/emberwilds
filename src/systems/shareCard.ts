/**
 * Share cards — a pixel-art "I cleared this" image generated on the Clear
 * screen (GROWTH_ROADMAP Phase 2: the zero-backend viral loop). The card is
 * drawn from the game's OWN art: the 4×6 font, the No-Neon palette, and
 * Sorrel's idle frame, rasterized onto a 1200×630 canvas (the social-card
 * size) at 5× so every pixel stays crisp.
 *
 * Share path: Web Share API with the PNG attached (the native sheet on
 * mobile); falls back to a straight download on desktop browsers.
 */
import { PALETTE } from '../gfx/palette';
import { FONT_4x6 } from '../gfx/data/fontData';
import { PLAYER_FRAMES } from '../gfx/data/playerSprites';

export interface ClearCardOpts {
  levelName: string;
  /** world label, e.g. 'THORNWOOD' */
  world: string;
  timeMs: number;
  gems: number;
  gemTotal: number;
  tokens: number;
  flawless: boolean;
  newBest: boolean;
}

// logical pixel grid; ×5 = 1200×630, the standard social-card size
const CW = 240;
const CH = 126;
const SCALE = 5;

const FONT = FONT_4x6 as Record<string, string[]>;

function glyphOf(ch: string): string[] | undefined {
  return FONT[ch] ?? FONT[ch.toUpperCase()];
}

/** Draw text in the 4×6 font. Returns nothing; measures like PixelText.
 *  ADVANCE = 5 (4px glyph + 1px tracking) to match gfx/text.ts's readability. */
const ADVANCE = 5;
function drawText(
  ctx: CanvasRenderingContext2D, x: number, y: number, text: string,
  s: number, color: string, align: 'left' | 'center' = 'left', shadow = false,
): void {
  const total = Math.max(0, text.length * ADVANCE - 1) * s;
  let x0 = align === 'center' ? Math.round(x - total / 2) : x;
  const off = Math.max(1, Math.floor(s / 2));
  for (const ch of text) {
    const glyph = glyphOf(ch) ?? FONT['?'];
    for (let gy = 0; gy < 6; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        if (glyph[gy]?.[gx] !== '#') continue;
        if (shadow) {
          ctx.fillStyle = PALETTE.K;
          ctx.fillRect(x0 + gx * s + off, y + gy * s + off, s, s);
        }
        ctx.fillStyle = color;
        ctx.fillRect(x0 + gx * s, y + gy * s, s, s);
      }
    }
    x0 += ADVANCE * s;
  }
}

/** Rasterize a palette-coded sprite frame ('.' = transparent). */
function drawSprite(ctx: CanvasRenderingContext2D, rows: string[], x: number, y: number, s: number): void {
  for (let ry = 0; ry < rows.length; ry++) {
    for (let rx = 0; rx < rows[ry].length; rx++) {
      const code = rows[ry][rx];
      if (code === '.') continue;
      const hex = PALETTE[code];
      if (!hex) continue;
      ctx.fillStyle = hex;
      ctx.fillRect(x + rx * s, y + ry * s, s, s);
    }
  }
}

/** Render the clear card. Everything is in logical pixels ×SCALE. */
export function renderClearCard(o: ClearCardOpts): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CW * SCALE;
  canvas.height = CH * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const px = (x: number, y: number, w: number, h: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
  };

  // ---- backdrop: dusk sky, hill silhouette, dark ground -------------------
  px(0, 0, CW, CH, PALETTE.I);            // night indigo
  px(0, 58, CW, 20, PALETTE.i);           // slate ridge
  // a soft ridge line so the band reads as hills, not a stripe
  [8, 30, 55, 84, 120, 150, 178, 205, 228].forEach((hx, i) => {
    px(hx, 55 - (i % 3), 14, 4 + (i % 3), PALETTE.i);
  });
  px(0, 78, CW, CH - 78, PALETTE.K);      // ground
  px(0, 78, CW, 1, PALETTE.B);            // ground lip

  // drifting embers (hand-placed, warm)
  const embers: Array<[number, number, string]> = [
    [30, 30, 'o'], [52, 18, 'O'], [70, 44, 'o'], [96, 12, 'o'],
    [150, 8, 'o'], [200, 26, 'O'], [222, 44, 'o'], [120, 30, 'O'],
  ];
  for (const [ex, ey, code] of embers) px(ex, ey, 1, 1, PALETTE[code]);

  // ---- Sorrel, standing proud on the ground line --------------------------
  const fox = PLAYER_FRAMES.idle[0];
  const fs = 3; // 24×28 → 72×84
  drawSprite(ctx, fox, 14 * SCALE, (112 - fox.length * fs) * SCALE, fs * SCALE);
  // warm pool of light at the fox's feet
  px(18, 112, 60, 1, PALETTE.B);

  // ---- the right column ----------------------------------------------------
  const cx = 156; // column center
  drawText(ctx, cx * SCALE, 14 * SCALE, 'EMBERWILDS', 3 * SCALE, PALETTE.O, 'center', true);
  drawText(ctx, cx * SCALE, 36 * SCALE, 'BEACON RELIT!', SCALE, PALETTE.c, 'center');

  // level name auto-scales down when long (17+ chars would overflow at 2×)
  const name = o.levelName.toUpperCase();
  const ns = name.length > 16 ? 1 : 2;
  drawText(ctx, cx * SCALE, (ns > 1 ? 46 : 49) * SCALE, name, ns * SCALE, PALETTE.W, 'center', true);
  drawText(ctx, cx * SCALE, 62 * SCALE, o.world.toUpperCase(), SCALE, PALETTE.t, 'center');

  // stats
  const secs = (o.timeMs / 1000).toFixed(1);
  const rows: Array<[string, string, string]> = [
    ['TIME', `${secs}s${o.newBest ? '  BEST!' : ''}`, o.newBest ? PALETTE.O : PALETTE.y],
    ['GEMS', `${o.gems}/${o.gemTotal}`, PALETTE.y],
    ['EMBER TOKENS', `${o.tokens}/4`, PALETTE.y],
  ];
  rows.forEach(([label, value], i) => {
    const y = (74 + i * 12) * SCALE;
    drawText(ctx, 100 * SCALE, y, label, SCALE, PALETTE.W);
    drawText(ctx, 168 * SCALE, y, value, SCALE, rows[i][2]);
  });

  // flawless badge — the brag that makes the card worth posting
  if (o.flawless) {
    const bw = 'FLAWLESS'.length * 4 * 1 + 8;
    px(cx - bw / 2, 106, bw, 10, PALETTE.B);
    px(cx - bw / 2 + 1, 107, bw - 2, 8, PALETTE.K);
    drawText(ctx, cx * SCALE, 108 * SCALE, 'FLAWLESS', SCALE, PALETTE.O, 'center');
  }

  drawText(ctx, cx * SCALE, (o.flawless ? 120 : 114) * SCALE, 'PLAY AT EMBERWILDS.FUN', SCALE, PALETTE.b, 'center');
  return canvas;
}

export type ShareOutcome = 'shared' | 'saved' | 'cancelled' | 'failed';

/** Render + share (native sheet where available, download otherwise). */
export async function shareClearCard(o: ClearCardOpts): Promise<ShareOutcome> {
  try {
    const canvas = renderClearCard(o);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return 'failed';
    const file = new File([blob], 'emberwilds-clear.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: 'EMBERWILDS', text: `I relit the beacon in ${o.levelName}! emberwilds.fun` });
        return 'shared';
      } catch (err) {
        // the user closing the sheet is not an error
        if ((err as Error).name === 'AbortError') return 'cancelled';
        // fall through to download on any other share failure
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'emberwilds-clear.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return 'saved';
  } catch {
    return 'failed';
  }
}
