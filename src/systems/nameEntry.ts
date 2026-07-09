/**
 * Name entry — opens the in-canvas NameEntryScene (the game's own font and
 * carved-wood plaques) over the calling scene. Typing still comes from a real
 * but invisible <input>, created and focused synchronously inside the opening
 * tap so phones raise their native keyboard; the scene mirrors its value in
 * the pixel font. Resolves with the sanitized name, or null on cancel. The
 * chosen name is stored in localStorage and rides every leaderboard
 * submission.
 */
import type Phaser from 'phaser';

export const NAME_KEY = 'emberwilds.name';

export function storedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? 'FOX';
  } catch {
    return 'FOX';
  }
}

export function clean(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').trimStart().slice(0, 12);
}

/** Open the name prompt over `scene`. Must be called from inside a user
 *  gesture (a tap/click handler) — the hidden input's focus() only raises the
 *  mobile keyboard while the gesture is live. Pauses the calling scene;
 *  NameEntryScene resumes it and resolves on SAVE (the name) or CANCEL (null). */
export function promptName(scene: Phaser.Scene): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 12;
    input.autocomplete = 'off';
    input.autocapitalize = 'characters';
    input.spellcheck = false;
    input.value = storedName() === 'FOX' ? '' : storedName();
    // parked invisibly INSIDE the viewport: iOS refuses to raise the keyboard
    // for off-screen inputs, and font-size 16 stops Safari auto-zooming the page
    input.style.cssText =
      'position:fixed;left:8px;top:8px;width:2px;height:2px;opacity:0.01;' +
      'border:0;padding:0;background:transparent;color:transparent;' +
      'caret-color:transparent;outline:none;font-size:16px;pointer-events:none;';
    input.addEventListener('input', () => {
      const c = clean(input.value);
      if (input.value !== c) input.value = c;
    });
    document.body.append(input);
    input.focus();

    const returnTo = scene.scene.key;
    scene.scene.pause();
    scene.scene.launch('NameEntry', { input, resolve, returnTo });
  });
}
