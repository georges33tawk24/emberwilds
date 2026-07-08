/** Bakes every texture from hand-authored pixel data, then hands off to Title. */
import Phaser from 'phaser';
import { registerSheet } from '../gfx/textures';
import { registerFont } from '../gfx/text';
import { PLAYER_FRAMES } from '../gfx/data/playerSprites';
import { ENEMY_FRAMES } from '../gfx/data/enemySprites';
import { ENEMY_FRAMES_CANYON } from '../gfx/data/enemySpritesCanyon';
import { ENEMY_FRAMES_MOSS } from '../gfx/data/enemySpritesMoss';
import { ENEMY_FRAMES_ASH } from '../gfx/data/enemySpritesAsh';
import { ENEMY_FRAMES_RIME } from '../gfx/data/enemySpritesRime';
import { ENEMY_FRAMES_FOUNDRY } from '../gfx/data/enemySpritesFoundry';
import { TILE_FRAMES } from '../gfx/data/tileSprites';
import { TILE_FRAMES_CANYON } from '../gfx/data/tileSpritesCanyon';
import { TILE_FRAMES_MOSS } from '../gfx/data/tileSpritesMoss';
import { TILE_FRAMES_ASH } from '../gfx/data/tileSpritesAsh';
import { TILE_FRAMES_RIME } from '../gfx/data/tileSpritesRime';
import { TILE_FRAMES_FOUNDRY } from '../gfx/data/tileSpritesFoundry';
import { PICKUP_FRAMES } from '../gfx/data/pickupSprites';
import { EXTRA_PICKUP_FRAMES } from '../gfx/data/extraSprites';
import { BOSS_FRAMES } from '../gfx/data/bossSprites';
import { STORY_FRAMES } from '../gfx/data/storySprites';
import { FONT_4x6 } from '../gfx/data/fontData';
import { buildStyledFrames, PLAYER_TEX } from '../systems/cosmetics';
import type { SaveManager } from '../systems/save';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    registerSheet(this, 'player', PLAYER_FRAMES);
    registerSheet(this, 'enemies', ENEMY_FRAMES);
    registerSheet(this, 'enemies-canyon', ENEMY_FRAMES_CANYON);
    registerSheet(this, 'enemies-moss', ENEMY_FRAMES_MOSS);
    registerSheet(this, 'enemies-ash', ENEMY_FRAMES_ASH);
    registerSheet(this, 'enemies-rime', ENEMY_FRAMES_RIME);
    registerSheet(this, 'enemies-foundry', ENEMY_FRAMES_FOUNDRY);
    registerSheet(this, 'tiles', TILE_FRAMES);
    registerSheet(this, 'tiles-canyon', TILE_FRAMES_CANYON);
    registerSheet(this, 'tiles-moss', TILE_FRAMES_MOSS);
    registerSheet(this, 'tiles-ash', TILE_FRAMES_ASH);
    registerSheet(this, 'tiles-rime', TILE_FRAMES_RIME);
    registerSheet(this, 'tiles-foundry', TILE_FRAMES_FOUNDRY);
    registerSheet(this, 'pickups', { ...PICKUP_FRAMES, ...EXTRA_PICKUP_FRAMES });
    registerSheet(this, 'boss', BOSS_FRAMES);
    registerSheet(this, 'story', STORY_FRAMES);
    registerFont(this, FONT_4x6);
    // the wardrobe-styled fox — every fox sprite in the game draws from this
    const save = this.registry.get('save') as SaveManager;
    registerSheet(this, PLAYER_TEX, buildStyledFrames(save.data.style));
    this.scene.start('Title');
  }
}
