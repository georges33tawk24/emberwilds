/**
 * Achievements — feat-gated unlocks that graft endless retention onto a
 * campaign that otherwise ends (GROWTH_ROADMAP Phase 1). All checks are pure
 * predicates over the save data, so they're client-side with zero backend or
 * moderation. Keep the set MEANINGFUL (~a dozen), not padded to 100.
 *
 * The framing leans death-positive (Celeste: "be proud of your death count").
 */
import type { SaveData } from '../systems/save';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  test: (ctx: AchievementCtx) => boolean;
}

export interface AchievementCtx {
  data: SaveData;
  totalTokens: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_light', name: 'First Light', desc: 'Relight your first Warmth Beacon', test: (c) => c.data.levelUnlocked >= 1 },
  { id: 'thornwood', name: 'Through the Thornwood', desc: 'Clear all of World 1', test: (c) => c.data.levelUnlocked >= 3 },
  { id: 'canyon', name: 'Across the Canyon', desc: 'Clear all of World 2', test: (c) => c.data.levelUnlocked >= 8 },
  { id: 'ruins', name: 'Into the Ruins', desc: 'Clear all of World 3', test: (c) => c.data.levelUnlocked >= 13 },
  { id: 'cinderpeaks', name: 'Over the Cinderpeaks', desc: 'Clear all of World 4', test: (c) => c.data.levelUnlocked >= 18 },
  { id: 'rimefell', name: 'Through the Whiteout', desc: 'Clear all of World 5', test: (c) => c.data.levelUnlocked >= 23 },
  { id: 'bossbane', name: 'Bossbane', desc: 'Defeat a boss', test: (c) => c.data.stats.bossesDefeated >= 1 },
  { id: 'two_down', name: 'Two Down', desc: 'Defeat two bosses', test: (c) => c.data.stats.bossesDefeated >= 2 },
  { id: 'three_shards', name: 'Three Shards Burning', desc: 'Defeat three bosses', test: (c) => c.data.stats.bossesDefeated >= 3 },
  { id: 'four_shards', name: 'The Fourth Shard', desc: 'Defeat four bosses', test: (c) => c.data.stats.bossesDefeated >= 4 },
  { id: 'not_a_scratch', name: 'Not a Scratch', desc: 'Clear a level without taking a hit', test: (c) => c.data.stats.perfectClears >= 1 },
  { id: 'untouchable', name: 'Untouchable', desc: 'Clear five levels without a hit', test: (c) => c.data.stats.perfectClears >= 5 },
  { id: 'token_seeker', name: 'Token Seeker', desc: 'Collect 12 Ember Tokens', test: (c) => c.totalTokens >= 12 },
  { id: 'ember_collector', name: 'Ember Collector', desc: 'Collect 30 Ember Tokens', test: (c) => c.totalTokens >= 30 },
  { id: 'gem_hoarder', name: 'Gem Hoarder', desc: 'Gather 250 gems in all', test: (c) => c.data.stats.gemsAllTime >= 250 },
  { id: 'wildkeeper', name: 'Wildkeeper', desc: 'Defeat 100 foes', test: (c) => c.data.stats.enemiesDefeated >= 100 },
  { id: 'stomper', name: 'Stomper', desc: 'Stomp 50 enemies', test: (c) => c.data.stats.stomps >= 50 },
  { id: 'get_back_up', name: 'Get Back Up', desc: 'Fall and rise again 25 times', test: (c) => c.data.stats.deaths >= 25 },
  { id: 'warmth_bearer', name: 'Warmth Bearer', desc: 'Play for 30 minutes', test: (c) => c.data.stats.playtimeMs >= 1_800_000 },
];

/**
 * Mutate `data.achievements` with any newly-earned ids and return the fresh
 * Achievement objects (for celebrating). Caller persists the save.
 */
export function earnAchievements(data: SaveData): Achievement[] {
  const ctx: AchievementCtx = { data, totalTokens: countTokens(data.tokens) };
  const fresh = ACHIEVEMENTS.filter((a) => !data.achievements.includes(a.id) && a.test(ctx));
  for (const a of fresh) data.achievements.push(a.id);
  return fresh;
}

function countTokens(tokens: Record<number, number>): number {
  let total = 0;
  for (const mask of Object.values(tokens)) {
    let m = mask;
    while (m) { total += m & 1; m >>= 1; }
  }
  return total;
}
