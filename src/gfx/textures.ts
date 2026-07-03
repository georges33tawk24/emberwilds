/**
 * Runtime texture baking — converts hand-authored pixel data (string rows of
 * palette codes) into packed canvas textures with named frames. One canvas
 * per sheet, frames padded 1px to prevent bleed. This is the in-engine
 * equivalent of the Aseprite → atlas pipeline described in spec §13.
 */
import Phaser from 'phaser';
import { colorOf, type PixelFrame } from './palette';

export type FrameGroups = Record<string, PixelFrame[]>;

function drawFrame(ctx: CanvasRenderingContext2D, frame: PixelFrame, ox: number, oy: number): void {
  for (let y = 0; y < frame.length; y++) {
    const row = frame[y];
    for (let x = 0; x < row.length; x++) {
      const color = colorOf(row[x]);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

/**
 * Bake a sheet of frame groups into a texture. Frames are addressable as
 * `${group}.${index}` via setTexture(sheetKey, frameName).
 */
export function registerSheet(scene: Phaser.Scene, sheetKey: string, groups: FrameGroups): void {
  const PAD = 1;
  let width = 0;
  let height = PAD;
  for (const frames of Object.values(groups)) {
    const fw = frames[0][0].length;
    const fh = frames[0].length;
    width = Math.max(width, PAD + frames.length * (fw + PAD));
    height += fh + PAD;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(width, 1);
  canvas.height = Math.max(height, 1);
  const ctx = canvas.getContext('2d')!;

  const tex = scene.textures.addCanvas(sheetKey, canvas);
  if (!tex) throw new Error(`texture key collision: ${sheetKey}`);

  let cy = PAD;
  for (const [name, frames] of Object.entries(groups)) {
    const fw = frames[0][0].length;
    const fh = frames[0].length;
    let cx = PAD;
    frames.forEach((frame, i) => {
      drawFrame(ctx, frame, cx, cy);
      tex.add(`${name}.${i}`, 0, cx, cy, fw, fh);
      cx += fw + PAD;
    });
    cy += fh + PAD;
  }
  tex.refresh();
}

/** Pick the frame name for a looping animation at elapsed time t. */
export function animFrame(group: string, count: number, t: number, fps: number, loop = true): string {
  let i = Math.floor(t * fps);
  i = loop ? i % count : Math.min(i, count - 1);
  return `${group}.${i}`;
}

/** Convenience: does this sheet group exist with at least one frame? */
export function frameCount(groups: FrameGroups, key: string): number {
  return groups[key]?.length ?? 0;
}
