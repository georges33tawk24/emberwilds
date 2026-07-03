/** Level-clear tally overlay — time, gems, tokens, then onward. */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { audio } from '../audio/engine';
import { LEVELS, worldOf } from '../data/levels';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';

const H = TUNING.view.height;

interface ClearData {
  levelIndex: number;
  timeMs: number;
  gems: number;
  gemTotal: number;
  tokens: number;
  name: string;
}

export class ClearScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private data2!: ClearData;
  private grace = 0;
  private layoutW = 0;

  constructor() {
    super('Clear');
  }

  create(data: ClearData): void {
    this.data2 = data;
    this.layoutW = VIEW.w;
    this.inputSys = new InputSystem(this);
    this.grace = 0.6;

    const W = VIEW.w;
    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.66);
    this.add.rectangle(W / 2, H / 2, 260, 150, 0x2a1f1b, 0.95).setStrokeStyle(1, 0x7a5a3e);

    new PixelText(this, W / 2, H / 2 - 60, 'BEACON RELIT!', { scale: 2, color: 'O', align: 'center', shadow: true });
    new PixelText(this, W / 2, H / 2 - 40, data.name.toUpperCase(), { scale: 1, color: 'c', align: 'center' });

    const secs = (data.timeMs / 1000).toFixed(1);
    const rows: [string, string][] = [
      ['TIME', `${secs}s`],
      ['GEMS', `${data.gems}/${data.gemTotal}`],
      ['EMBER TOKENS', `${data.tokens}/4`],
    ];
    rows.forEach(([label, value], i) => {
      const y = H / 2 - 14 + i * 14;
      const l = new PixelText(this, W / 2 - 100, y, label, { scale: 1, color: 'W' });
      const v = new PixelText(this, W / 2 + 100, y, value, { scale: 1, color: 'y', align: 'right' });
      l.setAlpha(0);
      v.setAlpha(0);
      this.tweens.add({ targets: [l, v], alpha: 1, delay: 250 + i * 260, duration: 200 });
      this.time.delayedCall(250 + i * 260, () => audio.sfx('menuMove'));
    });

    const hasNext = data.levelIndex + 1 < LEVELS.length;
    const nextIsNewWorld = hasNext && worldOf(data.levelIndex + 1).num !== worldOf(data.levelIndex).num;
    const prompt = !hasNext
      ? 'ALL WORLDS CLEARED! Z: TITLE'
      : nextIsNewWorld
        ? `${worldOf(data.levelIndex + 1).label} AHEAD!  Z: ONWARD   X: MAP`
        : 'Z: NEXT LEVEL   X: MAP';
    const p = new PixelText(this, W / 2, H / 2 + 52, prompt, { scale: 1, color: 'W', align: 'center', shadow: true });
    this.tweens.add({ targets: p, alpha: { from: 0.4, to: 1 }, yoyo: true, repeat: -1, duration: 500 });
  }

  update(_time: number, delta: number): void {
    // live width change (rotation, URL-bar collapse) — rebuild the layout
    if (VIEW.w !== this.layoutW) {
      this.scene.restart(this.data2);
      return;
    }
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    const f = this.inputSys.sample();
    const hasNext = this.data2.levelIndex + 1 < LEVELS.length;
    if (f.jumpPressed) {
      audio.sfx('menuSelect');
      this.scene.stop('Game');
      this.scene.stop('Hud');
      this.scene.stop();
      if (hasNext) this.scene.start('Game', { levelIndex: this.data2.levelIndex + 1 });
      else {
        // final boss down — return to the title for the victory beat (matches the prompt)
        audio.stopSong();
        this.scene.start('Title');
      }
    } else if (f.firePressed) {
      audio.sfx('menuSelect');
      audio.stopSong();
      this.scene.stop('Game');
      this.scene.stop('Hud');
      this.scene.stop();
      this.scene.start('WorldMap');
    }
  }
}
