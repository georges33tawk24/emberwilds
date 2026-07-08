/**
 * Leaderboard client (GROWTH_ROADMAP Phase 2) — talks to the Cloudflare
 * Worker in backend/leaderboard/. DARK until LEADERBOARD_URL is set (see
 * backend/leaderboard/DEPLOY.md): with an empty URL nothing fetches, nothing
 * submits, and no UI appears — the feature simply does not exist.
 *
 * Render-side only (localStorage + fetch) — never touched by the sim.
 */
import type { GhostData } from './ghosts';

/** Paste the deployed worker URL here to turn leaderboards on. */
export const LEADERBOARD_URL = 'https://emberwilds-leaderboard.georges33tawk24.workers.dev';

export interface LeaderboardEntry {
  name: string;
  timeMs: number;
}

/** The world #1 run for a level: whose it is, its time, and the ghost path. */
export interface WorldRecordGhost {
  name: string;
  timeMs: number;
  ghost: GhostData;
}

export function leaderboardEnabled(): boolean {
  return LEADERBOARD_URL.length > 0;
}

/** Stable anonymous device id (the worker keys best-per-device on it). */
function uid(): string {
  try {
    let v = localStorage.getItem('emberwilds.uid');
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem('emberwilds.uid', v);
    }
    return v;
  } catch {
    return 'anon-00000000';
  }
}

/** Display name — defaults to FOX until a name-entry UI exists. */
export function playerName(): string {
  try {
    return localStorage.getItem('emberwilds.name') ?? 'FOX';
  } catch {
    return 'FOX';
  }
}

const cache = new Map<number, { at: number; entries: LeaderboardEntry[] }>();

/** Push a rename to every board this device already sits on. Resolves once
 *  the worker has applied it (so callers can refetch immediately). */
export async function announceName(levels: number[]): Promise<void> {
  if (!leaderboardEnabled() || levels.length === 0) return;
  try {
    await fetch(`${LEADERBOARD_URL}/name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid(), name: playerName(), levels }),
    });
    for (const l of levels) cache.delete(l);
  } catch {
    // offline — the rename still rides the next submission
  }
}

/** Fire-and-forget: submit a new best clear time, optionally with the run's
 *  ghost recording (the worker keeps it only if the run takes rank 1, so it
 *  becomes the world-record ghost others race). Never throws. */
export function submitScore(level: number, timeMs: number, ghost?: GhostData | null): void {
  if (!leaderboardEnabled()) return;
  cache.delete(level); // the next fetch should see this submission
  const body: Record<string, unknown> = { level, timeMs: Math.round(timeMs), name: playerName(), uid: uid() };
  if (ghost && ghost.xs.length > 1) body.ghost = ghost;
  void fetch(`${LEADERBOARD_URL}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

const wrCache = new Map<number, { at: number; wr: WorldRecordGhost | null }>();

/** The world-record ghost for a level (60s cache). Null if none / on failure. */
export async function fetchWrGhost(level: number): Promise<WorldRecordGhost | null> {
  if (!leaderboardEnabled()) return null;
  const hit = wrCache.get(level);
  if (hit && performance.now() - hit.at < 60_000) return hit.wr;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3500);
    const res = await fetch(`${LEADERBOARD_URL}/wrghost?level=${level}`, { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return null;
    const body = (await res.json()) as { ghost?: GhostData | null; name?: string; timeMs?: number };
    const wr = body.ghost && Array.isArray(body.ghost.xs) && body.ghost.xs.length > 1
      ? { name: body.name ?? 'FOX', timeMs: body.timeMs ?? 0, ghost: body.ghost }
      : null;
    wrCache.set(level, { at: performance.now(), wr });
    return wr;
  } catch {
    return null;
  }
}

/** Top times for a level (30s client cache, 3s timeout). Null on any failure. */
export async function fetchTop(level: number): Promise<LeaderboardEntry[] | null> {
  if (!leaderboardEnabled()) return null;
  const hit = cache.get(level);
  if (hit && performance.now() - hit.at < 30_000) return hit.entries;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    // bypass the browser's HTTP cache — our own 30s map above is the cache
    const res = await fetch(`${LEADERBOARD_URL}/leaderboard?level=${level}`, { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return null;
    const body = (await res.json()) as { scores?: LeaderboardEntry[] };
    const entries = Array.isArray(body.scores) ? body.scores : [];
    cache.set(level, { at: performance.now(), entries });
    return entries;
  } catch {
    return null;
  }
}
