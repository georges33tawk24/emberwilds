import { describe, expect, it } from 'vitest';
import { SaveManager, SAVE_VERSION, defaultSave, type StorageLike } from '../src/systems/save';

function memStorage(initial: Record<string, string> = {}): StorageLike & { map: Map<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

describe('SaveManager', () => {
  it('round-trips data', () => {
    const store = memStorage();
    const a = new SaveManager(store);
    a.data.gems = 42;
    a.collectToken(0, 2);
    a.clearLevel(0, 61234, 10);
    const b = new SaveManager(store);
    expect(b.data.gems).toBe(52); // 42 + 10 banked on clear
    expect(b.tokenCount(0)).toBe(1);
    expect(b.data.levelUnlocked).toBe(1);
    expect(b.data.bestTimes[0]).toBe(61234);
  });

  it('recovers from a corrupt primary blob via backup', () => {
    const store = memStorage();
    const a = new SaveManager(store);
    a.data.gems = 7;
    a.save();
    a.data.gems = 9;
    a.save(); // primary=9, backup=7
    store.map.set('emberwilds.save', '{corrupt!!!');
    const b = new SaveManager(store);
    expect(b.data.gems).toBe(7); // fell back to backup
  });

  it('falls back to defaults when everything is corrupt', () => {
    const store = memStorage({
      'emberwilds.save': 'garbage',
      'emberwilds.save.bak': 'also garbage',
    });
    const b = new SaveManager(store);
    expect(b.data).toEqual(defaultSave());
  });

  it('backfills missing settings keys on load (forward-compat)', () => {
    const store = memStorage();
    const old = defaultSave() as unknown as { settings: Record<string, unknown>; version: number };
    delete old.settings.flashReduction;
    store.map.set('emberwilds.save', JSON.stringify(old));
    const b = new SaveManager(store);
    expect(b.data.settings.flashReduction).toBe(false);
    expect(b.data.version).toBe(SAVE_VERSION);
  });

  it('migrates a v1 save through the full chain to the current version', () => {
    const store = memStorage();
    const v1 = {
      version: 1, levelUnlocked: 3, gems: 50, tokens: { 0: 3 }, bestTimes: {},
      settings: { musicVol: 0.5, sfxVol: 0.5, masterVol: 0.5, screenShake: true, flashReduction: false },
    };
    store.map.set('emberwilds.save', JSON.stringify(v1));
    const s = new SaveManager(store);
    expect(s.data.version).toBe(SAVE_VERSION);
    expect(s.data.levelUnlocked).toBe(3); // preserved
    expect(s.data.gems).toBe(50);
    expect(s.data.upgrades).toEqual({ maxHearts: 0, doubleJump: 0, glide: 0, charge: 0 });
    // v3 story fields arrive unset — the intro and world cards are new content
    expect(s.data.introSeen).toBe(false);
    expect(s.data.worldsSeen).toEqual([]);
  });

  it('migrates a v2 save to v3 with story fields', () => {
    const store = memStorage();
    const v2 = {
      version: 2, levelUnlocked: 7, gems: 120, tokens: { 3: 15 }, bestTimes: { 0: 41000 },
      upgrades: { maxHearts: 1, doubleJump: 1, glide: 0, charge: 0 },
      settings: { musicVol: 0.5, sfxVol: 0.5, masterVol: 0.5, screenShake: true, flashReduction: false },
    };
    store.map.set('emberwilds.save', JSON.stringify(v2));
    const s = new SaveManager(store);
    expect(s.data.version).toBe(SAVE_VERSION);
    expect(s.data.levelUnlocked).toBe(7);
    expect(s.data.upgrades.doubleJump).toBe(1); // preserved
    expect(s.data.introSeen).toBe(false);
    expect(s.data.worldsSeen).toEqual([]);
    // v4 fields backfilled too
    expect(s.data.stats.deaths).toBe(0);
    expect(s.data.achievements).toEqual([]);
  });

  it('migrates a v3 save to v4 with stats + achievements', () => {
    const store = memStorage();
    const v3 = {
      version: 3, levelUnlocked: 5, gems: 40, tokens: {}, bestTimes: {},
      upgrades: { maxHearts: 0, doubleJump: 0, glide: 0, charge: 0 },
      settings: { musicVol: 0.5, sfxVol: 0.5, masterVol: 0.5, screenShake: true, flashReduction: false },
      introSeen: true, worldsSeen: [1, 2],
    };
    store.map.set('emberwilds.save', JSON.stringify(v3));
    const s = new SaveManager(store);
    expect(s.data.version).toBe(SAVE_VERSION);
    expect(s.data.introSeen).toBe(true); // preserved
    expect(s.data.worldsSeen).toEqual([1, 2]);
    expect(s.data.stats).toBeDefined();
    expect(s.data.stats.jumps).toBe(0);
    expect(s.data.achievements).toEqual([]);
    expect(s.data.flawless).toEqual([]); // v5 field backfilled
  });

  it('buys upgrades, spends gems, and blocks when unaffordable or maxed', () => {
    const store = memStorage();
    const s = new SaveManager(store);
    s.data.gems = 100;
    expect(s.upgradeCost('doubleJump')).toBe(80);
    expect(s.buyUpgrade('doubleJump')).toBe(true);
    expect(s.data.gems).toBe(20);
    expect(s.data.upgrades.doubleJump).toBe(1);
    // maxed (doubleJump has one level)
    expect(s.upgradeCost('doubleJump')).toBe(null);
    expect(s.buyUpgrade('doubleJump')).toBe(false);
    // unaffordable
    expect(s.upgradeCost('maxHearts')).toBe(30);
    s.data.gems = 10;
    expect(s.buyUpgrade('maxHearts')).toBe(false);
    expect(s.data.upgrades.maxHearts).toBe(0);
    // persists
    const reload = new SaveManager(store);
    expect(reload.data.upgrades.doubleJump).toBe(1);
  });

  it('keeps the better best-time', () => {
    const store = memStorage();
    const a = new SaveManager(store);
    a.clearLevel(1, 50000, 0);
    a.clearLevel(1, 70000, 0);
    expect(a.data.bestTimes[1]).toBe(50000);
    a.clearLevel(1, 30000, 0);
    expect(a.data.bestTimes[1]).toBe(30000);
  });
});
