/**
 * Live view dimensions. Height is fixed at 360 (the design vertical scale);
 * width flexes to match the device's aspect ratio so the game fills the whole
 * screen with no letterbox bars. main.ts updates VIEW.w and calls
 * game.scale.resize on boot and on every window/orientation change; scenes read
 * VIEW.w (and VIEW.h) live so their layout adapts.
 */
export const VIEW = { w: 640, h: 360 };

/** Design reference height — never changes. */
export const VIEW_H = 360;
/** Clamp the flexible width so ultra-wide/− narrow screens stay sensible. */
export const VIEW_W_MIN = 512;
export const VIEW_W_MAX = 1120;

/** Compute the width that matches a given screen aspect ratio, clamped + even. */
export function widthForAspect(screenW: number, screenH: number): number {
  const aspect = screenH > 0 ? screenW / screenH : 16 / 9;
  let w = Math.round(VIEW_H * aspect);
  w = Math.max(VIEW_W_MIN, Math.min(VIEW_W_MAX, w));
  return w % 2 === 0 ? w : w + 1;
}
