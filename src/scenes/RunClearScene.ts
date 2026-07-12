/**
 * RUN COMPLETE — the results screen for a post-completion run (Boss Rush,
 * Time Attack, or a Hardcore run that either cleared the campaign or ended in
 * death). Records the local best, submits to the mode's global board, and
 * offers a rematch or the title.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { PixelButton } from '../gfx/ui';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { audio } from '../audio/engine';
import { submitScore } from '../systems/leaderboard';
import { RUN_LB_LEVEL, RUN_TITLE, runBest, runSeq, setRunBest, type RunMode } from '../systems/runs';
import { levelLabel } from '../data/levels';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';

const H = TUNING.view.height;

function fmt(ms: number): string {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}M ${(s % 60).toFixed(1).padStart(4, '0')}S` : `${s.toFixed(1)}S`;
}

interface RunResult {
  mode: RunMode;
  timeMs: number;
  deaths: number;
  /** levels cleared this run (for hardcore depth) */
  depth: number;
  /** the sequence was finished (false = hardcore death mid-run) */
  completed: boolean;
}

export class RunClearScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private grace = 0;
  private layoutW = 0;
  private data2!: RunResult;

  constructor() {
    super('RunClear');
  }

  create(data: RunResult): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.data2 = data;
    this.inputSys = new InputSystem(this);
    this.grace = 0.6;

    const timeRun = data.mode !== 'hardcore';
    const win = data.completed;

    // score it: time for boss/time (and a completed hardcore); depth is the
    // hardcore "best". Only a real completion reaches the global board.
    let isBest = false;
    if (timeRun) {
      isBest = setRunBest(data.mode, data.timeMs);
      submitScore(RUN_LB_LEVEL[data.mode], data.timeMs);
    } else {
      isBest = setRunBest('hardcore', data.depth);
      if (win) submitScore(RUN_LB_LEVEL.hardcore, data.timeMs);
    }

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.92);
    audio.sfx(win || timeRun ? 'goal' : 'die');
    if (win) this.cameras.main.flash(400, 242, 176, 80);

    const title = !timeRun && !win ? 'THE RUN ENDS' : RUN_TITLE[data.mode];
    new PixelText(this, W / 2, ui > 1 ? 40 : 44, title, {
      scale: ui > 1 ? 5 : 4, color: timeRun || win ? 'O' : 'R', align: 'center', shadow: true,
    });

    const sub =
      data.mode === 'boss' ? 'ALL FIVE SHARDS, ONE RUN'
        : data.mode === 'time' ? 'THE WHOLE WILDS, ONE CLOCK'
          : win ? 'ONE LIFE. NOT A SCRATCH.' : 'ONE LIFE. THE WILDS TAKE THEIR DUE.';
    new PixelText(this, W / 2, ui > 1 ? 76 : 74, sub, { scale: ui, color: 'c', align: 'center', shadow: true });

    // headline: time for time-runs / a hardcore win; depth for a hardcore death
    if (timeRun || win) {
      new PixelText(this, W / 2, H / 2 - (ui > 1 ? 30 : 24), fmt(data.timeMs), {
        scale: ui > 1 ? 5 : 4, color: 'W', align: 'center', shadow: true,
      });
    } else {
      const reached = levelLabel(runSeq('hardcore')[Math.min(data.depth, 27)]);
      new PixelText(this, W / 2, H / 2 - (ui > 1 ? 34 : 26), `REACHED ${reached}`, {
        scale: ui > 1 ? 3 : 2, color: 'W', align: 'center', shadow: true,
      });
      new PixelText(this, W / 2, H / 2 - (ui > 1 ? 6 : 4), `${data.depth} / 28 BEACONS`, { scale: ui, color: 'c', align: 'center' });
    }
    if (isBest) {
      new PixelText(this, W / 2, H / 2 + (ui > 1 ? 8 : 6), timeRun || win ? 'NEW BEST!' : 'DEEPEST YET!', {
        scale: ui, color: 'O', align: 'center', shadow: true,
      });
    }

    const rowY = H / 2 + (ui > 1 ? 44 : 34);
    new PixelText(this, W / 2, rowY, `DEATHS  ${data.deaths}`, { scale: ui, color: 't', align: 'center' });
    const bestLabel = timeRun ? `BEST  ${fmt(runBest(data.mode))}` : `BEST DEPTH  ${runBest('hardcore')} / 28`;
    new PixelText(this, W / 2, rowY + (ui > 1 ? 16 : 12), bestLabel, { scale: ui, color: 'y', align: 'center' });

    const by = H - (ui > 1 ? 44 : 40);
    new PixelButton(this, W / 2 - (ui > 1 ? 92 : 66), by, {
      w: ui > 1 ? 168 : 120, h: ui > 1 ? 26 : 20, label: 'RUN AGAIN', scale: ui, face: 'green', onTap: () => this.again(),
    });
    new PixelButton(this, W / 2 + (ui > 1 ? 92 : 66), by, {
      w: ui > 1 ? 168 : 120, h: ui > 1 ? 26 : 20, label: 'TITLE', scale: ui, face: 'wood', onTap: () => this.toTitle(),
    });
    if (ui === 1) new PixelText(this, W / 2, H - 16, 'Z  RUN AGAIN     X  TITLE', { scale: 1, color: 'W', align: 'center', shadow: true });
  }

  private again(): void {
    audio.sfx('menuSelect');
    this.scene.start('Game', { run: { mode: this.data2.mode, i: 0, timeMs: 0, deaths: 0 } });
  }

  private toTitle(): void {
    audio.sfx('menuSelect');
    this.scene.start('Title');
  }

  update(_t: number, delta: number): void {
    if (VIEW.w !== this.layoutW) { this.scene.restart(this.data2); return; }
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    const f = this.inputSys.sample();
    if (f.jumpPressed) this.again();
    else if (f.firePressed || f.pause) this.toTitle();
  }
}
