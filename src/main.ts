/**
 * EMBERWILDS entry point — Phaser 4, 640×360 internal resolution, scaled to
 * fill the window (pixel-perfect-ish via roundPixels), touch-enabled, PWA.
 */
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { IntroScene } from './scenes/IntroScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { ShopScene } from './scenes/ShopScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { PauseScene } from './scenes/PauseScene';
import { ClearScene } from './scenes/ClearScene';
import { FinaleScene } from './scenes/FinaleScene';
import { SaveManager } from './systems/save';
import { audio } from './audio/engine';
import { initTouchControls } from './systems/touch';
import { VIEW, VIEW_H, widthForAspect, setSafeInsets } from './gfx/viewport';

const save = new SaveManager();
audio.applySettings(save.data.settings);

/** Live screen size — measured from #app (the fixed, 100dvw/100dvh container
 *  the canvas must cover). visualViewport can be SHORTER than the page on
 *  iPads (home-indicator zone, collapsing chrome), which left the canvas
 *  hanging above a black strip at the bottom; #app's rect is the ground
 *  truth for what needs painting. visualViewport/inner* stay as fallbacks. */
function screenSize(): { w: number; h: number } {
  const app = document.getElementById('app');
  if (app) {
    const r = app.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return { w: Math.round(r.width), h: Math.round(r.height) };
  }
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
  scene: [BootScene, TitleScene, IntroScene, WorldMapScene, ShopScene, GameScene, HudScene, PauseScene, ClearScene, FinaleScene],
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
// fullscreen transitions animate on iPad — settle in waves like orientation
document.addEventListener('fullscreenchange', () => {
  [80, 300, 800].forEach((ms) => setTimeout(refit, ms));
});
document.addEventListener('webkitfullscreenchange', () => {
  [80, 300, 800].forEach((ms) => setTimeout(refit, ms));
});
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

// ---- fullscreen -----------------------------------------------------------
// We fullscreen document.documentElement OURSELVES (not via Phaser): Phaser
// targets the game parent #app, and fullscreening #app hides everything
// outside its subtree — including the DOM touch controls. WebKit prefixes
// cover iPad Safari < 16.4. iPhone Safari has no fullscreen API at all — the
// honest path there is Add to Home Screen (the PWA runs edge to edge), so the
// button says exactly that.
type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => void;
};
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };
const fsDoc = document as FsDoc;
const fsAvailable = (): boolean => document.fullscreenEnabled || !!fsDoc.webkitFullscreenEnabled;
const fsElement = (): Element | null => document.fullscreenElement ?? fsDoc.webkitFullscreenElement ?? null;
const isStandalone = (): boolean =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function showToast(msg: string): void {
  let t = document.getElementById('game-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'game-toast';
    t.style.cssText =
      'position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:70;' +
      'background:rgba(42,31,27,.96);color:#F7E6C4;border:1px solid #7A5A3E;' +
      'border-radius:8px;padding:10px 16px;font:600 14px system-ui,sans-serif;' +
      'transition:opacity .3s;pointer-events:none;max-width:82vw;text-align:center;opacity:0';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2800);
}

function toggleFullscreen(): void {
  try {
    if (fsElement()) {
      if (document.exitFullscreen) void document.exitFullscreen().catch(() => {});
      else fsDoc.webkitExitFullscreen?.();
      return;
    }
    if (!fsAvailable()) {
      if (!isStandalone()) showToast('For fullscreen: Share ▸ Add to Home Screen');
      return;
    }
    const el = document.documentElement as FsEl;
    if (el.requestFullscreen) void el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    else el.webkitRequestFullscreen?.();
    // in fullscreen Android honors landscape lock — absent on iOS/desktop
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    so?.lock?.('landscape').catch(() => {});
  } catch {
    // some browsers block fullscreen; the ENVELOP scaling already fills the window
  }
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' && !e.repeat) toggleFullscreen();
});

// On Android the browser letterboxes the page around the camera cutout and the
// gesture bar unless the document is fullscreen — so on touch devices, enter
// fullscreen on the first completed tap. touchEND, not touchstart: WebKit only
// grants user activation when the gesture ends, and silently rejects
// fullscreen requests made during touchstart. If the player backs out of
// fullscreen we respect that and never force it again.
let autoFsDone = false;
window.addEventListener(
  'touchend',
  () => {
    if (autoFsDone || fsElement()) return;
    autoFsDone = true;
    if (fsAvailable() && !isStandalone()) toggleFullscreen();
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

// PWA service worker (offline-capable static build). When a NEW build's
// worker takes control (skipWaiting + clients.claim in sw.js), reload once so
// the player gets the fresh shell and assets immediately — without this,
// updates only apply on some later visit. hadController guards the very first
// install (fresh content is already showing; a reload would just flicker).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(new URL('sw.js', window.location.href).pathname);
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) window.location.reload();
      hadController = true;
    });
  });
}
