/**
 * Run modes — the post-completion challenges (GROWTH_ROADMAP #4). All three
 * are "a rules-bound run over a sequence of levels", so they share one model:
 *
 *   boss     — the five bosses back to back, fastest cumulative time.
 *   time     — the whole 28-level campaign back to back, fastest total (a
 *              full-game speedrun); deaths respawn at checkpoint and cost time.
 *   hardcore — the whole campaign on ONE life; a single death ends the run.
 *              "Best" is how deep you got (and completing all 28 is the win).
 *
 * State rides GameScene's init data between levels. Bests live in their own
 * localStorage keys (no save-version bump); totals submit to the global board
 * under synthetic per-mode level ids.
 */

export type RunMode = 'boss' | 'time' | 'hardcore';

export interface RunState {
  mode: RunMode;
  /** index into the mode's sequence (NOT the level index) */
  i: number;
  /** cumulative ms across finished levels this run */
  timeMs: number;
  deaths: number;
}

const BOSS_SEQ = [7, 12, 17, 22, 27];
/** full campaign, in order (0..27) */
const CAMPAIGN_SEQ = Array.from({ length: 28 }, (_, i) => i);

export function runSeq(mode: RunMode): number[] {
  return mode === 'boss' ? BOSS_SEQ : CAMPAIGN_SEQ;
}

/** Synthetic leaderboard "level" ids per mode (past the real 0..27). */
export const RUN_LB_LEVEL: Record<RunMode, number> = { boss: 40, time: 41, hardcore: 42 };

export const RUN_TITLE: Record<RunMode, string> = {
  boss: 'BOSS RUSH', time: 'TIME ATTACK', hardcore: 'HARDCORE',
};

const BEST_KEY: Record<RunMode, string> = {
  boss: 'emberwilds.bossRushBest',   // ms (kept from the original Boss Rush)
  time: 'emberwilds.timeAttackBest', // ms
  hardcore: 'emberwilds.hardcoreBest', // deepest level count reached
};

function readNum(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}
function writeNum(key: string, v: number): void {
  try {
    localStorage.setItem(key, String(Math.round(v)));
  } catch {
    // storage unavailable — the run still counts for this session
  }
}

/** Best time (ms) for boss/time; best depth (levels reached) for hardcore. */
export function runBest(mode: RunMode): number {
  return readNum(BEST_KEY[mode]);
}

/** Record a result. For boss/time `value` is total ms (lower is better); for
 *  hardcore it's the depth reached (higher is better). Returns true if best. */
export function setRunBest(mode: RunMode, value: number): boolean {
  const prev = runBest(mode);
  const better = mode === 'hardcore' ? value > prev : !prev || value < prev;
  if (!better) return false;
  writeNum(BEST_KEY[mode], value);
  return true;
}
