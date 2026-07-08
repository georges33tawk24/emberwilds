/**
 * TOP 10 — the world leaderboard for one level. Fetches the global board,
 * shows the ten fastest names, your own best beneath, and a SET NAME action
 * (renames propagate to the board on your next submission). Opened from the
 * world map.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { SaveManager } from '../systems/save';
import { announceName, fetchTop, type LeaderboardEntry } from '../systems/leaderboard';
import { promptName, storedName } from '../systems/nameEntry';
import { LEVELS, levelLabel } from '../data/levels';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';
import { PixelButton } from '../gfx/ui';

const H = TUNING.view.height;
const SHOW_N = 10;

export class LeaderboardScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private save!: SaveManager;
  private levelIndex = 0;
  private layoutW = 0;
  private grace = 0;
  private rowsText: PixelText[] = [];
  private status!: PixelText;
  private mine!: PixelText;
  private nameBtn!: PixelButton;
  private busy = false;

  constructor() {
    super('Leaderboard');
  }

  create(data: { levelIndex?: number }): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.levelIndex = data.levelIndex ?? 0;
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.grace = 0.25;
    this.rowsText = [];
    this.busy = false;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.88);
    new PixelText(this, W / 2, ui > 1 ? 22 : 28, 'TOP 10', { scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true });
    new PixelText(this, W / 2, ui > 1 ? 50 : 54,
      `${LEVELS[this.levelIndex].name.toUpperCase()}  -  ${levelLabel(this.levelIndex)}`,
      { scale: 1, color: 'c', align: 'center' });

    this.status = new PixelText(this, W / 2, H / 2 - 20, 'FETCHING THE WILDS...', { scale: ui, color: 't', align: 'center' });

    const top = ui > 1 ? 74 : 72;
    const rowH = ui > 1 ? 18 : 15;
    for (let i = 0; i < SHOW_N; i++) {
      this.rowsText.push(new PixelText(this, W / 2, top + i * rowH, '', { scale: ui > 1 ? 2 : 1, color: 'W', align: 'center', shadow: true }));
    }

    const myBest = this.save.data.bestTimes[this.levelIndex];
    this.mine = new PixelText(this, W / 2, H - (ui > 1 ? 66 : 62),
      myBest ? `YOUR BEST ${(myBest / 1000).toFixed(1)}s AS ${storedName()}` : 'NO CLEAR TIME YET - GO SET ONE',
      { scale: 1, color: 'y', align: 'center', shadow: true });

    // SET NAME plaque
    this.nameBtn = new PixelButton(this, W / 2, H - (ui > 1 ? 42 : 40), {
      w: ui > 1 ? 180 : 120, h: ui > 1 ? 26 : 20, label: 'SET NAME', scale: ui, face: 'green',
      onTap: () => this.setName(),
    });

    new PixelText(this, W / 2, H - (ui > 1 ? 16 : 18), ui > 1 ? 'TAP SET NAME     II  BACK' : 'N  SET NAME     ESC  BACK', {
      scale: 1, color: 'W', align: 'center', shadow: true,
    });

    this.input.keyboard?.on('keydown-N', () => this.setName());

    void this.refresh();
  }

  private async refresh(): Promise<void> {
    const entries = await fetchTop(this.levelIndex);
    if (!this.scene.isActive()) return;
    this.paint(entries);
  }

  private paint(entries: LeaderboardEntry[] | null): void {
    if (entries === null) {
      this.status.setText('THE WILDS ARE QUIET - TRY AGAIN LATER');
      return;
    }
    if (entries.length === 0) {
      this.status.setText('NO TIMES YET - BE THE FIRST');
      return;
    }
    this.status.setText('');
    entries.slice(0, SHOW_N).forEach((e, i) => {
      const rank = `${i + 1}`.padStart(2, ' ');
      const name = e.name.padEnd(12, ' ');
      this.rowsText[i].setText(`${rank}  ${name}  ${(e.timeMs / 1000).toFixed(1)}s`);
      this.rowsText[i].setColor(i === 0 ? 'O' : i < 3 ? 'y' : 'W');
    });
  }

  private setName(): void {
    if (this.busy) return;
    this.busy = true;
    audio.sfx('menuSelect');
    void promptName().then(async (name) => {
      this.busy = false;
      if (!this.scene.isActive() || name === null) return;
      this.nameBtn.setLabel('SAVED!').setLit(true);
      this.time.delayedCall(1400, () => this.nameBtn.setLabel('SET NAME').setLit(false));
      const myBest = this.save.data.bestTimes[this.levelIndex];
      this.mine.setText(myBest ? `YOUR BEST ${(myBest / 1000).toFixed(1)}s AS ${name}` : 'NO CLEAR TIME YET - GO SET ONE');
      // sweep the rename across every board this device sits on, then refetch
      const levels = Object.keys(this.save.data.bestTimes).map(Number);
      await announceName(levels);
      if (this.scene.isActive()) void this.refresh();
    });
  }

  update(_time: number, delta: number): void {
    if (VIEW.w !== this.layoutW) {
      this.scene.restart({ levelIndex: this.levelIndex });
      return;
    }
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    const f = this.inputSys.sample();
    if (f.pause || f.firePressed) {
      audio.sfx('menuSelect');
      setTouchContext('map');
      this.scene.stop();
      this.scene.resume('WorldMap');
    }
  }
}
