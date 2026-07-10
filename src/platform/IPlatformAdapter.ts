/**
 * The one interface every platform speaks. Adapters implement only what their
 * portal supports; BaseAdapter (below) supplies safe "unsupported" defaults so
 * a new adapter can override two methods and ignore the rest. The Platform
 * facade is the ONLY caller — gameplay never touches an adapter directly.
 */
import type {
  AdResult,
  Capabilities,
  LoadResult,
  Player,
  RewardedResult,
  SaveResult,
} from './types';

export interface IPlatformAdapter {
  readonly name: string;

  /** Load + initialise the SDK. Resolves when the platform is ready; must not
   *  throw — return a rejected/handled state internally instead. */
  init(): Promise<void>;

  capabilities(): Capabilities;

  // lifecycle the portals want signalled around real play
  gameplayStart(): void;
  gameplayStop(): void;

  // ads
  showInterstitial(): Promise<AdResult>;
  showRewarded(): Promise<RewardedResult>;

  // storage (portal cloud/local; the game's own SaveManager still owns the
  // canonical save — this is the sync seam)
  save(key: string, data: unknown): Promise<SaveResult>;
  load<T = unknown>(key: string): Promise<LoadResult<T>>;

  // social / progression (all optional per platform)
  submitScore(board: string, score: number): Promise<SaveResult>;
  unlockAchievement(id: string): Promise<SaveResult>;
  login(): Promise<Player>;
  logout(): Promise<void>;
  getPlayer(): Player;

  // device / misc
  vibrate(ms: number): void;
  share(payload: { title?: string; text?: string; url?: string }): Promise<void>;
  openURL(url: string): void;
  rateGame(): Promise<void>;
}

const UNSUPPORTED = { success: false, reason: 'unsupported' as const };
const ANON: Player = { id: null, name: 'FOX', loggedIn: false };

/**
 * Every capability off, every action a graceful no-op. Real adapters extend
 * this and override what they support — that's the whole "add a platform = one
 * small file" promise. (Single shared default behaviour, not speculative
 * flexibility: it removes the same 15 no-op methods from every adapter.)
 */
export abstract class BaseAdapter implements IPlatformAdapter {
  abstract readonly name: string;

  async init(): Promise<void> {
    /* nothing to load by default */
  }

  capabilities(): Capabilities {
    return {
      interstitialAds: false,
      rewardedAds: false,
      achievements: false,
      leaderboards: false,
      cloudSave: false,
      login: false,
    };
  }

  gameplayStart(): void {}
  gameplayStop(): void {}

  async showInterstitial(): Promise<AdResult> {
    return UNSUPPORTED;
  }
  async showRewarded(): Promise<RewardedResult> {
    return { ...UNSUPPORTED, rewarded: false };
  }

  async save(_key: string, _data: unknown): Promise<SaveResult> {
    return UNSUPPORTED;
  }
  async load<T>(_key: string): Promise<LoadResult<T>> {
    return UNSUPPORTED;
  }

  async submitScore(_board: string, _score: number): Promise<SaveResult> {
    return UNSUPPORTED;
  }
  async unlockAchievement(_id: string): Promise<SaveResult> {
    return UNSUPPORTED;
  }
  async login(): Promise<Player> {
    return ANON;
  }
  async logout(): Promise<void> {}
  getPlayer(): Player {
    return ANON;
  }

  vibrate(ms: number): void {
    // the one thing every modern browser can do without an SDK
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* unsupported — ignore */
    }
  }
  async share(payload: { title?: string; text?: string; url?: string }): Promise<void> {
    try {
      await navigator.share?.(payload);
    } catch {
      /* user cancelled or unsupported — ignore */
    }
  }
  openURL(url: string): void {
    window.open(url, '_blank', 'noopener');
  }
  async rateGame(): Promise<void> {}
}
