/**
 * NAME ENTRY — an in-canvas name prompt rendered in the game's own font and
 * carved-wood plaques, so it matches every other panel. Text input still comes
 * from a real (but off-screen) <input>: it's created + focused synchronously
 * inside the opening tap in promptName() so mobile keyboards rise, and the
 * scene just mirrors its value in the pixel font with a blinking cursor.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { PixelButton } from '../gfx/ui';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';
import { setTouchContext } from '../systems/touch';
import { clean, NAME_KEY } from '../systems/nameEntry';

const H = TUNING.view.height;

interface NameEntryData {
  input: HTMLInputElement;
  resolve: (name: string | null) => void;
  returnTo: string;
}

export class NameEntryScene extends Phaser.Scene {
  private data2!: NameEntryData;
  private nameText!: PixelText;
  private cursor!: Phaser.GameObjects.Rectangle;
  private fieldX = 0;
  private t = 0;
  private done = false;

  constructor() {
    super('NameEntry');
  }

  create(data: NameEntryData): void {
    setTouchContext('ui');
    this.data2 = data;
    this.done = false;
    this.t = 0;
    const W = VIEW.w;
    const ui = uiScale();
    const cx = W / 2;
    const cy = H / 2;

    this.add.rectangle(cx, cy, W, H, 0x14100d, 0.9);

    // carved-wood panel — K outline, lit top bevel, carved bottom shadow
    const pw = ui > 1 ? Math.min(W - 28, 440) : 300;
    const ph = ui > 1 ? 180 : 138;
    this.add.rectangle(cx, cy, pw + 6, ph + 6, 0x2a1f1b);
    this.add.rectangle(cx, cy, pw, ph, 0x4a362b).setStrokeStyle(2, 0x2a1f1b);
    this.add.rectangle(cx, cy - ph / 2 + 2, pw - 4, 3, 0x7a5a3e); // top bevel
    this.add.rectangle(cx, cy + ph / 2 - 2, pw - 4, 3, 0x2a1f1b); // bottom shadow

    new PixelText(this, cx, cy - ph / 2 + (ui > 1 ? 18 : 14), 'YOUR NAME', {
      scale: ui > 1 ? 3 : 2, color: 'O', align: 'center', shadow: true,
    });
    new PixelText(this, cx, cy - ph / 2 + (ui > 1 ? 42 : 34), 'SHOWN ON THE WORLD LEADERBOARDS', {
      scale: ui, color: 'c', align: 'center',
    });

    // the field box
    const fw = ui > 1 ? 260 : 200;
    const fh = ui > 1 ? 34 : 26;
    const fy = cy - (ui > 1 ? 2 : 0);
    this.fieldX = cx;
    this.add.rectangle(cx, fy, fw, fh, 0x14100d).setStrokeStyle(2, 0xb58b5e);
    this.nameText = new PixelText(this, cx, fy - (ui > 1 ? 6 : 5), '', {
      scale: ui > 1 ? 3 : 2, color: 'W', align: 'center', shadow: true,
    });
    this.cursor = this.add.rectangle(cx, fy, 2, fh - 8, 0xf2a03d);

    // SAVE + CANCEL plaques
    const by = cy + ph / 2 - (ui > 1 ? 24 : 19);
    const bw = ui > 1 ? 120 : 88;
    const bh = ui > 1 ? 26 : 20;
    new PixelButton(this, cx - (ui > 1 ? 68 : 50), by, {
      w: bw, h: bh, label: 'CANCEL', scale: ui, face: 'wood', onTap: () => this.finish(null),
    });
    new PixelButton(this, cx + (ui > 1 ? 68 : 50), by, {
      w: bw, h: bh, label: 'SAVE', scale: ui, face: 'green', onTap: () => this.finish(clean(this.data2.input.value) || 'FOX'),
    });

    // tapping anywhere re-focuses the (off-screen) input so the mobile keyboard
    // comes back if it was dismissed — done in a real pointer handler so iOS
    // honours the focus()
    this.input.on('pointerdown', () => this.data2.input.focus());

    // Enter saves, Escape cancels (the input keeps focus and eats game keys)
    data.input.addEventListener('keydown', this.onKey);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      data.input.removeEventListener('keydown', this.onKey);
    });
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') this.finish(clean(this.data2.input.value) || 'FOX');
    else if (e.key === 'Escape') this.finish(null);
    e.stopPropagation();
  };

  private finish(result: string | null): void {
    if (this.done) return;
    this.done = true;
    audio.sfx('menuSelect');
    if (result !== null) {
      try {
        localStorage.setItem(NAME_KEY, result);
      } catch {
        // storage unavailable — the session still uses the default
      }
    }
    this.data2.input.remove();
    const { resolve, returnTo } = this.data2;
    this.scene.stop();
    this.scene.resume(returnTo);
    resolve(result);
  }

  update(_t: number, delta: number): void {
    this.t += delta / 1000;
    const val = clean(this.data2.input.value);
    this.nameText.setText(val || 'FOX').setColor(val ? 'W' : 'i');
    // park the cursor just past the text; blink it
    const half = this.nameText.textWidth / 2;
    this.cursor.x = Math.round(this.fieldX + half + 3);
    this.cursor.setVisible(Math.floor(this.t * 2) % 2 === 0);
  }
}
