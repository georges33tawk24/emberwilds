/**
 * Sprite-data lint (art bible: "all rows of a frame are exactly the frame
 * width; only palette codes and '.' are legal — validated in CI").
 * Uneven rows silently corrupt the baked atlas; an unknown code renders as a
 * hole. Every hand-authored pixel module is checked here.
 */
import { describe, it, expect } from 'vitest';
import { PALETTE } from '../src/gfx/palette';
import { PLAYER_FRAMES } from '../src/gfx/data/playerSprites';
import { ENEMY_FRAMES } from '../src/gfx/data/enemySprites';
import { ENEMY_FRAMES_CANYON } from '../src/gfx/data/enemySpritesCanyon';
import { ENEMY_FRAMES_MOSS } from '../src/gfx/data/enemySpritesMoss';
import { ENEMY_FRAMES_ASH } from '../src/gfx/data/enemySpritesAsh';
import { TILE_FRAMES } from '../src/gfx/data/tileSprites';
import { TILE_FRAMES_CANYON } from '../src/gfx/data/tileSpritesCanyon';
import { TILE_FRAMES_MOSS } from '../src/gfx/data/tileSpritesMoss';
import { TILE_FRAMES_ASH } from '../src/gfx/data/tileSpritesAsh';
import { PICKUP_FRAMES } from '../src/gfx/data/pickupSprites';
import { EXTRA_PICKUP_FRAMES } from '../src/gfx/data/extraSprites';
import { BOSS_FRAMES } from '../src/gfx/data/bossSprites';
import { STORY_FRAMES } from '../src/gfx/data/storySprites';

const SHEETS: Record<string, Record<string, string[][]>> = {
  player: PLAYER_FRAMES,
  enemies: ENEMY_FRAMES,
  'enemies-canyon': ENEMY_FRAMES_CANYON,
  'enemies-moss': ENEMY_FRAMES_MOSS,
  'enemies-ash': ENEMY_FRAMES_ASH,
  tiles: TILE_FRAMES,
  'tiles-canyon': TILE_FRAMES_CANYON,
  'tiles-moss': TILE_FRAMES_MOSS,
  'tiles-ash': TILE_FRAMES_ASH,
  pickups: PICKUP_FRAMES,
  'extra-pickups': EXTRA_PICKUP_FRAMES,
  boss: BOSS_FRAMES,
  story: STORY_FRAMES,
};

const LEGAL = new Set([...Object.keys(PALETTE), '.']);

describe.each(Object.entries(SHEETS))('sheet %s', (_sheet, groups) => {
  it.each(Object.entries(groups))('group %s has consistent, legal frames', (group, frames) => {
    expect(frames.length, `${group}: empty group`).toBeGreaterThan(0);
    const w = frames[0][0].length;
    const h = frames[0].length;
    frames.forEach((frame, fi) => {
      expect(frame.length, `${group}.${fi}: height ${frame.length} != ${h}`).toBe(h);
      frame.forEach((row, ri) => {
        expect(row.length, `${group}.${fi} row ${ri}: width ${row.length} != ${w}`).toBe(w);
        for (const ch of row) {
          expect(LEGAL.has(ch), `${group}.${fi} row ${ri}: illegal code '${ch}'`).toBe(true);
        }
      });
    });
  });
});
