/**
 * Achievements + lifetime-stats viewer (GROWTH_ROADMAP Phase 1 — lets players
 * see their progress; also portal-readiness). A full scene reached from the
 * Title. Scrollable list of every achievement (unlocked vs locked) over a
 * summary of lifetime stats. Keyboard / gamepad / touch — drag to scroll,
 * tap/ESC to go back (touch phones have no up/down rocker, so it must be
 * directly draggable).
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { SaveManager } from '../systems/save';
import { setTouchContext } from '../systems/touch';
import { attachMenuTouch } from '../systems/menuTouch';
import { audio } from '../audio/engine';
import { ACHIEVEMENTS } from '../data/achievements';
import { uiScale } from '../systems/platform';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { PixelButton } from '../gfx/ui';

const H = TUNING.view.height;

export class AchievementsScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private save!: SaveManager;
  private returnTo = 'Title';
  private scroll = 0;
  private layoutW = 0;
  private grace = 0;
  private prev = { up: false, down: false };
  private rows: { name: PixelText; desc: PixelText; mark: PixelText }[] = [];
  private listTop = 0;
  private rowH = 0;

  constructor() {
    super('Achievements');
  }

  create(data: { returnTo?: string }): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.returnTo = data.returnTo ?? 'Title';
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.scroll = 0;
    this.grace = 0.2;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 1);
    new PixelText(this, W / 2, ui > 1 ? 16 : 20, 'ACHIEVEMENTS', {
      scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true,
    });

    const unlocked = this.save.data.achievements.length;
    new PixelText(this, W / 2, ui > 1 ? 44 : 44, `${unlocked} / ${ACHIEVEMENTS.length} UNLOCKED`, {
      scale: ui, color: 'y', align: 'center', shadow: true,
    });

    // lifetime stats strip
    const s = this.save.data.stats;
    const mins = Math.floor(s.playtimeMs / 60000);
    const statLine = `CLEARED ${s.levelsCleared}   FOES ${s.enemiesDefeated}   FALLS ${s.deaths}   PLAYED ${mins}M`;
    new PixelText(this, W / 2, ui > 1 ? 62 : 58, statLine, { scale: 1, color: 't', align: 'center' });

    // BACK plaque (top-left) — same carved-wood button as every other screen
    const bw = ui > 1 ? 88 : 64;
    new PixelButton(this, VIEW.insetL + 10 + bw / 2, ui > 1 ? 24 : 18, {
      w: bw, h: ui > 1 ? 26 : 20, label: 'BACK', scale: ui, face: 'wood', onTap: () => this.back(),
    });
    new PixelText(this, W / 2, H - (ui > 1 ? 12 : 12), 'DRAG TO SCROLL     II / ESC  BACK', {
      scale: 1, color: 'c', align: 'center', shadow: true,
    });

    // the scrollable achievement rows
    this.listTop = ui > 1 ? 84 : 78;
    this.rowH = ui > 1 ? 34 : 22;
    const left = W / 2 - (ui > 1 ? 220 : 150);
    this.rows = ACHIEVEMENTS.map((a) => {
      const got = this.save.data.achievements.includes(a.id);
      const mark = new PixelText(this, left, 0, got ? '*' : '-', { scale: ui, color: got ? 'O' : 'i' });
      const name = new PixelText(this, left + 14 * ui, 0, a.name.toUpperCase(), {
        scale: ui, color: got ? 'W' : 's', shadow: got,
      });
      const desc = new PixelText(this, left + 14 * ui, 0, a.desc, { scale: 1, color: got ? 't' : 'i' });
      return { name, desc, mark };
    });
    this.layoutRows();

    attachMenuTouch(this, {
      rowAt: () => null, // rows are display-only; the BACK plaque handles exit
      onTapRow: () => undefined,
      onScroll: (dy) => {
        this.scroll = Phaser.Math.Clamp(this.scroll + dy, 0, this.maxScroll());
        this.layoutRows();
      },
    });
  }

  private maxScroll(): number {
    const bottomPad = 24;
    return Math.max(0, this.listTop + ACHIEVEMENTS.length * this.rowH + bottomPad - H);
  }

  private layoutRows(): void {
    this.rows.forEach((r, i) => {
      const y = this.listTop + i * this.rowH - this.scroll;
      const vis = y > this.listTop - this.rowH && y < H - 8;
      r.mark.setPosition(r.mark.x, y).setVisible(vis);
      r.name.setPosition(r.name.x, y - 4).setVisible(vis);
      r.desc.setPosition(r.desc.x, y + (uiScale() > 1 ? 12 : 8)).setVisible(vis);
    });
  }

  private back(): void {
    audio.sfx('menuSelect');
    this.scene.start(this.returnTo);
  }

  update(_t: number, delta: number): void {
    if (VIEW.w !== this.layoutW) { this.scene.restart({ returnTo: this.returnTo }); return; }
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    const f = this.inputSys.sample();
    if (f.pause || f.firePressed) { this.back(); return; }
    const up = f.up && !this.prev.up;
    const down = f.down && !this.prev.down;
    this.prev = { up: f.up, down: f.down };
    if (up || down) {
      this.scroll = Phaser.Math.Clamp(this.scroll + (down ? this.rowH : -this.rowH), 0, this.maxScroll());
      this.layoutRows();
    }
  }
}
