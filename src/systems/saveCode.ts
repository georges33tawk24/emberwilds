/**
 * Save transfer entry point. Mirrors nameEntry.ts: the off-screen <input> is
 * created and focused SYNCHRONOUSLY inside the opening tap so mobile keyboards
 * (and long-press paste) work, then the in-canvas SaveCodeScene takes over.
 */
import type Phaser from 'phaser';

/** Open the LOAD SAVE CODE prompt. Resolves true if a save was applied. */
export function promptSaveCode(scene: Phaser.Scene): Promise<boolean> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.autocapitalize = 'off';
    input.autocomplete = 'off';
    input.spellcheck = false;
    // in-viewport but invisible: iOS only raises the keyboard for a focused,
    // on-screen field (same hard-won rule as the name entry)
    input.style.cssText =
      'position:fixed;left:8px;top:8px;width:2px;height:2px;opacity:0.01;font-size:16px;';
    document.body.appendChild(input);
    input.focus();
    scene.scene.pause();
    scene.scene.launch('SaveCode', { input, resolve, returnTo: scene.scene.key });
  });
}
