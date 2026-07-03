/**
 * Old Rustjaw — the Ochre Canyon boss AI (spec §7). Arena-based, multi-phase,
 * every attack telegraphed, a clear damage window, no health-sponge tedium.
 * It remixes the world's momentum theme: it CHARGES across the arena, and the
 * only way to hurt it is when it over-commits, rams the wall, and its molten
 * core pops open — stomp or shoot the core during the stun window.
 *
 * Pure, deterministic, Phaser-free; stepped at 120 Hz.
 */
import { STEP_S, TUNING } from '../data/tuning';
import { TILE } from '../data/levelTypes';
import { moveY, type Body, type SolidityQuery } from '../systems/physics';

export type BossState = 'intro' | 'walk' | 'telegraph' | 'charge' | 'stun' | 'recover' | 'dead';

export interface BossShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const CFG = {
  maxHp: 9,
  bodyW: 38,
  bodyH: 20,
  walkSpeed: 40,
  chargeSpeed: [230, 300, 370], // per phase
  telegraphS: [0.75, 0.6, 0.45],
  stunS: [2.4, 2.0, 1.7],
  walkS: [1.6, 1.3, 1.0],
  recoverS: 0.5,
  volleyCount: [0, 3, 5], // projectiles spat during walk, per phase
  shotSpeed: 150,
};

export class BossSim {
  body: Body;
  hp = CFG.maxHp;
  readonly maxHp = CFG.maxHp;
  phase: 1 | 2 | 3 = 1;
  state: BossState = 'intro';
  facing: 1 | -1 = -1;
  alive = true;
  iframes = 0;
  hurtFlash = 0;
  shots: BossShot[] = [];
  /** set for one step when the boss slams a wall (for shake/dust) */
  slammed = false;
  animT = 0;
  private stateTimer = 0;
  private didVolley = false;

  constructor(
    x: number,
    private floorY: number,
    private solidAt: SolidityQuery,
  ) {
    this.body = { x, y: floorY, w: CFG.bodyW, h: CFG.bodyH, vx: 0, vy: 0 };
    this.stateTimer = 1.0;
  }

  /** Is there a solid wall just past the boss's leading edge on the given side? */
  private wallAhead(dir: 1 | -1): boolean {
    const edge = this.body.x + dir * (this.body.w / 2 + 2);
    const tx = Math.floor(edge / TILE);
    const midTy = Math.floor((this.body.y - this.body.h / 2) / TILE);
    const s = this.solidAt(tx, midTy);
    return s === 'solid' || s === 'crack';
  }

  get damageable(): boolean {
    return this.state === 'stun';
  }

  /** top of the exposed core (stomp/shoot target during stun). */
  get coreY(): number {
    return this.body.y - this.body.h;
  }

  private phaseIndex(): number {
    return this.phase - 1;
  }

  step(playerX: number, _playerY: number): void {
    this.animT += STEP_S;
    this.shots.length = 0;
    this.slammed = false;
    this.iframes = Math.max(0, this.iframes - STEP_S);
    this.hurtFlash = Math.max(0, this.hurtFlash - STEP_S);
    this.stateTimer -= STEP_S;
    if (this.state === 'dead') return;

    // gravity keeps the boss grounded on the arena floor
    this.body.vy = Math.min(this.body.vy + TUNING.gravity.fall * STEP_S, TUNING.gravity.max);
    const res = moveY(this.body, this.body.vy * STEP_S, this.solidAt, {});
    if (res.landed) this.body.vy = 0;

    switch (this.state) {
      case 'intro':
        if (this.stateTimer <= 0) this.enterWalk();
        break;

      case 'walk': {
        this.facing = playerX < this.body.x ? -1 : 1;
        // amble toward the player unless a wall is right there
        if (!this.wallAhead(this.facing)) {
          this.body.x += this.facing * CFG.walkSpeed * STEP_S;
        }
        // phase 2+ spits a fan of shots partway through the walk
        if (!this.didVolley && this.stateTimer < CFG.walkS[this.phaseIndex()] * 0.5) {
          this.spitVolley(playerX);
          this.didVolley = true;
        }
        if (this.stateTimer <= 0) {
          this.state = 'telegraph';
          this.stateTimer = CFG.telegraphS[this.phaseIndex()];
          this.body.vx = 0;
        }
        break;
      }

      case 'telegraph':
        this.facing = playerX < this.body.x ? -1 : 1;
        if (this.stateTimer <= 0) {
          this.state = 'charge';
          this.body.vx = this.facing * CFG.chargeSpeed[this.phaseIndex()];
        }
        break;

      case 'charge': {
        const dir = (this.body.vx > 0 ? 1 : -1) as 1 | -1;
        // ram into a wall → stun (the opening to hit the core)
        if (this.wallAhead(dir)) {
          this.enterStun();
        } else {
          this.body.x += this.body.vx * STEP_S;
        }
        break;
      }

      case 'stun':
        this.body.vx = 0;
        if (this.stateTimer <= 0) {
          this.state = 'recover';
          this.stateTimer = CFG.recoverS;
        }
        break;

      case 'recover':
        if (this.stateTimer <= 0) this.enterWalk();
        break;
    }
  }

  private enterWalk(): void {
    this.state = 'walk';
    this.stateTimer = CFG.walkS[this.phaseIndex()];
    this.didVolley = false;
  }

  private enterStun(): void {
    this.state = 'stun';
    this.stateTimer = CFG.stunS[this.phaseIndex()];
    this.body.vx = 0;
    this.slammed = true;
  }

  private spitVolley(playerX: number): void {
    const n = CFG.volleyCount[this.phaseIndex()];
    if (n <= 0) return;
    const dir = playerX < this.body.x ? -1 : 1;
    const cx = this.body.x + dir * (this.body.w / 2);
    const cy = this.body.y - this.body.h * 0.7;
    // an upward fan that rains down across the arena
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const ang = -Math.PI * (0.7 - 0.4 * t); // between ~ -126° and -54°
      this.shots.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * CFG.shotSpeed * dir,
        vy: Math.sin(ang) * CFG.shotSpeed,
      });
    }
  }

  /** Apply damage to the exposed core. Returns true if it died. Only lands
   *  while stunned; ignored otherwise (the armor deflects). */
  hitCore(n: number): boolean {
    if (!this.damageable || this.iframes > 0 || this.state === 'dead') return false;
    this.hp -= n;
    this.iframes = 0.25;
    this.hurtFlash = 0.18;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
      this.alive = false;
      return true;
    }
    // phase transitions
    const newPhase = this.hp > 6 ? 1 : this.hp > 3 ? 2 : 3;
    if (newPhase !== this.phase) {
      this.phase = newPhase as 1 | 2 | 3;
      // a hit that changes phase ends the stun early and re-engages
      this.state = 'recover';
      this.stateTimer = CFG.recoverS;
    }
    return false;
  }

  /** Does this AABB (player) overlap the boss body right now? */
  overlaps(px: number, py: number, pw: number, ph: number): boolean {
    return (
      Math.abs(px - this.body.x) * 2 < pw + this.body.w &&
      py - ph < this.body.y &&
      this.body.y - this.body.h < py
    );
  }

  animKey(): string {
    switch (this.state) {
      case 'telegraph': return 'rustjaw_telegraph';
      case 'charge': return 'rustjaw_charge';
      case 'stun': return 'rustjaw_stun';
      default: return this.hurtFlash > 0 ? 'rustjaw_hurt' : 'rustjaw_walk';
    }
  }

  static tileFloorY(bottomTileY: number): number {
    return bottomTileY * TILE;
  }
}
