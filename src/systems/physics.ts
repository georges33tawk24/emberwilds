/**
 * Pixel-honest AABB movement against the tile grid.
 *
 * Bodies are positioned by center-x / bottom-y (feet). Movement is resolved
 * one axis at a time in sub-steps small enough that no step can cross a full
 * tile — no tunneling at any speed the game can produce (and fuzz-tested
 * beyond it).
 *
 * Pure module: no Phaser, no globals — unit-testable and deterministic.
 */
import { TILE, type Solidity } from '../data/levelTypes';

export type SolidityQuery = (tx: number, ty: number) => Solidity;

export interface Body {
  /** center x, px */
  x: number;
  /** bottom (feet) y, px */
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

export interface MoveResult {
  hitX: boolean;
  hitY: boolean;
  onGround: boolean;
  /** the body is pressed against a wall on this side (-1 left, 1 right, 0 none) */
  wall: -1 | 0 | 1;
}

const EPS = 0.0001;
/** max px moved per sub-step; must stay below TILE */
const MAX_STEP = 4;

/** Full-tile blockers: never-pass terrain plus closed doors and gates.
 *  Ice collides exactly like stone — the slip lives in ground control. */
function blocks(s: Solidity): boolean {
  return s === 'solid' || s === 'crack' || s === 'door' || s === 'gate' || s === 'ice';
}

export function left(b: Body): number {
  return b.x - b.w / 2;
}
export function right(b: Body): number {
  return b.x + b.w / 2;
}
export function top(b: Body): number {
  return b.y - b.h;
}
export function bottom(b: Body): number {
  return b.y;
}

function tileRange(minPx: number, maxPx: number): [number, number] {
  return [Math.floor(minPx / TILE), Math.floor((maxPx - EPS) / TILE)];
}

/** Is any fully-solid tile overlapping the horizontal strip? */
function solidInRows(
  solidAt: SolidityQuery,
  tx: number,
  y0: number,
  y1: number,
): boolean {
  const [r0, r1] = tileRange(y0, y1);
  for (let ty = r0; ty <= r1; ty++) {
    if (blocks(solidAt(tx, ty))) return true;
  }
  return false;
}

function solidInCols(
  solidAt: SolidityQuery,
  ty: number,
  x0: number,
  x1: number,
): 'none' | 'solid' | 'oneway' {
  const [c0, c1] = tileRange(x0, x1);
  let oneway = false;
  for (let tx = c0; tx <= c1; tx++) {
    const s = solidAt(tx, ty);
    if (blocks(s)) return 'solid';
    if (s === 'oneway') oneway = true;
  }
  return oneway ? 'oneway' : 'none';
}

/**
 * Move horizontally by dx, stopping flush against solids.
 * If `cornerNudge` > 0 and the body is airborne, a head-height clip of up to
 * that many px is resolved by sliding the body down… (not used horizontally;
 * see moveY for upward corner correction).
 */
export function moveX(b: Body, dx: number, solidAt: SolidityQuery): boolean {
  let remaining = dx;
  let hit = false;
  while (Math.abs(remaining) > EPS) {
    const step = Math.max(-MAX_STEP, Math.min(MAX_STEP, remaining));
    remaining -= step;
    const newX = b.x + step;
    const dir = Math.sign(step);
    const edge = dir > 0 ? newX + b.w / 2 : newX - b.w / 2;
    const tx = Math.floor((dir > 0 ? edge - EPS : edge) / TILE);
    if (solidInRows(solidAt, tx, top({ ...b, x: newX }), bottom(b) - EPS)) {
      // stop flush against the tile edge
      b.x = dir > 0 ? tx * TILE - b.w / 2 : (tx + 1) * TILE + b.w / 2;
      hit = true;
      break;
    }
    b.x = newX;
  }
  return hit;
}

export interface MoveYResult {
  hit: boolean;
  landed: boolean;
  /** landed specifically on a one-way platform */
  onOneway: boolean;
  /** hit head on the ceiling */
  ceiling: boolean;
}

/**
 * Move vertically by dy. Falling collides with solids and one-way platform
 * tops (only when the feet started above them). Rising collides with solids
 * only, with corner-correction: if the head clips a tile by ≤ `cornerNudge`
 * px horizontally, the body is nudged sideways and keeps rising.
 */
export function moveY(
  b: Body,
  dy: number,
  solidAt: SolidityQuery,
  opts: { dropThrough?: boolean; cornerNudge?: number } = {},
): MoveYResult {
  const res: MoveYResult = { hit: false, landed: false, onOneway: false, ceiling: false };
  let remaining = dy;
  while (Math.abs(remaining) > EPS) {
    const step = Math.max(-MAX_STEP, Math.min(MAX_STEP, remaining));
    remaining -= step;
    if (step > 0) {
      // falling: check the row the feet are entering
      const newY = b.y + step;
      const tyFrom = Math.floor((b.y - EPS) / TILE);
      const tyTo = Math.floor((newY - EPS) / TILE);
      let blocked = false;
      for (let ty = tyFrom; ty <= tyTo; ty++) {
        const kind = solidInCols(solidAt, ty, left(b), right(b));
        if (kind === 'none') continue;
        const tileTop = ty * TILE;
        if (tileTop < b.y - EPS) continue; // already inside/past — not a landing edge
        if (kind === 'oneway') {
          if (opts.dropThrough) continue;
          // only land if feet started at or above the platform top
          if (b.y > tileTop + EPS) continue;
        }
        if (newY >= tileTop) {
          b.y = tileTop;
          res.hit = true;
          res.landed = true;
          res.onOneway = kind === 'oneway';
          return res;
        }
        blocked = true;
      }
      if (!blocked) b.y = newY;
    } else {
      // rising: check the row the head is entering
      const newY = b.y + step;
      const headNew = newY - b.h;
      const ty = Math.floor(headNew / TILE);
      const kind = solidInCols(solidAt, ty, left(b), right(b));
      if (kind === 'solid') {
        // corner correction: try nudging horizontally up to N px
        const nudge = opts.cornerNudge ?? 0;
        let corrected = false;
        for (let n = 1; n <= nudge && !corrected; n++) {
          for (const dir of [1, -1]) {
            const cand = { ...b, x: b.x + dir * n };
            if (
              solidInCols(solidAt, ty, left(cand), right(cand)) !== 'solid' &&
              !solidInRows(solidAt, Math.floor((dir > 0 ? right(cand) - EPS : left(cand)) / TILE), top(cand), bottom(cand) - EPS)
            ) {
              b.x = cand.x;
              corrected = true;
              break;
            }
          }
        }
        if (!corrected) {
          b.y = (ty + 1) * TILE + b.h;
          res.hit = true;
          res.ceiling = true;
          return res;
        }
        b.y = newY;
      } else {
        b.y = newY;
      }
    }
  }
  return res;
}

/** Is the body's mid-section submerged in a water tile? */
export function inWater(b: Body, solidAt: SolidityQuery): boolean {
  const tx = Math.floor(b.x / TILE);
  const ty = Math.floor((b.y - b.h / 2) / TILE);
  return solidAt(tx, ty) === 'water';
}

/** Is the body standing on ground right now (probe 1px below the feet)? */
export function groundBelow(b: Body, solidAt: SolidityQuery): 'none' | 'solid' | 'oneway' {
  const ty = Math.floor((b.y + 1 - EPS) / TILE);
  // feet must be at (or within 1px of) the tile top for it to count as standing
  const tileTop = ty * TILE;
  if (b.y < tileTop - 1 || b.y > tileTop + 1) {
    const kind = solidInCols(solidAt, ty, left(b), right(b));
    return kind === 'solid' && b.y >= tileTop - 1 ? 'solid' : 'none';
  }
  return solidInCols(solidAt, ty, left(b), right(b));
}

/** Which wall (if any) is the body flush against? */
export function wallContact(b: Body, solidAt: SolidityQuery): -1 | 0 | 1 {
  const probe = 1;
  const y0 = top(b) + 2;
  const y1 = bottom(b) - 2;
  const txR = Math.floor((right(b) + probe - EPS) / TILE);
  if (solidInRows(solidAt, txR, y0, y1)) return 1;
  const txL = Math.floor((left(b) - probe) / TILE);
  if (solidInRows(solidAt, txL, y0, y1)) return -1;
  return 0;
}

/** Does the body overlap any spike tile's dangerous zone (lower 10px)? */
export function touchesSpikes(b: Body, solidAt: SolidityQuery): boolean {
  const [c0, c1] = tileRange(left(b) + 2, right(b) - 2);
  const [r0, r1] = tileRange(top(b), bottom(b) - EPS);
  for (let ty = r0; ty <= r1; ty++) {
    for (let tx = c0; tx <= c1; tx++) {
      if (solidAt(tx, ty) !== 'spike') continue;
      const dangerTop = ty * TILE + 6; // spikes occupy the lower 10px of the tile
      if (bottom(b) > dangerTop && top(b) < (ty + 1) * TILE) return true;
    }
  }
  return false;
}

export function aabbOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return (
    Math.abs(ax - bx) * 2 < aw + bw &&
    ay - ah < by && by - bh < ay
  );
}

/** Overlap test between two bodies (center-x / bottom-y convention). */
export function bodiesOverlap(a: Body, b: Body): boolean {
  return aabbOverlap(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h);
}
