/**
 * Bakes a parsed level's tile grid into chunked canvas textures (one draw
 * call per ~128-tile chunk). Autotiling picks grass-top / side / interior
 * variants by neighborhood; decor scatters deterministically on exposed
 * grass. Crack blocks are NOT baked — the scene manages them as sprites so
 * they can break.
 */
import Phaser from 'phaser';
import { colorOf, type PixelFrame } from './palette';
import { hash2 } from '../core/rng';
import { TILE } from '../data/levelTypes';
import type { ParsedLevel } from '../data/levelParser';
import type { FrameGroups } from './textures';

const CHUNK_TILES = 128;

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

const DECOR = ['decor_flower_a', 'decor_flower_b', 'decor_tuft_a', 'decor_tuft_b', 'decor_mushroom', 'decor_pebble'];

export function bakeTerrain(
  scene: Phaser.Scene,
  level: ParsedLevel,
  tiles: FrameGroups,
  keyPrefix: string,
): Phaser.GameObjects.Image[] {
  const images: Phaser.GameObjects.Image[] = [];
  const at = (tx: number, ty: number): string => {
    if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height) return 'X';
    return level.grid[ty][tx];
  };
  const solidish = (ch: string): boolean => '#XCI<>'.includes(ch);

  const pick = (group: string, tx: number, ty: number): PixelFrame => {
    const frames = tiles[group];
    return frames[Math.floor(hash2(tx, ty, 3) * frames.length)];
  };

  for (let cx0 = 0; cx0 < level.width; cx0 += CHUNK_TILES) {
    const cw = Math.min(CHUNK_TILES, level.width - cx0);
    const canvas = document.createElement('canvas');
    canvas.width = cw * TILE;
    canvas.height = level.height * TILE;
    const ctx = canvas.getContext('2d')!;

    for (let ty = 0; ty < level.height; ty++) {
      for (let i = 0; i < cw; i++) {
        const tx = cx0 + i;
        const ch = at(tx, ty);
        const px = i * TILE;
        const py = ty * TILE;
        switch (ch) {
          case '#': {
            const topOpen = !solidish(at(tx, ty - 1));
            if (topOpen) {
              drawFrame(ctx, pick('grass_top', tx, ty), px, py);
            } else if (!solidish(at(tx - 1, ty))) {
              drawFrame(ctx, (tiles.grass_left ?? tiles.dirt)[0], px, py);
            } else if (!solidish(at(tx + 1, ty))) {
              drawFrame(ctx, (tiles.grass_right ?? tiles.dirt)[0], px, py);
            } else {
              drawFrame(ctx, pick('dirt', tx, ty), px, py);
            }
            // scatter decor on open grass
            if (topOpen && at(tx, ty - 1) === '.' && hash2(tx, ty, 11) < 0.34) {
              const decorKey = DECOR[Math.floor(hash2(tx, ty, 17) * DECOR.length)];
              const frames = tiles[decorKey];
              if (frames) drawFrame(ctx, frames[0], px, py - TILE);
            }
            break;
          }
          case 'X':
            drawFrame(ctx, pick('stone', tx, ty), px, py);
            break;
          case 'I':
            // ice blocks — only Rimefell's sheet carries the group
            drawFrame(ctx, pick(tiles.ice ? 'ice' : 'stone', tx, ty), px, py);
            break;
          case '>':
          case '<': {
            // conveyor belts — only the Foundry's sheet carries the groups
            const grp = ch === '>' ? 'belt_r' : 'belt_l';
            drawFrame(ctx, pick(tiles[grp] ? grp : 'stone', tx, ty), px, py);
            break;
          }
          case '=':
            drawFrame(ctx, tiles.oneway[0], px, py);
            break;
          case '^':
            drawFrame(ctx, tiles.spike[0], px, py);
            break;
          default:
            break; // air and cracks handled elsewhere
        }
      }
    }

    const key = `${keyPrefix}-chunk-${cx0}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
    images.push(scene.add.image(cx0 * TILE, 0, key).setOrigin(0).setDepth(-10));
  }
  return images;
}
