/**
 * Enemy simulations — pure, deterministic, stepped at 120 Hz.
 * Archetypes (spec §5): walker (beetle), hopper (toad), flyer/diver (owl),
 * armored roller (thorn-burr). Every attack telegraphs; every enemy has an
 * honest counter.
 */
import { STEP_S, TUNING } from '../data/tuning';
import { TILE } from '../data/levelTypes';
import {
  groundBelow,
  moveX,
  moveY,
  type Body,
  type SolidityQuery,
} from '../systems/physics';

const T = TUNING.enemies;

export type EnemyKind = 'beetle' | 'toad' | 'owl' | 'burr';

export interface EnemySim {
  kind: EnemyKind;
  body: Body;
  hp: number;
  facing: 1 | -1;
  /** stompable from above? (burrs are not) */
  stompable: boolean;
  alive: boolean;
  /** squashed corpse timer (beetles) */
  flatTimer: number;
  /** stun from ground-pound shockwave */
  stun: number;
  /** frozen-into-ice timer; while > 0 the enemy is inert and standable */
  frozen: number;
  /** animation hint for presentation */
  anim: string;
  animT: number;
  step(playerX: number, playerY: number, solidAt: SolidityQuery): void;
  /** apply damage; returns true if it died */
  damage(n: number): boolean;
  squash(): void;
  freeze(): void;
}

abstract class BaseEnemy implements EnemySim {
  abstract kind: EnemyKind;
  body: Body;
  hp = 1;
  facing: 1 | -1 = -1;
  stompable = true;
  alive = true;
  flatTimer = 0;
  stun = 0;
  frozen = 0;
  anim = 'walk';
  animT = 0;

  constructor(x: number, y: number, w: number, h: number) {
    this.body = { x, y, w, h, vx: 0, vy: 0 };
  }

  step(playerX: number, playerY: number, solidAt: SolidityQuery): void {
    this.animT += STEP_S;
    if (this.flatTimer > 0) {
      this.flatTimer -= STEP_S;
      if (this.flatTimer <= 0) this.alive = false;
      return;
    }
    if (this.frozen > 0) {
      // inert ice block — no movement, no gravity, just count down and thaw
      this.frozen -= STEP_S;
      this.body.vx = 0;
      this.body.vy = 0;
      return;
    }
    if (this.stun > 0) {
      this.stun -= STEP_S;
      this.applyGravity(solidAt);
      return;
    }
    this.tick(playerX, playerY, solidAt);
  }

  protected abstract tick(px: number, py: number, solidAt: SolidityQuery): void;

  protected applyGravity(solidAt: SolidityQuery): void {
    this.body.vy = Math.min(this.body.vy + TUNING.gravity.fall * STEP_S, TUNING.gravity.max);
    const res = moveY(this.body, this.body.vy * STEP_S, solidAt, {});
    if (res.landed) this.body.vy = 0;
  }

