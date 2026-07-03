/**
 * Platform detection for per-device tuning (camera FOV, controls). Cheap and
 * cached; treats coarse-pointer / touch-capable devices as "mobile".
 */
let cached: boolean | null = null;

export function isMobile(): boolean {
  if (cached !== null) return cached;
  if (typeof window === 'undefined') return (cached = false);
  cached =
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    (window.matchMedia?.('(pointer: coarse)').matches ?? false);
  return cached;
}
