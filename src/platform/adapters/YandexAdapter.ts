/**
 * Yandex Games (SDK v2). Documented public API — Yandex only initialises when
 * the game is served from their platform, so this can't run on emberwilds.fun;
 * verify in the Yandex Games console. Supports cloud save + login via player.
 *   docs: https://yandex.com/dev/games/doc/en/
 */
import { BaseAdapter } from '../IPlatformAdapter';
import { loadScript } from '../services/loadScript';
import type {
  AdResult,
  Capabilities,
  LoadResult,
  Player,
  RewardedResult,
  SaveResult,
} from '../types';

const SDK_URL = 'https://yandex.ru/games/sdk/v2.js';

interface YaPlayer {
  getUniqueID(): string;
  getName(): string;
  getData(keys?: string[]): Promise<Record<string, unknown>>;
  setData(data: Record<string, unknown>): Promise<void>;
}
interface YaSDK {
  adv: {
    showFullscreenAdv(o: { callbacks: { onClose?: (shown: boolean) => void; onError?: () => void } }): void;
    showRewardedVideo(o: { callbacks: { onRewarded?: () => void; onClose?: () => void; onError?: () => void } }): void;
  };
  getPlayer(): Promise<YaPlayer>;
  features?: { LoadingAPI?: { ready(): void } };
}
const yaGames = (): { init(): Promise<YaSDK> } | undefined =>
  (window as unknown as { YaGames?: { init(): Promise<YaSDK> } }).YaGames;

export class YandexAdapter extends BaseAdapter {
  readonly name = 'yandex';
  private ysdk?: YaSDK;
  private player?: YaPlayer;

  async init(): Promise<void> {
    await loadScript(SDK_URL);
    this.ysdk = await yaGames()?.init();
    this.ysdk?.features?.LoadingAPI?.ready();
  }

  capabilities(): Capabilities {
    return {
      interstitialAds: true,
      rewardedAds: true,
      achievements: false,
      leaderboards: true,
      cloudSave: true,
      login: true,
    };
  }

  async showInterstitial(): Promise<AdResult> {
    return new Promise((resolve) => {
      if (!this.ysdk) return resolve({ success: false, reason: 'not-ready' });
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: (shown) => resolve({ success: shown, reason: shown ? undefined : 'no-fill' }),
          onError: () => resolve({ success: false, reason: 'error' }),
        },
      });
    });
  }

  async showRewarded(): Promise<RewardedResult> {
    return new Promise((resolve) => {
      if (!this.ysdk) return resolve({ success: false, rewarded: false, reason: 'not-ready' });
      let rewarded = false;
      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => (rewarded = true),
          onClose: () => resolve({ success: rewarded, rewarded, reason: rewarded ? undefined : 'dismissed' }),
          onError: () => resolve({ success: false, rewarded: false, reason: 'error' }),
        },
      });
    });
  }

  async login(): Promise<Player> {
    this.player = await this.ysdk?.getPlayer();
    return this.getPlayer();
  }

  getPlayer(): Player {
    if (!this.player) return { id: null, name: 'FOX', loggedIn: false };
    return { id: this.player.getUniqueID(), name: this.player.getName() || 'FOX', loggedIn: true };
  }

  async save(key: string, data: unknown): Promise<SaveResult> {
    try {
      const p = this.player ?? (await this.ysdk?.getPlayer());
      await p?.setData({ [key]: data });
      return { success: true };
    } catch {
      return { success: false, reason: 'error' };
    }
  }

  async load<T>(key: string): Promise<LoadResult<T>> {
    try {
      const p = this.player ?? (await this.ysdk?.getPlayer());
      const all = await p?.getData([key]);
      const value = all?.[key];
      if (value === undefined) return { success: false, reason: 'no-fill' };
      return { success: true, data: value as T };
    } catch {
      return { success: false, reason: 'error' };
    }
  }
}
