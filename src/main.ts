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
import { TUNING } from './data/tuning';
import { initTouchControls } from './systems/touch';

const save = new SaveManager();
audio.applySettings(save.data.settings);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: TUNING.view.width,
  height: TUNING.view.height,
  backgroundColor: '#14100d',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    // FIT scales the internal canvas up to fill the window (letterboxed to
    // 16:9), so the game is as big as the screen on desktop and mobile alike.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    gamepad: true,
  },
  scene: [BootScene, TitleScene, WorldMapScene, ShopScene, GameScene, HudScene, PauseScene, ClearScene],
});

game.registry.set('save', save);

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
