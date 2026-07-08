/**
 * Leaderboard client (GROWTH_ROADMAP Phase 2) — talks to the Cloudflare
 * Worker in backend/leaderboard/. DARK until LEADERBOARD_URL is set (see
 * backend/leaderboard/DEPLOY.md): with an empty URL nothing fetches, nothing
 * submits, and no UI appears — the feature simply does not exist.
 *
 * Render-side only (localStorage + fetch) — never touched by the sim.
 */

/** Paste the deployed worker URL here to turn leaderboards on. */
export const LEADERBOARD_URL = '';

export interface LeaderboardEntry {
  name: string;
  timeMs: number;
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

/** Fire-and-forget: submit a new best clear time. Never throws. */
export function submitScore(level: number, timeMs: number): void {
  if (!leaderboardEnabled()) return;
  void fetch(`${LEADERBOARD_URL}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, timeMs: Math.round(timeMs), name: playerName(), uid: uid() }),
  }).catch(() => undefined);
}

const cache = new Map<number, { at: number; entries: LeaderboardEntry[] }>();

/** Top times for a level (30s client cache, 3s timeout). Null on any failure. */
export async function fetchTop(level: number): Promise<LeaderboardEntry[] | null> {
  if (!leaderboardEnabled()) return null;
  const hit = cache.get(level);
  if (hit && performance.now() - hit.at < 30_000) return hit.entries;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    const res = await fetch(`${LEADERBOARD_URL}/leaderboard?level=${level}`, { signal: ctl.signal });
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
