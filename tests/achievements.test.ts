import { describe, expect, it } from 'vitest';
import { earnAchievements, ACHIEVEMENTS } from '../src/data/achievements';
import { defaultSave } from '../src/systems/save';

describe('achievements', () => {
  it('every achievement has a unique id and non-empty name/desc', () => {
    const ids = new Set<string>();
    for (const a of ACHIEVEMENTS) {
      expect(a.name.length, a.id).toBeGreaterThan(0);
      expect(a.desc.length, a.id).toBeGreaterThan(0);
      expect(ids.has(a.id), `duplicate id ${a.id}`).toBe(false);
      ids.add(a.id);
    }
  });

  it('earns first_light when a beacon is relit, and only once', () => {
    const d = defaultSave();
    d.levelUnlocked = 1;
    const first = earnAchievements(d);
    expect(first.map((a) => a.id)).toContain('first_light');
    expect(d.achievements).toContain('first_light');
    // a second pass earns nothing new for the same state
    const second = earnAchievements(d);
    expect(second.some((a) => a.id === 'first_light')).toBe(false);
  });

  it('earns stat-threshold achievements', () => {
    const d = defaultSave();
    d.stats.perfectClears = 1;
    d.stats.bossesDefeated = 2;
    const earned = earnAchievements(d).map((a) => a.id);
    expect(earned).toContain('not_a_scratch');
    expect(earned).toContain('bossbane');
    expect(earned).toContain('two_down');
    // untouchable needs 5 perfect clears — not yet
    expect(earned).not.toContain('untouchable');
  });

  it('counts tokens across levels for token achievements', () => {
    const d = defaultSave();
    // full sets (mask 15 = 4 bits) in three levels = 12 tokens
    d.tokens = { 0: 15, 1: 15, 2: 15 };
    const earned = earnAchievements(d).map((a) => a.id);
    expect(earned).toContain('token_seeker'); // >= 12
    expect(earned).not.toContain('ember_collector'); // needs 30
  });

  it('earns lantern achievements from found relics', () => {
    const d = defaultSave();
    d.relics = [0];
    const first = earnAchievements(d).map((a) => a.id);
    expect(first).toContain('first_tale');
    expect(first).not.toContain('keeper_of_tales'); // needs all six
    d.relics = [0, 3, 8, 13, 18, 23];
    const all = earnAchievements(d).map((a) => a.id);
    expect(all).toContain('keeper_of_tales');
  });

  it('does not re-earn already unlocked achievements', () => {
    const d = defaultSave();
    d.levelUnlocked = 13;
    d.stats.gemsAllTime = 300;
    const firstIds = earnAchievements(d).map((a) => a.id);
    expect(firstIds.length).toBeGreaterThan(0);
    const again = earnAchievements(d);
    expect(again).toHaveLength(0);
  });
});
