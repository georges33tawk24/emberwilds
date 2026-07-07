/**
 * World bosses (spec §7). Arena-based, multi-phase, every attack telegraphed,
 * a clear damage window, no health-sponge tedium. One class drives both bosses
 * off a config; the state machine (walk → telegraph → commit → stun → recover)
 * is shared, the *commit* differs per variant:
 *
 *   • Old Rustjaw (Ochre Canyon) — a clockwork crab-tank. CHARGES horizontally
 *     and can only be hurt when it over-commits, rams a wall, and its molten
 *     core pops open. Bait it into the wall, then stomp/shoot the core.
 *
 *   • The Drowned Warden (Mossgrave Ruins) — a moss-caked stone colossus. It
 *     LEAPS at the player in a heavy arc and slams down, cracking a ground
 *     shockwave outward; the landing leaves it winded (core open) — no wall
 *     needed. Dodge out from under the slam, then punish the recovery.
 *
 *   • The Cinder Shrike (The Cinderpeaks) — a ragged raptor of foundry
 *     scrap. It HOVERS above the arena raining ember volleys, then DIVES at
 *     the player and impales its beak in the ash — the vertical threat. Bait
 *     the dive, step aside, and punish while it is stuck.
 *
 * Pure, deterministic, Phaser-free; stepped at 120 Hz.
 */
import { STEP_S, TUNING } from '../data/tuning';
import { TILE } from '../data/levelTypes';
import { moveY, type Body, type SolidityQuery } from '../systems/physics';

export type BossState = 'intro' | 'walk' | 'telegraph' | 'charge' | 'stun' | 'recover' | 'dead';
export type BossVariant = 'rustjaw' | 'warden' | 'shrike';

export interface BossShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface BossConfig {
  name: string;
  /** sprite-sheet / anim-key prefix, e.g. 'rustjaw' → 'rustjaw_walk' */
  prefix: string;
  variant: BossVariant;
  maxHp: number;
  bodyW: number;
  bodyH: number;
  walkSpeed: number;
  telegraphS: [number, number, number];
  stunS: [number, number, number];
  walkS: [number, number, number];
  recoverS: number;
  /** projectiles spat during the walk, per phase */
  volleyCount: [number, number, number];
  shotSpeed: number;
  /** Rustjaw: horizontal charge speed per phase */
  chargeSpeed: [number, number, number];
  /** Warden: leap horizontal speed per phase */
  leapVX: [number, number, number];
  /** Warden: upward launch impulse for the slam leap */
  leapImpulse: number;
  /** Warden: ground-shockwave shot speed on landing */
  shockSpeed: number;
  /** Shrike: hover height above the arena floor (px; 0 = grounded boss) */
  hoverH: number;
  /** Shrike: downward dive launch speed per phase */
  diveSpeed: [number, number, number];
  /** Shrike: climb rate back to hover altitude */
  riseSpeed: number;
}

const RUSTJAW: BossConfig = {
  name: 'OLD RUSTJAW',
  prefix: 'rustjaw',
  variant: 'rustjaw',
  maxHp: 9,
  bodyW: 38,
  bodyH: 20,
  walkSpeed: 40,
  chargeSpeed: [230, 300, 370],
  telegraphS: [0.75, 0.6, 0.45],
  stunS: [2.4, 2.0, 1.7],
  walkS: [1.6, 1.3, 1.0],
  recoverS: 0.5,
  volleyCount: [0, 3, 5],
  shotSpeed: 150,
  leapVX: [0, 0, 0],
  leapImpulse: 0,
  shockSpeed: 0,
  hoverH: 0,
  diveSpeed: [0, 0, 0],
  riseSpeed: 0,
};

const WARDEN: BossConfig = {
  name: 'THE DROWNED WARDEN',
  prefix: 'warden',
  variant: 'warden',
  maxHp: 9,
  bodyW: 46,
  bodyH: 26,
  walkSpeed: 30,
  chargeSpeed: [0, 0, 0],
  telegraphS: [0.85, 0.7, 0.55],
  stunS: [2.3, 2.0, 1.7],
  walkS: [1.8, 1.5, 1.2],
  recoverS: 0.55,
  volleyCount: [0, 4, 6],
  shotSpeed: 130,
  leapVX: [130, 165, 200],
  leapImpulse: 640,
  shockSpeed: 165,
  hoverH: 0,
  diveSpeed: [0, 0, 0],
  riseSpeed: 0,
};

