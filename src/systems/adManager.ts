/**
 * AdManager — the game's one entry point for ads. Wraps the Platform façade so
 * gameplay never touches an SDK, and fires the monetization analytics events in
 * one place (so every ad is measured consistently). On our own domain the
 * LocalAdapter no-ops, so these calls are invisible; on a portal they run the
 * portal's real ad and the SDK handles frequency capping.
 */
import { Platform } from '../platform';
import { track } from './analytics';

export const AdManager = {
  /** Show an interstitial at a natural break. Resolves true if one played.
   *  `placement` is a free-text tag for analytics (e.g. 'between-levels'). */
  async showInterstitial(placement: string): Promise<boolean> {
    track('ad_requested', { ad_type: 'interstitial', placement });
    const r = await Platform.showInterstitial();
    track(r.success ? 'interstitial_shown' : 'ad_failed', {
      ad_type: 'interstitial',
      placement,
      reason: r.reason,
    });
    return r.success;
  },

  /** Offer a rewarded ad. Resolves true ONLY if the player earned the reward.
   *  Caller grants the reward on true and does nothing on false. */
  async showRewarded(placement: string): Promise<boolean> {
    track('ad_requested', { ad_type: 'rewarded', placement });
    const r = await Platform.showRewarded();
    track(r.rewarded ? 'reward_claimed' : 'ad_failed', {
      ad_type: 'rewarded',
      placement,
      reason: r.reason,
    });
    return r.rewarded;
  },

  /** True only on a platform that actually serves rewarded ads — gate any
   *  "watch to earn" UI on this so it never appears on the self-hosted build. */
  rewardedAvailable(): boolean {
    return Platform.getPlatform() !== 'local' && Platform.hasRewardedAds();
  },
};
