/**
 * Platform — the single façade the whole game talks to. It detects the portal
 * once, constructs ONLY that portal's adapter (so no unused SDK ever loads),
 * and exposes a stable, Promise-based, never-throwing API. Gameplay code calls
 * `Platform.showInterstitial()` and friends and never learns which portal it's
 * on. Every `window.PokiSDK`-style check lives behind here.
 *
 * Adding a platform = write one adapter + one line in ADAPTERS below. Nothing
 * in gameplay changes.
 */
import { isMobile } from '../systems/platform';
import type { IPlatformAdapter } from './IPlatformAdapter';
import { LocalAdapter } from './adapters/LocalAdapter';
import { CrazyGamesAdapter } from './adapters/CrazyGamesAdapter';
import { PokiAdapter } from './adapters/PokiAdapter';
import { YandexAdapter } from './adapters/YandexAdapter';
import { GameDistributionAdapter } from './adapters/GameDistributionAdapter';
import { detectPlatform } from './services/PlatformDetector';
import type {
  AdResult,
  LoadResult,
  PlatformEvent,
  PlatformEventHandler,
  PlatformName,
  Player,
  RewardedResult,
  SaveResult,
} from './types';

/** name → lazy factory. Only the detected one is ever called. */
const ADAPTERS: Record<PlatformName, () => IPlatformAdapter> = {
  local: () => new LocalAdapter(),
  crazygames: () => new CrazyGamesAdapter(),
  poki: () => new PokiAdapter(),
  yandex: () => new YandexAdapter(),
  gamedistribution: () => new GameDistributionAdapter(),
};

const log = (...a: unknown[]): void => {
  if (import.meta.env.DEV) console.info('[platform]', ...a);
};

class PlatformFacade {
  private adapter: IPlatformAdapter = new LocalAdapter();
  private ready = false;
  private initPromise: Promise<void> | null = null;
  private handlers = new Map<PlatformEvent, Set<PlatformEventHandler>>();

