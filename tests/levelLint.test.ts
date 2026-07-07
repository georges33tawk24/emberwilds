/**
 * Level lint (spec §6, §15): every shipped level must parse, meet content
 * rules, and have a goal reachable under a conservative movement model.
 */
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/data/levels';
import { parseLevel } from '../src/data/levelParser';

const SOLID = new Set(['#', 'X', 'C', 'I']);
const STANDABLE = new Set(['#', 'X', 'C', '=', 'I']);

/**
 * Conservative reachability: BFS over "standing cells" (air with support
 * below). Moves: walk ±1; jump up to 4 tiles up / 6 across; fall any depth
 * within a ±3 drift; springs (and water) grant 8 tiles of lift. Water is a
 * swimmable foothold; doors/gates are assumed openable (keys/switches are
 * placed on the path before them). Glide/wall-jumps are NOT modeled — if this
 * passes, a mid-skill player can definitely finish.
 */
function goalReachable(level: ReturnType<typeof parseLevel>, springs: Set<string>): boolean {
  const { width, height, grid } = level;
  const at = (x: number, y: number): string =>
    x < 0 || x >= width || y < 0 || y >= height ? 'X' : grid[y][x];
  // doors 'D' and gates 'H' are not in SOLID → treated as open (openable)
  const open = (x: number, y: number): boolean => !SOLID.has(at(x, y)) && at(x, y) !== '^';
  // water is a region (level.waterSet), not a tile — a swimmable foothold
  const inWater = (x: number, y: number): boolean => level.waterSet.has(y * width + x);
  const standing = (x: number, y: number): boolean =>
    open(x, y) && (STANDABLE.has(at(x, y + 1)) || inWater(x, y) || y + 1 >= height);

  const start = {
    x: Math.floor(level.playerStart.x / 16),
    y: Math.floor((level.playerStart.y - 1) / 16),
  };
  const goal = level.entities.find((e) => e.type === 'F')!;

  const seen = new Set<string>();
  const queue: [number, number][] = [[start.x, start.y]];
  seen.add(`${start.x},${start.y}`);

  const tryAdd = (x: number, y: number): void => {
    const k = `${x},${y}`;
    if (seen.has(k)) return;
    if (!standing(x, y)) return;
    seen.add(k);
    queue.push([x, y]);
  };

  /** drop from (x, y) to the first standing cell below, then add it */
  const drop = (x: number, y: number): void => {
    for (let dy = 0; y + dy < height; dy++) {
      if (!open(x, y + dy)) return; // spikes/solid in the way
      if (standing(x, y + dy)) {
        tryAdd(x, y + dy);
        return;
      }
    }
  };

  let guard = 0;
  while (queue.length && guard++ < 200000) {
    const [x, y] = queue.shift()!;
    if (Math.abs(x - goal.tx) <= 1 && Math.abs(y - goal.ty) <= 2) return true;

    const lift = springs.has(`${x},${y}`) || inWater(x, y) ? 8 : 4;
    // jumps: up to `lift` up, up to 6 across (climbing arcs get less range)
    for (let dy = 0; dy >= -lift; dy--) {
      const maxDx = dy < -2 ? 3 : 6;
      for (let dx = -maxDx; dx <= maxDx; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (!open(nx, ny)) continue;
        if (standing(nx, ny)) tryAdd(nx, ny);
        else drop(nx, ny);
      }
    }
  }
  return false;
}

describe('level lint', () => {
  it('has at least 3 levels', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(3);
  });

  for (const [i, def] of LEVELS.entries()) {
    describe(`level ${i + 1}: ${def.name}`, () => {
      const level = parseLevel(def);
      const isBoss = !!def.boss;
      const springs = new Set(
        level.entities.filter((e) => e.type === 'S').map((e) => `${e.tx},${e.ty}`),
      );

      it('parses with sane dimensions', () => {
        // Phase-2 floor: standard levels are Super-Mario scale or bigger
        // (SMB 1-1 is ~211 wide); boss arenas are legitimately compact
        expect(level.width).toBeGreaterThanOrEqual(isBoss ? 48 : 220);
        expect(level.height).toBeGreaterThanOrEqual(isBoss ? 24 : 40);
      });

      it('has exactly one goal and one checkpoint', () => {
        expect(level.entities.filter((e) => e.type === 'F')).toHaveLength(1);
        expect(level.entities.filter((e) => e.type === 'K')).toHaveLength(1);
      });

      it.skipIf(isBoss)('has exactly 4 ember tokens', () => {
        expect(level.tokenTotal).toBe(4);
      });

      it.skipIf(isBoss)('has a healthy gem count', () => {
        expect(level.gemTotal).toBeGreaterThanOrEqual(40);
        expect(level.gemTotal).toBeLessThanOrEqual(90);
      });

      it.runIf(isBoss)('boss arena spawns exactly one boss', () => {
        expect(level.entities.filter((e) => e.type === 'Y')).toHaveLength(1);
      });

      it('ground entities are supported', () => {
        for (const e of level.entities) {
          if (!'KFSETAY'.includes(e.type)) continue;
          let supported = false;
          for (let dy = 1; dy <= 2; dy++) {
            const ch = level.grid[e.ty + dy]?.[e.tx];
            if (ch && '#X=CI'.includes(ch)) supported = true;
          }
          expect(supported, `${e.type} at ${e.tx},${e.ty} is floating`).toBe(true);
        }
      });

      it('goal is reachable under the conservative movement model', () => {
        expect(goalReachable(level, springs)).toBe(true);
      });

      it('checkpoint is reachable', () => {
        const k = level.entities.find((e) => e.type === 'K')!;
        const cut = {
          ...level,
          entities: level.entities.map((e) =>
            e.type === 'F' ? { ...k, type: 'F' } : e.type === 'K' ? { ...e, type: 'k-moved' } : e,
          ),
        };
        expect(goalReachable(cut, springs)).toBe(true);
      });
    });
  }
});
