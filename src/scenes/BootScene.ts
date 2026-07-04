/** Bakes every texture from hand-authored pixel data, then hands off to Title. */
import Phaser from 'phaser';
import { registerSheet } from '../gfx/textures';
import { registerFont } from '../gfx/text';
import { PLAYER_FRAMES } from '../gfx/data/playerSprites';
import { ENEMY_FRAMES } from '../gfx/data/enemySprites';
import { ENEMY_FRAMES_CANYON } from '../gfx/data/enemySpritesCanyon';
import { ENEMY_FRAMES_MOSS } from '../gfx/data/enemySpritesMoss';
import { TILE_FRAMES } from '../gfx/data/tileSprites';
import { TILE_FRAMES_CANYON } from '../gfx/data/tileSpritesCanyon';
import { TILE_FRAMES_MOSS } from '../gfx/data/tileSpritesMoss';
import { PICKUP_FRAMES } from '../gfx/data/pickupSprites';
import { EXTRA_PICKUP_FRAMES } from '../gfx/data/extraSprites';
import { BOSS_FRAMES } from '../gfx/data/bossSprites';
import { STORY_FRAMES } from '../gfx/data/storySprites';
import { FONT_4x6 } from '../gfx/data/fontData';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    registerSheet(this, 'player', PLAYER_FRAMES);
    registerSheet(this, 'enemies', ENEMY_FRAMES);
    registerSheet(this, 'enemies-canyon', ENEMY_FRAMES_CANYON);
    registerSheet(this, 'enemies-moss', ENEMY_FRAMES_MOSS);
    registerSheet(this, 'tiles', TILE_FRAMES);
    registerSheet(this, 'tiles-canyon', TILE_FRAMES_CANYON);
    registerSheet(this, 'tiles-moss', TILE_FRAMES_MOSS);
    registerSheet(this, 'pickups', { ...PICKUP_FRAMES, ...EXTRA_PICKUP_FRAMES });
    registerSheet(this, 'boss', BOSS_FRAMES);
    registerSheet(this, 'story', STORY_FRAMES);
    registerFont(this, FONT_4x6);
    this.scene.start('Title');
  }
}