  /** Detect + boot the active adapter. Idempotent — safe to await anywhere. */
  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.boot();
    return this.initPromise;
  }

  private async boot(): Promise<void> {
    const name = detectPlatform();
    this.adapter = ADAPTERS[name]();
    log('detected', name);
    try {
      await this.adapter.init();
    } catch (e) {
      // an SDK that fails to load must NEVER block the game — fall back to local
      console.warn('[platform] adapter init failed, falling back to local', e);
      this.adapter = new LocalAdapter();
      await this.adapter.init();
    }
    this.wireBrowserEvents();
    this.ready = true;
    log('ready');
  }

  // ---- lifecycle ----------------------------------------------------------
  gameplayStart(): void {
    this.guard(() => this.adapter.gameplayStart());
  }
  gameplayStop(): void {
    this.guard(() => this.adapter.gameplayStop());
  }
  pause(): void {
    this.gameplayStop();
    this.emit('pause');
  }
  resume(): void {
    this.gameplayStart();
    this.emit('resume');
  }

  // ---- ads ----------------------------------------------------------------
  async showInterstitial(): Promise<AdResult> {
    if (!this.ready) return { success: false, reason: 'not-ready' };
    this.emit('adstarted');
    const r = await this.safe<AdResult>(() => this.adapter.showInterstitial(), {
      success: false,
      reason: 'error',
    });
    this.emit(r.success ? 'adfinished' : 'adfailed');
    return r;
  }

  async showRewarded(): Promise<RewardedResult> {
    if (!this.ready) return { success: false, rewarded: false, reason: 'not-ready' };
    this.emit('adstarted');
    const r = await this.safe<RewardedResult>(() => this.adapter.showRewarded(), {
      success: false,
      rewarded: false,
      reason: 'error',
    });
    this.emit(r.success ? 'adfinished' : 'adfailed');
    return r;
  }

  // ---- storage ------------------------------------------------------------
  save(key: string, data: unknown): Promise<SaveResult> {
    return this.safe(() => this.adapter.save(key, data), { success: false, reason: 'error' });
  }
  load<T = unknown>(key: string): Promise<LoadResult<T>> {
    return this.safe(() => this.adapter.load<T>(key), { success: false, reason: 'error' });
  }

  // ---- social / progression ----------------------------------------------
  submitScore(board: string, score: number): Promise<SaveResult> {
    return this.safe(() => this.adapter.submitScore(board, score), { success: false, reason: 'error' });
  }
  unlockAchievement(id: string): Promise<SaveResult> {
    return this.safe(() => this.adapter.unlockAchievement(id), { success: false, reason: 'error' });
  }
  login(): Promise<Player> {
    return this.safe(() => this.adapter.login(), this.adapter.getPlayer());
  }
  logout(): Promise<void> {
    return this.safe(() => this.adapter.logout(), undefined);
  }
  getPlayer(): Player {
    return this.adapter.getPlayer();
  }
  isLoggedIn(): boolean {
    return this.adapter.getPlayer().loggedIn;
  }

  // ---- device / misc ------------------------------------------------------
  vibrate(ms: number): void {
    this.guard(() => this.adapter.vibrate(ms));
  }
  share(payload: { title?: string; text?: string; url?: string }): Promise<void> {
    return this.safe(() => this.adapter.share(payload), undefined);
  }
  openURL(url: string): void {
    this.guard(() => this.adapter.openURL(url));
  }
  rateGame(): Promise<void> {
    return this.safe(() => this.adapter.rateGame(), undefined);
  }
  // the game owns its own pixel-art loading screen (BootScene); these are hooks
  // portals that demand an SDK-driven splash can wire an adapter method into.
  showLoading(): void {}
  hideLoading(): void {}

  // ---- introspection ------------------------------------------------------
  getPlatform(): PlatformName {
    return this.adapter.name as PlatformName;
  }
  isMobile(): boolean {
    return isMobile();
  }
  isDesktop(): boolean {
    return !isMobile();
  }
  hasInterstitialAds(): boolean {
    return this.adapter.capabilities().interstitialAds;
  }
  hasRewardedAds(): boolean {
    return this.adapter.capabilities().rewardedAds;
  }
  hasAchievements(): boolean {
    return this.adapter.capabilities().achievements;
  }
  hasLeaderboard(): boolean {
    return this.adapter.capabilities().leaderboards;
  }
  hasCloudSave(): boolean {
    return this.adapter.capabilities().cloudSave;
  }
  hasLogin(): boolean {
    return this.adapter.capabilities().login;
  }
  hasStorage(): boolean {
    // storage always works — cloud when available, else localStorage/memory
    return true;
  }

  // ---- events -------------------------------------------------------------
  on(event: PlatformEvent, handler: PlatformEventHandler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }
  off(event: PlatformEvent, handler: PlatformEventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }
  private emit(event: PlatformEvent, payload?: unknown): void {
    this.handlers.get(event)?.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        log('event handler threw', event, e);
      }
    });
  }
  // convenience subscriptions the prompt spells out
  onPause(h: PlatformEventHandler): void {
    this.on('pause', h);
  }
  onResume(h: PlatformEventHandler): void {
    this.on('resume', h);
  }
  onVisibilityChanged(h: PlatformEventHandler): void {
    this.on('visibilitychange', h);
  }
  onNetworkChange(h: PlatformEventHandler): void {
    this.on('networkchange', h);
  }

  private wireBrowserEvents(): void {
    document.addEventListener('visibilitychange', () => {
      const hidden = document.hidden;
      this.emit('visibilitychange', !hidden);
      this.emit(hidden ? 'pause' : 'resume');
    });
    window.addEventListener('online', () => this.emit('networkchange', true));
    window.addEventListener('offline', () => this.emit('networkchange', false));
  }

  // ---- error firewall -----------------------------------------------------
  /** Await an adapter call; on throw, log and return the standard fallback so
   *  an SDK exception can never crash gameplay. */
  private async safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      log('adapter call failed', e);
      return fallback;
    }
  }
  private guard(fn: () => void): void {
    try {
      fn();
    } catch (e) {
      log('adapter call failed', e);
    }
  }
}

/** The single shared instance the whole game imports. */
export const Platform = new PlatformFacade();
