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
import { attachMenuTouch } from '../systems/menuTouch';
import { shareClearCard } from '../systems/shareCard';
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
  /** this run took no damage */
  flawless?: boolean;
  /** this run set a new best time */
  newBest?: boolean;
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
    this.add.rectangle(W / 2, H / 2, ui > 1 ? 440 : 288, ui > 1 ? 250 : 178, 0x2a1f1b, 0.95).setStrokeStyle(1, 0x7a5a3e);

    // the final boss holds the Heart itself, not a shard — its fall gets
    // its own beat before the true finale takes over
    const isFinal = data.levelIndex + 1 >= LEVELS.length;
    const fallBeat = isBoss && isFinal ? STORY.heartFall : STORY.bossFall;
    new PixelText(this, W / 2, H / 2 - (ui > 1 ? 92 : 62), isBoss ? fallBeat.title : 'BEACON RELIT!', {
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
      // narrative beat — placed just under the level name so it never collides
      // with the tally or the achievement summary below
      const line = new PixelText(this, W / 2, H / 2 - (ui > 1 ? 44 : 28), fallBeat.lines[1], {
        scale: 1, color: 'y', align: 'center', shadow: true,
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

    // any achievements this clear unlocked — ONE compact line (a burst of 6 on a
    // final-boss clear must never stack and overlap); full list is in the
    // Achievements menu
    const earned = data.achievements ?? [];
    if (earned.length > 0) {
      const txt = earned.length === 1
        ? `ACHIEVEMENT - ${earned[0].toUpperCase()}`
        : `${earned.length} ACHIEVEMENTS UNLOCKED!`;
      const y = H / 2 + (ui > 1 ? 56 : 34);
      const line = new PixelText(this, W / 2, y, txt, { scale: ui, color: 'O', align: 'center', shadow: true }).setAlpha(0);
      this.tweens.add({ targets: line, alpha: 1, y: { from: y + 6, to: y }, delay: 1150, duration: 300, ease: 'Back.easeOut' });
      this.time.delayedCall(1150, () => audio.sfx('token'));
    }

    // no colons — the 4x6 font has no ':' glyph (renders as '?')
    const hasNext = data.levelIndex + 1 < LEVELS.length;
    const nextIsNewWorld = hasNext && worldOf(data.levelIndex + 1).num !== worldOf(data.levelIndex).num;
    const prompt = !hasNext
      ? 'Z - ONWARD'
      : nextIsNewWorld
        ? `${worldOf(data.levelIndex + 1).label} AHEAD!  Z - ONWARD   X - MAP`
        : 'Z - NEXT LEVEL   X - MAP';
    const p = new PixelText(this, W / 2, H / 2 + (ui > 1 ? 104 : 66), prompt, { scale: ui, color: 'W', align: 'center', shadow: true });
    this.tweens.add({ targets: p, alpha: { from: 0.4, to: 1 }, yoyo: true, repeat: -1, duration: 500 });

    // share card — a tappable chip in the free band between tally and prompt
    // (mobile-first: every action needs a button), plus C on the keyboard
    const shareY = H / 2 + (ui > 1 ? 84 : 50);
    const chipW = (ui > 1 ? 110 : 68);
    const chipH = (ui > 1 ? 20 : 13);
    this.add.rectangle(W / 2, shareY, chipW, chipH, 0x4a362b, 0.95).setStrokeStyle(1, 0xb58b5e);
    this.shareLabel = new PixelText(this, W / 2, shareY - 3 * ui, ui > 1 ? 'SHARE CARD' : 'C - SHARE', {
      scale: ui, color: 'O', align: 'center',
    });
    this.shareRect = new Phaser.Geom.Rectangle(W / 2 - chipW / 2, shareY - chipH / 2 - 4, chipW, chipH + 8);
    this.input.keyboard?.on('keydown-C', () => this.doShare());
    attachMenuTouch(this, {
      rowAt: (x, y) => (this.shareRect.contains(x, y) ? 0 : null),
      onTapRow: () => this.doShare(),
    });
  }

  private shareLabel!: PixelText;
  private shareRect!: Phaser.Geom.Rectangle;
  private sharing = false;

  private doShare(): void {
    if (this.sharing || this.grace > 0) return;
    this.sharing = true;
    audio.sfx('menuSelect');
    this.shareLabel.setText('...');
    const d = this.data2;
    void shareClearCard({
      levelName: d.name,
      world: worldOf(d.levelIndex).label,
      timeMs: d.timeMs,
      gems: d.gems,
      gemTotal: d.gemTotal,
      tokens: d.tokens,
      flawless: d.flawless ?? false,
      newBest: d.newBest ?? false,
    }).then((outcome) => {
      this.sharing = false;
      if (!this.scene.isActive()) return;
      const ui = uiScale();
      const idle = ui > 1 ? 'SHARE CARD' : 'C - SHARE';
      const text = outcome === 'shared' ? 'SHARED!' : outcome === 'saved' ? 'SAVED!' : idle;
      this.shareLabel.setText(text).setColor(outcome === 'failed' ? 'R' : 'O');
      if (outcome === 'shared' || outcome === 'saved') audio.sfx('token');
    });
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
