/** Level-clear tally overlay — time, gems, tokens, then onward. */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { SaveManager } from '../systems/save';
import { audio } from '../audio/engine';
import { LEVELS, worldOf } from '../data/levels';
import { STORY } from '../data/story';
import { uiScale } from '../systems/platform';
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
  /** names of achievements unlocked by this clear */
  achievements?: string[];
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
    setTouchContext('clear');
    this.data2 = data;
    this.layoutW = VIEW.w;
    this.inputSys = new InputSystem(this);
    this.grace = 0.6;

    const W = VIEW.w;
    const ui = uiScale();
    const isBoss = LEVELS[data.levelIndex]?.boss === true;
    const save = this.registry.get('save') as SaveManager;
    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.66);
    this.add.rectangle(W / 2, H / 2, ui > 1 ? 430 : 280, ui > 1 ? 232 : 160, 0x2a1f1b, 0.95).setStrokeStyle(1, 0x7a5a3e);

    new PixelText(this, W / 2, H / 2 - (ui > 1 ? 92 : 62), isBoss ? STORY.bossFall.title : 'BEACON RELIT!', {
      scale: ui > 1 ? 3 : 2, color: 'O', align: 'center', shadow: true,
    });
    new PixelText(this, W / 2, H / 2 - (ui > 1 ? 64 : 42), data.name.toUpperCase(), { scale: ui, color: 'c', align: 'center' });

    if (isBoss) {
      // a shard of the Ember Heart, reclaimed — golden beat + glinting shard
      if (!save.data.settings.flashReduction) this.cameras.main.flash(220, 242, 176, 80);
      audio.sfx('token');
      const shardScale = ui > 1 ? 3 : 2;
      const shard = this.add.image(W / 2, H / 2 - (ui > 1 ? 126 : 84), 'story', 'shard.0').setScale(shardScale);
      this.tweens.add({ targets: shard, scale: { from: shardScale * 1.6, to: shardScale }, duration: 320, ease: 'Back.easeOut' });
      this.tweens.add({
        targets: shard, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut',
      });
      this.time.addEvent({
        delay: 450, loop: true,
        callback: () => shard.setFrame(shard.frame.name === 'shard.0' ? 'shard.1' : 'shard.0'),
      });
      const line = new PixelText(this, W / 2, H / 2 + (ui > 1 ? 52 : 30), STORY.bossFall.lines[1], {
        scale: ui, color: 'y', align: 'center', shadow: true,
      });
      line.setAlpha(0);
      this.tweens.add({ targets: line, alpha: 1, delay: 1100, duration: 300 });
    }

    const secs = (data.timeMs / 1000).toFixed(1);
    const rows: [string, string][] = [
      ['TIME', `${secs}s`],
      ['GEMS', `${data.gems}/${data.gemTotal}`],
      ['EMBER TOKENS', `${data.tokens}/4`],
    ];
    rows.forEach(([label, value], i) => {
      const y = H / 2 - (ui > 1 ? 24 : 14) + i * (ui > 1 ? 24 : 14);
      const l = new PixelText(this, W / 2 - (ui > 1 ? 180 : 100), y, label, { scale: ui, color: 'W' });
      const v = new PixelText(this, W / 2 + (ui > 1 ? 180 : 100), y, value, { scale: ui, color: 'y', align: 'right' });
      l.setAlpha(0);
      v.setAlpha(0);
      this.tweens.add({ targets: [l, v], alpha: 1, delay: 250 + i * 260, duration: 200 });
      this.time.delayedCall(250 + i * 260, () => audio.sfx('menuMove'));
    });

    // any achievements this clear unlocked — pop them in after the tally, with a
    // little token fanfare
    const earned = data.achievements ?? [];
    earned.forEach((name, i) => {
      const y = H / 2 + (ui > 1 ? 30 : 22) + i * (ui > 1 ? 16 : 11);
      const line = new PixelText(this, W / 2, y, `ACHIEVEMENT - ${name.toUpperCase()}`, {
        scale: 1, color: 'O', align: 'center', shadow: true,
      }).setAlpha(0);
      const delay = 1100 + i * 400;
      this.tweens.add({ targets: line, alpha: 1, y: { from: y + 6, to: y }, delay, duration: 260, ease: 'Back.easeOut' });
      this.time.delayedCall(delay, () => audio.sfx('token'));
    });

    // no colons — the 4x6 font has no ':' glyph (renders as '?')
    const hasNext = data.levelIndex + 1 < LEVELS.length;
    const nextIsNewWorld = hasNext && worldOf(data.levelIndex + 1).num !== worldOf(data.levelIndex).num;
    const prompt = !hasNext
      ? 'Z - ONWARD'
      : nextIsNewWorld
        ? `${worldOf(data.levelIndex + 1).label} AHEAD!  Z - ONWARD   X - MAP`
        : 'Z - NEXT LEVEL   X - MAP';
    const p = new PixelText(this, W / 2, H / 2 + (ui > 1 ? 96 : 52), prompt, { scale: ui, color: 'W', align: 'center', shadow: true });
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
        // last existing boss down — the full victory sequence
        this.scene.start('Finale');
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
