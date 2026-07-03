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
import { VIEW, VIEW_H, widthForAspect } from './gfx/viewport';

const save = new SaveManager();
audio.applySettings(save.data.settings);

// pick the starting internal width from the device aspect (height fixed at 360)
VIEW.w = widthForAspect(window.innerWidth, window.innerHeight);

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
    // fixed 360 height), so FIT scales it to fill the whole screen with no
    // letterbox bars on any device.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    gamepad: true,
  },
  scene: [BootScene, TitleScene, WorldMapScene, ShopScene, GameScene, HudScene, PauseScene, ClearScene],
});

game.registry.set('save', save);

// re-fit the internal width to the aspect ratio on window/orientation change
function refit(): void {
  const w = widthForAspect(window.innerWidth, window.innerHeight);
  if (w !== VIEW.w) {
    VIEW.w = w;
    game.scale.resize(w, VIEW_H);
    game.scale.refresh();
  }
}
window.addEventListener('resize', refit);
window.addEventListener('orientationchange', () => setTimeout(refit, 100));

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
    else game.scale.startFullscreen();
  } catch {
    // some browsers block fullscreen; the FIT scaling already fills the window
  }
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' && !e.repeat) toggleFullscreen();
});

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
