/**
 * Live view dimensions. Height is fixed at 360 (the design vertical scale);
 * width flexes to match the device's aspect ratio so the game fills the whole
 * screen with no letterbox bars. main.ts updates VIEW.w and calls
 * game.scale.resize on boot and on every window/orientation change; scenes read
 * VIEW.w (and VIEW.h) live so their layout adapts.
 *
 * The canvas paints edge to edge — under notches and home indicators — while
 * VIEW.insetL/R/T/B carry the device safe-area insets converted to game units.
 * HUD and interactive UI anchor inside the insets so nothing hides under
 * hardware; the world itself still fills every physical pixel.
 */
export const VIEW = {
  w: 640,
  h: 360,
  /** safe-area insets in game units (0 on devices without notches) */
  insetL: 0,
  insetR: 0,
  insetT: 0,
  insetB: 0,
};

/** Design reference height — never changes. */
export const VIEW_H = 360;
/** Clamp the flexible width so ultra-wide/− narrow screens stay sensible.
 *  480 = exact 4:3, so tablets fill edge to edge with zero crop; portrait is
 *  blocked by the rotate overlay so nothing narrower reaches gameplay. */
export const VIEW_W_MIN = 480;
export const VIEW_W_MAX = 1120;

/** Compute the width that matches a given screen aspect ratio, clamped + even. */
export function widthForAspect(screenW: number, screenH: number): number {
  const aspect = screenH > 0 ? screenW / screenH : 16 / 9;
  let w = Math.round(VIEW_H * aspect);
  w = Math.max(VIEW_W_MIN, Math.min(VIEW_W_MAX, w));
  return w % 2 === 0 ? w : w + 1;
}

/** Store safe-area insets, converting CSS px to game units via the canvas scale. */
export function setSafeInsets(cssL: number, cssR: number, cssT: number, cssB: number, cssPerGameUnit: number): void {
  const f = cssPerGameUnit > 0 ? 1 / cssPerGameUnit : 1;
  VIEW.insetL = Math.max(0, Math.round(cssL * f));
  VIEW.insetR = Math.max(0, Math.round(cssR * f));
  VIEW.insetT = Math.max(0, Math.round(cssT * f));
  VIEW.insetB = Math.max(0, Math.round(cssB * f));
}
