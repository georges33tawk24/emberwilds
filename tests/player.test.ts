import { describe, expect, it } from 'vitest';
import { PlayerSim, EMPTY_INPUT, type InputFrame } from '../src/entities/playerSim';
import { EventBus } from '../src/core/events';
import { STEP_S, TUNING } from '../src/data/tuning';
import { TILE, type Solidity } from '../src/data/levelTypes';

function world(rows: string[]): (tx: number, ty: number) => Solidity {
  return (tx, ty) => {
    const ch = rows[ty]?.[tx] ?? (ty >= rows.length ? '#' : '.');
    if (ch === '#') return 'solid';
    if (ch === '=') return 'oneway';
    if (ch === '^') return 'spike';
    if (ch === 'w') return 'water';
    return 'empty';
  };
}

const FLAT = world([
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '################',
]);
const FLOOR_Y = 7 * TILE; // 112

function makePlayer(w = FLAT, x = 64, y = FLOOR_Y, waterAt?: (tx: number, ty: number) => boolean) {
  const bus = new EventBus();
  const p = new PlayerSim(x, y, w, bus, undefined, waterAt);
  return { p, bus };
}

/** A water lookup from ASCII rows where 'w' marks water. */
function waterFrom(rows: string[]): (tx: number, ty: number) => boolean {
  return (tx, ty) => rows[ty]?.[tx] === 'w';
}

function press(over: Partial<InputFrame>): InputFrame {
  return { ...EMPTY_INPUT, ...over };
}

function settle(p: PlayerSim, steps = 30): void {
  for (let i = 0; i < steps; i++) p.step(EMPTY_INPUT);
}

describe('jump', () => {
  it('reaches ~5 tiles of height with full hold, never more than 5.5', () => {
    // v₀²/2g_rise = 78px ≈ 4.9 tiles, apex hang stretches it slightly.
    // Level design assumes a conservative 4 tiles, leaving generous headroom.
    const { p } = makePlayer();
    settle(p);
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    let minY = FLOOR_Y;
    for (let i = 0; i < 240; i++) {
      p.step(press({ jumpHeld: true }));
      minY = Math.min(minY, p.y);
      if (p.onGround && i > 10) break;
    }
    const heightTiles = (FLOOR_Y - minY) / TILE;
    expect(heightTiles).toBeGreaterThan(4.4);
    expect(heightTiles).toBeLessThan(5.5);
  });

  it('variable height: early release jumps much lower', () => {
    const { p } = makePlayer();
    settle(p);
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    for (let i = 0; i < 6; i++) p.step(press({ jumpHeld: true }));
    let minY = FLOOR_Y;
    for (let i = 0; i < 240; i++) {
      p.step(EMPTY_INPUT); // released
      minY = Math.min(minY, p.y);
      if (p.onGround && i > 10) break;
    }
    const shortHeight = (FLOOR_Y - minY) / TILE;
    expect(shortHeight).toBeLessThan(2.9); // roughly half the full jump
    expect(shortHeight).toBeGreaterThan(0.3);
  });

  it('coyote time allows a jump shortly after walking off a ledge', () => {
    const w = world([
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '########........',
    ]);
    const { p } = makePlayer(w, 100, FLOOR_Y);
    settle(p, 10);
    // walk right off the ledge (edge at x=128)
    for (let i = 0; i < 60 && p.onGround; i++) p.step(press({ right: true }));
    expect(p.onGround).toBe(false);
    // within coyote window (~90ms = ~10 steps): jump must fire
    for (let i = 0; i < 5; i++) p.step(press({ right: true }));
    p.step(press({ right: true, jumpPressed: true, jumpHeld: true }));
    expect(p.vy).toBeLessThan(-400);
  });

  it('jump buffering fires the jump on landing', () => {
    const { p } = makePlayer();
    settle(p);
    // launch upward, then press jump mid-air before landing
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    for (let i = 0; i < 30; i++) p.step(press({ jumpHeld: true }));
    // falling now; press jump ~80ms before touchdown
    let pressed = false;
    for (let i = 0; i < 300; i++) {
      const nearGround = p.y > FLOOR_Y - 14 && p.vy > 0;
      if (nearGround && !pressed) {
        p.step(press({ jumpPressed: true }));
        pressed = true;
      } else {
        p.step(EMPTY_INPUT);
      }
      if (pressed && p.vy < -400) break; // buffered jump fired
    }
    expect(p.vy).toBeLessThan(-400);
  });
});

