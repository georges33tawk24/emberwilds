/**
 * Every gameplay number in one place (spec §4). Units: px, px/s, px/s², ms.
 * All tuned at the internal resolution of 480×270 with 16px tiles.
 * See TUNING.md for the design rationale behind each value.
 */
export const TUNING = {
  /** Fixed-timestep simulation rate (Hz). Rendering interpolates between steps. */
  fixedHz: 120,

  /** Internal render resolution (16:9). Scaled to fill the window (Scale.FIT). */
  view: { width: 640, height: 360 },

  run: {
    accel: 1800,
    friction: 2400,
    walkCap: 140,
    dashCap: 260,
    /** accel used above walkCap while pushing to build into dash speed */
    dashAccel: 420,
    airControlMult: 0.82,
  },

  jump: {
    v0: -560,
    /** releasing jump while rising clamps vy to this (variable height) */
    cutVy: -180,
    coyoteMs: 90,
    bufferMs: 120,
    /** gravity multiplier near the apex (|vy| < apexBand) for a floaty peak */
    apexGravityMult: 0.6,
    apexBand: 60,
  },

  gravity: { rise: 2000, fall: 2600, max: 900 },

  glide: { fallCap: 70 },

  /** Swimming — buoyant, draggy, jump = a repeatable upward stroke. */
  water: {
    buoyancy: 340,
    sinkCap: 110,
    riseCap: 200,
    stroke: -220,
    horizCap: 120,
    horizAccel: 900,
    drag: 3.2,
  },

  /** Ice (Rimefell 'I' tiles) — ground control multipliers while standing on
   *  ice. Push accel softens, release friction nearly vanishes: momentum
   *  carries, turning is a commitment, stopping takes room. */
  ice: { accelMult: 0.38, frictionMult: 0.07 },

  /** Conveyor belts (Foundry '<' '>') — constant surface drag on riders. */
  belt: { speed: 55 },

  wall: { slideCap: 90, jumpVx: 220, jumpVy: -520, inputLockMs: 110 },

  stomp: { bounce: -360, heldBounce: -460 },

  pound: {
    startupMs: 110,
    fallSpeed: 700,
    stunS: 0.5,
    radius: 24,
    /** small hop at the start of the pound windup */
    hopVy: -120,
  },

  roll: { durationMs: 350, speed: 300, iframesMs: 150 },

  spring: { vy: -720 },

  /** max pixels of horizontal nudge to slide a clipped head around a corner */
  cornerCorrectionPx: 4,

  player: {
    bodyW: 12,
    bodyH: 18,
    rollBodyH: 10,
    hearts: 5,
    hurtIframesMs: 1000,
    hurtLockMs: 300,
    hurtKnockVx: 160,
    hurtKnockVy: -240,
  },

  weapons: {
    pellet: { speed: 340, lifeS: 0.8, damage: 1, cooldownMs: 180 },
    charge: { speed: 420, lifeS: 1.1, damage: 3, chargeMs: 500 },
    ember: { speed: 360, lifeS: 0.9, damage: 2, cooldownMs: 200 },
    frost: { speed: 300, lifeS: 0.9, damage: 1, cooldownMs: 220 },
  },

  /** Mario-style transformations. A hit strips the power before a heart. */
  powers: {
    /** Gale: mid-air lift while holding jump, drained from a fuel pool that
     *  refills on the ground. This is the "helicopter/cape" ascent. */
    gale: { lift: -170, fuelS: 1.1, refillPerS: 1.6, fallCap: 90 },
    /** Frost: how long a frozen enemy stays a standable ice block. */
    frost: { freezeS: 4.0 },
  },

  enemies: {
    beetle: { speed: 30, hp: 1 },
    toad: { hp: 1, hopVx: 120, hopVy: -320, restMs: 900, aggroRange: 96 },
    owl: {
      hp: 1,
      bobAmp: 12,
      bobHz: 0.7,
      diveSpeed: 230,
      diveRangeX: 24,
      diveRangeY: 130,
      returnSpeed: 60,
    },
    burr: { speed: 46, hp: 3 },
    flatDespawnMs: 600,
  },

  camera: {
    lookAheadX: 28,
    lerp: 0.12,
    /** vertical dead zone half-height before the camera follows */
    deadZoneY: 24,
    shakeMax: 3,
    /**
     * Per-platform field of view via camera zoom. Desktop gets the full,
     * spacious 640×360 playfield (1.0). Mobile pulls in ~22% closer so the
     * fox and its immediate surroundings read clearly on a small screen and
     * under the thumbs — the comfortable read for touch play.
     */
    zoomDesktop: 1.0,
    zoomMobile: 1.22,
    /** trim look-ahead a touch on mobile so the closer camera stays centered */
    lookAheadMobileMult: 0.75,
  },

  feel: {
    hitstopMs: { stomp: 60, hurt: 90, enemyDie: 40, pound: 70 },
    traumaStomp: 0.25,
    traumaPound: 0.45,
    traumaHurt: 0.5,
  },
} as const;

export const STEP_S = 1 / TUNING.fixedHz;
export const STEP_MS = 1000 / TUNING.fixedHz;