const SHRIKE: BossConfig = {
  name: 'THE CINDER SHRIKE',
  prefix: 'shrike',
  variant: 'shrike',
  maxHp: 9,
  bodyW: 40,
  bodyH: 22,
  walkSpeed: 55,
  chargeSpeed: [0, 0, 0],
  telegraphS: [0.8, 0.65, 0.5],
  stunS: [2.4, 2.0, 1.7],
  walkS: [2.0, 1.7, 1.4],
  recoverS: 0.6,
  volleyCount: [2, 4, 6],
  shotSpeed: 120,
  leapVX: [0, 0, 0],
  leapImpulse: 0,
  shockSpeed: 150,
  hoverH: 88,
  diveSpeed: [340, 400, 460],
  riseSpeed: 130,
};

export const BOSS_CONFIGS: Record<BossVariant, BossConfig> = {
  rustjaw: RUSTJAW,
  warden: WARDEN,
  shrike: SHRIKE,
};

export class BossSim {
  body: Body;
  hp: number;
  readonly maxHp: number;
  phase: 1 | 2 | 3 = 1;
  state: BossState = 'intro';
  facing: 1 | -1 = -1;
  alive = true;
  iframes = 0;
  hurtFlash = 0;
  shots: BossShot[] = [];
  /** set for one step when the boss slams (wall ram / ground slam) — shake+dust */
  slammed = false;
  animT = 0;
  private cfg: BossConfig;
  private stateTimer = 0;
  private didVolley = false;
  /** Warden: seconds airborne during the current leap (guards landing stun) */
  private airborneT = 0;
  /** Shrike: player x captured when the telegraph BEGINS — the dive aims
   *  here, so moving after the tell is the dodge */
  private commitTargetX = 0;
  /** captured each step: did the vertical solver land the body this step? */
  private landedThisStep = false;

  constructor(
    x: number,
    private floorY: number,
    private solidAt: SolidityQuery,
    variant: BossVariant = 'rustjaw',
  ) {
    this.cfg = BOSS_CONFIGS[variant];
    this.hp = this.cfg.maxHp;
    this.maxHp = this.cfg.maxHp;
    this.body = { x, y: floorY, w: this.cfg.bodyW, h: this.cfg.bodyH, vx: 0, vy: 0 };
    this.stateTimer = 1.0;
  }

  get name(): string {
    return this.cfg.name;
  }

  get variant(): BossVariant {
    return this.cfg.variant;
  }

  /** Is there a solid wall just past the boss's leading edge on the given side? */
  private wallAhead(dir: 1 | -1): boolean {
    const edge = this.body.x + dir * (this.body.w / 2 + 2);
    const tx = Math.floor(edge / TILE);
    const midTy = Math.floor((this.body.y - this.body.h / 2) / TILE);
    const s = this.solidAt(tx, midTy);
    return s === 'solid' || s === 'crack' || s === 'ice';
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

    // gravity keeps the boss grounded on the arena floor (and shapes leaps);
    // the Shrike defies it outside its dive and its impaled stun
    const hovering =
      this.cfg.hoverH > 0 && this.state !== 'charge' && this.state !== 'stun';
    if (hovering) {
      this.body.vy = 0;
      const targetY = this.floorY - this.cfg.hoverH;
      const dy = targetY - this.body.y;
      const stepMax = this.cfg.riseSpeed * STEP_S;
      this.body.y += Math.max(-stepMax, Math.min(stepMax, dy));
      this.landedThisStep = false;
    } else {
      this.body.vy = Math.min(this.body.vy + TUNING.gravity.fall * STEP_S, TUNING.gravity.max);
      const res = moveY(this.body, this.body.vy * STEP_S, this.solidAt, {});
      this.landedThisStep = res.landed;
      if (res.landed) this.body.vy = 0;
    }

    switch (this.state) {
      case 'intro':
        if (this.stateTimer <= 0) this.enterWalk();
        break;

      case 'walk': {
        this.facing = playerX < this.body.x ? -1 : 1;
        // amble toward the player unless a wall is right there
        if (!this.wallAhead(this.facing)) {
          this.body.x += this.facing * this.cfg.walkSpeed * STEP_S;
        }
        // phase 2+ spits a fan of shots partway through the walk
        if (!this.didVolley && this.stateTimer < this.cfg.walkS[this.phaseIndex()] * 0.5) {
          this.spitVolley(playerX);
          this.didVolley = true;
        }
        if (this.stateTimer <= 0) {
          this.state = 'telegraph';
          this.stateTimer = this.cfg.telegraphS[this.phaseIndex()];
          this.body.vx = 0;
          this.commitTargetX = playerX;
        }
        break;
      }

      case 'telegraph':
        this.facing = playerX < this.body.x ? -1 : 1;
        if (this.stateTimer <= 0) this.commit();
        break;

      case 'charge':
        // leapers and divers share the airborne handler; only Rustjaw rams
        if (this.cfg.variant === 'rustjaw') this.stepCharge();
        else this.stepLeap();
        break;

      case 'stun':
        this.body.vx = 0;
        if (this.stateTimer <= 0) {
          this.state = 'recover';
          this.stateTimer = this.cfg.recoverS;
        }
        break;

      case 'recover':
        if (this.stateTimer <= 0) this.enterWalk();
        break;
    }
  }

