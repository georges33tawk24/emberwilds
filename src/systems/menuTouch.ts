/**
 * Direct touch/mouse interaction for menu scenes — tap a row to use it, drag
 * vertically to scroll, mouse wheel on desktop. Touch phones have no up/down
 * on the rocker (vertical actions live on the right cluster), so menus MUST be
 * directly tappable. Uses Phaser's scene input, which is fed by native touch
 * events internally — NOT the DOM pointer-events compat layer iOS suppresses
 * (see src/systems/touch.ts for that hard-won rule).
 */
import Phaser from 'phaser';

export interface MenuTouchOpts {
  /** Map a point in game coords to a row index, or null when nothing's there. */
  rowAt(x: number, y: number): number | null;
  /** A row was tapped (a press-and-release that never became a drag). */
  onTapRow(row: number, x: number): void;
  /** Vertical scroll request in game units (positive = reveal content below). */
  onScroll?(dy: number): void;
}

/** Finger travel (game units) beyond which a press becomes a drag, not a tap. */
const DRAG_THRESHOLD = 8;

export function attachMenuTouch(scene: Phaser.Scene, opts: MenuTouchOpts): void {
  let pressY: number | null = null;
  let lastY = 0;
  let dragging = false;

  const onDown = (p: Phaser.Input.Pointer): void => {
    pressY = p.y;
    lastY = p.y;
    dragging = false;
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (pressY === null || !p.isDown) return;
    if (!dragging && Math.abs(p.y - pressY) > DRAG_THRESHOLD) dragging = true;
    if (dragging) {
      opts.onScroll?.(lastY - p.y);
      lastY = p.y;
    }
  };
  const onUp = (p: Phaser.Input.Pointer): void => {
    if (pressY !== null && !dragging) {
      const row = opts.rowAt(p.x, p.y);
      if (row !== null) opts.onTapRow(row, p.x);
    }
    pressY = null;
    dragging = false;
  };
  const onWheel = (_p: Phaser.Input.Pointer, _over: unknown[], _dx: number, dy: number): void => {
    opts.onScroll?.(dy * 0.35);
  };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  scene.input.on('wheel', onWheel);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    scene.input.off('wheel', onWheel);
  });
}
