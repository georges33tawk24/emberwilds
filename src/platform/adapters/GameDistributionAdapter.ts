/**
 * GameDistribution. Documented public API — set your real GD game id in
 * GD_OPTIONS before submitting (theirs is required for the SDK to load). No
 * cloud save / login, so save() uses localStorage.
 *   docs: https://gamedistribution.com/sdk/html5
 */
import { BaseAdapter } from '../IPlatformAdapter';
import { loadScript } from '../services/loadScript';
import type { AdResult, Capabilities, LoadResult, RewardedResult, SaveResult } from '../types';

const SDK_URL = 'https://html5.api.gamedistribution.com/main.min.js';
const NS = 'emberwilds.gd.';
// TODO(release): replace with the real game id from the GameDistribution portal.
const GAME_ID = 'REPLACE_WITH_GD_GAME_ID';

interface GdSdk {
  showAd(type: string): Promise<void>;
  preloadAd(type: string): Promise<void>;
  AdType: { Interstitial: string; Rewarded: string };
}
const gd = (): GdSdk | undefined => (window as unknown as { gdsdk?: GdSdk }).gdsdk;

export class GameDistributionAdapter extends BaseAdapter {
  readonly name = 'gamedistribution';
  private rewardedFlag = false;

  async init(): Promise<void> {
    // GD reads config off a global set BEFORE the script loads, and reports
    // reward completion through onEvent rather than the showAd promise
    (window as unknown as { GD_OPTIONS?: unknown }).GD_OPTIONS = {
      gameId: GAME_ID,
      onEvent: (e: { name?: string }) => {
        if (e?.name === 'SDK_REWARDED_WATCH_COMPLETE') this.rewardedFlag = true;
      },
    };
    await loadScript(SDK_URL);
  }

  capabilities(): Capabilities {
    return {
      interstitialAds: true,
      rewardedAds: true,
      achievements: false,
      leaderboards: false,
      cloudSave: false,
      login: false,
    };
  }

  async showInterstitial(): Promise<AdResult> {
    const s = gd();
    if (!s) return { success: false, reason: 'not-ready' };
    try {
      await s.showAd(s.AdType.Interstitial);
      return { success: true };
    } catch {
      return { success: false, reason: 'no-fill' };
    }
  }

  async showRewarded(): Promise<RewardedResult> {
    const s = gd();
    if (!s) return { success: false, rewarded: false, reason: 'not-ready' };
    try {
      this.rewardedFlag = false;
      await s.showAd(s.AdType.Rewarded);
      return {
        success: this.rewardedFlag,
        rewarded: this.rewardedFlag,
        reason: this.rewardedFlag ? undefined : 'dismissed',
      };
    } catch {
      return { success: false, rewarded: false, reason: 'no-fill' };
    }
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
}