  /** telegraph → committed attack (variant-specific). */
  private commit(): void {
    this.state = 'charge';
    if (this.cfg.variant === 'shrike') {
      // dive to arrive exactly where the player stood at commit — steep,
      // fair, and sidesteppable. Horizontal speed is capped so late phases
      // stay a dodge, not a homing missile.
      this.airborneT = 0.2; // already airborne — arm the landing check now
      const dive = this.cfg.diveSpeed[this.phaseIndex()];
      const fallH = Math.max(24, this.floorY - this.body.y);
      const t = fallH / dive;
      const vx = (this.commitTargetX - this.body.x) / t;
      this.body.vx = Math.max(-dive * 0.8, Math.min(dive * 0.8, vx));
      this.body.vy = dive;
    } else if (this.cfg.variant === 'warden') {
      this.airborneT = 0;
      this.body.vy = -this.cfg.leapImpulse;
      this.body.vx = this.facing * this.cfg.leapVX[this.phaseIndex()];
    } else {
      this.body.vx = this.facing * this.cfg.chargeSpeed[this.phaseIndex()];
    }
  }

  /** Rustjaw: barrel forward until a wall stops it, then stun. */
  private stepCharge(): void {
    const dir = (this.body.vx > 0 ? 1 : -1) as 1 | -1;
    if (this.wallAhead(dir)) {
      this.enterStun();
    } else {
      this.body.x += this.body.vx * STEP_S;
    }
  }

  /** Warden: arc through the air; the slam landing is the damage opening. */
  private stepLeap(): void {
    this.airborneT += STEP_S;
    const dir = (this.body.vx >= 0 ? 1 : -1) as 1 | -1;
    if (!this.wallAhead(dir)) {
      this.body.x += this.body.vx * STEP_S;
    }
    // touched down after actually leaving the ground → slam
    if (this.airborneT > 0.12 && this.landedThisStep) {
      this.enterStun();
      this.spawnShockwave();
    }
  }

  private enterWalk(): void {
    this.state = 'walk';
    this.stateTimer = this.cfg.walkS[this.phaseIndex()];
    this.didVolley = false;
  }

  private enterStun(): void {
    this.state = 'stun';
    this.stateTimer = this.cfg.stunS[this.phaseIndex()];
    this.body.vx = 0;
    this.slammed = true;
  }

  /** A pair of low shots skittering out along the ground from the slam point;
   *  later phases add a rising splash burst overhead. */
  private spawnShockwave(): void {
    const gy = this.body.y - 6;
    const sp = this.cfg.shockSpeed;
    this.shots.push({ x: this.body.x - this.body.w / 2, y: gy, vx: -sp, vy: -34 });
    this.shots.push({ x: this.body.x + this.body.w / 2, y: gy, vx: sp, vy: -34 });
    if (this.phase >= 2) {
      this.shots.push({ x: this.body.x, y: this.body.y - this.body.h, vx: -sp * 0.4, vy: -120 });
      this.shots.push({ x: this.body.x, y: this.body.y - this.body.h, vx: sp * 0.4, vy: -120 });
    }
  }

  private spitVolley(playerX: number): void {
    const n = this.cfg.volleyCount[this.phaseIndex()];
    if (n <= 0) return;
    const dir = playerX < this.body.x ? -1 : 1;
    const cx = this.body.x + dir * (this.body.w / 2);
    const cy = this.body.y - this.body.h * 0.7;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      if (this.cfg.hoverH > 0) {
        // a hovering boss sheds embers downward in a spreading fan
        const ang = Math.PI * (0.3 + 0.4 * t); // between ~ +54° and +126°
        this.shots.push({
          x: this.body.x,
          y: this.body.y - this.body.h / 2,
          vx: Math.cos(ang) * this.cfg.shotSpeed,
          vy: Math.sin(ang) * this.cfg.shotSpeed,
        });
      } else {
        // an upward fan that rains down across the arena
        const ang = -Math.PI * (0.7 - 0.4 * t); // between ~ -126° and -54°
        this.shots.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * this.cfg.shotSpeed * dir,
          vy: Math.sin(ang) * this.cfg.shotSpeed,
        });
      }
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
      this.stateTimer = this.cfg.recoverS;
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
    const p = this.cfg.prefix;
    switch (this.state) {
      case 'telegraph': return `${p}_telegraph`;
      case 'charge': return `${p}_charge`;
      case 'stun': return `${p}_stun`;
      default: return this.hurtFlash > 0 ? `${p}_hurt` : `${p}_walk`;
    }
  }

  static tileFloorY(bottomTileY: number): number {
    return bottomTileY * TILE;
  }
}
