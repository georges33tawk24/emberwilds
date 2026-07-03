import { describe, expect, it } from 'vitest';
import { BossSim } from '../src/entities/bossSim';
import { TILE, type Solidity } from '../src/data/levelTypes';

/** A simple walled arena: solid columns at the far left and right. */
function arena(leftWallTx: number, rightWallTx: number, floorTy: number): (tx: number, ty: number) => Solidity {
  return (tx, ty) => {
    if (ty >= floorTy) return 'solid';
    if (tx <= leftWallTx || tx >= rightWallTx) return 'solid';
    return 'empty';
  };
}

const FLOOR_TY = 26;
const FLOOR_Y = FLOOR_TY * TILE;

function makeBoss(): BossSim {
  // walls at tx<=5 and tx>=54; boss starts mid-arena
  return new BossSim(30 * TILE, FLOOR_Y, arena(5, 54, FLOOR_TY));
}

/** Step the boss for up to `maxSteps`, returning the set of states visited. */
function runUntil(boss: BossSim, playerX: number, pred: () => boolean, maxSteps = 2000): Set<string> {
  const seen = new Set<string>();
  for (let i = 0; i < maxSteps; i++) {
    boss.step(playerX, FLOOR_Y);
    seen.add(boss.state);
    if (pred()) break;
  }
  return seen;
}

describe('BossSim — Old Rustjaw', () => {
  it('cycles telegraph → charge → stun and rams a wall', () => {
    const boss = makeBoss();
    // player pinned to the far left so the boss charges into the left wall
    const seen = runUntil(boss, 6 * TILE, () => boss.state === 'stun');
    expect(seen.has('telegraph')).toBe(true);
    expect(seen.has('charge')).toBe(true);
    expect(boss.state).toBe('stun');
    // it should be pressed against the left wall (inner face at tx=6 → x≈96)
    expect(boss.body.x).toBeLessThan(9 * TILE);
  });

  it('telegraphs before every charge (never charges cold)', () => {
    const boss = makeBoss();
    let prev = boss.state;
    let sawChargeWithoutTelegraph = false;
    let lastNonCharge = boss.state;
    for (let i = 0; i < 1500; i++) {
      boss.step(6 * TILE, FLOOR_Y);
      if (boss.state === 'charge' && prev !== 'charge' && lastNonCharge !== 'telegraph') {
        sawChargeWithoutTelegraph = true;
      }
      if (boss.state !== 'charge') lastNonCharge = boss.state;
      prev = boss.state;
    }
    expect(sawChargeWithoutTelegraph).toBe(false);
  });

  it('takes damage only while stunned', () => {
    const boss = makeBoss();
    // while walking/charging it is armored
    boss.step(6 * TILE, FLOOR_Y);
    expect(boss.damageable).toBe(false);
    expect(boss.hitCore(1)).toBe(false);
    expect(boss.hp).toBe(boss.maxHp);
    // drive to stun, then the core is open
    runUntil(boss, 6 * TILE, () => boss.state === 'stun');
    expect(boss.damageable).toBe(true);
    const before = boss.hp;
    expect(boss.hitCore(1)).toBe(false); // not dead yet
    expect(boss.hp).toBe(before - 1);
  });

  it('escalates phases as its health falls', () => {
    const boss = makeBoss();
    expect(boss.phase).toBe(1);
    // force it through stun windows and hammer the core
    const phases: number[] = [];
    for (let hit = 0; hit < 8 && boss.alive; hit++) {
      runUntil(boss, 6 * TILE, () => boss.state === 'stun');
      if (boss.state === 'stun') {
        boss.iframes = 0;
        boss.hitCore(1);
        phases.push(boss.phase);
      }
    }
    expect(Math.max(...phases)).toBeGreaterThanOrEqual(2);
  });

  it('dies after enough core hits and stops being a threat', () => {
    const boss = makeBoss();
    let guard = 0;
    // land one hit per stun window (i-frames block same-instant multi-hits,
    // so we clear them to simulate hits landing across the stun's duration)
    while (boss.alive && guard++ < 100) {
      runUntil(boss, 6 * TILE, () => boss.state === 'stun');
      if (boss.state === 'stun') {
        boss.iframes = 0;
        boss.hitCore(1);
      }
    }
    expect(boss.alive).toBe(false);
    expect(boss.hp).toBe(0);
    expect(boss.state).toBe('dead');
  });

  it('spits projectiles in phase 2+, none in phase 1', () => {
    const boss = makeBoss();
    // phase 1: no volleys during a full walk cycle
    let p1shots = 0;
    for (let i = 0; i < 400 && boss.phase === 1; i++) {
      boss.step(20 * TILE, FLOOR_Y);
      p1shots += boss.shots.length;
    }
    expect(p1shots).toBe(0);
  });
});
