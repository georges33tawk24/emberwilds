/** Conveyor belts ('<' '>') — the Foundry's ground: solid like stone, but
 *  the surface drags whoever stands on it. */
import { describe, expect, it } from 'vitest';
import { PlayerSim, EMPTY_INPUT, type InputFrame } from '../src/entities/playerSim';
import { EventBus } from '../src/core/events';
import { TILE, type Solidity } from '../src/data/levelTypes';
import { STEP_S, TUNING } from '../src/data/tuning';

function world(rows: string[]): (tx: number, ty: number) => Solidity {
  return (tx, ty) => {
    const ch = rows[ty]?.[tx] ?? (ty >= rows.length ? '#' : '.');
    if (ch === '#') return 'solid';
    if (ch === '<') return 'beltL';
    if (ch === '>') return 'beltR';
    return 'empty';
  };
}

const RIGHT_BELT = world(['.'.repeat(64), '.'.repeat(64), '>'.repeat(64)]);
const LEFT_BELT = world(['.'.repeat(64), '.'.repeat(64), '<'.repeat(64)]);
const FLOOR_Y = 2 * TILE;

function press(over: Partial<InputFrame>): InputFrame {
  return { ...EMPTY_INPUT, ...over };
}

describe('conveyor belts', () => {
  it('carries an idle rider at the belt speed', () => {
    const p = new PlayerSim(8 * TILE, FLOOR_Y, RIGHT_BELT, new EventBus());
    for (let i = 0; i < 30; i++) p.step(EMPTY_INPUT); // settle
    const from = p.x;
    const steps = 120; // one second
    for (let i = 0; i < steps; i++) p.step(EMPTY_INPUT);
    const carried = p.x - from;
    expect(carried).toBeGreaterThan(TUNING.belt.speed * 0.9);
    expect(carried).toBeLessThan(TUNING.belt.speed * 1.1);
  });

  it('slows a walk against it and speeds a walk with it', () => {
    const walked = (w: (tx: number, ty: number) => Solidity, dir: 'left' | 'right'): number => {
      const p = new PlayerSim(32 * TILE, FLOOR_Y, w, new EventBus());
      for (let i = 0; i < 30; i++) p.step(EMPTY_INPUT);
      const from = p.x;
      for (let i = 0; i < 120; i++) p.step(press({ [dir]: true } as Partial<InputFrame>));
      return Math.abs(p.x - from);
    };
    const withBelt = walked(RIGHT_BELT, 'right');
    const against = walked(LEFT_BELT, 'right');
    expect(withBelt).toBeGreaterThan(against + TUNING.belt.speed); // ~2x speed gap over 1s
  });

  it('never drags a rider through a wall', () => {
    const walled = world(['.'.repeat(64), '........#'.padEnd(64, '.'), '>'.repeat(64)]);
    const p = new PlayerSim(3 * TILE, FLOOR_Y, walled, new EventBus());
    for (let i = 0; i < 600; i++) p.step(EMPTY_INPUT);
    expect(p.x).toBeLessThan(8 * TILE + 1);
  });

  it('stops dragging the moment the rider jumps', () => {
    const p = new PlayerSim(8 * TILE, FLOOR_Y, RIGHT_BELT, new EventBus());
    for (let i = 0; i < 30; i++) p.step(EMPTY_INPUT);
    p.step(press({ jumpPressed: true, jumpHeld: true }));
    const from = p.x;
    for (let i = 0; i < 20 && !p.onGround; i++) p.step(press({ jumpHeld: true }));
    // airborne drift without input should be ~zero (no belt under the feet)
    expect(Math.abs(p.x - from)).toBeLessThan(2);
  });
});
