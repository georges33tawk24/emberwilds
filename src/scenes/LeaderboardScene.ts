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
import { RUN_LB_LEVEL, RUN_TITLE, runBest, type RunMode } from '../systems/runs';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';
import { PixelButton } from '../gfx/ui';

const H = TUNING.view.height;
const SHOW_N = 10;

/** Which run mode a board slot belongs to (40/41/42), or null for a level. */
function runModeOf(levelIndex: number): RunMode | null {
  const hit = (Object.entries(RUN_LB_LEVEL) as [RunMode, number][]).find(([, v]) => v === levelIndex);
  return hit ? hit[0] : null;
}

/** Run times are minutes long — format like the run-results screen. */
function fmtRun(ms: number): string {
  const sec = ms / 1000;
  const m = Math.floor(sec / 60);
  return m > 0 ? `${m}M ${(sec % 60).toFixed(1).padStart(4, '0')}S` : `${sec.toFixed(1)}S`;
}

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
  private returnTo = 'WorldMap';

  constructor() {
    super('Leaderboard');
  }

  create(data: { levelIndex?: number; returnTo?: string }): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.levelIndex = data.levelIndex ?? 0;
    this.returnTo = data.returnTo ?? 'WorldMap';
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.grace = 0.25;
    this.rowsText = [];
    this.busy = false;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.88);
    new PixelText(this, W / 2, ui > 1 ? 22 : 28, 'TOP 10', { scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true });
    const mode = runModeOf(this.levelIndex);
    new PixelText(this, W / 2, ui > 1 ? 50 : 54,
      mode
        ? `${RUN_TITLE[mode]}  -  THE WHOLE WILDS`
        : `${LEVELS[this.levelIndex].name.toUpperCase()}  -  ${levelLabel(this.levelIndex)}`,
      { scale: ui, color: 'c', align: 'center' });

    this.status = new PixelText(this, W / 2, H / 2 - 20, 'FETCHING THE WILDS...', { scale: ui, color: 't', align: 'center' });

    const top = ui > 1 ? 74 : 72;
    const rowH = ui > 1 ? 18 : 15;
    for (let i = 0; i < SHOW_N; i++) {
      this.rowsText.push(new PixelText(this, W / 2, top + i * rowH, '', { scale: ui > 1 ? 2 : 1, color: 'W', align: 'center', shadow: true }));
    }

    const myBest = mode ? runBest(mode) : this.save.data.bestTimes[this.levelIndex];
    const fmtMine = (ms: number): string => (mode ? fmtRun(ms) : `${(ms / 1000).toFixed(1)}s`);
    this.mine = new PixelText(this, W / 2, H - (ui > 1 ? 72 : 62),
      myBest ? `YOUR BEST ${fmtMine(myBest)} AS ${storedName()}` : mode && mode === 'hardcore'
        ? 'NO COMPLETED RUN YET - SURVIVE ONE'
        : mode ? 'NO COMPLETED RUN YET - GO SET ONE' : 'NO CLEAR TIME YET - GO SET ONE',
      { scale: ui, color: 'y', align: 'center', shadow: true });

    // SET NAME plaque
    this.nameBtn = new PixelButton(this, W / 2, H - (ui > 1 ? 42 : 40), {
      w: ui > 1 ? 180 : 120, h: ui > 1 ? 26 : 20, label: 'SET NAME', scale: ui, face: 'green',
      onTap: () => this.setName(),
    });

    new PixelText(this, W / 2, H - (ui > 1 ? 16 : 18), ui > 1 ? 'TAP SET NAME     TAP  BACK' : 'N  SET NAME     ESC  BACK', {
      scale: ui, color: 'W', align: 'center', shadow: true,
    });

    // BACK plaque — top-left corner (the DOM pause/fullscreen cluster owns the
    // top-right); mobile needs a visible way out beyond the II button
    const bw = ui > 1 ? 88 : 64;
    const bh = ui > 1 ? 26 : 20;
    new PixelButton(this, VIEW.insetL + 10 + bw / 2, ui > 1 ? 24 : 18, {
      w: bw, h: bh, label: 'BACK', scale: ui, face: 'wood', onTap: () => this.leave(),
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
    const mode = runModeOf(this.levelIndex);
    entries.slice(0, SHOW_N).forEach((e, i) => {
      const rank = `${i + 1}`.padStart(2, ' ');
      const name = e.name.padEnd(12, ' ');
      const t = mode ? fmtRun(e.timeMs) : `${(e.timeMs / 1000).toFixed(1)}s`;
      this.rowsText[i].setText(`${rank}  ${name}  ${t}`);
      this.rowsText[i].setColor(i === 0 ? 'O' : i < 3 ? 'y' : 'W');
    });
  }

  private setName(): void {
    if (this.busy) return;
    this.busy = true;
    audio.sfx('menuSelect');
    void promptName(this).then(async (name) => {
      this.busy = false;
      if (!this.scene.isActive() || name === null) return;
      this.nameBtn.setLabel('SAVED!').setLit(true);
      this.time.delayedCall(1400, () => this.nameBtn.setLabel('SET NAME').setLit(false));
      const myBest = this.save.data.bestTimes[this.levelIndex];
      this.mine.setText(myBest ? `YOUR BEST ${(myBest / 1000).toFixed(1)}s AS ${name}` : 'NO CLEAR TIME YET - GO SET ONE');
      // sweep the rename across every board this device sits on — levels AND
      // any run boards it has a completed run on — then refetch
      const levels = Object.keys(this.save.data.bestTimes).map(Number);
      for (const [m, slot] of Object.entries(RUN_LB_LEVEL) as [RunMode, number][]) {
        if (runBest(m) > 0) levels.push(slot);
      }
      await announceName(levels);
      if (this.scene.isActive()) void this.refresh();
    });
  }

  private leave(): void {
    audio.sfx('menuSelect');
    setTouchContext(this.returnTo === 'WorldMap' ? 'map' : 'ui');
    this.scene.stop();
    this.scene.resume(this.returnTo);
  }

  update(_time: number, delta: number): void {
    if (VIEW.w !== this.layoutW) {
      this.scene.restart({ levelIndex: this.levelIndex, returnTo: this.returnTo });
      return;
    }
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    const f = this.inputSys.sample();
    if (f.pause || f.firePressed) this.leave();
  }
}
