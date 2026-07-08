/**
 * BOSS RUSH COMPLETE — the results screen after felling all five bosses in one
 * run. Shows the cumulative time and death tally, records a local best, and
 * submits the total to the global board (synthetic BOSS_RUSH_LEVEL). Offers a
 * rematch or back to the title.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { PixelButton } from '../gfx/ui';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { audio } from '../audio/engine';
import { submitScore } from '../systems/leaderboard';
import { BOSS_RUSH_LEVEL, bossRushBest, setBossRushBest } from '../systems/bossRush';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';

const H = TUNING.view.height;

function fmt(ms: number): string {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}M ${(s % 60).toFixed(1).padStart(4, '0')}S` : `${s.toFixed(1)}S`;
}

export class BossRushClearScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private grace = 0;
  private layoutW = 0;
  private data2!: { timeMs: number; deaths: number };

  constructor() {
    super('BossRushClear');
  }

  create(data: { timeMs: number; deaths: number }): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.data2 = data;
    this.inputSys = new InputSystem(this);
    this.grace = 0.6;

    // record best + submit the total to the global board
    const isBest = setBossRushBest(data.timeMs);
    submitScore(BOSS_RUSH_LEVEL, data.timeMs);
    const best = bossRushBest();

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.92);
    audio.sfx('goal');
    if (isBest) this.cameras.main.flash(400, 242, 176, 80);

    new PixelText(this, W / 2, ui > 1 ? 40 : 44, 'BOSS RUSH', { scale: ui > 1 ? 5 : 4, color: 'O', align: 'center', shadow: true });
    new PixelText(this, W / 2, ui > 1 ? 76 : 74, 'ALL FIVE SHARDS, ONE RUN', { scale: 1, color: 'c', align: 'center', shadow: true });

    new PixelText(this, W / 2, H / 2 - (ui > 1 ? 30 : 24), fmt(data.timeMs), { scale: ui > 1 ? 5 : 4, color: 'W', align: 'center', shadow: true });
    if (isBest) {
      new PixelText(this, W / 2, H / 2 + (ui > 1 ? 8 : 4), 'NEW BEST!', { scale: ui, color: 'O', align: 'center', shadow: true });
    }

    const rowY = H / 2 + (ui > 1 ? 44 : 32);
    new PixelText(this, W / 2, rowY, `DEATHS  ${data.deaths}`, { scale: 1, color: 't', align: 'center' });
    new PixelText(this, W / 2, rowY + 12, `BEST  ${fmt(best)}`, { scale: 1, color: 'y', align: 'center' });

    // rematch / title plaques
    const by = H - (ui > 1 ? 44 : 40);
    new PixelButton(this, W / 2 - (ui > 1 ? 92 : 66), by, {
      w: ui > 1 ? 168 : 120, h: ui > 1 ? 26 : 20, label: 'RACE AGAIN', scale: ui, face: 'green', onTap: () => this.again(),
    });
    new PixelButton(this, W / 2 + (ui > 1 ? 92 : 66), by, {
      w: ui > 1 ? 168 : 120, h: ui > 1 ? 26 : 20, label: 'TITLE', scale: ui, face: 'wood', onTap: () => this.toTitle(),
    });
    new PixelText(this, W / 2, H - (ui > 1 ? 16 : 16), 'Z  RACE AGAIN     X  TITLE', { scale: 1, color: 'W', align: 'center', shadow: true });
  }

  private again(): void {
    audio.sfx('menuSelect');
    this.scene.start('Game', { rush: { i: 0, timeMs: 0, deaths: 0 } });
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
