/** Slingblast projectiles — pooled, deterministic, tile-aware. */
import { STEP_S, TUNING } from '../data/tuning';
import { TILE } from '../data/levelTypes';
import type { SolidityQuery } from '../systems/physics';
import type { ShotKind } from './playerSim';

export interface ProjectileSim {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  charged: boolean;
  kind: ShotKind;
  damage: number;
  /** passes through enemies instead of dying on first contact */
  pierce: boolean;
  /** freezes the enemy it hits into a standable ice block */
  freeze: boolean;
  life: number;
  /** set on the step the projectile dies against a tile (for impact FX) */
  hitTile: boolean;
}

function specOf(kind: ShotKind): { speed: number; lifeS: number; damage: number } {
  switch (kind) {
    case 'charge': return TUNING.weapons.charge;
    case 'ember': return TUNING.weapons.ember;
    case 'frost': return TUNING.weapons.frost;
    default: return TUNING.weapons.pellet; // pellet + scatter
  }
}

export function fireProjectile(
  p: ProjectileSim,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  charged: boolean,
  kind: ShotKind,
): void {
  const spec = specOf(kind);
  p.active = true;
  p.x = x;
  p.y = y;
  p.vx = dirX * spec.speed;
  p.vy = dirY * spec.speed;
  p.charged = charged;
  p.kind = kind;
  p.damage = spec.damage;
  p.pierce = charged || kind === 'ember'; // charge and fire punch through
  p.freeze = kind === 'frost';
  p.life = spec.lifeS;
  p.hitTile = false;
}

export function stepProjectile(p: ProjectileSim, solidAt: SolidityQuery): void {
  if (!p.active) return;
  p.hitTile = false;
  p.life -= STEP_S;
  if (p.life <= 0) {
    p.active = false;
    return;
  }
  // sub-step so fast shots can't skip a tile
  const steps = Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy)) * STEP_S / (TILE / 2)) || 1;
  for (let i = 0; i < steps; i++) {
    p.x += (p.vx * STEP_S) / steps;
    p.y += (p.vy * STEP_S) / steps;
    const s = solidAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE));
    if (s === 'solid' || s === 'crack') {
      p.active = false;
      p.hitTile = true;
      return;
    }
  }
}
