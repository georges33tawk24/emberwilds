/**
 * LOAD SAVE CODE — an in-canvas prompt in the game's plaque language, mirroring
 * NameEntryScene: the paste lands in a real (off-screen) <input> created and
 * focused inside the opening tap (promptSaveCode), and the scene shows a live
 * verdict on whatever was pasted. Loading applies the save and rebuilds the
 * title so CONTINUE/beacon counts reflect the imported campaign.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { PixelButton } from '../gfx/ui';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';
import { setTouchContext } from '../systems/touch';
import { importCode, type SaveData, type SaveManager } from '../systems/save';

const H = TUNING.view.height;

interface SaveCodeData {
  input: HTMLInputElement;
  resolve: (applied: boolean) => void;
  returnTo: string;
}

export class SaveCodeScene extends Phaser.Scene {
  private data2!: SaveCodeData;
  private status!: PixelText;
  private loadBtn!: PixelButton;
  private parsed: SaveData | null = null;
  private lastValue = '';
  private done = false;

  constructor() {
    super('SaveCode');
  }

  create(data: SaveCodeData): void {
    setTouchContext('ui');
    this.data2 = data;
    this.done = false;
    this.parsed = null;
    this.lastValue = '';
    const W = VIEW.w;
    const ui = uiScale();
    const cx = W / 2;
    const cy = H / 2;

    this.add.rectangle(cx, cy, W, H, 0x14100d, 0.9);
    const pw = ui > 1 ? Math.min(W - 28, 440) : 300;
    const ph = ui > 1 ? 180 : 138;
    this.add.rectangle(cx, cy, pw + 6, ph + 6, 0x2a1f1b);
    this.add.rectangle(cx, cy, pw, ph, 0x4a362b).setStrokeStyle(2, 0x2a1f1b);
    this.add.rectangle(cx, cy - ph / 2 + 2, pw - 4, 3, 0x7a5a3e);
    this.add.rectangle(cx, cy + ph / 2 - 2, pw - 4, 3, 0x2a1f1b);

    new PixelText(this, cx, cy - ph / 2 + (ui > 1 ? 18 : 14), 'LOAD SAVE CODE', {
      scale: ui > 1 ? 3 : 2, color: 'O', align: 'center', shadow: true,
    });
    new PixelText(this, cx, cy - ph / 2 + (ui > 1 ? 42 : 34), 'PASTE THE CODE YOU COPIED', {
      scale: ui, color: 'c', align: 'center',
    });

    this.status = new PixelText(this, cx, cy - (ui > 1 ? 2 : 0), 'WAITING FOR A PASTE...', {
      scale: ui, color: 'c', align: 'center', shadow: true,
    });

    const by = cy + ph / 2 - (ui > 1 ? 24 : 19);
    const bw = ui > 1 ? 120 : 88;
    const bh = ui > 1 ? 26 : 20;
    new PixelButton(this, cx - (ui > 1 ? 68 : 50), by, {
      w: bw, h: bh, label: 'CANCEL', scale: ui, face: 'wood', onTap: () => this.finish(false),
    });
    this.loadBtn = new PixelButton(this, cx + (ui > 1 ? 68 : 50), by, {
      w: bw, h: bh, label: 'LOAD', scale: ui, face: 'green', onTap: () => this.apply(),
    });

    // tapping anywhere re-focuses the (off-screen) input so a mobile paste works
    this.input.on('pointerdown', () => this.data2.input.focus());
    data.input.addEventListener('keydown', this.onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      data.input.removeEventListener('keydown', this.onKey);
    });
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') this.apply();
    else if (e.key === 'Escape') this.finish(false);
    e.stopPropagation();
  };

  private apply(): void {
    if (!this.parsed || this.done) return;
    const save = this.registry.get('save') as SaveManager;
    save.data = this.parsed;
    save.save();
    audio.applySettings(save.data.settings);
    this.finish(true);
  }

  private finish(applied: boolean): void {
    if (this.done) return;
    this.done = true;
    audio.sfx('menuSelect');
    this.data2.input.remove();
    const { resolve, returnTo } = this.data2;
    this.scene.stop();
    this.scene.resume(returnTo);
    resolve(applied);
  }

  update(): void {
    const val = this.data2.input.value.trim();
    if (val === this.lastValue) return;
    this.lastValue = val;
    this.parsed = val ? importCode(val) : null;
    if (!val) {
      this.status.setText('WAITING FOR A PASTE...').setColor('c');
    } else if (this.parsed) {
      const beacons = this.parsed.levelUnlocked;
      this.status.setText(`CAMPAIGN FOUND - ${beacons} BEACON${beacons === 1 ? '' : 'S'} RELIT`).setColor('l');
    } else {
      this.status.setText("THAT CODE ISN'T VALID").setColor('R');
    }
    this.loadBtn.setLit(!!this.parsed);
  }
}
