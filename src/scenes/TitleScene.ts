/** Animated title / attract screen — routes to the world-map hub. */
import Phaser from 'phaser';
import { PLAYER_TEX } from '../systems/cosmetics';
import { PixelButton } from '../gfx/ui';
import { promptName, storedName } from '../systems/nameEntry';
import { announceName } from '../systems/leaderboard';
import { PixelText } from '../gfx/text';
import { buildParallax, type ParallaxLayers } from '../gfx/parallax';
import { ParticleSystem } from '../gfx/particles';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { isMobile } from '../systems/platform';
import { SaveManager } from '../systems/save';
import { audio } from '../audio/engine';
import { TITLE_SONG as TITLE_SONG_RAW } from '../audio/songs';
import type { Song } from '../audio/songTypes';
import { LEVELS } from '../data/levels';
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
    setTouchContext('ui');
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

    this.fox = this.add.sprite(W / 2, H - 30, PLAYER_TEX, 'idle.0').setOrigin(0.5, 1).setDepth(2);

    this.logo = new PixelText(this, W / 2, 52, 'EMBERWILDS', {
      scale: 4, color: 'O', align: 'center', shadow: true,
    }).setDepth(3);
    new PixelText(this, W / 2, 90, 'A WARM LITTLE ACTION PLATFORMER', {
      scale: 1, color: 'c', align: 'center', shadow: true,
    }).setDepth(3);

    const cleared = this.save.data.levelUnlocked;
    const touch = isMobile();
    this.tokenLabel = new PixelText(this, W / 2, 122, '', {
      scale: 1, color: 'y', align: 'center', shadow: true,
    }).setDepth(3);
    this.tokenLabel.setText(cleared > 0 ? `${cleared} BEACON${cleared === 1 ? '' : 'S'} RELIT` : 'THE WILDS AWAIT');

    // the menu — carved-wood plaques in the game's own button language
    const playBtn = new PixelButton(this, W / 2, 154, {
      w: 190, h: 34, label: cleared > 0 ? 'CONTINUE' : 'PLAY', scale: 2, face: 'green',
      onTap: () => this.begin(false),
    }).setDepth(4);
    playBtn.setLit(true);
    this.promptLabel = new PixelText(this, W / 2, 176, touch ? 'OR TAP ANYWHERE' : 'OR PRESS Z', {
      scale: 1, color: 'c', align: 'center',
    }).setDepth(3);

    const rowY = 200;
    const bw = 122;
    new PixelButton(this, W / 2 - bw - 8, rowY, {
      w: bw, h: 24, label: 'WORLD MAP', face: 'wood', onTap: () => this.begin(true),
    }).setDepth(4);
    new PixelButton(this, W / 2, rowY, {
      w: bw, h: 24, label: 'WARDROBE', face: 'wood', onTap: () => this.openWardrobe(),
    }).setDepth(4);
    new PixelButton(this, W / 2 + bw + 8, rowY, {
      w: bw, h: 24, label: 'AWARDS', face: 'wood', onTap: () => this.openAchievements(),
    }).setDepth(4);
    new PixelButton(this, W / 2 - 63, rowY + 28, {
      w: 116, h: 20, label: `NAME - ${storedName()}`.slice(0, 16), face: 'wood',
      onTap: () => this.editName(),
    }).setDepth(4);
    new PixelButton(this, W / 2 + 63, rowY + 28, {
      w: 116, h: 20, label: 'HOW TO PLAY', face: 'wood',
      onTap: () => this.openHowTo(),
    }).setDepth(4);
    // Boss Rush unlocks once the campaign is beaten — the post-game gauntlet
    if (cleared >= LEVELS.length) {
      new PixelButton(this, W / 2, rowY + 56, {
        w: 190, h: 22, label: 'BOSS RUSH', face: 'green', onTap: () => this.beginBossRush(),
      }).setDepth(4);
      this.input.keyboard?.on('keydown-B', () => this.beginBossRush());
    }

    new PixelText(
      this, W / 2, 300,
      touch
        ? 'ROCKER MOVE   JUMP   FIRE   POUND'
        : 'ARROWS MOVE   Z JUMP   X SHOOT   C POUND   ESC PAUSE   F FULLSCREEN',
      { scale: 1, color: 't', align: 'center', shadow: true },
    ).setDepth(3);

    // one tap still starts the game (mobile-first) — anywhere outside the menu
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.y > 132 && p.y < 268) return; // the plaques own this band
      this.begin(false);
    });
    this.input.keyboard?.on('keydown-M', () => this.begin(true));
    this.input.keyboard?.on('keydown-A', () => this.openAchievements());
    this.input.keyboard?.on('keydown-W', () => this.openWardrobe());
    this.input.keyboard?.on('keydown-N', () => this.editName());
    this.input.keyboard?.on('keydown-H', () => this.openHowTo());

    // unlock audio on the very first interaction
    this.input.keyboard?.once('keydown', () => {
      audio.unlock();
      audio.applySettings(this.save.data.settings);
      audio.playSong(TITLE_SONG);
    });
  }

  private openHowTo(): void {
    audio.sfx('menuSelect');
    this.scene.start('HowToPlay', { returnTo: 'Title' });
  }

  private beginBossRush(): void {
    audio.sfx('menuSelect');
    audio.unlock();
    this.scene.start('Game', { rush: { i: 0, timeMs: 0, deaths: 0 } });
  }

  private openWardrobe(): void {
    if (this.started) return;
    this.started = true;
    audio.unlock();
    audio.sfx('menuSelect');
    this.scene.start('Wardrobe', { returnTo: 'Title' });
  }

  private editName(): void {
    if (this.started) return;
    audio.unlock();
    audio.sfx('menuSelect');
    void promptName().then((name) => {
      if (name !== null) {
        void announceName(Object.keys(this.save.data.bestTimes).map(Number));
        this.scene.restart(); // the NAME plaque re-reads the stored name
      }
    });
  }

  private openAchievements(): void {
    if (this.started) return;
    this.started = true;
    audio.unlock();
    audio.sfx('menuSelect');
    this.scene.start('Achievements', { returnTo: 'Title' });
  }

  /** Route into play: intro on a fresh save, straight into the next level
   *  otherwise; the map when asked for (or when the campaign is finished). */
  private begin(toMap: boolean): void {
    if (this.started) return;
    this.started = true;
    audio.unlock();
    audio.sfx('menuSelect');
    this.cameras.main.fadeOut(280, 20, 16, 13);
    const save = this.save.data;
    this.time.delayedCall(300, () => {
      if (toMap || save.levelUnlocked >= LEVELS.length) this.scene.start('WorldMap');
      else if (!save.introSeen) this.scene.start('Intro', { next: save.levelUnlocked });
      else this.scene.start('Game', { levelIndex: save.levelUnlocked });
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

    if (!this.started && frame.jumpPressed) this.begin(false);

    // gentle attract motion
    this.logo.y = 52 + Math.round(Math.sin(this.t * 1.4) * 2);
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
