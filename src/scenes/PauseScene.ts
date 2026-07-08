/** Pause overlay — resume/restart/settings/quit, all inputs, persisted settings. */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { SaveManager } from '../systems/save';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';
import { attachMenuTouch } from '../systems/menuTouch';
import { promptName } from '../systems/nameEntry';
import { announceName } from '../systems/leaderboard';

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
  private scroll = 0;
  private layoutW = 0;
  private prev = { up: false, down: false, left: false, right: false };
  private grace = 0;
  // ui-scaled layout, set in create (×2 on touch devices for readability)
  private menuTop = 92;
  private rowH = 16;
  private bottomPad = 28;

  constructor() {
    super('Pause');
  }

  create(): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.menuTop = ui > 1 ? 74 : 92;
    this.rowH = ui > 1 ? 26 : 16;
    this.bottomPad = ui > 1 ? 34 : 28;
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.sel = 0;
    this.grace = 0.25;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.72);
    new PixelText(this, W / 2, ui > 1 ? 34 : 46, 'PAUSED', { scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true });

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
      {
        kind: 'toggle', label: 'SPEEDRUN TIMER',
        get: () => s.speedrunTimer,
        set: (v) => { s.speedrunTimer = v; this.apply(); },
      },
      {
        kind: 'toggle', label: 'RACE GHOST',
        get: () => s.ghostRacer,
        set: (v) => { s.ghostRacer = v; this.apply(); },
      },
      {
        kind: 'toggle', label: 'ASSIST MODE',
        get: () => s.assistMode,
        // GameScene re-applies this live on resume (no restart, no lost progress)
        set: (v) => { s.assistMode = v; this.apply(); },
      },
      {
        kind: 'action', label: 'HOW TO PLAY',
        act: () => { this.scene.stop(); this.scene.launch('HowToPlay', { returnTo: 'Game' }); },
      },
      {
        kind: 'action', label: 'YOUR NAME',
        act: () => void promptName().then((name) => {
          if (name !== null) void announceName(Object.keys(this.save.data.bestTimes).map(Number));
        }),
      },
      { kind: 'action', label: 'QUIT TO MAP', act: () => this.quit() },
    ];

    this.scroll = 0;
    this.labels = this.items.map(
      (_, i) => new PixelText(this, W / 2, this.menuTop + i * this.rowH, '', { scale: ui, color: 'W', align: 'center', shadow: true }),
    );
    this.redraw();

    // touch phones have no up/down rocker — menus are directly tappable and
    // drag/wheel-scrollable (scroll only engages once content overflows)
    attachMenuTouch(this, {
      rowAt: (_x, y) => {
        const i = Math.floor((y + this.scroll - (this.menuTop - this.rowH / 2)) / this.rowH);
        return i >= 0 && i < this.items.length ? i : null;
      },
      onTapRow: (i, x) => this.tapRow(i, x),
      onScroll: (dy) => {
        this.scroll = Phaser.Math.Clamp(this.scroll + dy, 0, this.maxScroll());
        this.redraw();
      },
    });
  }

  private maxScroll(): number {
    return Math.max(0, this.menuTop + this.items.length * this.rowH + this.bottomPad - H);
  }

  /** Keep the keyboard/gamepad selection on-screen when the list overflows. */
  private ensureVisible(): void {
    const y = this.menuTop + this.sel * this.rowH - this.scroll;
    if (y < this.menuTop) this.scroll = this.sel * this.rowH;
    else if (y > H - this.bottomPad) this.scroll = this.menuTop + this.sel * this.rowH - (H - this.bottomPad);
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, this.maxScroll());
  }

  private tapRow(i: number, x: number): void {
    const item = this.items[i];
    if (this.sel !== i) {
      this.sel = i;
      audio.sfx('menuMove');
    }
    if (item.kind === 'action') {
      audio.sfx('menuSelect');
      this.redraw();
      item.act();
      return;
    }
    if (item.kind === 'toggle') {
      item.set(!item.get());
      audio.sfx('menuSelect');
      return; // set() -> apply() redraws
    }
    // slider: left half of the row steps down, right half steps up
    const dir = x >= VIEW.w / 2 ? 0.1 : -0.1;
    item.set(Phaser.Math.Clamp(Math.round((item.get() + dir) * 10) / 10, 0, 1));
    audio.sfx('menuMove');
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
      const label = this.labels[i];
      label.y = this.menuTop + i * this.rowH - this.scroll;
      label.setVisible(label.y > this.menuTop - this.rowH && label.y < H);
      label.setText(selected ? `> ${text} <` : text);
      label.setColor(selected ? 'O' : 'W');
    });
  }

  private resume(): void {
    setTouchContext('game');
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
    // live width change (rotation, URL-bar collapse) — rebuild the layout
    if (VIEW.w !== this.layoutW) {
      this.scene.restart();
      return;
    }
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
      this.ensureVisible();
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