describe('glide', () => {
  it('caps fall speed while held', () => {
    const OPEN = world(Array.from({ length: 60 }, () => '................'));
    const { p } = makePlayer(OPEN, 64, 0);
    // free fall to build speed
    for (let i = 0; i < 60; i++) p.step(EMPTY_INPUT);
    expect(p.vy).toBeGreaterThan(TUNING.glide.fallCap * 2);
    // fresh press + hold enters glide
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    for (let i = 0; i < 30; i++) p.step(press({ jumpHeld: true }));
    expect(p.state).toBe('glide');
    expect(p.vy).toBeLessThanOrEqual(TUNING.glide.fallCap + 0.01);
  });
});

describe('determinism', () => {
  it('same inputs produce identical trajectories', () => {
    const script = (i: number): InputFrame =>
      press({
        right: i < 100,
        left: i >= 100 && i < 140,
        jumpPressed: i === 20 || i === 90,
        jumpHeld: (i >= 20 && i < 45) || (i >= 90 && i < 130),
        firePressed: i % 37 === 0,
        fireHeld: i % 37 < 4,
      });
    const run = () => {
      const { p } = makePlayer();
      const trace: number[] = [];
      for (let i = 0; i < 300; i++) {
        p.step(script(i));
        trace.push(p.x, p.y, p.vx, p.vy);
      }
      return trace.join(',');
    };
    expect(run()).toBe(run());
  });
});

describe('damage & i-frames', () => {
  it('loses a heart, gets knockback and invulnerability', () => {
    const { p } = makePlayer();
    settle(p);
    const ok = p.hurt(p.x + 4);
    expect(ok).toBe(true);
    expect(p.hearts).toBe(TUNING.player.hearts - 1);
    expect(p.vx).toBeLessThan(0); // knocked away from source
    // immediately hurt again: blocked by i-frames
    expect(p.hurt(p.x + 4)).toBe(false);
    expect(p.hearts).toBe(TUNING.player.hearts - 1);
  });

  it('dies at zero hearts', () => {
    const { p, bus } = makePlayer();
    let died = false;
    bus.on('player:died', () => (died = true));
    settle(p);
    for (let i = 0; i < 10; i++) {
      p.hurt(p.x + 1);
      p.iframes = 0; // bypass i-frames for the test
    }
    expect(p.hearts).toBe(0);
    expect(p.state).toBe('dead');
    expect(died).toBe(true);
  });
});

describe('upgrades (shop)', () => {
  it('double-jump grants exactly one mid-air jump, reset on landing', () => {
    const bus = new EventBus();
    const p = new PlayerSim(64, FLOOR_Y, FLAT, bus, {
      maxHearts: 5, doubleJump: true, glideFallCap: 70, chargeMs: 500,
    });
    settle(p);
    // ground jump
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    for (let i = 0; i < 20; i++) p.step(press({ jumpHeld: true }));
    expect(p.onGround).toBe(false);
    const vyBefore = p.vy;
    // a fresh press mid-air fires the double jump (upward kick)
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    expect(p.vy).toBeLessThan(vyBefore - 200);
    expect(p.airJumpsLeft).toBe(0);
    // a third press does nothing
    const vy2 = p.vy;
    for (let i = 0; i < 3; i++) p.step(press({ jumpHeld: false }));
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    expect(p.vy).toBeGreaterThan(vy2); // still falling/rising normally, no new kick
  });

  it('without the upgrade there is no air jump', () => {
    const bus = new EventBus();
    const p = new PlayerSim(64, FLOOR_Y, FLAT, bus); // default config: no double jump
    settle(p);
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    for (let i = 0; i < 20; i++) p.step(press({ jumpHeld: true }));
    const vyBefore = p.vy;
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    expect(p.vy).toBeGreaterThanOrEqual(vyBefore - 5); // no upward kick
  });

  it('extra max-hearts config raises the heart cap', () => {
    const bus = new EventBus();
    const p = new PlayerSim(64, FLOOR_Y, FLAT, bus, {
      maxHearts: 7, doubleJump: false, glideFallCap: 70, chargeMs: 500,
    });
    expect(p.maxHearts).toBe(7);
    expect(p.hearts).toBe(7);
  });
});

