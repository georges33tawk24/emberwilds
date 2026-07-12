/**
 * The world-map hub (spec §8). A walkable overworld: level nodes strung along
 * a winding path over a warm, living parallax, the fox hopping between them.
 * Nodes show clear-state and ember-token progress; the map is the level select
 * and the gateway to the Grove (shop). Keyboard, gamepad, and touch navigable.
 */
import Phaser from 'phaser';
import { PLAYER_TEX } from '../systems/cosmetics';
import { PixelText } from '../gfx/text';
import { buildParallax, type ParallaxLayers, type ThemeKey } from '../gfx/parallax';
import { ParticleSystem } from '../gfx/particles';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { isMobile } from '../systems/platform';
import { SaveManager } from '../systems/save';
import { audio } from '../audio/engine';
import { LEVELS, worldOf, levelLabel } from '../data/levels';
import { fetchTop, leaderboardEnabled } from '../systems/leaderboard';
import { PixelButton } from '../gfx/ui';
import { themeOf } from '../gfx/themes';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';

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
  private headerWorld!: PixelText;
  private gemText!: PixelText;
  private prompt!: PixelText;
  private prev = { left: false, right: false, up: false, pause: false };
  private mapWidth = 0;
  private layoutW = 0;

  constructor() {
    super('WorldMap');
  }

  create(): void {
    setTouchContext('map');
    const W = VIEW.w;
    this.layoutW = W;
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
    this.fox = this.add.sprite(n0.x, n0.y - 16, PLAYER_TEX, 'idle.0').setOrigin(0.5, 1).setDepth(20);

    // fixed header + prompts
    const mobile = isMobile();
    // mobile: a deeper bar + doubled sub-lines, so the best-time and world-best
    // rows are actually readable on a phone
    const barTall = mobile ? 52 : 32;
    this.add.rectangle(W / 2, barTall / 2, W, barTall, 0x2a1f1b, 0.55).setScrollFactor(0).setDepth(30);
    this.headerTitle = new PixelText(this, 12, 7, '', { scale: 2, color: 'O', shadow: true }).setScrollFactor(0).setDepth(31);
    this.headerSub = new PixelText(this, 12, 23, '', { scale: mobile ? 2 : 1, color: 'c', shadow: true }).setScrollFactor(0).setDepth(31);
    this.headerWorld = new PixelText(this, 12, mobile ? 39 : 33, '', { scale: mobile ? 2 : 1, color: 'y', shadow: true }).setScrollFactor(0).setDepth(31);
    const lb = leaderboardEnabled();
    // the gem tally stays clear of the plaques on desktop and clear of the DOM
    // pause/fullscreen cluster (top-right, CSS-positioned) on mobile
    const gemX = mobile ? W - 195 : lb ? W - 210 : W - 150;
    this.add.image(gemX, 15, 'pickups', 'gem.0').setScrollFactor(0).setDepth(31);
    this.gemText = new PixelText(this, gemX + 8, 11, '', { scale: mobile ? 2 : 1, color: 'W', shadow: true }).setScrollFactor(0).setDepth(31);

    // carved-wood plaques, GROVE + TOP 10 side by side — top-right on desktop;
    // bottom-centre on mobile, because the DOM pause/fullscreen buttons own the
    // top-right corner and the rocker/jump clusters own the bottom corners
    const btnW = mobile ? 104 : 80;
    const btnH = mobile ? 26 : 22;
    const btnScale = mobile ? 2 : 1;
    const btnY = mobile ? H - 18 : 16;
    // the mobile pair sits 12px right of centre — the true middle of the free
    // corridor between the rocker (bottom-left) and jump (bottom-right) pads
    const groveX = mobile ? (lb ? W / 2 - 44 : W / 2) : W - 48;
    const topX = mobile ? W / 2 + 68 : W - 134;
    new PixelButton(this, groveX, btnY, {
      w: btnW, h: btnH, label: 'GROVE', scale: btnScale, face: 'green', onTap: () => this.openGrove(),
    }).setScrollFactor(0).setDepth(31);
    if (lb) {
      new PixelButton(this, topX, btnY, {
        w: btnW, h: btnH, label: 'TOP 10', scale: btnScale, face: 'wood', onTap: () => this.openLeaderboard(),
      }).setScrollFactor(0).setDepth(31);
      this.input.keyboard?.on('keydown-L', () => this.openLeaderboard());
    }

    // bottom bar — taller on mobile, where it hosts the plaques
    const barH = mobile ? 36 : 24;
    this.add.rectangle(W / 2, H - barH / 2, W, barH, 0x2a1f1b, 0.55).setScrollFactor(0).setDepth(30);
    this.prompt = new PixelText(this, W / 2, mobile ? H - 46 : H - 17,
      mobile ? 'JUMP  ENTER      II  MENU'
        : lb ? 'Z  ENTER      FIRE  THE GROVE      L  TOP 10      ESC  MENU'
          : 'Z  ENTER      FIRE  THE GROVE      ESC  MENU', {
        scale: mobile ? 2 : 1, color: 'W', align: 'center', shadow: true,
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
    const unlocked = this.save.data.levelUnlocked;
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const a = this.nodePos(i);
      const b = this.nodePos(i + 1);
      const steps = 7;
      // the road behind you is warm; the road ahead is dead rusted iron —
      // the map itself tells the story of the warmth returning
      const cleared = i < unlocked;
      for (let s = 1; s < steps; s++) {
        const tt = s / steps;
        const x = a.x + (b.x - a.x) * tt;
        const y = a.y + (b.y - a.y) * tt - Math.sin(tt * Math.PI) * 10;
        const worldA = worldOf(i);
        g.fillStyle(0x2a1f1b, 0.5);
        g.fillCircle(Math.round(x) + 1, Math.round(y) + 1, 2.2);
        if (cleared) g.fillStyle(worldA.num % 2 === 0 ? 0xb0663f : 0xb58b5e, 0.9);
        else g.fillStyle(0x5a5450, 0.7);
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
      const cleared = i < unlocked;
      // cleared beacons burn: a warm halo and a small flame above the node
      if (cleared) {
        disc.fillStyle(0xf2a03d, 0.16).fillCircle(p.x, p.y, r + 7);
        const fy = p.y - r - 6;
        disc.fillStyle(0xe8622c, 1).fillCircle(p.x, fy + 1, isBoss ? 3 : 2.4);
        disc.fillStyle(0xf2a03d, 1).fillCircle(p.x, fy - 1, isBoss ? 2 : 1.6);
      }
      // shadow
      disc.fillStyle(0x2a1f1b, 0.4).fillCircle(p.x + 2, p.y + 3, r);
      // base ring
      disc.fillStyle(0x2a1f1b, 1).fillCircle(p.x, p.y, r);
      disc.fillStyle(available ? accent : 0x3c3530, 1).fillCircle(p.x, p.y, r - 2);
      disc.fillStyle(available ? 0xe6c79a : 0x5a5450, 0.9).fillCircle(p.x - r * 0.28, p.y - r * 0.32, r * 0.42);
      if (isBoss && available) {
        disc.lineStyle(2, cleared ? 0xf2a03d : 0xc7402b, 1).strokeCircle(p.x, p.y, r + 2);
      }
      // flawless (no-hit) clear earns a small gold star on the node's shoulder
      if (cleared && this.save.data.flawless.includes(i)) {
        const mx = p.x + r * 0.82;
        const my = p.y - r * 0.82;
        disc.fillStyle(0x2a1f1b, 1).fillPoints(starPoints(mx, my + 0.5, 5, 2.2), true);
        disc.fillStyle(0xf2a03d, 1).fillPoints(starPoints(mx, my, 4.2, 1.8), true);
        disc.fillStyle(0xf7e6c4, 1).fillCircle(mx - 1, my - 1.2, 0.9);
      }

      const label = new PixelText(this, p.x, p.y - (isMobile() ? 6 : 3), '', { scale: isMobile() ? 2 : 1, color: available ? 'K' : 's', align: 'center' }).setDepth(7);
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
    // a hidden Keeper's Lantern lives here — show its little diamond slot so
    // completionists know there is a tale to hunt (lit once it's found)
    if (LEVELS[node.index].rows.some((r) => r.includes('L'))) {
      const lx = node.x + 20;
      const ly = node.y + 17;
      const found = this.save.data.relics.includes(node.index);
      const diamond = (cx: number, cy: number, r: number): Phaser.Math.Vector2[] => [
        new Phaser.Math.Vector2(cx, cy - r), new Phaser.Math.Vector2(cx + r, cy),
        new Phaser.Math.Vector2(cx, cy + r), new Phaser.Math.Vector2(cx - r, cy),
      ];
      if (found) node.pips.fillStyle(0xf2a03d, 0.18).fillCircle(lx, ly, 6);
      node.pips.fillStyle(0x2a1f1b, 0.8).fillPoints(diamond(lx + 1, ly + 1, 3.4), true);
      node.pips.fillStyle(found ? 0xf2a03d : 0x4a362b, 1).fillPoints(diamond(lx, ly, 3), true);
      if (found) node.pips.fillStyle(0xf7e6c4, 1).fillCircle(lx, ly - 0.5, 0.9);
    }
  }

  private refreshHeader(): void {
    const w = worldOf(this.sel);
    const available = this.sel <= this.save.data.levelUnlocked;
    this.headerTitle.setText(available ? LEVELS[this.sel].name.toUpperCase() : 'LOCKED');
    let sub = available ? levelLabel(this.sel) : 'CLEAR THE PATH BEHIND IT';
    const best = this.save.data.bestTimes[this.sel];
    if (available && best) {
      sub += `   BEST ${(best / 1000).toFixed(1)}s`;
      if (this.save.data.flawless.includes(this.sel)) sub += '   FLAWLESS';
    }
    this.headerSub.setText(sub);
    this.headerTitle.setColor(available ? 'O' : 'i');
    this.gemText.setText(`${this.save.data.gems}`);
    void w;

    // global best for the selected level — appears only once the worker is
    // deployed (leaderboardEnabled); the fetch is cached and race-guarded
    this.headerWorld.setText('');
    if (available && leaderboardEnabled()) {
      const forSel = this.sel;
      void fetchTop(forSel).then((entries) => {
        if (!this.scene.isActive() || this.sel !== forSel) return;
        const first = entries?.[0];
        if (first) this.headerWorld.setText(`WORLD BEST ${(first.timeMs / 1000).toFixed(1)}s - ${first.name}`);
      });
    }
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

  private openLeaderboard(): void {
    if (this.sel > this.save.data.levelUnlocked) return;
    audio.sfx('menuSelect');
    this.scene.pause();
    this.scene.launch('Leaderboard', { levelIndex: this.sel });
  }

  private openGrove(): void {
    if (this.moving) return;
    audio.sfx('menuSelect');
    this.scene.launch('Shop', { returnTo: 'WorldMap' });
    this.scene.pause();
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
    // live width change (rotation, URL-bar collapse) — rebuild the layout
    if (VIEW.w !== this.layoutW) {
      this.scene.restart();
      return;
    }
    const dt = delta / 1000;
    const W = VIEW.w;
    this.t += dt;
    const f = this.inputSys.sample();

    if (!this.moving) {
      if (f.right && !this.prev.right) this.moveSel(1);
      else if (f.left && !this.prev.left) this.moveSel(-1);
      else if ((f.up && !this.prev.up) || f.firePressed) {
        // up or FIRE (keyboard/pad) opens the Grove; touch uses the GROVE button
        this.openGrove();
      } else if (f.jumpPressed) this.enterLevel();
      else if (f.pause && !this.prev.pause) {
        // the menu button opens the MENU — going to the title lives inside it
        // (it used to warp straight to the title, which read as a bug)
        audio.sfx('pause');
        this.scene.pause();
        this.scene.launch('Pause', { from: 'map' });
      }
    }
    this.prev = { left: f.left, right: f.right, up: f.up, pause: f.pause };

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

/** Points of a 5-point star centred at (cx, cy) — the flawless medal. */
function starPoints(cx: number, cy: number, outer: number, inner: number): Phaser.Math.Vector2[] {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
}
