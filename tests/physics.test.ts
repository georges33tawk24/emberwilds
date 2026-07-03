import { describe, expect, it } from 'vitest';
import { moveX, moveY, groundBelow, touchesSpikes, type Body } from '../src/systems/physics';
import { TILE, type Solidity } from '../src/data/levelTypes';

/** Build a solidity query from ASCII rows ('#' solid, '=' oneway, '^' spike). */
function world(rows: string[]): (tx: number, ty: number) => Solidity {
  return (tx, ty) => {
    const ch = rows[ty]?.[tx] ?? '.';
    if (ch === '#') return 'solid';
    if (ch === '=') return 'oneway';
    if (ch === '^') return 'spike';
    if (ch === 'C') return 'crack';
    return 'empty';
  };
}

function body(x: number, y: number): Body {
  return { x, y, w: 12, h: 18, vx: 0, vy: 0 };
}

describe('moveX', () => {
  const w = world([
    '........',
    '........',
    '...#....',
    '########',
  ]);

  it('moves freely through open space', () => {
    const b = body(20, 48);
    const hit = moveX(b, 10, w);
    expect(hit).toBe(false);
    expect(b.x).toBe(30);
  });

  it('stops flush against a wall', () => {
    const b = body(30, 48); // wall tile at tx=3 spans x 48..64, row ty=2 spans y 32..48
    const hit = moveX(b, 40, w);
    expect(hit).toBe(true);
    expect(b.x).toBe(48 - 6); // left edge of wall minus half width
  });

  it('never tunnels at extreme speed', () => {
    const b = body(8, 48);
    moveX(b, 4000, w);
    expect(b.x).toBeLessThanOrEqual(42);
  });
});

describe('moveY falling', () => {
  const w = world([
    '........',
    '........',
    '........',
    '########',
  ]);

  it('lands flush on the floor', () => {
    const b = body(20, 30);
    const res = moveY(b, 40, w);
    expect(res.landed).toBe(true);
    expect(b.y).toBe(48);
  });

  it('never tunnels through the floor at extreme speed', () => {
    const b = body(20, 4);
    const res = moveY(b, 100000, w);
    expect(res.landed).toBe(true);
    expect(b.y).toBe(48);
  });
});

describe('one-way platforms', () => {
  const w = world([
    '........',
    '........',
    '..====..',
    '........',
    '########',
  ]);

  it('lands when falling from above', () => {
    const b = body(50, 20);
    const res = moveY(b, 30, w);
    expect(res.landed).toBe(true);
    expect(res.onOneway).toBe(true);
    expect(b.y).toBe(32);
  });

  it('passes through when jumping from below', () => {
    const b = body(50, 60);
    const res = moveY(b, -40, w);
    expect(res.ceiling).toBe(false);
    expect(b.y).toBe(20);
  });

  it('passes through when dropping with dropThrough', () => {
    const b = body(50, 32);
    const res = moveY(b, 20, w, { dropThrough: true });
    expect(res.landed).toBe(false);
    expect(b.y).toBe(52);
  });

  it('does not catch a body already below the platform top', () => {
    const b = body(50, 40); // feet below platform top (32)
    const res = moveY(b, 20, w);
    expect(res.landed).toBe(false);
  });
});

describe('corner correction', () => {
  // ceiling with a one-tile notch: tiles at tx=0..1 and tx=3.. — gap at tx=2
  const w = world([
    '##.#####',
    '........',
    '........',
    '########',
  ]);

  it('nudges a head-clip around the corner while rising', () => {
    // body centered so its head slightly clips the tile at tx=3 (x=48..64)
    const b = body(41, 46); // head spans x 35..47... clip right edge just under tile 1? place to clip left of tile at tx=3
    const clipB = body(45, 40); // head strip 39..51 clips tile tx=3 by 3px
    const res = moveY(clipB, -24, w, { cornerNudge: 4 });
    expect(res.ceiling).toBe(false);
    expect(clipB.x).toBeLessThan(45); // nudged left into the notch
    void b;
  });

  it('still blocks a deep clip', () => {
    const deep = body(56, 40); // dead under tile tx=3, no nudge can save 8px overlap
    const res = moveY(deep, -30, w, { cornerNudge: 4 });
    expect(res.ceiling).toBe(true);
  });
});

describe('groundBelow / spikes', () => {
  const w = world([
    '........',
    '..^.....',
    '########',
  ]);

  it('detects standing on solid', () => {
    const b = body(20, 32);
    expect(groundBelow(b, w)).toBe('solid');
  });

  it('detects airborne', () => {
    const b = body(20, 20);
    expect(groundBelow(b, w)).toBe('none');
  });

  it('spikes hurt only in the danger zone', () => {
    const above = body(40, 18); // spike tile ty=1 spans y16..32; danger from y22
    expect(touchesSpikes(above, w)).toBe(false);
    const inside = body(40, 30);
    expect(touchesSpikes(inside, w)).toBe(true);
  });
});
