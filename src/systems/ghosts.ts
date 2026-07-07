/**
 * Ghost racing — record the player's path on a best-time run, replay it as a
 * translucent fox next time so players race their own best line (GROWTH_ROADMAP
 * Phase 2: the deterministic-sim asset, but purely client-side — the ghost is a
 * cosmetic position playback, it never touches the world, so it needs no sim
 * determinism at all).
 *
 * Ghosts live in their own localStorage keys (NOT the save blob) so the save
 * stays lean. One ghost per level: the best-time run.
 */

export interface GhostData {
  /** ms between samples (fixed cadence; sample i is at time i*dt) */
  dt: number;
  xs: number[];
  ys: number[];
  /** facing per sample: -1 or 1 */
  fs: number[];
}

/** Sample cadence while recording (25 Hz — smooth enough with lerp, compact). */
export const GHOST_DT = 40;

const KEY = (level: number): string => `emberwilds.ghost.${level}`;

export function saveGhost(level: number, data: GhostData): void {
  try {
    localStorage.setItem(KEY(level), JSON.stringify(data));
  } catch {
    // storage full / unavailable — ghosts are non-essential, just skip
  }
}

export function loadGhost(level: number): GhostData | null {
  try {
    const raw = localStorage.getItem(KEY(level));
    if (!raw) return null;
    const d = JSON.parse(raw) as GhostData;
    if (!d || !Array.isArray(d.xs) || !Array.isArray(d.ys) || d.xs.length === 0) return null;
    return d;
  } catch {
    return null;
  }
}

/** Interpolated ghost position at time `ms`, or null once the ghost has
 *  finished its run (so it vanishes at its goal). */
export function ghostAt(g: GhostData, ms: number): { x: number; y: number; facing: number } | null {
  const f = ms / g.dt;
  const i = Math.floor(f);
  if (i < 0) return { x: g.xs[0], y: g.ys[0], facing: g.fs[0] || 1 };
  if (i >= g.xs.length - 1) {
    const last = g.xs.length - 1;
    // one dt of grace past the end, then the ghost is done
    if (i > last + 1) return null;
    return { x: g.xs[last], y: g.ys[last], facing: g.fs[last] || 1 };
  }
  const t = f - i;
  return {
    x: g.xs[i] + (g.xs[i + 1] - g.xs[i]) * t,
    y: g.ys[i] + (g.ys[i + 1] - g.ys[i]) * t,
    facing: g.fs[i] || 1,
  };
}