  damage(n: number): boolean {
    this.hp -= n;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  squash(): void {
    this.flatTimer = T.flatDespawnMs / 1000;
    this.anim = 'flat';
    this.body.vx = 0;
    this.body.vy = 0;
  }

  freeze(): void {
    this.frozen = TUNING.powers.frost.freezeS;
    this.body.vx = 0;
    this.body.vy = 0;
  }
}

/** Patrols; turns at walls and ledges. */
class Beetle extends BaseEnemy {
  kind = 'beetle' as const;
  constructor(x: number, y: number) {
    super(x, y, 12, 10);
    this.hp = T.beetle.hp;
  }
  protected tick(_px: number, _py: number, solidAt: SolidityQuery): void {
    this.anim = 'walk';
    this.body.vx = this.facing * T.beetle.speed;
    const hitWall = moveX(this.body, this.body.vx * STEP_S, solidAt);
    this.applyGravity(solidAt);
    // turn at walls and at ledges (probe one tile ahead below the feet)
    const aheadX = this.body.x + this.facing * (this.body.w / 2 + 2);
    const footTy = Math.floor((this.body.y + 2) / TILE);
    const aheadTx = Math.floor(aheadX / TILE);
    const groundAhead = solidAt(aheadTx, footTy);
    if (hitWall || (groundAhead === 'empty' && groundBelow(this.body, solidAt) !== 'none')) {
      this.facing = this.facing === 1 ? -1 : 1;
    }
  }
}

/** Rests, then hops toward the player when close. */
class Toad extends BaseEnemy {
  kind = 'toad' as const;
  private rest = T.toad.restMs / 1000;
  constructor(x: number, y: number) {
    super(x, y, 12, 12);
    this.hp = T.toad.hp;
    this.anim = 'sit';
  }
  protected tick(px: number, _py: number, solidAt: SolidityQuery): void {
    const grounded = groundBelow(this.body, solidAt) !== 'none' && this.body.vy >= 0;
    if (grounded) {
      this.body.vx = 0;
      this.anim = 'sit';
      this.rest -= STEP_S;
      const dist = Math.abs(px - this.body.x);
      if (this.rest <= 0 && dist < T.toad.aggroRange) {
        this.facing = px < this.body.x ? -1 : 1;
        this.body.vx = this.facing * T.toad.hopVx;
        this.body.vy = T.toad.hopVy;
        this.rest = T.toad.restMs / 1000;
        this.anim = 'leap';
      }
    } else {
      this.anim = 'leap';
    }
    moveX(this.body, this.body.vx * STEP_S, solidAt);
    this.applyGravity(solidAt);
  }
}

/** Bobs on a sine around its anchor; dives when the player is below. */
class Owl extends BaseEnemy {
  kind = 'owl' as const;
  private anchorY: number;
  private t = 0;
  private mode: 'fly' | 'dive' | 'return' = 'fly';
  constructor(x: number, y: number) {
    super(x, y, 14, 12);
    this.hp = T.owl.hp;
    this.anchorY = y;
    this.anim = 'fly';
  }
  protected tick(px: number, py: number, solidAt: SolidityQuery): void {
    this.t += STEP_S;
    const o = T.owl;
    if (this.mode === 'fly') {
      this.anim = 'fly';
      this.body.y = this.anchorY + Math.sin(this.t * Math.PI * 2 * o.bobHz) * o.bobAmp;
      this.facing = px < this.body.x ? -1 : 1;
      const dy = py - this.body.y;
      if (Math.abs(px - this.body.x) < o.diveRangeX && dy > 8 && dy < o.diveRangeY) {
        this.mode = 'dive';
        this.anim = 'dive';
      }
    } else if (this.mode === 'dive') {
      this.anim = 'dive';
      const res = moveY(this.body, o.diveSpeed * STEP_S, solidAt, {});
      if (res.hit || this.body.y > this.anchorY + o.diveRangeY) this.mode = 'return';
    } else {
      this.anim = 'fly';
      this.body.y -= o.returnSpeed * STEP_S;
      if (this.body.y <= this.anchorY) {
        this.body.y = this.anchorY;
        this.mode = 'fly';
      }
    }
  }
}

/** Armored spiky roller — cannot be stomped; shoot it (3 hp). */
class Burr extends BaseEnemy {
  kind = 'burr' as const;
  constructor(x: number, y: number) {
    super(x, y, 12, 12);
    this.hp = T.burr.hp;
    this.stompable = false;
    this.anim = 'roll';
  }
  protected tick(_px: number, _py: number, solidAt: SolidityQuery): void {
    this.anim = 'roll';
    this.body.vx = this.facing * T.burr.speed;
    const hitWall = moveX(this.body, this.body.vx * STEP_S, solidAt);
    this.applyGravity(solidAt);
    const aheadX = this.body.x + this.facing * (this.body.w / 2 + 2);
    const footTy = Math.floor((this.body.y + 2) / TILE);
    const groundAhead = solidAt(Math.floor(aheadX / TILE), footTy);
    if (hitWall || (groundAhead === 'empty' && groundBelow(this.body, solidAt) !== 'none')) {
      this.facing = this.facing === 1 ? -1 : 1;
    }
  }
}

export function createEnemy(type: string, x: number, y: number): EnemySim | null {
  switch (type) {
    case 'E': return new Beetle(x, y);
    case 'T': return new Toad(x, y);
    case 'O': return new Owl(x, y);
    case 'A': return new Burr(x, y);
    default: return null;
  }
}
