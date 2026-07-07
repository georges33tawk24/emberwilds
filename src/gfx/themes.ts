/**
 * World theme registry — one place that binds a level's `theme` key to its
 * tileset, enemy skins, music, and display label. Adding a world = one entry
 * here plus its data modules.
 */
import type { FrameGroups } from './textures';
import type { Song } from '../audio/songTypes';
import { TILE_FRAMES } from './data/tileSprites';
import { TILE_FRAMES_CANYON } from './data/tileSpritesCanyon';
import { TILE_FRAMES_MOSS } from './data/tileSpritesMoss';
import { TILE_FRAMES_ASH } from './data/tileSpritesAsh';
import { ENEMY_FRAMES } from './data/enemySprites';
import { ENEMY_FRAMES_CANYON } from './data/enemySpritesCanyon';
import { ENEMY_FRAMES_MOSS } from './data/enemySpritesMoss';
import { ENEMY_FRAMES_ASH } from './data/enemySpritesAsh';
import { THORNWOOD_SONG } from '../audio/songs';
import { CANYON_SONG } from '../audio/canyonSong';
import { MOSS_SONG } from '../audio/mossSong';
import { ASH_SONG } from '../audio/ashSong';

export interface WorldTheme {
  key: string;
  /** display name, e.g. 'THORNWOOD' */
  label: string;
  worldNum: number;
  tiles: FrameGroups;
  tileSheet: string;
  enemies: FrameGroups;
  enemySheet: string;
  song: Song;
}

export const THEMES: Record<string, WorldTheme> = {
  thornwood: {
    key: 'thornwood',
    label: 'THORNWOOD',
    worldNum: 1,
    tiles: TILE_FRAMES as FrameGroups,
    tileSheet: 'tiles',
    enemies: ENEMY_FRAMES as FrameGroups,
    enemySheet: 'enemies',
    song: THORNWOOD_SONG as Song,
  },
  canyon: {
    key: 'canyon',
    label: 'OCHRE CANYON',
    worldNum: 2,
    tiles: TILE_FRAMES_CANYON as FrameGroups,
    tileSheet: 'tiles-canyon',
    enemies: ENEMY_FRAMES_CANYON as FrameGroups,
    enemySheet: 'enemies-canyon',
    song: CANYON_SONG as Song,
  },
  mossgrave: {
    key: 'mossgrave',
    label: 'MOSSGRAVE RUINS',
    worldNum: 3,
    tiles: TILE_FRAMES_MOSS as FrameGroups,
    tileSheet: 'tiles-moss',
    enemies: ENEMY_FRAMES_MOSS as FrameGroups,
    enemySheet: 'enemies-moss',
    song: MOSS_SONG as Song,
  },
  cinder: {
    key: 'cinder',
    label: 'THE CINDERPEAKS',
    worldNum: 4,
    tiles: TILE_FRAMES_ASH as FrameGroups,
    tileSheet: 'tiles-ash',
    enemies: ENEMY_FRAMES_ASH as FrameGroups,
    enemySheet: 'enemies-ash',
    song: ASH_SONG as Song,
  },
};

export function themeOf(key: string): WorldTheme {
  return THEMES[key] ?? THEMES.thornwood;
}