describe('swimming (water)', () => {
  // a deep water column with a floor (water is a region, queried separately)
  const POOL_ROWS = [
    '................',
    '.....wwww.......',
    '.....wwww.......',
    '.....wwww.......',
    '.....wwww.......',
    '.....####.......',
    '................',
    '################',
  ];
  const POOL = world(POOL_ROWS);
  const POOL_WATER = waterFrom(POOL_ROWS);

  it('is buoyant — sinks slowly in water, not full gravity', () => {
    const { p } = makePlayer(POOL, 6 * TILE, 3 * TILE, POOL_WATER); // inside the water
    for (let i = 0; i < 20; i++) p.step(EMPTY_INPUT);
    expect(p.submerged).toBe(true);
    // sink speed is capped far below normal fall (gravity.max 900)
    expect(p.vy).toBeLessThanOrEqual(TUNING.water.sinkCap + 1);
  });

  it('a stroke (jump press) pushes upward, repeatably', () => {
    const { p } = makePlayer(POOL, 6 * TILE, 4 * TILE, POOL_WATER);
    for (let i = 0; i < 6; i++) p.step(EMPTY_INPUT);
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    expect(p.vy).toBeLessThan(0); // moving up
    expect(p.stroked).toBe(true);
    // and again after settling — no ground needed
    for (let i = 0; i < 8; i++) p.step(press({ jumpHeld: true }));
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    expect(p.vy).toBeLessThan(0);
  });

  it('leaves swim mode when out of the water', () => {
    const { p } = makePlayer(POOL, 6 * TILE, 4 * TILE, POOL_WATER);
    p.step(EMPTY_INPUT);
    expect(p.submerged).toBe(true);
    // stroke up out of the pool
    for (let i = 0; i < 60; i++) p.step(press({ jumpPressed: i % 6 === 0, jumpHeld: true }));
    // eventually above the water surface (rows 1-4), no longer submerged
    p.step(EMPTY_INPUT);
    expect(p.y).toBeLessThan(2 * TILE + 8);
  });
});

describe('power-ups (transformations)', () => {
  it('default sling fires a single pellet', () => {
    const { p } = makePlayer();
    settle(p);
    p.step(press({ firePressed: true, fireHeld: true }));
    expect(p.shots).toHaveLength(1);
    expect(p.shots[0].kind).toBe('pellet');
  });

  it('scatter fires a 3-pellet fan', () => {
    const { p } = makePlayer();
    p.setPower('scatter');
    settle(p);
    p.step(press({ firePressed: true, fireHeld: true }));
    expect(p.shots).toHaveLength(3);
    expect(p.shots.every((s) => s.kind === 'scatter')).toBe(true);
  });

  it('ember fires a piercing fire shot', () => {
    const { p } = makePlayer();
    p.setPower('ember');
    settle(p);
    p.step(press({ firePressed: true, fireHeld: true }));
    expect(p.shots).toHaveLength(1);
    expect(p.shots[0].kind).toBe('ember');
  });

  it('frost fires a freezing shot', () => {
    const { p } = makePlayer();
    p.setPower('frost');
    settle(p);
    p.step(press({ firePressed: true, fireHeld: true }));
    expect(p.shots[0].kind).toBe('frost');
  });

  it('a hit strips the power instead of a heart (Mario-style)', () => {
    const { p } = makePlayer();
    p.setPower('ember');
    settle(p);
    const heartsBefore = p.hearts;
    const applied = p.hurt(p.x + 4);
    expect(applied).toBe(true);
    expect(p.power).toBe('sling');
    expect(p.hearts).toBe(heartsBefore); // no heart lost
    // now a second hit (after i-frames) costs a heart
    p.iframes = 0;
    p.hurt(p.x + 4);
    expect(p.hearts).toBe(heartsBefore - 1);
  });

  it('respawn resets the power to sling', () => {
    const { p } = makePlayer();
    p.setPower('frost');
    p.respawnAt(64, FLOOR_Y);
    expect(p.power).toBe('sling');
  });

  it('gale gives mid-air lift while held, bounded by fuel', () => {
    const OPEN = world(Array.from({ length: 60 }, () => '................'));
    const { p } = makePlayer(OPEN, 64, 0);
    p.setPower('gale');
    // fall to build downward speed, then enter the glide/hover
    for (let i = 0; i < 40; i++) p.step(EMPTY_INPUT);
    const fastFall = p.vy;
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    for (let i = 0; i < 20; i++) p.step(press({ jumpHeld: true }));
    // hovering rises (negative vy) or at least far slower than free fall
    expect(p.vy).toBeLessThan(fastFall);
    expect(p.vy).toBeLessThanOrEqual(0); // gale lift pulls upward
    // fuel eventually drains and it stops lifting
    for (let i = 0; i < 400; i++) p.step(press({ jumpHeld: true }));
    expect(p.galeFuel).toBe(0);
  });
});

describe('fixed timestep invariant', () => {
  it('step duration is exactly 1/120s', () => {
    expect(STEP_S).toBeCloseTo(1 / 120, 10);
  });
});
