/**
 * The world-map hub (spec §8). A walkable overworld: level nodes strung along
 * a winding path over a warm, living parallax, the fox hopping between them.
 * Nodes show clear-state and ember-token progress; the map is the level select
 * and the gateway to the Grove (shop). Keyboard, gamepad, and touch navigable.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { buildParallax, type ParallaxLayers, type ThemeKey } from '../gfx/parallax';
import { ParticleSystem } from '../gfx/particles';
import { InputSystem } from '../systems/input';
import { SaveManager } from '../systems/save';
import { audio } from '../audio/engine';
import { LEVELS, worldOf, levelLabel } from '../data/levels';
import { themeOf } from '../gfx/themes';
import { TUNING } from '../data/tuning';

const W = TUNING.view.width;
const H = TUNING.view.height;

interface Node {
  index: number;
  x: number;
  y: number;
  disc: Phaser.GameObjects.Graphics;
  label: PixelText;
  pips: Phaser.GameObjects.Graphics;
}

export class WorldMapScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private save!: SaveManager;
  private parallax!: ParallaxLayers;
  private particles!: ParticleSystem;
  private nodes: Node[] = [];
  private fox!: Phaser.GameObjects.Sprite;
  private sel = 0;
  private camX = 0;
  private t = 0;
  private leafTimer = 0;
  private moving = false;
  private headerTitle!: PixelText;
  private headerSub!: PixelText;
  private gemText!: PixelText;
  private prompt!: PixelText;
  private prev = { left: false, right: false, up: false };
  private mapWidth = 0;

  constructor() {
    super('WorldMap');
  }

  create(): void {
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.nodes = [];
    this.moving = false;
    this.t = 0;
    this.sel = Math.min(this.save.data.levelUnlocked, LEVELS.length - 1);

    const firstTheme = themeOf(LEVELS[this.sel]?.theme ?? 'thornwood').key as ThemeKey;
    this.parallax = buildParallax(this, firstTheme, 'dawn', 21);
    this.particles = new ParticleSystem(this);

    this.buildPath();
    this.buildNodes();

    // fox avatar
    const n0 = this.nodes[this.sel];
    this.fox = this.add.sprite(n0.x, n0.y - 16, 'player', 'idle.0').setOrigin(0.5, 1).setDepth(20);

    // fixed header + prompts
    this.add.rectangle(W / 2, 16, W, 32, 0x2a1f1b, 0.55).setScrollFactor(0).setDepth(30);
    this.headerTitle = new PixelText(this, 12, 7, '', { scale: 2, color: 'O', shadow: true }).setScrollFactor(0).setDepth(31);
    this.headerSub = new PixelText(this, 12, 23, '', { scale: 1, color: 'c', shadow: true }).setScrollFactor(0).setDepth(31);
    this.add.image(W - 78, 15, 'pickups', 'gem.0').setScrollFactor(0).setDepth(31);
    this.gemText = new PixelText(this, W - 70, 11, '', { scale: 1, color: 'W', shadow: true }).setScrollFactor(0).setDepth(31);

    this.add.rectangle(W / 2, H - 12, W, 24, 0x2a1f1b, 0.55).setScrollFactor(0).setDepth(30);
    this.prompt = new PixelText(this, W / 2, H - 17, 'Z  ENTER      up  THE GROVE      ESC  TITLE', {
      scale: 1, color: 'W', align: 'center', shadow: true,
    }).setScrollFactor(0).setDepth(31);

    this.camX = Phaser.Math.Clamp(n0.x - W / 2, 0, Math.max(0, this.mapWidth - W));
    this.cameras.main.setScroll(Math.round(this.camX), 0);
    this.refreshHeader();
    this.cameras.main.fadeIn(300, 20, 16, 13);

    this.input.keyboard?.once('keydown', () => audio.unlock());
  }

  private nodePos(i: number): { x: number; y: number } {
    // a gentle winding path; group spacing widens slightly between worlds
    const x = 130 + i * 150;
    const y = 210 + Math.sin(i * 0.9) * 46 - Math.cos(i * 0.5) * 14;
    return { x, y };
  }

  private buildPath(): void {
    const g = this.add.graphics().setDepth(4);
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const a = this.nodePos(i);
      const b = this.nodePos(i + 1);
      const steps = 7;
      for (let s = 1; s < steps; s++) {
        const tt = s / steps;
        const x = a.x + (b.x - a.x) * tt;
        const y = a.y + (b.y - a.y) * tt - Math.sin(tt * Math.PI) * 10;
        const worldA = worldOf(i);
        g.fillStyle(0x2a1f1b, 0.5);
        g.fillCircle(Math.round(x) + 1, Math.round(y) + 1, 2.2);
        g.fillStyle(worldA.num % 2 === 0 ? 0xb0663f : 0xb58b5e, 0.9);
        g.fillCircle(Math.round(x), Math.round(y), 2.2);
      }
    }
    this.mapWidth = this.nodePos(LEVELS.length - 1).x + 130;
  }

  private buildNodes(): void {
    const unlocked = this.save.data.levelUnlocked;
    for (let i = 0; i < LEVELS.length; i++) {
      const p = this.nodePos(i);
      const isBoss = !!LEVELS[i].boss;
      const theme = themeOf(LEVELS[i].theme);
      const accent = theme.worldNum % 2 === 0 ? 0xb0663f : 0x5f7d34;
      const available = i <= unlocked;

      const disc = this.add.graphics().setDepth(6);
      const r = isBoss ? 15 : 12;
      // shadow
      disc.fillStyle(0x2a1f1b, 0.4).fillCircle(p.x + 2, p.y + 3, r);
      // base ring
      disc.fillStyle(0x2a1f1b, 1).fillCircle(p.x, p.y, r);
      disc.fillStyle(available ? accent : 0x3c3530, 1).fillCircle(p.x, p.y, r - 2);
      disc.fillStyle(available ? 0xe6c79a : 0x5a5450, 0.9).fillCircle(p.x - r * 0.28, p.y - r * 0.32, r * 0.42);
      if (isBoss && available) {
        disc.lineStyle(2, 0xc7402b, 1).strokeCircle(p.x, p.y, r + 2);
      }

      const label = new PixelText(this, p.x, p.y - 3, '', { scale: 1, color: available ? 'K' : 's', align: 'center' }).setDepth(7);
      label.setText(isBoss ? '!' : String(worldLevelNum(i)));

      const pips = this.add.graphics().setDepth(7);
      this.nodes.push({ index: i, x: p.x, y: p.y, disc, label, pips });
      this.drawPips(this.nodes[this.nodes.length - 1]);
    }
  }

  private drawPips(node: Node): void {
    node.pips.clear();
    if (LEVELS[node.index].boss) return;
    const got = this.save.tokenCount(node.index);
    for (let k = 0; k < 4; k++) {
      const px = node.x - 11 + k * 7;
      const py = node.y + 17;
      node.pips.fillStyle(0x2a1f1b, 0.8).fillCircle(px + 1, py + 1, 2.4);
      node.pips.fillStyle(k < got ? 0xf2a03d : 0x4a362b, 1).fillCircle(px, py, 2.2);
    }
  }

  private refreshHeader(): void {
    const w = worldOf(this.sel);
    const available = this.sel <= this.save.data.levelUnlocked;
    this.headerTitle.setText(available ? LEVELS[this.sel].name.toUpperCase() : 'LOCKED');
    this.headerSub.setText(available ? levelLabel(this.sel) : 'CLEAR THE PATH BEHIND IT');
    this.headerTitle.setColor(available ? 'O' : 'i');
    this.gemText.setText(`${this.save.data.gems}`);
    void w;
  }

  private moveSel(dir: -1 | 1): void {
    const target = this.sel + dir;
    if (target < 0 || target >= LEVELS.length) return;
    if (target > this.save.data.levelUnlocked) return; // can't walk past the frontier
    const from = { x: this.fox.x, y: this.nodes[this.sel].y - 16 };
    this.sel = target;
    this.moving = true;
    audio.sfx('menuMove');
    const n = this.nodes[this.sel];
    this.fox.setFlipX(dir < 0);
    this.particles.dust(this.fox.x, from.y, 3, 20);
    const proxy = { p: 0 };
    this.tweens.add({
      targets: proxy,
      p: 1,
      duration: 280,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.fox.x = Phaser.Math.Linear(from.x, n.x, proxy.p);
        const baseY = Phaser.Math.Linear(from.y, n.y - 16, proxy.p);
        this.fox.y = baseY - Math.sin(proxy.p * Math.PI) * 12; // hop arc
        this.fox.setFrame(`jump.0`);
      },
      onComplete: () => {
        this.moving = false;
        this.fox.setPosition(n.x, n.y - 16);
        this.particles.dust(n.x, n.y - 16, 3, 20);
      },
    });
    this.refreshHeader();
  }

  private enterLevel(): void {
    if (this.sel > this.save.data.levelUnlocked) {
      audio.sfx('pause');
      return;
    }
    audio.sfx('menuSelect');
    this.registry.set('lastLevel', this.sel);
    this.cameras.main.fadeOut(280, 20, 16, 13);
    this.time.delayedCall(300, () => {
      audio.stopSong();
      this.scene.start('Game', { levelIndex: this.sel });
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.t += dt;
    const f = this.inputSys.sample();

    if (!this.moving) {
      if (f.right && !this.prev.right) this.moveSel(1);
      else if (f.left && !this.prev.left) this.moveSel(-1);
      else if (f.up && !this.prev.up) {
        audio.sfx('menuSelect');
        this.scene.launch('Shop', { returnTo: 'WorldMap' });
        this.scene.pause();
      } else if (f.jumpPressed) this.enterLevel();
      else if (f.pause) {
        audio.sfx('pause');
        audio.stopSong();
        this.scene.start('Title');
      }
    }
    this.prev = { left: f.left, right: f.right, up: f.up };

    // idle fox animation + selected-node pulse
    if (!this.moving) this.fox.setFrame(`idle.${Math.floor(this.t * 5) % 4}`);
    const n = this.nodes[this.sel];
    this.cameras.main.setScroll(
      Math.round(Phaser.Math.Linear(this.cameras.main.scrollX, Phaser.Math.Clamp(n.x - W / 2, 0, Math.max(0, this.mapWidth - W)), Math.min(1, dt * 6))),
      0,
    );

    this.parallax.update(this.cameras.main.scrollX, 0);
    this.leafTimer -= dt;
    if (this.leafTimer <= 0) {
      this.particles.ambientLeaf(this.cameras.main.scrollX, 0, W, H);
      this.leafTimer = 0.5;
    }
    this.particles.update(dt);
    this.prompt.setColor(Math.floor(this.t * 2) % 2 === 0 ? 'W' : 'c');
  }
}

/** 1-based level number within its own world (for the node badge). */
function worldLevelNum(index: number): number {
  const theme = LEVELS[index].theme;
  let n = 0;
  for (let i = 0; i <= index; i++) if (LEVELS[i].theme === theme) n++;
  return n;
}
