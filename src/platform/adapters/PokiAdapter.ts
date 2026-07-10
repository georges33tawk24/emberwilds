/**
 * Poki (SDK v2). Documented public API — verify against a live Poki game id in
 * their inspector before submitting. Poki has no cloud-storage SDK, so save()
 * uses localStorage (Poki's own guidance).
 *   docs: https://sdk.poki.com/
 */
import { BaseAdapter } from '../IPlatformAdapter';
import { loadScript } from '../services/loadScript';
import type { AdResult, Capabilities, LoadResult, RewardedResult, SaveResult } from '../types';

const SDK_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
const NS = 'emberwilds.poki.';

interface PokiSDK {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(): Promise<void>;
  rewardedBreak(): Promise<boolean>;
}
const sdk = (): PokiSDK | undefined =>
  (window as unknown as { PokiSDK?: PokiSDK }).PokiSDK;

export class PokiAdapter extends BaseAdapter {
  readonly name = 'poki';

  async init(): Promise<void> {
    await loadScript(SDK_URL);
    await sdk()?.init();
    sdk()?.gameLoadingFinished();
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

  gameplayStart(): void {
    sdk()?.gameplayStart();
  }
  gameplayStop(): void {
    sdk()?.gameplayStop();
  }

  async showInterstitial(): Promise<AdResult> {
    try {
      await sdk()?.commercialBreak();
      return { success: true };
    } catch {
      return { success: false, reason: 'no-fill' };
    }
  }

  async showRewarded(): Promise<RewardedResult> {
    try {
      const watched = (await sdk()?.rewardedBreak()) ?? false;
      return { success: watched, rewarded: watched, reason: watched ? undefined : 'dismissed' };
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
