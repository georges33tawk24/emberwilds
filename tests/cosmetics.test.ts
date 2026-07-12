/** The Wardrobe — styled player frames stay lint-legal in every combination,
 *  and the v6 save migration lands cleanly. */
import { describe, expect, it } from 'vitest';
import { COSMETICS, buildStyledFrames } from '../src/systems/cosmetics';
import { PLAYER_FRAMES } from '../src/gfx/data/playerSprites';
import { PALETTE } from '../src/gfx/palette';
import { migrate, DEFAULT_STYLE, type SaveData } from '../src/systems/save';

const LEGAL = new Set([...Object.keys(PALETTE), '.']);

function assertSheetLegal(frames: Record<string, string[][]>): void {
  for (const [group, list] of Object.entries(frames)) {
    const base = PLAYER_FRAMES[group];
    expect(list.length, group).toBe(base.length);
    list.forEach((frame, fi) => {
      expect(frame.length, `${group}[${fi}] height`).toBe(base[fi].length);
      frame.forEach((row, ri) => {
        expect(row.length, `${group}[${fi}] row ${ri} width`).toBe(base[fi][ri].length);
        for (const ch of row) {
          expect(LEGAL.has(ch), `${group}[${fi}] illegal code '${ch}'`).toBe(true);
        }
      });
    });
  }
}

describe('cosmetics', () => {
  it('every remap targets a real palette code', () => {
    for (const c of COSMETICS) {
      for (const [from, to] of Object.entries(c.remap ?? {})) {
        expect(PALETTE[from], `${c.id} remaps unknown source ${from}`).toBeDefined();
        expect(PALETTE[to], `${c.id} remaps to unknown target ${to}`).toBeDefined();
      }
    }
  });

  it('the plain style is a faithful copy of the base frames', () => {
    const styled = buildStyledFrames({ ...DEFAULT_STYLE });
    expect(styled).toEqual(PLAYER_FRAMES);
  });

  // exhaustive bake — ~4s alone, and it can cross vitest's 5s default under
  // machine load (dev server + browser running), so give it explicit headroom
  it('every character x scarf x hat combination bakes lint-legal frames', { timeout: 20_000 }, () => {
    const characters = [null, ...COSMETICS.filter((c) => c.kind === 'character').map((c) => c.id)];
    const scarves = [null, ...COSMETICS.filter((c) => c.kind === 'scarf').map((c) => c.id)];
    for (const character of characters) {
      for (const scarf of scarves) {
        for (const hat of [null, 'hat_cap']) {
          assertSheetLegal(buildStyledFrames({ owned: [], character, scarf, hat }));
        }
      }
    }
  });

  it('the hat actually lands on every frame', () => {
    const plain = buildStyledFrames({ ...DEFAULT_STYLE });
    const hatted = buildStyledFrames({ ...DEFAULT_STYLE, hat: 'hat_cap' });
    for (const group of Object.keys(plain)) {
      plain[group].forEach((frame, fi) => {
        expect(hatted[group][fi].join(''), `${group}[${fi}] unchanged by the hat`).not.toBe(frame.join(''));
      });
    }
  });

  it('v5 saves migrate through v6 with an empty wardrobe', () => {
    const v5 = {
      version: 5, levelUnlocked: 9, gems: 321, tokens: { 1: 5 }, bestTimes: { 1: 44000 },
      upgrades: { maxHearts: 1, doubleJump: 1, glide: 0, charge: 0 },
      settings: { musicVol: 0.5, sfxVol: 0.5, masterVol: 0.5, screenShake: true, flashReduction: false, speedrunTimer: true, ghostRacer: true },
      introSeen: true, worldsSeen: [1, 2],
      stats: { deaths: 3, jumps: 40, stomps: 2, enemiesDefeated: 9, gemsAllTime: 400, levelsCleared: 9, perfectClears: 1, bossesDefeated: 1, playtimeMs: 90000 },
      achievements: ['first_light'], flawless: [2],
    } as unknown as SaveData;
    const out = migrate(v5);
    expect(out.version).toBeGreaterThanOrEqual(6); // continues to the current version
    expect(out.style).toEqual({ owned: [], character: null, scarf: null, hat: null });
    expect(out.gems).toBe(321); // nothing else touched
  });
});
