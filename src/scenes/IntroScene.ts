/**
 * The story intro — three staged beats on the living parallax, fully
 * skippable, tap/jump to advance (first tap completes the current text,
 * second advances — no waiting on slow prose):
 *   1. The Ember Heart on its shrine, kept by Pip. Warm, alive.
 *   2. Coglar's walker looms in; the light cools; he takes the Heart AND Pip.
 *   3. Sorrel runs in out of the dark and sets out. TAP TO BEGIN.
 * Plays once (save.introSeen), then hands off to the first level.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { SaveManager } from '../systems/save';
import { buildParallax, type ParallaxLayers } from '../gfx/parallax';
import { ParticleSystem } from '../gfx/particles';
import { audio } from '../audio/engine';
import { STORY } from '../data/story';
import { animFrame } from '../gfx/textures';
import { uiScale } from '../systems/platform';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';

const H = TUNING.view.height;
const GROUND_Y = H - 30;
/** seconds of no input before a beat advances by itself */
const BEAT_AUTO_S = 7;

export class IntroScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private save!: SaveManager;
  private parallax!: ParallaxLayers;
  private particles!: ParticleSystem;
  private nextLevel = 0;
  private beat = 0;
  private lineTexts: PixelText[] = [];
  private linesShown = 0;
  private lineTimer = 0;
  private beatTimer = 0;
  private advanceLock = 0;
  private done = false;
  private t = 0;
  private layoutW = 0;
  private heartTaken = false;

  private heart!: Phaser.GameObjects.Image;
  private pip!: Phaser.GameObjects.Image;
  private coglar!: Phaser.GameObjects.Image;
  private fox!: Phaser.GameObjects.Sprite;
  private foxRunning = false;
  private halo!: Phaser.GameObjects.Arc;
  private cold!: Phaser.GameObjects.Rectangle;
  private prompt!: PixelText;
  private sparkTimer = 0;

  constructor() {
    super('Intro');
  }

  create(data: { next?: number; beat?: number }): void {
    setTouchContext('ui');
    const W = VIEW.w;
    this.layoutW = W;
    this.nextLevel = data.next ?? 0;
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.parallax = buildParallax(this, 'thornwood', 'dawn', 13);
    this.particles = new ParticleSystem(this, 24);
    this.done = false;
    this.heartTaken = false;
    this.foxRunning = false;
    this.t = 0;

    // warm ground strip (matches the title's)
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x4a362b).fillRect(0, H - 26, W, 26);
    g.fillStyle(0x5f7d34).fillRect(0, H - 30, W, 5);
    g.fillStyle(0x8fa84a).fillRect(0, H - 31, W, 2);

    // the shrine: a small stone plinth for the Heart
    const px = W / 2;
    const plinth = this.add.graphics().setDepth(2);
    plinth.fillStyle(0x4a362b).fillRect(px - 14, GROUND_Y - 8, 28, 8);
    plinth.fillStyle(0x7a5a3e).fillRect(px - 10, GROUND_Y - 16, 20, 8);
    plinth.fillStyle(0xb58b5e).fillRect(px - 10, GROUND_Y - 17, 20, 2);

    this.halo = this.add.circle(px, GROUND_Y - 30, 38, 0xf2a03d, 0.14).setDepth(2);
    this.heart = this.add.image(px, GROUND_Y - 28, 'story', 'heart_orb.0').setScale(1.5).setDepth(4);
    this.pip = this.add.image(px + 30, GROUND_Y - 19, 'story', 'pip.0').setScale(1.25).setDepth(4);

    this.coglar = this.add
      .image(W + 90, GROUND_Y + 2, 'story', 'coglar.0')
      .setOrigin(0.5, 1)
      .setScale(3.5)
      .setDepth(5);
    this.fox = this.add
      .sprite(-30, GROUND_Y, 'player', 'idle.0')
      .setOrigin(0.5, 1)
      .setDepth(5);

    // mood overlay — the world cooling as Coglar takes the Heart
    this.cold = this.add.rectangle(W / 2, H / 2, W + 4, H + 4, 0x243049, 0).setDepth(50);

    const ui = uiScale();
    const textY = ui > 1 ? 196 : 226;
    const lineH = 14 * ui;
    this.lineTexts = [0, 1, 2].map(
      (i) =>
        new PixelText(this, W / 2, textY + i * lineH, '', {
          scale: ui, color: 'c', align: 'center', shadow: true,
        }),
    );
    this.lineTexts.forEach((l) => l.setDepth(60));

    this.prompt = new PixelText(this, W / 2, H - 8 - 6 * ui, '', { scale: ui, color: 'W', align: 'center', shadow: true });
    this.prompt.setDepth(60);
    // top-LEFT: the top-right corner belongs to the pause/fullscreen tablets
    const skip = new PixelText(this, 10, 10, 'SKIP >>', { scale: ui, color: 't', shadow: true });
    skip.setDepth(60);

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.y < 10 + 16 * ui && p.x < 80 * ui) this.finish();
      else this.advance();
    });

    this.startBeat(data.beat ?? 0);
  }

  private lines(): readonly string[] {
    return STORY.intro[this.beat]?.lines ?? [];
  }

  private startBeat(i: number): void {
    this.beat = i;
    this.linesShown = 0;
    this.lineTimer = 0.4;
    this.beatTimer = 0;
    this.advanceLock = 0.35;
    this.lineTexts.forEach((l) => l.setText(''));
    this.prompt.setText(i === STORY.intro.length - 1 ? 'TAP TO BEGIN' : 'TAP >');

    if (i === 1) {
      // Coglar looms in; the light cools; he takes the Heart and Pip
      audio.sfx('pound');
      if (this.save.data.settings.screenShake) this.cameras.main.shake(700, 0.004);
      this.tweens.add({ targets: this.coglar, x: VIEW.w * 0.74, duration: 1700, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: this.cold, fillAlpha: 0.42, duration: 2400 });
      this.time.delayedCall(1900, () => {
        if (this.done || this.beat !== 1) return;
        audio.sfx('break');
        this.pip.setTexture('story', 'pip_dim.0');
        const cx = this.coglar.x - 6;
        const cy = this.coglar.y - 26 * 3.5 * 0.55;
        for (const target of [this.heart, this.pip]) {
          this.tweens.add({ targets: target, x: cx, y: cy, scale: 0.15, alpha: 0, duration: 850, ease: 'Quad.easeIn' });
        }
        this.tweens.add({ targets: this.halo, alpha: 0, duration: 850 });
        this.heartTaken = true;
        this.time.delayedCall(880, () => {
          if (!this.save.data.settings.flashReduction) this.cameras.main.flash(160, 240, 160, 60);
          audio.sfx('hurt');
        });
      });
    } else if (i === 2) {
      // Coglar withdraws into the dark; Sorrel runs in
      this.tweens.add({ targets: this.coglar, x: VIEW.w + 120, duration: 2000, ease: 'Quad.easeIn' });
      this.foxRunning = true;
      this.tweens.add({
        targets: this.fox,
        x: VIEW.w * 0.38,
        duration: 1500,
        ease: 'Quad.easeOut',
        onComplete: () => { this.foxRunning = false; },
      });
    }
  }

  /** tap: finish the current text, then advance beats, then begin. */
  private advance(): void {
    if (this.done || this.advanceLock > 0) return;
    this.advanceLock = 0.3;
    const lines = this.lines();
    if (this.linesShown < lines.length) {
      this.linesShown = lines.length;
      lines.forEach((text, i) => this.lineTexts[i].setText(text));
      return;
    }
    audio.sfx('menuMove');
    if (this.beat < STORY.intro.length - 1) this.startBeat(this.beat + 1);
    else this.finish();
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    audio.sfx('menuSelect');
    this.save.data.introSeen = true;
    this.save.save();
    this.cameras.main.fadeOut(420, 20, 16, 13);
    this.time.delayedCall(440, () => this.scene.start('Game', { levelIndex: this.nextLevel }));
  }

  update(_time: number, delta: number): void {
    if (VIEW.w !== this.layoutW) {
      this.scene.restart({ next: this.nextLevel, beat: this.beat });
      return;
    }
    const dt = delta / 1000;
    this.t += dt;
    this.advanceLock -= dt;
    this.beatTimer += dt;

    const f = this.inputSys.sample();
    if (f.pause) { this.finish(); return; }
    if (f.jumpPressed || f.firePressed) this.advance();

    // reveal narration line by line
    const lines = this.lines();
    if (this.linesShown < lines.length) {
      this.lineTimer -= dt;
      if (this.lineTimer <= 0) {
        this.lineTexts[this.linesShown].setText(lines[this.linesShown]);
        this.linesShown++;
        this.lineTimer = 0.9;
      }
    } else if (this.beatTimer > BEAT_AUTO_S && !this.done) {
      this.advance();
    }

    // living actors
    if (!this.heartTaken) {
      this.heart.setFrame(animFrame('heart_orb', 2, this.t, 2.2));
      this.pip.setFrame(animFrame('pip', 2, this.t, 2.6));
      this.pip.y = GROUND_Y - 18 + Math.sin(this.t * 2.2) * 3;
      this.halo.setAlpha(0.11 + Math.sin(this.t * 2.2) * 0.05);
      this.sparkTimer -= dt;
      if (this.sparkTimer <= 0) {
        this.particles.sparks(this.heart.x + Phaser.Math.Between(-8, 8), this.heart.y - 6, 2);
        this.sparkTimer = 1.4;
      }
    }
    if (this.coglar.x < VIEW.w + 60) {
      this.coglar.setFrame(animFrame('coglar', 2, this.t, 1.6));
    }
    this.fox.setFrame(
      this.foxRunning ? animFrame('run', 6, this.t, 10) : animFrame('idle', 4, this.t, 5),
    );

    this.prompt.setColor(Math.floor(this.t * 2) % 2 === 0 ? 'W' : 't');
    this.parallax.update(this.t * 4, 0);
    this.particles.update(dt);
  }
}
