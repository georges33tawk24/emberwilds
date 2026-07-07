/** Ice ('I') — Rimefell's ground: collides like stone, but ground control
 *  decays hard. Momentum carries, turning is a commitment. */
import { describe, expect, it } from 'vitest';
import { PlayerSim, EMPTY_INPUT, type InputFrame } from '../src/entities/playerSim';
import { EventBus } from '../src/core/events';
import { TILE, type Solidity } from '../src/data/levelTypes';

function world(rows: string[]): (tx: number, ty: number) => Solidity {
  return (tx, ty) => {
    const ch = rows[ty]?.[tx] ?? (ty >= rows.length ? '#' : '.');
    if (ch === '#') return 'solid';
    if (ch === 'I') return 'ice';
    return 'empty';
  };
}

// one long floor, earth on the left half, ice on the right — plus an
// all-ice strip for the control tests
const EARTH = world(['.'.repeat(64), '.'.repeat(64), '#'.repeat(64)]);
const ICE = world(['.'.repeat(64), '.'.repeat(64), 'I'.repeat(64)]);
const FLOOR_Y = 2 * TILE;

function press(over: Partial<InputFrame>): InputFrame {
  return { ...EMPTY_INPUT, ...over };
}

/** run right until at dash speed, then release; returns coast distance. */
function coastDistance(w: (tx: number, ty: number) => Solidity): number {
  const p = new PlayerSim(3 * TILE, FLOOR_Y, w, new EventBus());
  for (let i = 0; i < 30; i++) p.step(EMPTY_INPUT); // settle onto the floor
  for (let i = 0; i < 240; i++) p.step(press({ right: true }));
  const from = p.x;
  for (let i = 0; i < 600 && Math.abs(p.vx) > 0.5; i++) p.step(EMPTY_INPUT);
  return p.x - from;
}

describe('ice', () => {
  it('carries momentum — coasting goes several times farther than on earth', () => {
    const earth = coastDistance(EARTH);
    const ice = coastDistance(ICE);
    expect(earth).toBeGreaterThan(0);
    expect(ice).toBeGreaterThan(earth * 3);
  });

  it('makes turning a commitment — reversal takes far longer than on earth', () => {
    const reversalSteps = (w: (tx: number, ty: number) => Solidity): number => {
      const p = new PlayerSim(6 * TILE, FLOOR_Y, w, new EventBus());
      for (let i = 0; i < 30; i++) p.step(EMPTY_INPUT);
      for (let i = 0; i < 240; i++) p.step(press({ right: true }));
      let steps = 0;
      while (p.vx > 0 && steps < 1200) {
        p.step(press({ left: true }));
        steps++;
      }
      return steps;
    };
    const earth = reversalSteps(EARTH);
    const ice = reversalSteps(ICE);
    expect(ice).toBeGreaterThan(earth * 2);
  });

  it('collides exactly like stone — an ice wall stops the run', () => {
    const walled = world(['.'.repeat(64), '........I'.padEnd(64, '.'), 'I'.repeat(64)]);
    const p = new PlayerSim(3 * TILE, FLOOR_Y, walled, new EventBus());
    for (let i = 0; i < 30; i++) p.step(EMPTY_INPUT);
    for (let i = 0; i < 400; i++) p.step(press({ right: true }));
    // the wall tile at tx=8 spans px 128..144; the body never passes it
    expect(p.x).toBeLessThan(8 * TILE + 1);
  });
});
