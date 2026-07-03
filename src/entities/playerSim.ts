/**
 * Sorrel's character controller — the crown jewel (spec §4, §12).
 *
 * Pure, deterministic, Phaser-free. Steps at a fixed 120 Hz against a tile
 * solidity query. All feel systems live here: coyote time, jump buffering,
 * variable jump height, apex hang, asymmetric gravity, corner correction,
 * glide, wall slide/jump, ground-pound, roll, stomp bounce, springs,
 * hurt/knockback/i-frames.
 */
import { STEP_S, TUNING } from '../data/tuning';
import type { EventBus } from '../core/events';
import {
  groundBelow,
  inWater,
  moveX,
  moveY,
  touchesSpikes,
  wallContact,
  type Body,
  type SolidityQuery,
} from '../systems/physics';

export interface InputFrame {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  fireHeld: boolean;
  firePressed: boolean;
  poundPressed: boolean;
}

export const EMPTY_INPUT: InputFrame = {
  left: false, right: false, up: false, down: false,
  jumpHeld: false, jumpPressed: false,
  fireHeld: false, firePressed: false, poundPressed: false,
};

export type PlayerState =
  | 'normal'
  | 'glide'
  | 'poundStartup'
  | 'pound'
  | 'roll'
  | 'hurt'
  | 'dead'
  | 'goal';

/** Active transformation. 'sling' is the default; the rest are pickups. */
export type PowerKind = 'sling' | 'scatter' | 'ember' | 'frost' | 'gale';

/** What a fired projectile is — drives damage, pierce, freeze, and visuals. */
export type ShotKind = 'pellet' | 'charge' | 'scatter' | 'ember' | 'frost';

export interface ShotRequest {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  charged: boolean;
  kind: ShotKind;
}

/** Player tuning modified by shop upgrades. */
export interface PlayerConfig {
  maxHearts: number;
  doubleJump: boolean;
  glideFallCap: number;
  chargeMs: number;
}

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  maxHearts: TUNING.player.hearts,
  doubleJump: false,
  glideFallCap: TUNING.glide.fallCap,
  chargeMs: TUNING.weapons.charge.chargeMs,
};

const T = TUNING;

export class PlayerSim {
  body: Body;
  state: PlayerState = 'normal';
  facing: 1 | -1 = 1;
  onGround = false;
  wall: -1 | 0 | 1 = 0;

  hearts: number = T.player.hearts;
  maxHearts: number = T.player.hearts;
  /** active transformation (Mario-style power-up). */
  power: PowerKind = 'sling';
  /** gale hover fuel, seconds; refills on the ground. */
  galeFuel = 0;
  /** true this step when the body is submerged (swim physics). */
  submerged = false;
  /** set for one step when a swim stroke fires (for FX). */
  stroked = false;
  /** upgrade-driven tuning (shop). */
  readonly config: PlayerConfig;
  /** mid-air jumps remaining before touching ground (double-jump upgrade). */
  airJumpsLeft = 0;
  /** set for one step when an air (double) jump fires, for FX. */
  airJumped = false;

  // timers (seconds, count down)
  private coyote = 0;
  private jumpBuffer = 0;
  private stateTimer = 0;
  iframes = 0;
  private fireCooldown = 0;
  private wallInputLock = 0;
  private chargeHeld = 0;
  /** set for one step when landing so presentation can kick dust/squash */
  landedImpact = 0;
  /** velocity y before the last vertical move (for landing impact) */
  private prevVy = 0;
  private droppingThrough = 0;
  private jumpHeldPrev = false;
  /** shots requested this step — drained by the scene */
  shots: ShotRequest[] = [];
  /** pound landing this step (for shockwave) */
  poundLanded = false;
  charging = false;

  constructor(
    x: number,
    y: number,
    private solidAt: SolidityQuery,
    private bus: EventBus,
    config: PlayerConfig = DEFAULT_PLAYER_CONFIG,
  ) {
    this.config = config;
    this.body = { x, y, w: T.player.bodyW, h: T.player.bodyH, vx: 0, vy: 0 };
    this.maxHearts = config.maxHearts;
    this.hearts = config.maxHearts;
  }

  get x(): number { return this.body.x; }
  get y(): number { return this.body.y; }
  get vx(): number { return this.body.vx; }
  get vy(): number { return this.body.vy; }

