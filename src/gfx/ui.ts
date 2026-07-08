/**
 * PixelButton — the game's carved-wood plaque as an in-canvas button, in the
 * exact language of the touch controls (src/systems/touch.ts): K outline,
 * bevel-lit face, wood-grain streaks, pixel-cut corners, and a 1px sink when
 * pressed. Bakes one texture per (palette, size, lit) and shares it.
 */
import Phaser from 'phaser';
import { PixelText } from './text';

type Face = 'wood' | 'green' | 'iron';

const FACES: Record<Face, { face: string; hi: string; dark: string }> = {
  wood: { face: '#7a5a3e', hi: '#8a6a48', dark: '#4a362b' },
  green: { face: '#5f7d34', hi: '#74954a', dark: '#3e5a2e' },
  iron: { face: '#5a5450', hi: '#7c7a72', dark: '#3c3530' },
};
const K = '#2a1f1b';
const LIT = '#f2a03d';

/** Bake (or fetch) the plaque texture. Logical cells are 2px. */
function plaqueTex(scene: Phaser.Scene, w: number, h: number, face: Face, lit: boolean): string {
  const key = `plaque-${face}-${w}x${h}-${lit ? 'lit' : 'dim'}`;
  if (scene.textures.exists(key)) return key;
  const cell = 2;
  const gw = Math.round(w / cell);
  const gh = Math.round(h / cell);
  const canvas = document.createElement('canvas');
  canvas.width = gw * cell;
  canvas.height = gh * cell;
  const ctx = canvas.getContext('2d')!;
  const cols = FACES[face];
  const cut = 1; // pixel-cut corners
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const corner =
        (gx < cut && gy < cut) || (gx >= gw - cut && gy < cut) ||
        (gx < cut && gy >= gh - cut) || (gx >= gw - cut && gy >= gh - cut);
      if (corner) continue;
      const edge = gx === 0 || gx === gw - 1 || gy === 0 || gy === gh - 1;
      let col: string;
      if (edge) {
        col = lit ? LIT : K;
      } else if (gy === 1) {
        col = cols.hi; // bevel light along the top
      } else if (gy >= gh - 2) {
        col = cols.dark; // carved shadow along the bottom
      } else {
        col = cols.face;
        if ((gx + gy) % 5 === 0) col = cols.dark; // wood grain
        if ((gx * 3 + gy) % 11 === 0) col = cols.hi;
      }
      ctx.fillStyle = col;
      ctx.fillRect(gx * cell, gy * cell, cell, cell);
    }
  }
  scene.textures.addCanvas(key, canvas);
  return key;
}

export interface PixelButtonOpts {
  w: number;
  h: number;
  label: string;
  /** label scale (1 or 2) */
  scale?: number;
  face?: Face;
  onTap: () => void;
}

export class PixelButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private text: PixelText;
  private opts: PixelButtonOpts;
  private lit = false;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: PixelButtonOpts) {
    super(scene, x, y);
    this.opts = opts;
    const face = opts.face ?? 'wood';
    this.bg = scene.add.image(0, 0, plaqueTex(scene, opts.w, opts.h, face, false));
    this.text = new PixelText(scene, 0, -3 * (opts.scale ?? 1), opts.label, {
      scale: opts.scale ?? 1, color: 'W', align: 'center', shadow: true,
    });
    this.add([this.bg, this.text]);
    this.setSize(opts.w, opts.h + 6); // a little extra tap slack
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => {
      this.bg.y = 1;
      this.text.y = 1 - 3 * (opts.scale ?? 1);
    });
    this.on('pointerout', () => this.release());
    this.on('pointerup', () => {
      this.release();
      opts.onTap();
    });
    scene.add.existing(this);
  }

  private release(): void {
    this.bg.y = 0;
    this.text.y = -3 * (this.opts.scale ?? 1);
  }

  /** Amber-rim focus state (keyboard selection / emphasis). */
  setLit(on: boolean): this {
    if (on === this.lit) return this;
    this.lit = on;
    this.bg.setTexture(plaqueTex(this.scene, this.opts.w, this.opts.h, this.opts.face ?? 'wood', on));
    this.text.setColor(on ? 'O' : 'W');
    return this;
  }

  setLabel(label: string): this {
    this.text.setText(label);
    return this;
  }
}
