/**
 * Platform abstraction — shared types. Every result is a plain object the
 * gameplay code can read without knowing which portal produced it; SDK-shaped
 * values never leak past an adapter.
 */

export type PlatformName =
  | 'local'
  | 'crazygames'
  | 'poki'
  | 'yandex'
  | 'gamedistribution';

/** Why an operation didn't fully succeed — a small closed vocabulary so
 *  gameplay can branch without string-matching SDK error text. */
export type FailReason =
  | 'unsupported' // the platform has no such feature
  | 'no-fill' // ads: nothing to show right now
  | 'dismissed' // rewarded ad closed early — no reward
  | 'blocked' // an ad blocker or policy stopped it
  | 'not-ready' // Platform.init() hasn't finished
  | 'error'; // the SDK threw; details are logged, not surfaced

export interface AdResult {
  success: boolean;
  reason?: FailReason;
}

export interface RewardedResult extends AdResult {
  /** true ONLY when the player watched to completion and earned the reward. */
  rewarded: boolean;
}

export interface SaveResult {
  success: boolean;
  reason?: FailReason;
}

export interface LoadResult<T = unknown> {
  success: boolean;
  data?: T;
  reason?: FailReason;
}

export interface Player {
  id: string | null;
  name: string;
  loggedIn: boolean;
}

/** What the active platform can actually do — drives the Platform.hasX() gates
 *  so the game hides features a portal doesn't support instead of failing. */
export interface Capabilities {
  interstitialAds: boolean;
  rewardedAds: boolean;
  achievements: boolean;
  leaderboards: boolean;
  cloudSave: boolean;
  login: boolean;
}

export type PlatformEvent =
  | 'pause'
  | 'resume'
  | 'visibilitychange'
  | 'networkchange'
  | 'adstarted'
  | 'adfinished'
  | 'adfailed'
  | 'playerlogin'
  | 'playerlogout';

export type PlatformEventHandler = (payload?: unknown) => void;
