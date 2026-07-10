/**
 * CrazyGames (SDK v3). Documented public API — verify against a live game key
 * in the CrazyGames dashboard before submitting; it can't be exercised here
 * without their portal wrapper.
 *   docs: https://docs.crazygames.com/
 */
import { BaseAdapter } from '../IPlatformAdapter';
import { loadScript } from '../services/loadScript';
import type { AdResult, Capabilities, LoadResult, RewardedResult, SaveResult } from '../types';

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

// narrow shape of just the SDK surface we call — no `any`, no global pollution
interface CGAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (e: unknown) => void;
}
interface CrazySDK {
  init(): Promise<void>;
  game: { gameplayStart(): void; gameplayStop(): void; happytime(): void };
  ad: { requestAd(type: 'midgame' | 'rewarded', cb: CGAdCallbacks): void };
  data: { setItem(k: string, v: string): void; getItem(k: string): string | null };
}
const sdk = (): CrazySDK | undefined =>
  (window as unknown as { CrazyGames?: { SDK: CrazySDK } }).CrazyGames?.SDK;

export class CrazyGamesAdapter extends BaseAdapter {
  readonly name = 'crazygames';

  async init(): Promise<void> {
    await loadScript(SDK_URL);
    await sdk()?.init();
  }

  capabilities(): Capabilities {
    return {
      interstitialAds: true,
      rewardedAds: true,
      achievements: false,
      leaderboards: false,
      cloudSave: true,
      login: false,
    };
  }

  gameplayStart(): void {
    sdk()?.game.gameplayStart();
  }
  gameplayStop(): void {
    sdk()?.game.gameplayStop();
  }

  private runAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    return new Promise((resolve) => {
      const s = sdk();
      if (!s) return resolve(false);
      s.ad.requestAd(type, {
        adFinished: () => resolve(true),
        adError: () => resolve(false),
      });
    });
  }

  async showInterstitial(): Promise<AdResult> {
    const ok = await this.runAd('midgame');
    return ok ? { success: true } : { success: false, reason: 'no-fill' };
  }

  async showRewarded(): Promise<RewardedResult> {
    const ok = await this.runAd('rewarded');
    return { success: ok, rewarded: ok, reason: ok ? undefined : 'dismissed' };
  }

  async save(key: string, data: unknown): Promise<SaveResult> {
    try {
      sdk()?.data.setItem(key, JSON.stringify(data));
      return { success: true };
    } catch {
      return { success: false, reason: 'error' };
    }
  }

  async load<T>(key: string): Promise<LoadResult<T>> {
    try {
      const raw = sdk()?.data.getItem(key);
      if (raw == null) return { success: false, reason: 'no-fill' };
      return { success: true, data: JSON.parse(raw) as T };
    } catch {
      return { success: false, reason: 'error' };
    }
  }
}
