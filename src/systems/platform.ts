/**
 * Platform detection for per-device tuning (camera FOV, controls). Cheap and
 * cached; treats coarse-pointer / touch-capable devices as "mobile".
 */
let cached: boolean | null = null;

export function isMobile(): boolean {
  if (cached !== null) return cached;
  if (typeof window === 'undefined') return (cached = false);
  // ?mobile=1 forces the mobile experience for testing on a desktop browser
  if (window.location?.search.includes('mobile=1')) return (cached = true);
  cached =
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    (window.matchMedia?.('(pointer: coarse)').matches ?? false);
  return cached;
}

/**
 * UI magnification for touch devices. The camera pulls the WORLD in ~22%
 * closer on mobile (TUNING.camera.zoomMobile) but HUD/menu scenes render at
 * raw internal resolution — on a phone that leaves hearts, menus, and tallies
 * far too small to read. Every UI scene multiplies its layout by this factor.
 * 2 keeps the 4×6 bitmap font on whole pixels (1.5 would smear it).
 */
export function uiScale(): number {
  return isMobile() ? 2 : 1;
}
