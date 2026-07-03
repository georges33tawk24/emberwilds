/** Diegetic, minimal HUD — hearts, gems, ember tokens. Animates every change. */
import Phaser from 'phaser';
import type { EventBus } from '../core/events';
import { PixelText } from '../gfx/text';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';

const H = TUNING.view.height;

interface HudData {
  bus: EventBus;
  tokenTotal: number;
  hearts: number;
  max: number;
}

export class HudScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private tokens: Phaser.GameObjects.Image[] = [];
  private gemText!: PixelText;
  private gemIcon!: Phaser.GameObjects.Image;
  private powerIcon!: Phaser.GameObjects.Image;
  private powerText!: PixelText;
  private keyIcon!: Phaser.GameObjects.Image;
  private keyText!: PixelText;
  private bossBar!: Phaser.GameObjects.Container;
  private bossFill!: Phaser.GameObjects.Rectangle;
  private bossMax = 1;
  private unsub: (() => void)[] = [];

  constructor() {
    super('Hud');
  }

  create(data: HudData): void {
    const W = VIEW.w;
    this.hearts = [];
    this.tokens = [];
    this.unsub.forEach((u) => u());
    this.unsub = [];

    for (let i = 0; i < data.max; i++) {
      const img = this.add.image(10 + i * 11, 10, 'pickups', i < data.hearts ? 'heart.0' : 'heart_empty.0');
      this.hearts.push(img);
    }

    this.gemIcon = this.add.image(12, 24, 'pickups', 'gem.0');
    this.gemText = new PixelText(this, 20, 21, 'x0', { scale: 1, color: 'W', shadow: true });

    // power indicator, bottom-left — hidden until a transformation is held
    this.powerIcon = this.add.image(12, 36, 'pickups', 'scatter.0').setVisible(false).setScale(0.85);
    this.powerText = new PixelText(this, 22, 33, '', { scale: 1, color: 'O', shadow: true });

    // key count, next to gems — hidden until a key is held
    this.keyIcon = this.add.image(48, 24, 'pickups', 'key.0').setVisible(false);
    this.keyText = new PixelText(this, 55, 21, '', { scale: 1, color: 'O', shadow: true });

    for (let i = 0; i < data.tokenTotal; i++) {
      const img = this.add.image(W - 14 - i * 15, 12, 'pickups', 'token.0').setAlpha(0.28);
      this.tokens.push(img);
    }

    // boss health bar (top-center), hidden until a boss spawns
    const barW = 180;
    this.bossBar = this.add.container(W / 2, H - 18).setVisible(false);
    const frame = this.add.rectangle(0, 0, barW + 4, 10, 0x2a1f1b, 0.85).setStrokeStyle(1, 0x7a5a3e);
    this.bossFill = this.add.rectangle(-barW / 2, 0, barW, 6, 0xc7402b).setOrigin(0, 0.5);
    const label = new PixelText(this, 0, -12, '', { scale: 1, color: 'o', align: 'center', shadow: true });
    label.name = 'bosslabel';
    this.bossBar.add([frame, this.bossFill, label]);

    const bus = data.bus;
    this.unsub.push(
      bus.on('hearts:changed', ({ hearts, max }) => {
        for (let i = 0; i < this.hearts.length; i++) {
          this.hearts[i].setFrame(i < hearts ? 'heart.0' : 'heart_empty.0');
        }
        void max;
        // pulse the last changed heart
        const idx = Math.max(0, Math.min(this.hearts.length - 1, hearts - 1 < 0 ? 0 : hearts - 1));
        const h = this.hearts[idx];
        this.tweens.add({ targets: h, scale: { from: 1.6, to: 1 }, duration: 220 });
      }),
      bus.on('pickup:gem', ({ count }) => {
        this.gemText.setText(`x${count}`);
        this.tweens.add({ targets: this.gemIcon, scale: { from: 1.5, to: 1 }, duration: 180 });
      }),
      bus.on('pickup:token', ({ index }) => {
        const img = this.tokens[index] ?? this.tokens.find((t) => t.alpha < 1);
        if (img) {
          img.setAlpha(1);
          this.tweens.add({ targets: img, scale: { from: 1.8, to: 1 }, duration: 300 });
        }
      }),
      bus.on('player:power', ({ power }) => {
        const icons: Record<string, [string, string, string]> = {
          scatter: ['scatter.0', 'SCATTER', 'l'],
          ember: ['ember_pk.0', 'EMBER', 'o'],
          frost: ['frost_pk.0', 'FROST', 'a'],
          gale: ['gale_pk.0', 'GALE', 'y'],
        };
        const spec = icons[power];
        if (!spec) {
          this.powerIcon.setVisible(false);
          this.powerText.setText('');
          return;
        }
        this.powerIcon.setVisible(true).setFrame(spec[0]);
        this.powerText.setText(spec[1]).setColor(spec[2]);
        this.tweens.add({ targets: this.powerIcon, scale: { from: 1.4, to: 0.85 }, duration: 240 });
      }),
      bus.on('player:powerLost', () => {
        this.powerIcon.setVisible(false);
        this.powerText.setText('');
      }),
      bus.on('keys:changed', ({ keys }) => {
        this.keyIcon.setVisible(keys > 0);
        this.keyText.setText(keys > 0 ? `x${keys}` : '');
        if (keys > 0) this.tweens.add({ targets: this.keyIcon, scale: { from: 1.5, to: 1 }, duration: 180 });
      }),
      bus.on('boss:spawn', ({ name, max }) => {
        this.bossMax = max;
        this.bossBar.setVisible(true);
        this.bossFill.width = 180;
        const label = this.bossBar.getByName('bosslabel') as PixelText;
        label?.setText(name);
      }),
      bus.on('boss:hp', ({ hp, max }) => {
        const frac = Math.max(0, hp / max);
        this.tweens.add({ targets: this.bossFill, width: 180 * frac, duration: 200 });
        this.bossFill.fillColor = frac > 0.5 ? 0xc7402b : frac > 0.25 ? 0xe8622c : 0xf2a03d;
      }),
      bus.on('boss:died', () => {
        this.tweens.add({ targets: this.bossBar, alpha: 0, duration: 600, onComplete: () => this.bossBar.setVisible(false) });
      }),
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsub.forEach((u) => u());
      this.unsub = [];
    });
  }

  update(time: number): void {
    this.gemIcon.setFrame(`gem.${Math.floor(time / 160) % 4}`);
    // keep the HUD anchored inside the live safe-area insets as the view
    // width / notch geometry changes (the canvas itself paints edge to edge)
    const W = VIEW.w;
    const { insetL, insetR, insetT, insetB } = VIEW;
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setPosition(insetL + 10 + i * 11, insetT + 10);
    }
    this.gemIcon.setPosition(insetL + 12, insetT + 24);
    this.gemText.setPosition(insetL + 20, insetT + 21);
    this.powerIcon.setPosition(insetL + 12, insetT + 36);
    this.powerText.setPosition(insetL + 22, insetT + 33);
    this.keyIcon.setPosition(insetL + 48, insetT + 24);
    this.keyText.setPosition(insetL + 55, insetT + 21);
    for (let i = 0; i < this.tokens.length; i++) {
      this.tokens[i].setPosition(W - insetR - 14 - i * 15, insetT + 12);
    }
    this.bossBar.setPosition(W / 2, H - 18 - insetB);
  }
}
