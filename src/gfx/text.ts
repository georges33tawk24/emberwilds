/**
 * Bitmap text rendered from the hand-authored 4×6 pixel font. Glyphs are
 * baked white and tinted per label, so one texture serves every color.
 */
import Phaser from 'phaser';
import { PALETTE } from './palette';

export const FONT_SHEET = 'font4x6';
export const GLYPH_W = 4;
export const GLYPH_H = 6;

/** Bake the font sheet. Call once at boot. */
export function registerFont(scene: Phaser.Scene, font: Record<string, string[]>): void {
  const entries = Object.entries(font);
  const PAD = 1;
  const cols = 16;
  const rows = Math.ceil(entries.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * (GLYPH_W + PAD) + PAD;
  canvas.height = rows * (GLYPH_H + PAD) + PAD;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';

  const tex = scene.textures.addCanvas(FONT_SHEET, canvas)!;
  entries.forEach(([ch, glyph], idx) => {
    const cx = PAD + (idx % cols) * (GLYPH_W + PAD);
    const cy = PAD + Math.floor(idx / cols) * (GLYPH_H + PAD);
    for (let y = 0; y < GLYPH_H; y++) {
      for (let x = 0; x < GLYPH_W; x++) {
        if (glyph[y]?.[x] === '#') ctx.fillRect(cx + x, cy + y, 1, 1);
      }
    }
    tex.add(glyphFrame(ch), 0, cx, cy, GLYPH_W, GLYPH_H);
  });
  tex.refresh();
}

function glyphFrame(ch: string): string {
  return `g.${ch}`;
}

export interface PixelTextOpts {
  scale?: number;
  color?: string; // palette code or #hex
  align?: 'left' | 'center' | 'right';
  /** 1px drop shadow in the darkest palette tone */
  shadow?: boolean;
}

export class PixelText extends Phaser.GameObjects.Container {
  private glyphs: Phaser.GameObjects.Image[] = [];
  private shadowGlyphs: Phaser.GameObjects.Image[] = [];
  private opts: Required<PixelTextOpts>;
  private content = '';

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, opts: PixelTextOpts = {}) {
    super(scene, x, y);
    this.opts = {
      scale: opts.scale ?? 1,
      color: opts.color ?? 'W',
      align: opts.align ?? 'left',
      shadow: opts.shadow ?? false,
    };
    scene.add.existing(this);
    this.setText(text);
  }

  get textWidth(): number {
    return this.content.length * GLYPH_W * this.opts.scale;
  }

  setColor(color: string): this {
    this.opts.color = color;
    const tint = tintOf(color);
    for (const g of this.glyphs) g.setTint(tint);
    return this;
  }

  setText(text: string): this {
    this.content = text;
    const s = this.opts.scale;
    const tint = tintOf(this.opts.color);
    const shadowTint = tintOf('K');
    const total = text.length * GLYPH_W * s;
    const x0 = this.opts.align === 'center' ? -total / 2 : this.opts.align === 'right' ? -total : 0;

    const shadowOff = Math.max(1, Math.round(s / 2));
    const need = text.length;
    while (this.glyphs.length < need) {
      if (this.opts.shadow) {
        const sh = this.scene.add.image(0, 0, FONT_SHEET, glyphFrame(' ')).setOrigin(0, 0);
        this.shadowGlyphs.push(sh);
        this.add(sh);
      }
      const img = this.scene.add.image(0, 0, FONT_SHEET, glyphFrame(' ')).setOrigin(0, 0);
      this.glyphs.push(img);
      this.add(img);
    }
    for (let i = 0; i < this.glyphs.length; i++) {
      const visible = i < need;
      const g = this.glyphs[i];
      g.setVisible(visible);
      const sh = this.shadowGlyphs[i];
      if (sh) sh.setVisible(visible && this.opts.shadow);
      if (!visible) continue;
      const ch = text[i];
      const frame = this.scene.textures.get(FONT_SHEET).has(glyphFrame(ch)) ? glyphFrame(ch) : glyphFrame('?');
      const gx = x0 + i * GLYPH_W * s;
      g.setTexture(FONT_SHEET, frame).setScale(s).setPosition(gx, 0).setTint(tint);
      if (sh) sh.setTexture(FONT_SHEET, frame).setScale(s).setPosition(gx + shadowOff, shadowOff).setTint(shadowTint);
    }
    return this;
  }
}

function tintOf(color: string): number {
  const hex = color.startsWith('#') ? color : PALETTE[color] ?? '#F7E6C4';
  return parseInt(hex.slice(1), 16);
}