  respawnAt(x: number, y: number): void {
    this.body.x = x;
    this.body.y = y;
    this.body.vx = 0;
    this.body.vy = 0;
    this.state = 'normal';
    this.iframes = T.player.hurtIframesMs / 1000;
    this.hearts = this.maxHearts;
    this.power = 'sling';
    this.galeFuel = 0;
    this.airJumpsLeft = this.config.doubleJump ? 1 : 0;
    this.bus.emit('player:power', { power: this.power });
    this.bus.emit('hearts:changed', { hearts: this.hearts, max: this.maxHearts });
  }

  /** One fixed 120 Hz step. */
  step(input: InputFrame): void {
    const dt = STEP_S;
    this.captureAim(input);
    this.shots.length = 0;
    this.poundLanded = false;
    this.landedImpact = 0;
    this.airJumped = false;
    this.stroked = false;
    this.submerged = inWater(this.body, this.solidAt);

    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.iframes = Math.max(0, this.iframes - dt);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.wallInputLock = Math.max(0, this.wallInputLock - dt);
    this.droppingThrough = Math.max(0, this.droppingThrough - dt);
    this.stateTimer = Math.max(0, this.stateTimer - dt);
    // gale refills its hover fuel whenever grounded
    if (this.power === 'gale' && this.onGround) {
      this.galeFuel = Math.min(T.powers.gale.fuelS, this.galeFuel + T.powers.gale.refillPerS * dt);
    }

    if (this.state === 'dead' || this.state === 'goal') {
      // gravity still applies so the goal pose settles
      this.applyGravity(dt, false);
      this.integrate(dt, false);
      this.jumpHeldPrev = input.jumpHeld;
      return;
    }

    if (input.jumpPressed) this.jumpBuffer = T.jump.bufferMs / 1000;

    switch (this.state) {
      case 'hurt':
        if (this.stateTimer <= 0) this.state = 'normal';
        this.applyGravity(dt, false);
        break;

      case 'poundStartup':
        this.body.vx = 0;
        this.body.vy = 0;
        if (this.stateTimer <= 0) {
          this.state = 'pound';
          this.body.vy = T.pound.fallSpeed;
        }
        break;

      case 'pound':
        this.body.vx = 0;
        this.body.vy = T.pound.fallSpeed;
        break;

      case 'roll': {
        this.body.vx = this.facing * T.roll.speed;
        this.applyGravity(dt, false);
        if (this.stateTimer <= 0 && this.canStand()) {
          this.state = 'normal';
          this.body.h = T.player.bodyH;
        }
        break;
      }

      case 'glide': {
        if (this.submerged) { this.state = 'normal'; this.swimControl(input, dt); break; }
        this.horizontalControl(input, dt, true);
        this.applyGravity(dt, false);
        // Gale power turns the glide into a helicopter: hold jump to hover and
        // climb while fuel lasts, otherwise a slower controlled descent.
        if (this.power === 'gale' && input.jumpHeld && this.galeFuel > 0) {
          this.galeFuel = Math.max(0, this.galeFuel - dt);
          this.body.vy = T.powers.gale.lift;
          this.bus.emit('player:glide');
        } else {
          const cap = this.power === 'gale' ? T.powers.gale.fallCap : this.config.glideFallCap;
          if (this.body.vy > cap) this.body.vy = cap;
        }
        if (!input.jumpHeld || this.onGround) this.state = 'normal';
        break;
      }

      case 'normal': {
        if (this.submerged) {
          this.swimControl(input, dt);
          break;
        }
        this.horizontalControl(input, dt, !this.onGround);
        this.applyGravity(dt, input.jumpHeld);

        // variable jump cutoff
        if (!input.jumpHeld && this.jumpHeldPrev && this.body.vy < T.jump.cutVy) {
          this.body.vy = T.jump.cutVy;
        }

        // wall slide
        this.wall = wallContact(this.body, this.solidAt);
        const pushingWall =
          (this.wall === 1 && input.right) || (this.wall === -1 && input.left);
        const wallSliding = !this.onGround && this.body.vy > 0 && pushingWall;
        if (wallSliding && this.body.vy > T.wall.slideCap) {
          this.body.vy = T.wall.slideCap;
        }

        // jump: ground/coyote, then wall jump, then mid-air (double) jump
        if (this.jumpBuffer > 0) {
          if (this.onGround || this.coyote > 0) {
            this.body.vy = T.jump.v0;
            this.coyote = 0;
            this.jumpBuffer = 0;
            this.onGround = false;
            this.bus.emit('player:jump');
          } else if (wallSliding || (this.wall !== 0 && !this.onGround)) {
            this.body.vx = -this.wall * T.wall.jumpVx;
            this.body.vy = T.wall.jumpVy;
            this.facing = this.wall === 1 ? -1 : 1;
            this.jumpBuffer = 0;
            this.wallInputLock = T.wall.inputLockMs / 1000;
            this.airJumpsLeft = 0; // wall-jump consumes the air jump
            this.bus.emit('player:walljump');
          } else if (this.airJumpsLeft > 0 && input.jumpPressed) {
            this.body.vy = T.jump.v0 * 0.9;
            this.airJumpsLeft -= 1;
            this.jumpBuffer = 0;
            this.airJumped = true;
            this.bus.emit('player:jump');
          }
        }

        // glide: hold jump while falling (fresh press or continued hold after apex)
        if (
          !this.onGround &&
          this.body.vy > 40 &&
          input.jumpHeld &&
          !this.jumpHeldPrev
        ) {
          this.state = 'glide';
          this.bus.emit('player:glide');
        }

        // ground pound: (down + jump press) or dedicated pound key, airborne
        if (!this.onGround && (input.poundPressed || (input.down && input.jumpPressed))) {
          this.state = 'poundStartup';
          this.stateTimer = T.pound.startupMs / 1000;
          this.body.vy = T.pound.hopVy;
          this.jumpBuffer = 0;
        }

        // roll: down + direction on the ground
        if (this.onGround && input.down && (input.left || input.right)) {
          this.state = 'roll';
          this.stateTimer = T.roll.durationMs / 1000;
          this.iframes = Math.max(this.iframes, T.roll.iframesMs / 1000);
          this.body.h = T.player.rollBodyH;
          this.facing = input.left ? -1 : 1;
        }

        // drop through one-way platforms: down + jump press while standing on one
        if (
          this.onGround &&
          input.down &&
          input.jumpPressed &&
          groundBelow(this.body, this.solidAt) === 'oneway'
        ) {
          this.droppingThrough = 0.18;
          this.onGround = false;
          this.jumpBuffer = 0;
        }
        break;
      }
    }

    // firing (any state but pound/hurt)
    if (this.state === 'normal' || this.state === 'glide') {
      this.handleFire(input, dt);
    } else {
      this.charging = false;
      this.chargeHeld = 0;
    }

    this.integrate(dt, this.state === 'normal' || this.state === 'glide');
    this.jumpHeldPrev = input.jumpHeld;
  }

