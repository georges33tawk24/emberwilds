/**
 * Boss Rush — the post-completion mode (GROWTH_ROADMAP #4). Fight all five
 * bosses back to back for a single cumulative time: Rustjaw → Warden →
 * Shrike → Shiverback → Baron, ascending world order (= ascending difficulty).
 *
 * State is carried between arenas through GameScene's init data; the best time
 * lives in its own localStorage key (no save-version bump), and the total is
 * submitted to the leaderboard under a synthetic level id so there's a global
 * board to chase.
 */

/** Boss arena level indices, in fight order. */
export const BOSS_RUSH_SEQ = [7, 12, 17, 22, 27];

/** Synthetic leaderboard "level" for the boss-rush total time. */
export const BOSS_RUSH_LEVEL = 40;

/** Carried between arenas: which boss, time so far, deaths so far. */
export interface RushState {
  i: number;
  timeMs: number;
  deaths: number;
}

const KEY = 'emberwilds.bossRushBest';

/** Best boss-rush total time in ms, or 0 if never finished. */
export function bossRushBest(): number {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Record a finished run; returns true if it's a new best. */
export function setBossRushBest(ms: number): boolean {
  const prev = bossRushBest();
  if (prev && ms >= prev) return false;
  try {
    localStorage.setItem(KEY, String(Math.round(ms)));
  } catch {
    // storage unavailable — the run still counts for this session
  }
  return true;
}
