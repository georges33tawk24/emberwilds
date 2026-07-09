/** Diegetic, minimal HUD — hearts, gems, ember tokens. Animates every change.
 *  All layout multiplies by uiScale(): the world camera zooms in on mobile but
 *  HUD scenes don't — without this the hearts/counters are unreadably small
 *  on a phone. */
import Phaser from 'phaser';
import type { EventBus } from '../core/events';
import { PixelText } from '../gfx/text';
import { uiScale } from '../systems/platform';
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
  private barW = 180;
  private timerText: PixelText | null = null;
  private unsub: (() => void)[] = [];

  constructor() {
    super('Hud');
  }

  create(data: HudData): void {
    const W = VIEW.w;
    const ui = uiScale();
    this.hearts = [];
    this.tokens = [];
    this.unsub.forEach((u) => u());
    this.unsub = [];

    this.buildHearts(data.max, data.hearts);

    this.gemIcon = this.add.image(12 * ui, 24 * ui, 'pickups', 'gem.0').setScale(ui);
    this.gemText = new PixelText(this, 20 * ui, 21 * ui, 'x0', { scale: ui, color: 'W', shadow: true });

    // power indicator, below the gems — hidden until a transformation is held
    this.powerIcon = this.add.image(12 * ui, 36 * ui, 'pickups', 'scatter.0').setVisible(false).setScale(0.85 * ui);
    this.powerText = new PixelText(this, 22 * ui, 33 * ui, '', { scale: ui, color: 'O', shadow: true });

    // key count, next to gems — hidden until a key is held
    this.keyIcon = this.add.image(48 * ui, 24 * ui, 'pickups', 'key.0').setVisible(false).setScale(ui);
    this.keyText = new PixelText(this, 55 * ui, 21 * ui, '', { scale: ui, color: 'O', shadow: true });

    // ember tokens: top-center — the top corners belong to the touch buttons
    for (let i = 0; i < data.tokenTotal; i++) {
      const img = this.add
        .image(W / 2 + (i - (data.tokenTotal - 1) / 2) * 15 * ui, 12 * ui, 'pickups', 'token.0')
        .setScale(ui)
        .setAlpha(0.28);
      this.tokens.push(img);
    }

    // boss health bar (bottom-center), hidden until a boss spawns
    this.barW = 180 * (ui > 1 ? 1.4 : 1);
    const barH = 10 * (ui > 1 ? 1.4 : 1);
    this.bossBar = this.add.container(W / 2, H - 18 - 4 * (ui - 1)).setVisible(false);
    const frame = this.add.rectangle(0, 0, this.barW + 4, barH, 0x2a1f1b, 0.85).setStrokeStyle(1, 0x7a5a3e);
    this.bossFill = this.add.rectangle(-this.barW / 2, 0, this.barW, barH - 4, 0xc7402b).setOrigin(0, 0.5);
    const label = new PixelText(this, 0, -(barH + 2 + 4 * ui), '', { scale: ui, color: 'o', align: 'center', shadow: true });
    label.name = 'bosslabel';
    this.bossBar.add([frame, this.bossFill, label]);

    // optional speedrun timer (top-centre, under the tokens) — always built,
    // shown/hidden live from the setting so toggling in pause takes effect now
    this.timerText = new PixelText(this, W / 2, 0, '0.0', { scale: ui, color: 'W', align: 'center', shadow: true });

    const bus = data.bus;
    this.unsub.push(
      bus.on('hearts:changed', ({ hearts, max }) => {
        // the max can grow/shrink live (assist mode toggled mid-level) — rebuild
        // the heart row so the new slots actually show
        if (max !== this.hearts.length) this.buildHearts(max, hearts);
        for (let i = 0; i < this.hearts.length; i++) {
          this.hearts[i].setFrame(i < hearts ? 'heart.0' : 'heart_empty.0');
        }
        // pulse the last changed heart
        const idx = Math.max(0, Math.min(this.hearts.length - 1, hearts - 1 < 0 ? 0 : hearts - 1));
        const h = this.hearts[idx];
        this.tweens.add({ targets: h, scale: { from: 1.6 * ui, to: ui }, duration: 220 });
      }),
      bus.on('pickup:gem', ({ count }) => {
        this.gemText.setText(`x${count}`);
        this.tweens.add({ targets: this.gemIcon, scale: { from: 1.5 * ui, to: ui }, duration: 180 });
      }),
      bus.on('pickup:token', ({ index }) => {
        const img = this.tokens[index] ?? this.tokens.find((t) => t.alpha < 1);
        if (img) {
          img.setAlpha(1);
          this.tweens.add({ targets: img, scale: { from: 1.8 * ui, to: ui }, duration: 300 });
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
        this.tweens.add({ targets: this.powerIcon, scale: { from: 1.4 * ui, to: 0.85 * ui }, duration: 240 });
      }),
      bus.on('player:powerLost', () => {
        this.powerIcon.setVisible(false);
        this.powerText.setText('');
      }),
      bus.on('keys:changed', ({ keys }) => {
        this.keyIcon.setVisible(keys > 0);
        this.keyText.setText(keys > 0 ? `x${keys}` : '');
        if (keys > 0) this.tweens.add({ targets: this.keyIcon, scale: { from: 1.5 * ui, to: ui }, duration: 180 });
      }),
      bus.on('boss:spawn', ({ name, max }) => {
        this.bossMax = max;
        this.bossBar.setVisible(true);
        this.bossFill.width = this.barW;
        const label = this.bossBar.getByName('bosslabel') as PixelText;
        label?.setText(name);
      }),
      bus.on('boss:hp', ({ hp, max }) => {
        const frac = Math.max(0, hp / max);
        this.tweens.add({ targets: this.bossFill, width: this.barW * frac, duration: 200 });
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

  /** (Re)build the heart row for a given max — supports a live max change. */
  private buildHearts(max: number, hearts: number): void {
    const ui = uiScale();
    for (const h of this.hearts) h.destroy();
    this.hearts = [];
    for (let i = 0; i < max; i++) {
      this.hearts.push(
        this.add.image((10 + i * 11) * ui, 10 * ui, 'pickups', i < hearts ? 'heart.0' : 'heart_empty.0').setScale(ui),
      );
    }
  }

  update(time: number): void {
    this.gemIcon.setFrame(`gem.${Math.floor(time / 160) % 4}`);
    // keep the HUD anchored inside the live safe-area insets as the view
    // width / notch geometry changes (the canvas itself paints edge to edge)
    const W = VIEW.w;
    const ui = uiScale();
    const { insetL, insetT, insetB } = VIEW;
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setPosition(insetL + (10 + i * 11) * ui, insetT + 10 * ui);
    }
    this.gemIcon.setPosition(insetL + 12 * ui, insetT + 24 * ui);
    this.gemText.setPosition(insetL + 20 * ui, insetT + 21 * ui);
    this.powerIcon.setPosition(insetL + 12 * ui, insetT + 36 * ui);
    this.powerText.setPosition(insetL + 22 * ui, insetT + 33 * ui);
    this.keyIcon.setPosition(insetL + 48 * ui, insetT + 24 * ui);
    this.keyText.setPosition(insetL + 55 * ui, insetT + 21 * ui);
    const n = this.tokens.length;
    for (let i = 0; i < n; i++) {
      this.tokens[i].setPosition(W / 2 + (i - (n - 1) / 2) * 15 * ui, insetT + 12 * ui);
    }
    this.bossBar.setPosition(W / 2, H - 18 - 4 * (ui - 1) - insetB);

    // optional speedrun timer — reads the Game scene's clock (freezes on pause);
    // visibility is live from the setting so a pause-menu toggle applies at once
    if (this.timerText) {
      const save = this.registry.get('save') as { data: { settings: { speedrunTimer: boolean } } };
      const game = this.scene.get('Game') as unknown as {
        elapsedMs?: () => number; runTotalMs?: () => number | null; runMode?: () => string | null;
      } | null;
      // a run always shows the cumulative timer; otherwise it's the setting
      const runMs = game?.runTotalMs?.() ?? null;
      const on = runMs !== null || save.data.settings.speedrunTimer;
      this.timerText.setVisible(on);
      if (on) {
        const ms = runMs ?? game?.elapsedMs?.() ?? 0;
        this.timerText.setText(`${(ms / 1000).toFixed(1)}`);
        // gold for a timed run, red for hardcore (one life), white otherwise
        this.timerText.setColor(runMs === null ? 'W' : game?.runMode?.() === 'hardcore' ? 'R' : 'O');
        this.timerText.setPosition(W / 2, insetT + (n > 0 ? 28 : 12) * ui);
      }
    }
  }
}