  private canStand(): boolean {
    const test: Body = { ...this.body, h: T.player.bodyH };
    const headTy = Math.floor((test.y - test.h) / 16);
    const s = this.solidAt(Math.floor(test.x / 16), headTy);
    return s !== 'solid' && s !== 'crack';
  }

  private horizontalControl(input: InputFrame, dt: number, inAir: boolean): void {
    if (this.wallInputLock > 0) return;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const controlMult = inAir ? T.run.airControlMult : 1;
    if (dir !== 0) {
      this.facing = dir as 1 | -1;
      const sameDir = Math.sign(this.body.vx) === dir;
      const speed = Math.abs(this.body.vx);
      let accel: number = T.run.accel;
      if (!sameDir && speed > 1) accel = T.run.accel + T.run.friction; // turn-around boost
      else if (speed >= T.run.walkCap) accel = T.run.dashAccel; // build into dash
      this.body.vx += dir * accel * controlMult * dt;
      const cap = T.run.dashCap;
      if (Math.abs(this.body.vx) > cap) this.body.vx = dir * cap;
    } else {
      const fr = T.run.friction * (inAir ? 0.35 : 1) * dt;
      if (Math.abs(this.body.vx) <= fr) this.body.vx = 0;
      else this.body.vx -= Math.sign(this.body.vx) * fr;
    }
  }

