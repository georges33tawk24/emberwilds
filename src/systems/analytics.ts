/**
 * GA4 funnel events. A paper-thin wrapper over the gtag() loaded in
 * index.html — it tells you WHERE players start, clear, and (crucially) die,
 * so drop-off is measurable instead of guessed.
 *
 * Fail-safe by design: if gtag is absent (ad-blocked, offline, tests) every
 * call is a silent no-op. Render-side only — never touched by the sim.
 */

type GtagFn = (command: string, event: string, params?: Record<string, unknown>) => void;

function gtag(): GtagFn | null {
  const g = (globalThis as unknown as { gtag?: GtagFn }).gtag;
  return typeof g === 'function' ? g : null;
}

/** Fire a GA4 custom event. Params show up as event parameters (register the
 *  ones you want to slice by as custom dimensions in the GA4 UI). */
export function track(event: string, params: Record<string, unknown> = {}): void {
  try {
    gtag()?.('event', event, params);
  } catch {
    // analytics must never break the game
  }
}
