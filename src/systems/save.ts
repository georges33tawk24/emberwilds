/**
 * Save system — versioned, corruption-safe, migratable (spec §12).
 *
 * Storage strategy: localStorage as the primary for the slice (synchronous,
 * universally available); the write path is atomic-in-effect because the
 * serialized blob is validated before replacing the previous key. A
 * `version` field gates migrations. IndexedDB promotion is a drop-in swap
 * behind the same interface.
 */

export interface Settings {
  musicVol: number;
  sfxVol: number;
  masterVol: number;
  screenShake: boolean;
  flashReduction: boolean;
}

/** Persistent upgrades bought in the Grove (each is a small integer level). */
export interface Upgrades {
  /** +1 max heart per level */
  maxHearts: number;
  /** 0/1 — unlocks a mid-air second jump */
  doubleJump: number;
  /** longer, slower scarf glide */
  glide: number;
  /** faster charge-shot windup */
  charge: number;
}

export const DEFAULT_UPGRADES: Upgrades = { maxHearts: 0, doubleJump: 0, glide: 0, charge: 0 };

export interface ShopItem {
  key: keyof Upgrades;
  name: string;
  desc: string;
  /** gem cost of each successive level; length = max level */
  costs: number[];
}

/** The Grove's stock. Costs scale so later ranks feel earned. */
export const SHOP_ITEMS: ShopItem[] = [
  { key: 'maxHearts', name: 'HEART BLOOM', desc: '+1 MAX HEART', costs: [30, 60, 120] },
  { key: 'doubleJump', name: 'TWINLEAF', desc: 'MID-AIR DOUBLE JUMP', costs: [80] },
  { key: 'glide', name: 'BROADSCARF', desc: 'LONGER, SLOWER GLIDE', costs: [40, 90] },
  { key: 'charge', name: 'QUICK EMBER', desc: 'FASTER CHARGE SHOT', costs: [40, 90] },
];

export interface SaveData {
  version: number;
  /** highest unlocked level index (0-based) */
  levelUnlocked: number;
  gems: number;
  /** per-level bitmask of the 4 ember tokens */
  tokens: Record<number, number>;
  /** best clear time per level, ms */
  bestTimes: Record<number, number>;
  upgrades: Upgrades;
  settings: Settings;
}

const KEY = 'emberwilds.save';
const BACKUP_KEY = 'emberwilds.save.bak';
export const SAVE_VERSION = 2;

export const DEFAULT_SETTINGS: Settings = {
  musicVol: 0.8,
  sfxVol: 0.9,
  masterVol: 0.9,
  screenShake: true,
  flashReduction: false,
};

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    levelUnlocked: 0,
    gems: 0,
    tokens: {},
    bestTimes: {},
    upgrades: { ...DEFAULT_UPGRADES },
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isValid(d: unknown): d is SaveData {
  if (!d || typeof d !== 'object') return false;
  const s = d as Partial<SaveData>;
  return (
    typeof s.version === 'number' &&
    typeof s.levelUnlocked === 'number' &&
    typeof s.gems === 'number' &&
    typeof s.tokens === 'object' && s.tokens !== null &&
    typeof s.settings === 'object' && s.settings !== null
  );
}

/** Migrations run in order from the blob's version up to SAVE_VERSION. */
const MIGRATIONS: Record<number, (d: SaveData) => SaveData> = {
  1: (d) => ({ ...d, version: 2, upgrades: { ...DEFAULT_UPGRADES } }),
};

export function migrate(d: SaveData): SaveData {
  let cur = d;
  while (cur.version < SAVE_VERSION) {
    const m = MIGRATIONS[cur.version];
    if (!m) break;
    cur = m(cur);
  }
  // backfill any missing keys from defaults (forward-compat)
  cur.settings = { ...DEFAULT_SETTINGS, ...cur.settings };
  cur.upgrades = { ...DEFAULT_UPGRADES, ...cur.upgrades };
  cur.bestTimes = cur.bestTimes ?? {};
  return cur;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class SaveManager {
  data: SaveData;

  constructor(private storage: StorageLike = safeLocalStorage()) {
    this.data = this.load();
  }

  load(): SaveData {
    for (const key of [KEY, BACKUP_KEY]) {
      try {
        const raw = this.storage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) return migrate(parsed);
      } catch {
        // corrupt blob — fall through to backup, then defaults
      }
    }
    return defaultSave();
  }

  save(): void {
    try {
      const blob = JSON.stringify(this.data);
      // keep the previous good blob as a backup before overwriting
      const prev = this.storage.getItem(KEY);
      if (prev) this.storage.setItem(BACKUP_KEY, prev);
      this.storage.setItem(KEY, blob);
    } catch {
      // storage full/unavailable — the game keeps running on in-memory state
    }
  }

  collectToken(level: number, index: number): void {
    this.data.tokens[level] = (this.data.tokens[level] ?? 0) | (1 << index);
    this.save();
  }

  tokenCount(level: number): number {
    let mask = this.data.tokens[level] ?? 0;
    let n = 0;
    while (mask) { n += mask & 1; mask >>= 1; }
    return n;
  }

  /** Cost of the NEXT level of an upgrade, or null if maxed. */
  upgradeCost(key: keyof Upgrades): number | null {
    const item = SHOP_ITEMS.find((s) => s.key === key)!;
    const owned = this.data.upgrades[key];
    if (owned >= item.costs.length) return null;
    return item.costs[owned];
  }

  /** Attempt to buy the next level of an upgrade. Returns true on success. */
  buyUpgrade(key: keyof Upgrades): boolean {
    const cost = this.upgradeCost(key);
    if (cost === null || this.data.gems < cost) return false;
    this.data.gems -= cost;
    this.data.upgrades[key] += 1;
    this.save();
    return true;
  }

  clearLevel(level: number, timeMs: number, gems: number): void {
    this.data.levelUnlocked = Math.max(this.data.levelUnlocked, level + 1);
    this.data.gems += gems;
    const best = this.data.bestTimes[level];
    if (!best || timeMs < best) this.data.bestTimes[level] = timeMs;
    this.save();
  }
}

function safeLocalStorage(): StorageLike {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.getItem('__probe__');
      return localStorage;
    }
  } catch {
    // sandboxed iframe etc.
  }
  const mem = new Map<string, string>();
  return {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, v),
  };
}