  /** Swimming: draggy horizontal control, buoyancy, repeatable up-stroke. */
  private swimControl(input: InputFrame, dt: number): void {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) {
      this.facing = dir as 1 | -1;
      this.body.vx += dir * T.water.horizAccel * dt;
      const cap = T.water.horizCap;
      if (Math.abs(this.body.vx) > cap) this.body.vx = dir * cap;
    } else {
      const d = this.body.vx * T.water.drag * dt;
      this.body.vx -= d;
      if (Math.abs(this.body.vx) < 2) this.body.vx = 0;
    }
    this.applyGravity(dt, false);
    // vertical nudge from up/down held, and a strong stroke on jump press
    if (input.up) this.body.vy -= T.water.horizAccel * 0.35 * dt;
    if (input.down) this.body.vy += T.water.horizAccel * 0.3 * dt;
    if (this.body.vy < -T.water.riseCap) this.body.vy = -T.water.riseCap;
    if (this.body.vy > T.water.sinkCap) this.body.vy = T.water.sinkCap;
    if (input.jumpPressed) {
      this.body.vy = T.water.stroke;
      this.stroked = true;
      this.jumpBuffer = 0;
      this.bus.emit('player:jump');
    }
    this.airJumpsLeft = this.config.doubleJump ? 1 : 0;
    this.wall = 0;
  }

  private applyGravity(dt: number, jumpHeld: boolean): void {
    if (this.submerged) {
      // buoyant, capped rise/sink
      this.body.vy += T.water.buoyancy * dt;
      if (this.body.vy > T.water.sinkCap) this.body.vy = T.water.sinkCap;
      if (this.body.vy < -T.water.riseCap) this.body.vy = -T.water.riseCap;
      return;
    }
    let g = this.body.vy < 0 ? T.gravity.rise : T.gravity.fall;
    if (Math.abs(this.body.vy) < T.jump.apexBand && !this.onGround) {
      g *= T.jump.apexGravityMult; // apex hang
    }
    this.body.vy += g * dt;
    if (this.body.vy > T.gravity.max) this.body.vy = T.gravity.max;
  }

  private handleFire(input: InputFrame, dt: number): void {
    if (input.fireHeld) {
      this.chargeHeld += dt;
      this.charging = this.chargeHeld * 1000 >= this.config.chargeMs;
    } else {
      if (this.charging) this.emitShot(true);
      this.charging = false;
      this.chargeHeld = 0;
    }
    if (input.firePressed && !this.charging && this.fireCooldown <= 0) {
      // immediate pellet on press for responsiveness; hold keeps charging
      this.emitShot(false);
      this.fireCooldown = T.weapons.pellet.cooldownMs / 1000;
      this.chargeHeld = 0;
    }
  }

  private emitShot(charged: boolean): void {
    // 8-way aim: up/down modify, otherwise facing
    let dirX = this.facing as number;
    let dirY = 0;
    // (matching input snapshot is not stored; aim from the last control step)
    if (this.aimUp) dirY = -1;
    else if (this.aimDown && !this.onGround) dirY = 1;
    if (dirY !== 0 && !this.aimSide) dirX = 0;
    const len = Math.hypot(dirX, dirY) || 1;
    const y = this.body.y - this.body.h * 0.55;
    const nx = dirX / len;
    const ny = dirY / len;
    const kind: ShotKind = charged
      ? 'charge'
      : this.power === 'ember'
        ? 'ember'
        : this.power === 'frost'
          ? 'frost'
          : this.power === 'scatter'
            ? 'scatter'
            : 'pellet';
    const spreads = !charged && this.power === 'scatter' ? [-0.22, 0, 0.22] : [0];
    for (const a of spreads) {
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      this.shots.push({
        x: this.body.x + this.facing * 8,
        y,
        dirX: nx * cos - ny * sin,
        dirY: nx * sin + ny * cos,
        charged,
        kind,
      });
    }
    this.bus.emit('player:shoot', { x: this.body.x, y, charged });
  }

  private aimUp = false;
  private aimDown = false;
  private aimSide = false;

  /** Called by step() before firing so aim matches this step's input. */
  private captureAim(input: InputFrame): void {
    this.aimUp = input.up;
    this.aimDown = input.down;
    this.aimSide = input.left || input.right;
  }

  private integrate(dt: number, allowCorner: boolean): void {
    const solid = this.solidAt;
    moveX(this.body, this.body.vx * dt, solid) && (this.body.vx = 0);

    this.prevVy = this.body.vy;
    const wasGrounded = this.onGround;
    const resY = moveY(this.body, this.body.vy * dt, solid, {
      dropThrough: this.droppingThrough > 0,
      cornerNudge: allowCorner && this.body.vy < 0 ? T.cornerCorrectionPx : 0,
    });

    if (resY.landed) {
      if (!wasGrounded && this.prevVy > 120) {
        this.landedImpact = this.prevVy;
        this.bus.emit('player:land', { impact: this.prevVy });
      }
      if (this.state === 'pound') {
        this.poundLanded = true;
        this.state = 'normal';
        this.bus.emit('player:pound', { x: this.body.x, y: this.body.y });
      }
      this.onGround = true;
      this.body.vy = 0;
      this.coyote = T.jump.coyoteMs / 1000;
      this.airJumpsLeft = this.config.doubleJump ? 1 : 0;
    } else {
      if (resY.ceiling && this.body.vy < 0) this.body.vy = 0;
      // did we walk off a ledge?
      const g = groundBelow(this.body, solid);
      if (this.onGround && g === 'none') {
        this.onGround = false;
        // coyote already primed from landing; refresh it at the moment of leaving
        this.coyote = T.jump.coyoteMs / 1000;
      } else if (this.onGround && g !== 'none') {
        // still grounded (moveY of 0 distance won't set landed)
        this.body.vy = Math.min(this.body.vy, 0.01);
      } else {
        this.onGround = false;
      }
    }
  }

  /** External: stomp bounce off an enemy. */
  stompBounce(jumpHeld: boolean): void {
    this.body.vy = jumpHeld ? T.stomp.heldBounce : T.stomp.bounce;
    this.onGround = false;
    this.bus.emit('player:stomp', { x: this.body.x, y: this.body.y });
  }

  /** External: spring pad launch. */
  springLaunch(): void {
    this.body.vy = T.spring.vy;
    this.onGround = false;
    if (this.state === 'pound' || this.state === 'poundStartup') this.state = 'normal';
    this.bus.emit('player:spring');
  }

  /**
   * Take a hit from a source at sx. Mario-style: if transformed, the hit
   * strips the power instead of a heart (one "free" hit). Returns true if the
   * hit registered (either lost power or lost a heart).
   */
  hurt(sx: number): boolean {
    if (this.iframes > 0 || this.state === 'dead' || this.state === 'goal') return false;
    const dir = this.body.x < sx ? -1 : 1;
    // knockback + i-frames apply either way
    this.iframes = T.player.hurtIframesMs / 1000;
    this.state = 'hurt';
    this.stateTimer = T.player.hurtLockMs / 1000;
    this.body.h = T.player.bodyH;
    this.body.vx = dir * T.player.hurtKnockVx;
    this.body.vy = T.player.hurtKnockVy;
    this.onGround = false;

    if (this.power !== 'sling') {
      // lose the transformation, keep all hearts
      this.power = 'sling';
      this.galeFuel = 0;
      this.bus.emit('player:powerLost');
      return true;
    }

    this.hearts -= 1;
    this.bus.emit('player:hurt', { hearts: this.hearts });
    this.bus.emit('hearts:changed', { hearts: this.hearts, max: this.maxHearts });
    if (this.hearts <= 0) {
      this.state = 'dead';
      this.bus.emit('player:died');
    }
    return true;
  }

  /** External: grant a transformation (from a pickup). */
  setPower(power: PowerKind): void {
    this.power = power;
    this.galeFuel = power === 'gale' ? T.powers.gale.fuelS : 0;
    this.bus.emit('player:power', { power });
  }

  heal(n: number): void {
    this.hearts = Math.min(this.maxHearts, this.hearts + n);
    this.bus.emit('hearts:changed', { hearts: this.hearts, max: this.maxHearts });
  }

  kill(): void {
    if (this.state === 'dead') return;
    this.hearts = 0;
    this.state = 'dead';
    this.bus.emit('hearts:changed', { hearts: 0, max: this.maxHearts });
    this.bus.emit('player:died');
  }

  checkSpikes(): void {
    if (this.iframes > 0 || this.state === 'dead') return;
    if (touchesSpikes(this.body, this.solidAt)) {
      this.hurt(this.body.x + this.facing); // knock back from where we face
    }
  }

  enterGoal(): void {
    this.state = 'goal';
    this.body.vx = 0;
  }

  /** Presentation helper: which animation should play? */
  animKey(): string {
    switch (this.state) {
      case 'glide': return 'glide';
      case 'poundStartup':
      case 'pound': return 'pound';
      case 'roll': return 'pound';
      case 'hurt': return 'hurt';
      case 'dead': return 'hurt';
      case 'goal': return 'idle';
      default:
        if (!this.onGround) return this.body.vy < -40 ? 'jump' : 'fall';
        if (this.charging || this.fireCooldown > 0.09) return 'shoot';
        if (Math.abs(this.body.vx) > 10) {
          const dir = (this.body.vx > 0 ? 1 : -1);
          return dir !== this.facing ? 'skid' : 'run';
        }
        return 'idle';
    }
  }
}
