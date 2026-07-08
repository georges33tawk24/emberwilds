/**
 * The victory sequence after the last existing boss — a real ending, not a
 * bounce to the title:
 *   A. warmth floods back — the cold lifts off the wilds, the beacon roars,
 *      recovered shards orbit it, narration sets up the road to the Foundry
 *   B. the campaign tally — time, gems, tokens, completion
 *   C. credits roll, then home to the title
 * When World 6 ships, beat A swaps to the Pip rescue (STORY.finale).
 */
import Phaser from 'phaser';
import { PLAYER_TEX } from '../systems/cosmetics';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { SaveManager } from '../systems/save';
import { buildParallax, type ParallaxLayers } from '../gfx/parallax';
import { ParticleSystem } from '../gfx/particles';
import { audio } from '../audio/engine';
import { track } from '../systems/analytics';
import { TITLE_SONG as TITLE_SONG_RAW } from '../audio/songs';
import type { Song } from '../audio/songTypes';
import { STORY } from '../data/story';
import { LEVELS } from '../data/levels';
import { animFrame } from '../gfx/textures';
import { uiScale } from '../systems/platform';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';

const H = TUNING.view.height;
const GROUND_Y = H - 30;
const TITLE_SONG = TITLE_SONG_RAW as Song;

export class FinaleScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private save!: SaveManager;
  private parallax!: ParallaxLayers;
  private particles!: ParticleSystem;
  private phase = 0;
  private t = 0;
  private phaseT = 0;
  private advanceLock = 0.6;
  private layoutW = 0;
  private done = false;

  private beacon!: Phaser.GameObjects.Image;
  private fox!: Phaser.GameObjects.Sprite;
  private shards: Phaser.GameObjects.Image[] = [];
  private cold!: Phaser.GameObjects.Rectangle;
  private lineTexts: PixelText[] = [];
  private linesShown = 0;
  private lineTimer = 1.2;
  private statsBox!: Phaser.GameObjects.Container;
  private creditsBox!: Phaser.GameObjects.Container;
  private creditsH = 0;
  private prompt!: PixelText;

  constructor() {
    super('Finale');
  }

  create(): void {
    setTouchContext('ui');
    const W = VIEW.w;
    this.layoutW = W;
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.parallax = buildParallax(this, 'thornwood', 'dawn', 17);
    this.particles = new ParticleSystem(this, 24);
    this.phase = 0;
    this.phaseT = 0;
    this.t = 0;
    this.linesShown = 0;
    this.lineTimer = 1.2;
    this.advanceLock = 0.6;
    this.done = false;
    this.shards = [];

    audio.stopSong();
    audio.playSong(TITLE_SONG);

    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x4a362b).fillRect(0, H - 26, W, 26);
    g.fillStyle(0x5f7d34).fillRect(0, H - 30, W, 5);
    g.fillStyle(0x8fa84a).fillRect(0, H - 31, W, 2);

    this.beacon = this.add.image(W / 2, GROUND_Y, 'pickups', 'beacon_lit.0').setOrigin(0.5, 1).setScale(2).setDepth(3);
    this.fox = this.add.sprite(W / 2 - 44, GROUND_Y, PLAYER_TEX, 'idle.0').setOrigin(0.5, 1).setDepth(4);
    const bosses = LEVELS.filter((l) => l.boss).length;
    for (let i = 0; i < bosses; i++) {
      this.shards.push(this.add.image(W / 2, GROUND_Y - 60, 'story', 'shard.0').setDepth(4).setScale(1.4));
    }

    // the cold lifting — starts heavy, burns away
    this.cold = this.add.rectangle(W / 2, H / 2, W + 4, H + 4, 0x243049, 0.45).setDepth(50);
    this.tweens.add({ targets: this.cold, fillAlpha: 0, duration: 3200, ease: 'Sine.easeOut' });
    if (!this.save.data.settings.flashReduction) this.cameras.main.flash(500, 242, 176, 80);
    audio.sfx('goal');

    const ui = uiScale();
    const title = new PixelText(this, W / 2, ui > 1 ? 42 : 54, STORY.finale.title, {
      scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true,
    });
    title.setDepth(60).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, delay: 500, duration: 600 });

    this.lineTexts = [0, 1, 2, 3].map((i) =>
      new PixelText(this, W / 2, (ui > 1 ? 84 : 96) + i * 13 * ui, '', { scale: ui, color: 'c', align: 'center', shadow: true }),
    );
    this.lineTexts.forEach((l) => l.setDepth(60));

    this.prompt = new PixelText(this, W / 2, H - 6 - 6 * ui, 'TAP >', { scale: ui, color: 'W', align: 'center', shadow: true });
    this.prompt.setDepth(60);

    this.buildStats();
    this.buildCredits();

    this.input.on('pointerup', () => this.advance());
  }

  private buildStats(): void {
    const W = VIEW.w;
    const ui = uiScale();
    const d = this.save.data;
    const cleared = Math.min(d.levelUnlocked, LEVELS.length);
    let tokens = 0;
    const tokenLevels = LEVELS.filter((l) => !l.boss).length;
    for (let i = 0; i < LEVELS.length; i++) tokens += this.save.tokenCount(i);
    let timeMs = 0;
    for (let i = 0; i < cleared; i++) timeMs += d.bestTimes[i] ?? 0;
    const totalS = Math.floor(timeMs / 1000);
    const timeText = `${Math.floor(totalS / 60)}M ${String(totalS % 60).padStart(2, '0')}S`;
    const completion = Math.round((cleared / LEVELS.length) * 50 + (tokens / (tokenLevels * 4)) * 50);

    // funnel event: the campaign was finished (the top of the funnel is the
    // page load; this is the very bottom)
    track('game_complete', { completion, time_ms: timeMs, tokens });

    this.statsBox = this.add.container(0, 0).setDepth(60).setAlpha(0);
    const bg = this.add
      .rectangle(W / 2, ui > 1 ? 200 : 168, ui > 1 ? 400 : 240, ui > 1 ? 168 : 118, 0x2a1f1b, 0.94)
      .setStrokeStyle(1, 0x7a5a3e);
    const header = new PixelText(this, W / 2, ui > 1 ? 132 : 122, 'THE STORY SO FAR', { scale: ui > 1 ? 3 : 2, color: 'O', align: 'center', shadow: true });
    const rows: [string, string][] = [
      ['BEACONS RELIT', `${cleared}/${LEVELS.length}`],
      ['BEST TIME', timeText],
      ['EMBER TOKENS', `${tokens}/${tokenLevels * 4}`],
      ['GEMS IN THE POUCH', `${d.gems}`],
      ['COMPLETION', `${completion}%`],
    ];
    this.statsBox.add([bg, header]);
    rows.forEach(([label, value], i) => {
      const y = (ui > 1 ? 152 : 146) + i * (ui > 1 ? 24 : 15);
      this.statsBox.add(new PixelText(this, W / 2 - (ui > 1 ? 180 : 105), y, label, { scale: ui, color: 'W' }));
      this.statsBox.add(new PixelText(this, W / 2 + (ui > 1 ? 180 : 105), y, value, { scale: ui, color: 'y', align: 'right' }));
    });
  }

  private buildCredits(): void {
    const W = VIEW.w;
    const ui = uiScale();
    this.creditsBox = this.add.container(0, H).setDepth(60).setVisible(false);
    let y = 0;
    for (const [text, color, scale] of STORY.credits) {
      const s = scale * ui;
      if (text) this.creditsBox.add(new PixelText(this, W / 2, y, text, { scale: s, color, align: 'center', shadow: true }));
      y += 10 + s * 8;
    }
    this.creditsH = y;
  }

  private advance(): void {
    if (this.done || this.advanceLock > 0) return;
    this.advanceLock = 0.5;
    const lines = STORY.finale.lines;
    if (this.phase === 0 && this.linesShown < lines.length) {
      this.linesShown = lines.length;
      lines.forEach((text, i) => this.lineTexts[i].setText(text));
      return;
    }
    audio.sfx('menuSelect');
    if (this.phase === 0) {
      this.phase = 1;
      this.phaseT = 0;
      this.lineTexts.forEach((l) => l.setText(''));
      this.tweens.add({ targets: this.statsBox, alpha: 1, duration: 400 });
      this.prompt.setText('TAP >');
    } else if (this.phase === 1) {
      this.phase = 2;
      this.phaseT = 0;
      this.tweens.add({ targets: this.statsBox, alpha: 0, duration: 300 });
      this.creditsBox.setVisible(true);
      this.prompt.setText('');
      // roll the credits from below the screen to above it, then go home
      this.tweens.add({
        targets: this.creditsBox,
        y: -this.creditsH - 20,
        duration: Math.max(9000, this.creditsH * 55),
        ease: 'Linear',
        onComplete: () => this.finish(),
      });
    } else {
      this.finish();
    }
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    audio.stopSong();
    this.cameras.main.fadeOut(500, 20, 16, 13);
    this.time.delayedCall(520, () => this.scene.start('Title'));
  }

  update(_time: number, delta: number): void {
    if (VIEW.w !== this.layoutW) {
      this.scene.restart();
      return;
    }
    const dt = delta / 1000;
    this.t += dt;
    this.phaseT += dt;
    this.advanceLock -= dt;

    const f = this.inputSys.sample();
    if (f.jumpPressed || f.firePressed) this.advance();

    if (this.phase === 0) {
      const lines = STORY.finale.lines;
      if (this.linesShown < lines.length) {
        this.lineTimer -= dt;
        if (this.lineTimer <= 0) {
          this.lineTexts[this.linesShown].setText(lines[this.linesShown]);
          this.linesShown++;
          this.lineTimer = 1.1;
        }
      } else if (this.phaseT > 9) {
        this.advance();
      }
    } else if (this.phase === 1 && this.phaseT > 8) {
      this.advance();
    }

    // living scene: roaring beacon, orbiting shards, drifting warm sparks
    this.beacon.setFrame(animFrame('beacon_lit', 2, this.t, 6));
    this.fox.setFrame(animFrame('idle', 4, this.t, 5));
    this.shards.forEach((s, i) => {
      const a = this.t * 1.1 + (i * Math.PI * 2) / Math.max(1, this.shards.length);
      s.setPosition(VIEW.w / 2 + Math.cos(a) * 34, GROUND_Y - 58 + Math.sin(a) * 10);
      s.setFrame(animFrame('shard', 2, this.t + i, 2));
    });
    if (Math.floor(this.t * 3) !== Math.floor((this.t - dt) * 3)) {
      this.particles.sparks(this.beacon.x + Phaser.Math.Between(-10, 10), this.beacon.y - 30, 2);
    }
    this.prompt.setColor(Math.floor(this.t * 2) % 2 === 0 ? 'W' : 't');
    this.parallax.update(this.t * 4, 0);
    this.particles.update(dt);
  }
}
