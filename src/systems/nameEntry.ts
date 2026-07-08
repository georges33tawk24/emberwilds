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

/** Open the overlay. Resolves the saved name, or null if cancelled. */
export function promptName(): Promise<string | null> {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.id = 'name-entry';
    wrap.style.cssText =
      'position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(20,16,13,0.82);font-family:monospace;';
    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#2a1f1b;border:2px solid #7a5a3e;padding:22px 26px;text-align:center;' +
      'box-shadow:0 8px 40px rgba(0,0,0,0.6);max-width:86vw;';
    const title = document.createElement('div');
    title.textContent = 'YOUR NAME';
    title.style.cssText = 'color:#f2a03d;font-size:20px;font-weight:bold;letter-spacing:3px;margin-bottom:6px;';
    const hint = document.createElement('div');
    hint.textContent = 'SHOWN ON THE WORLD LEADERBOARDS';
    hint.style.cssText = 'color:#e6c79a;font-size:10px;letter-spacing:1px;margin-bottom:14px;';
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 12;
    input.value = storedName() === 'FOX' ? '' : storedName();
    input.placeholder = 'FOX';
    input.autocomplete = 'off';
    input.style.cssText =
      'display:block;width:200px;margin:0 auto 16px;padding:10px 12px;background:#14100d;color:#f7e6c4;' +
      'border:2px solid #b58b5e;font-family:monospace;font-size:18px;letter-spacing:2px;text-align:center;' +
      'text-transform:uppercase;outline:none;';
    input.addEventListener('input', () => {
      const c = clean(input.value);
      if (input.value !== c) input.value = c;
    });
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center;';
    const mkBtn = (label: string, bg: string): HTMLButtonElement => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText =
        `background:${bg};color:#f7e6c4;border:2px solid #2a1f1b;padding:10px 22px;font-family:monospace;` +
        'font-size:14px;font-weight:bold;letter-spacing:2px;cursor:pointer;';
      return b;
    };
    const ok = mkBtn('SAVE', '#5f7d34');
    const cancel = mkBtn('CANCEL', '#5a5450');
    btnRow.append(cancel, ok);
    panel.append(title, hint, input, btnRow);
    wrap.append(panel);
    document.body.append(wrap);
    input.focus();

    const done = (value: string | null): void => {
      wrap.remove();
      resolve(value);
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
