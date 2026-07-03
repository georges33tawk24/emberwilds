/**
 * EMBERWILDS entry point — Phaser 4, 640×360 internal resolution, scaled to
 * fill the window (pixel-perfect-ish via roundPixels), touch-enabled, PWA.
 */
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { ShopScene } from './scenes/ShopScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { PauseScene } from './scenes/PauseScene';
import { ClearScene } from './scenes/ClearScene';
import { SaveManager } from './systems/save';
import { audio } from './audio/engine';
import { initTouchControls } from './systems/touch';
import { VIEW, VIEW_H, widthForAspect, setSafeInsets } from './gfx/viewport';

const save = new SaveManager();
audio.applySettings(save.data.settings);

/** Live screen size — visualViewport tracks iOS Safari's collapsing chrome
 *  more faithfully than window.inner*, which can report stale values around
 *  orientation changes and URL-bar transitions. */
function screenSize(): { w: number; h: number } {
  const vv = window.visualViewport;
  return {
    w: Math.round(vv?.width ?? window.innerWidth),
    h: Math.round(vv?.height ?? window.innerHeight),
  };
}

// pick the starting internal width from the device aspect (height fixed at 360)
const boot = screenSize();
VIEW.w = widthForAspect(boot.w, boot.h);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: VIEW.w,
  height: VIEW_H,
  backgroundColor: '#14100d',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    // The game's internal size matches the screen aspect (flexible width,
    // fixed 360 height). ENVELOP covers the parent completely — any sub-pixel
    // aspect mismatch crops a hair off an edge instead of leaving a black bar,
    // so the world paints every physical pixel on every device.
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // keep fractional CSS sizes — rounding the centering offsets can leave a
    // 1px unpainted hairline at a screen edge on non-integer zoom factors
    autoRound: false,
  },
  input: {
    gamepad: true,
  },
  scene: [BootScene, TitleScene, WorldMapScene, ShopScene, GameScene, HudScene, PauseScene, ClearScene],
});

game.registry.set('save', save);

/** Read env(safe-area-inset-*) from the hidden probe and convert to game units. */
function updateSafeInsets(): void {
  const probe = document.getElementById('safe-probe');
  if (!probe) return;
  const cs = getComputedStyle(probe);
  const px = (v: string): number => parseFloat(v) || 0;
  // uniform canvas scale: CSS px per game unit (ENVELOP keeps aspect)
  const rect = game.canvas?.getBoundingClientRect();
  const cssPerUnit = rect && rect.height > 0 ? rect.height / VIEW_H : 1;
  setSafeInsets(px(cs.paddingLeft), px(cs.paddingRight), px(cs.paddingTop), px(cs.paddingBottom), cssPerUnit);
}

/** Size the canvas to exactly cover the screen with fractional CSS.
 *  Phaser's updateCenter floors its margins, which can expose a 1px unpainted
 *  hairline at an edge whenever the zoom factor isn't integer. */
function coverCanvas(): void {
  const c = game.canvas;
  if (!c) return;
  const s = screenSize();
  if (s.w <= 0 || s.h <= 0) return;
  const aspect = VIEW.w / VIEW_H;
  let dw = s.w;
  let dh = s.w / aspect;
  if (dh < s.h) {
    dh = s.h;
    dw = s.h * aspect;
  }
  c.style.width = `${dw}px`;
  c.style.height = `${dh}px`;
  c.style.marginLeft = `${(s.w - dw) / 2}px`;
  c.style.marginTop = `${(s.h - dh) / 2}px`;
}

// re-fit the internal width to the aspect ratio on window/orientation change.
// Always refresh: the width can be unchanged while the parent box still moved
// (URL bar collapse, fullscreen enter/exit), and refresh() is cheap.
function refit(): void {
  const s = screenSize();
  const w = widthForAspect(s.w, s.h);
  if (w !== VIEW.w) {
    VIEW.w = w;
    // setGameSize, NOT resize(): only setGameSize updates displaySize's locked
    // aspect ratio — resize() leaves it stale and the canvas letterboxes
    // forever after the first orientation change
    game.scale.setGameSize(w, VIEW_H);
  }
  game.scale.refresh();
  coverCanvas();
  game.scale.updateBounds(); // input mapping must see the final canvas rect
  updateSafeInsets();
}
window.addEventListener('resize', refit);
window.visualViewport?.addEventListener('resize', refit);
// iOS reports stale dimensions for a beat after rotating — settle in waves
window.addEventListener('orientationchange', () => {
  [100, 350, 700].forEach((ms) => setTimeout(refit, ms));
});
document.addEventListener('fullscreenchange', () => setTimeout(refit, 50));
game.events.once(Phaser.Core.Events.READY, refit);

// While a touch device is held in portrait the #rotate prompt (index.html)
// covers the screen; sleep the game loop so no gameplay runs behind it and the
// battery isn't spent rendering a hidden frame. Resumes the instant it's turned
// back to landscape.
const portraitMq = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
portraitMq.addEventListener('change', (e) => {
  if (e.matches) game.loop.sleep();
  else game.loop.wake();
});

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

// fullscreen — must be toggled from within a real user-gesture handler
function toggleFullscreen(): void {
  try {
    if (game.scale.isFullscreen) game.scale.stopFullscreen();
    else {
      game.scale.startFullscreen();
      // in fullscreen Android honors landscape lock — absent on iOS/desktop
      const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      so?.lock?.('landscape').catch(() => {});
    }
  } catch {
    // some browsers block fullscreen; the ENVELOP scaling already fills the window
  }
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' && !e.repeat) toggleFullscreen();
});

// On Android the browser letterboxes the page around the camera cutout and the
// gesture bar unless the document is fullscreen — so on touch devices, enter
// fullscreen on the first gesture. If the player backs out of fullscreen we
// respect that and never force it again. (iPhone Safari has no element
// fullscreen; there the viewport-fit=cover meta already paints edge to edge.)
let autoFsDone = false;
window.addEventListener(
  'touchstart',
  () => {
    if (autoFsDone || game.scale.isFullscreen) return;
    autoFsDone = true;
    if (document.fullscreenEnabled) toggleFullscreen();
  },
  { once: true, passive: true },
);

// on-screen controls for touch devices (wired into InputSystem)
initTouchControls(toggleFullscreen);

// unlock the audio context from within a real user-gesture stack (mobile
// requires this; the deferred game loop doesn't count as a gesture)
const unlockAudio = (): void => {
  audio.unlock();
  audio.applySettings(save.data.settings);
};
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('touchstart', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

// PWA service worker (offline-capable static build)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(new URL('sw.js', window.location.href).pathname);
  });
}
