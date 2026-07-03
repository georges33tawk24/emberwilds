/** Animated title / attract screen — routes to the world-map hub. */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { buildParallax, type ParallaxLayers } from '../gfx/parallax';
import { ParticleSystem } from '../gfx/particles';
import { InputSystem } from '../systems/input';
import { SaveManager } from '../systems/save';
import { audio } from '../audio/engine';
import { TITLE_SONG as TITLE_SONG_RAW } from '../audio/songs';
import type { Song } from '../audio/songTypes';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';

const TITLE_SONG = TITLE_SONG_RAW as Song;

const H = TUNING.view.height;

export class TitleScene extends Phaser.Scene {
  private input2!: InputSystem;
  private save!: SaveManager;
  private parallax!: ParallaxLayers;
  private particles!: ParticleSystem;
  private tokenLabel!: PixelText;
  private promptLabel!: PixelText;
  private fox!: Phaser.GameObjects.Sprite;
  private t = 0;
  private leafTimer = 0;
  private logo!: PixelText;
  private started = false;
  private layoutW = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    const W = VIEW.w;
    this.layoutW = W;
    this.save = this.registry.get('save') as SaveManager;
    this.input2 = new InputSystem(this);
    this.parallax = buildParallax(this, 'thornwood', 'dawn', 11);
    this.particles = new ParticleSystem(this);
    this.started = false;

    // warm ground strip for the fox to stand on
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x4a362b).fillRect(0, H - 26, W, 26);
    g.fillStyle(0x5f7d34).fillRect(0, H - 30, W, 5);
    g.fillStyle(0x8fa84a).fillRect(0, H - 31, W, 2);

    this.fox = this.add.sprite(W / 2, H - 30, 'player', 'idle.0').setOrigin(0.5, 1).setDepth(2);

    this.logo = new PixelText(this, W / 2, 52, 'EMBERWILDS', {
      scale: 4, color: 'O', align: 'center', shadow: true,
    }).setDepth(3);
    new PixelText(this, W / 2, 90, 'A WARM LITTLE ACTION PLATFORMER', {
      scale: 1, color: 'c', align: 'center', shadow: true,
    }).setDepth(3);

    const cleared = this.save.data.levelUnlocked;
    this.tokenLabel = new PixelText(this, W / 2, 190, '', {
      scale: 1, color: 'y', align: 'center', shadow: true,
    }).setDepth(3);
    this.tokenLabel.setText(cleared > 0 ? `${cleared} BEACON${cleared === 1 ? '' : 'S'} RELIT` : 'THE WILDS AWAIT');
    this.promptLabel = new PixelText(this, W / 2, 236, cleared > 0 ? 'PRESS Z TO CONTINUE' : 'PRESS Z TO BEGIN', {
      scale: 2, color: 'W', align: 'center', shadow: true,
    }).setDepth(3);
    new PixelText(this, W / 2, 300, 'ARROWS MOVE   Z JUMP   X SHOOT   C POUND   ESC PAUSE   F FULLSCREEN', {
      scale: 1, color: 't', align: 'center', shadow: true,
    }).setDepth(3);

    // unlock audio on the very first interaction
    this.input.keyboard?.once('keydown', () => {
      audio.unlock();
      audio.applySettings(this.save.data.settings);
      audio.playSong(TITLE_SONG);
    });
  }

  update(_time: number, delta: number): void {
    // live width change (rotation, URL-bar collapse) — rebuild the layout
    if (VIEW.w !== this.layoutW && !this.started) {
      this.scene.restart();
      return;
    }
    const dt = delta / 1000;
    this.t += dt;
    const frame = this.input2.sample();

    if (!this.started && frame.jumpPressed) {
      this.started = true;
      audio.unlock();
      audio.sfx('menuSelect');
      this.cameras.main.fadeOut(280, 20, 16, 13);
      this.time.delayedCall(300, () => this.scene.start('WorldMap'));
    }

    // gentle attract motion
    this.logo.y = 52 + Math.round(Math.sin(this.t * 1.4) * 2);
    this.promptLabel.setColor(Math.floor(this.t * 2) % 2 === 0 ? 'W' : 'c');
    const foxFrame = Math.floor(this.t * 5) % 4;
    this.fox.setFrame(`idle.${foxFrame}`);

    this.parallax.update(this.t * 6, 0);
    this.leafTimer -= dt;
    if (this.leafTimer <= 0) {
      this.particles.ambientLeaf(0, 0, VIEW.w, H);
      this.leafTimer = 0.5;
    }
    this.particles.update(dt);
  }
}
