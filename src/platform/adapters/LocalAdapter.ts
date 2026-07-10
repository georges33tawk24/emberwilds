/**
 * The self-hosted / local-dev platform (emberwilds.fun and `npm run dev`).
 * No portal SDK: ads are simulated (resolve instantly so the between-level
 * flow is real), storage is localStorage, the player is an anonymous local
 * profile. This is what lets the whole game run — and be developed and
 * tested — with zero external SDK installed.
 */
import { BaseAdapter } from '../IPlatformAdapter';
import type {
  AdResult,
  Capabilities,
  LoadResult,
  Player,
  RewardedResult,
  SaveResult,
} from '../types';

const NS = 'emberwilds.platform.';

export class LocalAdapter extends BaseAdapter {
  readonly name = 'local';

  capabilities(): Capabilities {
    return {
      interstitialAds: true, // simulated
      rewardedAds: true, // simulated — always grants (dev convenience)
      achievements: true, // localStorage
      leaderboards: false, // the game already has its own Cloudflare board
      cloudSave: false, // localStorage only
      login: false,
    };
  }

  async showInterstitial(): Promise<AdResult> {
    // eslint-disable-next-line no-console
    console.info('[platform:local] interstitial (simulated)');
    return { success: true };
  }

  async showRewarded(): Promise<RewardedResult> {
    // eslint-disable-next-line no-console
    console.info('[platform:local] rewarded (simulated → granted)');
    return { success: true, rewarded: true };
  }

  async save(key: string, data: unknown): Promise<SaveResult> {
    try {
      localStorage.setItem(NS + key, JSON.stringify(data));
      return { success: true };
    } catch {
      return { success: false, reason: 'error' };
    }
  }

  async load<T>(key: string): Promise<LoadResult<T>> {
    try {
      const raw = localStorage.getItem(NS + key);
      if (raw === null) return { success: false, reason: 'no-fill' };
      return { success: true, data: JSON.parse(raw) as T };
    } catch {
      return { success: false, reason: 'error' };
    }
  }

  async unlockAchievement(id: string): Promise<SaveResult> {
    // the game's own SaveManager is the source of truth; this mirror just makes
    // the capability real for local testing of the Platform API
    try {
      const key = NS + 'achievements';
      const set = new Set<string>(JSON.parse(localStorage.getItem(key) ?? '[]'));
      set.add(id);
      localStorage.setItem(key, JSON.stringify([...set]));
      return { success: true };
    } catch {
      return { success: false, reason: 'error' };
    }
  }

  getPlayer(): Player {
    return { id: 'local', name: 'FOX', loggedIn: false };
  }
}
