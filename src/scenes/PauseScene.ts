/** Pause overlay — resume/restart/settings/quit, all inputs, persisted settings. */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { SaveManager } from '../systems/save';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';

const H = TUNING.view.height;

type Item =
  | { kind: 'action'; label: string; act: () => void }
  | { kind: 'slider'; label: string; get: () => number; set: (v: number) => void }
  | { kind: 'toggle'; label: string; get: () => boolean; set: (v: boolean) => void };

export class PauseScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private save!: SaveManager;
  private items: Item[] = [];
  private labels: PixelText[] = [];
  private sel = 0;
  private prev = { up: false, down: false, left: false, right: false };
  private grace = 0;

  constructor() {
    super('Pause');
  }

  create(): void {
    const W = VIEW.w;
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.sel = 0;
    this.grace = 0.25;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.72);
    new PixelText(this, W / 2, 46, 'PAUSED', { scale: 3, color: 'O', align: 'center', shadow: true });

    const s = this.save.data.settings;
    this.items = [
      { kind: 'action', label: 'RESUME', act: () => this.resume() },
      { kind: 'action', label: 'RESTART LEVEL', act: () => this.restart() },
      {
        kind: 'slider', label: 'MUSIC',
        get: () => s.musicVol,
        set: (v) => { s.musicVol = v; this.apply(); },
      },
      {
        kind: 'slider', label: 'SOUND',
        get: () => s.sfxVol,
        set: (v) => { s.sfxVol = v; this.apply(); },
      },
      {
        kind: 'toggle', label: 'SCREEN SHAKE',
        get: () => s.screenShake,
        set: (v) => { s.screenShake = v; this.apply(); },
      },
      {
        kind: 'toggle', label: 'REDUCE FLASHES',
        get: () => s.flashReduction,
        set: (v) => { s.flashReduction = v; this.apply(); },
      },
      { kind: 'action', label: 'QUIT TO MAP', act: () => this.quit() },
    ];

    this.labels = this.items.map(
      (_, i) => new PixelText(this, W / 2, 92 + i * 16, '', { scale: 1, color: 'W', align: 'center', shadow: true }),
    );
    this.redraw();
  }

  private apply(): void {
    audio.applySettings(this.save.data.settings);
    this.save.save();
    this.redraw();
  }

  private redraw(): void {
    this.items.forEach((item, i) => {
      let text = item.label;
      if (item.kind === 'slider') {
        const v = Math.round(item.get() * 10);
        text = `${item.label}  ${'#'.repeat(v)}${'.'.repeat(10 - v)}`;
      } else if (item.kind === 'toggle') {
        text = `${item.label}  ${item.get() ? 'ON' : 'OFF'}`;
      }
      const selected = i === this.sel;
      this.labels[i].setText(selected ? `> ${text} <` : text);
      this.labels[i].setColor(selected ? 'O' : 'W');
    });
  }

  private resume(): void {
    this.scene.stop();
    this.scene.resume('Game');
  }

  private restart(): void {
    const levelIndex = (this.registry.get('lastLevel') as number) ?? 0;
    this.scene.stop();
    this.scene.stop('Game');
    this.scene.launch('Game', { levelIndex });
  }

  private quit(): void {
    audio.stopSong();
    this.scene.stop('Game');
    this.scene.stop('Hud');
    this.scene.stop();
    this.scene.start('WorldMap');
  }

  update(_time: number, delta: number): void {
    const f = this.inputSys.sample();
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    if (f.pause && this.scene.isActive()) {
      this.resume();
      return;
    }
    const up = f.up && !this.prev.up;
    const down = f.down && !this.prev.down;
    const leftP = f.left && !this.prev.left;
    const rightP = f.right && !this.prev.right;
    this.prev = { up: f.up, down: f.down, left: f.left, right: f.right };

    if (up || down) {
      this.sel = (this.sel + (down ? 1 : this.items.length - 1)) % this.items.length;
      audio.sfx('menuMove');
      this.redraw();
    }
    const item = this.items[this.sel];
    if (item.kind === 'slider' && (leftP || rightP)) {
      const v = Phaser.Math.Clamp(item.get() + (rightP ? 0.1 : -0.1), 0, 1);
      item.set(Math.round(v * 10) / 10);
      audio.sfx('menuMove');
    }
    if (item.kind === 'toggle' && (leftP || rightP || f.jumpPressed)) {
      item.set(!item.get());
      audio.sfx('menuSelect');
      return;
    }
    if (item.kind === 'action' && f.jumpPressed) {
      audio.sfx('menuSelect');
      item.act();
    }
  }
}
