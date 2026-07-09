/**
 * Name entry — a DOM overlay (a real <input>, so phones raise their native
 * keyboard; canvas text input is a trap). Styled to the palette; resolves
 * with the sanitized name, or null on cancel. The chosen name is stored in
 * localStorage and rides every leaderboard submission.
 */

const KEY = 'emberwilds.name';

export function storedName(): string {
  try {
    return localStorage.getItem(KEY) ?? 'FOX';
  } catch {
    return 'FOX';
  }
}

function clean(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').trimStart().slice(0, 12);
}

const FONT = "'Courier New', ui-monospace, monospace";

/** Open the overlay. Resolves the saved name, or null if cancelled. */
export function promptName(): Promise<string | null> {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.id = 'name-entry';
    wrap.style.cssText =
      'position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;' +
      `background:rgba(20,16,13,0.9);font-family:${FONT};`;

    // carved-wood plaque, matching the in-canvas panels: K outline, a lit bevel
    // along the top and a carved shadow along the bottom
    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#4a362b;border:4px solid #2a1f1b;padding:22px 28px 24px;text-align:center;' +
      'box-shadow:inset 0 3px 0 #7a5a3e, inset 0 -4px 0 #2a1f1b, 0 10px 44px rgba(0,0,0,0.65);' +
      'max-width:86vw;image-rendering:pixelated;';

    const title = document.createElement('div');
    title.textContent = 'YOUR NAME';
    title.style.cssText =
      'color:#f2a03d;font-size:22px;font-weight:bold;letter-spacing:4px;margin-bottom:6px;' +
      'text-shadow:2px 2px 0 #2a1f1b;';

    const hint = document.createElement('div');
    hint.textContent = 'SHOWN ON THE WORLD LEADERBOARDS';
    hint.style.cssText = 'color:#e6c79a;font-size:10px;letter-spacing:1px;margin-bottom:16px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 12;
    input.value = storedName() === 'FOX' ? '' : storedName();
    input.placeholder = 'FOX';
    input.autocomplete = 'off';
    input.style.cssText =
      'display:block;width:210px;margin:0 auto 18px;padding:11px 12px;background:#14100d;color:#f7e6c4;' +
      `border:3px solid #b58b5e;font-family:${FONT};font-size:20px;font-weight:bold;letter-spacing:3px;` +
      'text-align:center;text-transform:uppercase;outline:none;caret-color:#f2a03d;';
    input.addEventListener('focus', () => { input.style.borderColor = '#f2a03d'; });
    input.addEventListener('blur', () => { input.style.borderColor = '#b58b5e'; });
    input.addEventListener('input', () => {
      const c = clean(input.value);
      if (input.value !== c) input.value = c;
    });

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:14px;justify-content:center;';
    const mkBtn = (label: string, face: string, hi: string, dark: string): HTMLButtonElement => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        `background:${face};color:#f7e6c4;border:3px solid #2a1f1b;padding:11px 26px;font-family:${FONT};` +
        `font-size:15px;font-weight:bold;letter-spacing:2px;cursor:pointer;` +
        `box-shadow:inset 0 2px 0 ${hi}, inset 0 -3px 0 ${dark};text-shadow:1px 1px 0 #2a1f1b;`;
      // press-sink, like the carved plaques in-game
      b.addEventListener('pointerdown', () => { b.style.transform = 'translateY(1px)'; });
      b.addEventListener('pointerup', () => { b.style.transform = 'none'; });
      return b;
    };
    const ok = mkBtn('SAVE', '#5f7d34', '#74954a', '#3e5a2e');
    const cancel = mkBtn('CANCEL', '#7a5a3e', '#8a6a48', '#4a362b');
    btnRow.append(cancel, ok);
    panel.append(title, hint, input, btnRow);
    wrap.append(panel);

    // Stop every pointer/touch event from bubbling to window — Phaser attaches
    // its pointer listeners there, so without this the SAME tap that hits SAVE
    // also fires on whatever canvas button sits behind the overlay (that was
    // the "clicking SAVE also opens HOW TO PLAY" bug).
    for (const t of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend']) {
      wrap.addEventListener(t, (e) => e.stopPropagation());
    }

    document.body.append(wrap);
    input.focus();

    const done = (value: string | null): void => {
      wrap.remove();
      // resolve on the next tick so the tap that closed the overlay is fully
      // dissipated before any scene it hands back to reads input
      setTimeout(() => resolve(value), 0);
    };
    ok.addEventListener('click', () => {
      const name = clean(input.value).trim() || 'FOX';
      try {
        localStorage.setItem(KEY, name);
      } catch {
        // storage unavailable — the session still uses the default
      }
      done(name);
    });
    cancel.addEventListener('click', () => done(null));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') ok.click();
      if (e.key === 'Escape') cancel.click();
      e.stopPropagation(); // keep game keys out of the fight
    });
  });
}
