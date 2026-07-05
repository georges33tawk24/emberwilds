/**
 * The gameplay scene: fixed 120 Hz simulation with render interpolation,
 * manual look-ahead camera, event-driven juice (hitstop, trauma shake,
 * particles, squash & stretch), and all entity interactions.
 */
import Phaser from 'phaser';
import { EventBus } from '../core/events';
import { Pool } from '../core/pool';
import { Rng } from '../core/rng';
import { STEP_MS, TUNING } from '../data/tuning';
import { TILE, POWER_PICKUPS } from '../data/levelTypes';
import { LEVELS } from '../data/levels';
import { parseLevel, TileWorld, type ParsedLevel } from '../data/levelParser';
import { PlayerSim, type InputFrame, type PowerKind, type ShotKind, type PlayerConfig } from '../entities/playerSim';
import { createEnemy, type EnemySim } from '../entities/enemySim';
import { fireProjectile, stepProjectile, type ProjectileSim } from '../entities/projectileSim';
import { BossSim } from '../entities/bossSim';
import { bodiesOverlap } from '../systems/physics';
import { InputSystem } from '../systems/input';
import { SaveManager } from '../systems/save';
import { isMobile, uiScale } from '../systems/platform';
import { setTouchContext } from '../systems/touch';
import { bakeTerrain } from '../gfx/terrain';
import { buildParallax, type ParallaxLayers, type ThemeKey } from '../gfx/parallax';
import { buildAtmosphere, type Atmosphere } from '../gfx/atmosphere';
import { ParticleSystem } from '../gfx/particles';
import { PixelText } from '../gfx/text';
import { themeOf, type WorldTheme } from '../gfx/themes';
import { levelLabel, worldOf } from '../data/levels';
import { STORY } from '../data/story';
import { earnAchievements } from '../data/achievements';
import { audio } from '../audio/engine';
import { VIEW } from '../gfx/viewport';

const H = TUNING.view.height;
const T = TUNING;

interface EnemyView {
  sim: EnemySim;
  spr: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  prevX: number;
  prevY: number;
  dying: boolean;
}

interface Projectile {
  sim: ProjectileSim;
  img: Phaser.GameObjects.Image;
  prevX: number;
  prevY: number;
}

type PickupType = '*' | 'B' | 'M' | 'W' | 'e' | 'z' | 'h' | 'j';

interface Pickup {
  type: PickupType;
  x: number;
  y: number;
  taken: boolean;
  img: Phaser.GameObjects.Image;
  tokenIndex: number;
}

const POWER_ICON: Record<string, string> = {
  W: 'scatter.0', e: 'ember_pk.0', z: 'frost_pk.0', h: 'gale_pk.0',
};

const POWER_TOAST: Record<string, string> = {
  W: 'SCATTERBURR! SHOTS NOW SPREAD',
  e: 'EMBER FLOWER! SHOTS BURN AND PIERCE',
  z: 'FROSTBLOOM! FREEZE FOES INTO PLATFORMS',
  h: 'GALE SEED! HOLD JUMP TO HOVER AND CLIMB',
};

/** Palette-code tint per power (fox glow + toast color). */
const POWER_COLOR: Record<PowerKind, string> = {
  sling: 'W', scatter: 'l', ember: 'o', frost: 'a', gale: 'y',
};

const POWER_TINT: Record<PowerKind, number> = {
  sling: 0xffffff, scatter: 0x8fa84a, ember: 0xe8622c, frost: 0xa9c6d6, gale: 0xc2c56b,
};

/** Which pickup atlas group renders a given shot kind. */
function projectileGroup(kind: ShotKind): string {
  switch (kind) {
    case 'charge': return 'charge';
    case 'ember': return 'ember_sh';
    case 'frost': return 'frost_sh';
    default: return 'pellet'; // pellet + scatter
  }
}

interface SpringPad {
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  timer: number;
}

export class GameScene extends Phaser.Scene {
  private bus!: EventBus;
  private save!: SaveManager;
  private inputSys!: InputSystem;
  private level!: ParsedLevel;
  private world!: TileWorld;
  private theme!: WorldTheme;
  private levelIndex = 0;

  private player!: PlayerSim;
  private playerSpr!: Phaser.GameObjects.Sprite;
  private pPrevX = 0;
  private pPrevY = 0;
  private animKey = 'idle';
  private animT = 0;
  private squash = 0;
  private stretch = 0;

  private enemies: EnemyView[] = [];
  private projectiles!: Pool<Projectile>;
  private pickups: Pickup[] = [];
  private springs: SpringPad[] = [];
  private crackSprites = new Map<string, Phaser.GameObjects.Image>();
  private checkpointSpr: Phaser.GameObjects.Sprite | null = null;
  private checkpointPos: { x: number; y: number } | null = null;
  private checkpointLit = false;
  private beaconSpr!: Phaser.GameObjects.Sprite;
  private beaconPos = { x: 0, y: 0 };
  private goalReached = false;

  // Mossgrave mechanics: keys/doors, switches/gates, water
  private keysHeld = 0;
  private doorSprites = new Map<string, Phaser.GameObjects.Image>();
  private gateSprites = new Map<string, Phaser.GameObjects.Image>();
  private switches: { tx: number; ty: number; spr: Phaser.GameObjects.Image; hit: boolean }[] = [];
  private gatesOpen = false;
  private waterGfx: Phaser.GameObjects.Graphics | null = null;
  private waterOverGfx: Phaser.GameObjects.Graphics | null = null;
  private waterTiles: { tx: number; ty: number; surface: boolean }[] = [];
  private wasSubmerged = false;
  private bubbleTimer = 0;
  /** true if the tile is inside a water body (region-based, not a grid tile). */
  private waterAt = (tx: number, ty: number): boolean =>
    this.level.waterSet.has(ty * this.level.width + tx);

  private bossSim: BossSim | null = null;
  private bossSpr: Phaser.GameObjects.Sprite | null = null;
  private bossPrevX = 0;
  private bossPrevY = 0;
  private bossDefeated = false;
  private hostiles: { x: number; y: number; vx: number; vy: number; life: number; prevX: number; prevY: number; img: Phaser.GameObjects.Image }[] = [];

  private parallax!: ParallaxLayers;
  private parallaxW = 0;
  private atmosphere: Atmosphere | null = null;
  private playerShadow!: Phaser.GameObjects.Image;
  private bossShadow: Phaser.GameObjects.Image | null = null;
  private particles!: ParticleSystem;
  private rng = new Rng(0xa11ce);

  private acc = 0;
  private hitstop = 0;
  private trauma = 0;
  private camX = 0;
  private camY = 0;
  /** per-platform camera zoom (FOV) and the resulting visible view size. */
  private camZoom = 1;
  private vw: number = 640;
  private vh: number = H;
  private lookAhead = 0;
  private t = 0;
  private leafTimer = 0;
  private respawnTimer = 0;
  private startTime = 0;
  private gemsCollected = 0;
  private gemChain = 0;
  private tokensGot: number[] = [];
  private ending = false;
  private damagedThisLevel = false;

  constructor() {
    super('Game');
  }

  init(data: { levelIndex?: number }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.registry.set('lastLevel', this.levelIndex);
  }

  create(): void {
    setTouchContext('game');
    this.save = this.registry.get('save') as SaveManager;
    this.bus = new EventBus();
    this.level = parseLevel(LEVELS[this.levelIndex]);
    this.world = new TileWorld(this.level);
    this.theme = themeOf(this.level.theme);
    this.inputSys = new InputSystem(this);
    this.particles = new ParticleSystem(this);
    this.parallax = buildParallax(this, this.theme.key as ThemeKey, this.level.daypart, 7 + this.levelIndex);
    this.parallaxW = VIEW.w;
    this.atmosphere = buildAtmosphere(this, this.theme.key, this.level.daypart, 5 + this.levelIndex);
    bakeTerrain(this, this.level, this.theme.tiles, `lvl${this.levelIndex}`);

    // reset per-run state (scene instances are reused on restart)
    this.enemies = [];
    this.pickups = [];
    this.springs = [];
    this.crackSprites.clear();
    this.checkpointSpr = null;
    this.checkpointPos = null;
    this.checkpointLit = false;
    this.goalReached = false;
    this.ending = false;
    this.damagedThisLevel = false;
    this.bossSim = null;
    this.bossSpr = null;
    this.bossDefeated = false;
    this.hostiles = [];
    this.keysHeld = 0;
    this.doorSprites.clear();
    this.gateSprites.clear();
    this.switches = [];
    this.gatesOpen = false;
    this.waterGfx = null;
    this.waterOverGfx = null;
    this.waterTiles = [];
    this.wasSubmerged = false;
    this.acc = 0;
    this.hitstop = 0;
    this.trauma = 0;
    this.respawnTimer = 0;
    this.gemsCollected = 0;
    this.gemChain = 0;
    this.tokensGot = [];
    this.t = 0;

    this.buildEntities();

    const start = this.level.playerStart;
    const up = this.save.data.upgrades;
    const playerConfig: PlayerConfig = {
      maxHearts: TUNING.player.hearts + up.maxHearts,
      doubleJump: up.doubleJump > 0,
      // each glide rank trims 14 px/s off the fall cap (longer, floatier glide)
      glideFallCap: Math.max(30, TUNING.glide.fallCap - up.glide * 14),
      // each charge rank shaves 130 ms off the windup
      chargeMs: Math.max(180, TUNING.weapons.charge.chargeMs - up.charge * 130),
    };
    this.player = new PlayerSim(start.x, start.y, this.world.solidAt, this.bus, playerConfig, this.waterAt);
    this.pPrevX = start.x;
    this.pPrevY = start.y;
    this.playerSpr = this.add.sprite(start.x, start.y, 'player', 'idle.0')
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.playerShadow = this.add.image(start.x, start.y, 'pickups', 'shadow.0').setDepth(3).setAlpha(0.26);

    this.projectiles = new Pool<Projectile>(
      () => ({
        sim: {
          active: false, x: 0, y: 0, vx: 0, vy: 0, charged: false,
          kind: 'pellet', damage: 1, pierce: false, freeze: false, life: 0, hitTile: false,
        },
        img: this.add.image(-100, -100, 'pickups', 'pellet.0').setVisible(false).setDepth(9),
        prevX: 0,
        prevY: 0,
      }),
      (p) => {
        p.sim.active = false;
        p.img.setVisible(false);
      },
      12,
    );

    // per-platform camera FOV: mobile pulls in closer for a comfortable read
    this.camZoom = isMobile() ? T.camera.zoomMobile : T.camera.zoomDesktop;
    this.vw = VIEW.w / this.camZoom;
    this.vh = H / this.camZoom;
    this.cameras.main.setZoom(this.camZoom);

    // scene instances are REUSED on restart — every camera accumulator must
    // re-init here or garbage (incl. NaN) survives into the next run
    this.lookAhead = 0;
    this.camX = Phaser.Math.Clamp(start.x - this.vw / 2, 0, Math.max(0, this.level.width * TILE - this.vw));
    this.camY = Phaser.Math.Clamp(start.y - this.vh * 0.62, 0, Math.max(0, this.level.height * TILE - this.vh));
    // pull scroll back by half the zoom delta — Phaser zooms around the
    // viewport center while camX/camY track the visible top-left (see renderPass)
    this.cameras.main.setScroll(
      Math.round(this.camX - (VIEW.w - this.vw) / 2),
      Math.round(this.camY - (H - this.vh) / 2),
    );

    this.wireEvents();
    this.scene.launch('Hud', { bus: this.bus, tokenTotal: 4, hearts: this.player.hearts, max: this.player.maxHearts });
    this.showIntroCard();
    this.startTime = this.time.now;

    audio.applySettings(this.save.data.settings);
    audio.playSong(this.theme.song);
    this.input.keyboard?.once('keydown', () => {
      audio.unlock();
      audio.resumePendingSong(this.theme.song);
    });
    this.cameras.main.fadeIn(250, 20, 16, 13);

    const spawnedBoss = this.bossSim as BossSim | null;
    if (spawnedBoss) {
      this.time.delayedCall(70, () =>
        this.bus.emit('boss:spawn', { name: spawnedBoss.name, hp: spawnedBoss.hp, max: spawnedBoss.maxHp }));
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('Hud');
      this.bus.clear();
    });
  }

  private buildEntities(): void {
    let tokenIndex = 0;
    for (const e of this.level.entities) {
      const px = e.tx * TILE + TILE / 2;
      const feetY = (e.ty + 1) * TILE;
      switch (e.type) {
        case 'E': case 'T': case 'O': case 'A': {
          const sim = createEnemy(e.type, px, feetY);
          if (!sim) break;
          const spr = this.add.sprite(px, feetY, this.theme.enemySheet, `${sim.kind}_${sim.anim}.0`)
            .setOrigin(0.5, 1)
            .setDepth(8);
          const shadow = this.add.image(px, feetY, 'pickups', 'shadow.0').setDepth(3).setAlpha(0.26);
          this.enemies.push({ sim, spr, shadow, prevX: px, prevY: feetY, dying: false });
          break;
        }
        case '*': case 'B': case 'M': case 'W': case 'e': case 'z': case 'h': case 'j': {
          const frame =
            e.type === '*' ? 'gem.0'
              : e.type === 'B' ? 'berry.0'
                : e.type === 'M' ? 'token.0'
                  : e.type === 'j' ? 'key.0'
                    : POWER_ICON[e.type];
          const img = this.add.image(px, feetY - TILE / 2, 'pickups', frame).setDepth(6);
          this.pickups.push({
            type: e.type as PickupType, x: px, y: feetY - TILE / 2, taken: false, img,
            tokenIndex: e.type === 'M' ? tokenIndex++ : -1,
          });
          break;
        }
        case 'n': {
          const spr = this.add.image(e.tx * TILE + TILE / 2, feetY, 'pickups', 'switch_off.0')
            .setOrigin(0.5, 1)
            .setDepth(5);
          this.switches.push({ tx: e.tx, ty: e.ty, spr, hit: false });
          break;
        }
        case 'S': {
          const img = this.add.image(px, feetY, this.theme.tileSheet, 'spring.0').setOrigin(0.5, 1).setDepth(7);
          this.springs.push({ x: px, y: feetY, img, timer: 0 });
          break;
        }
        case 'K': {
          this.checkpointSpr = this.add.sprite(px, feetY, this.theme.tileSheet, 'checkpoint_unlit.0')
            .setOrigin(0.5, 1)
            .setDepth(5);
          this.checkpointSpr.setData('pos', { x: px, y: feetY });
          break;
        }
        case 'F': {
          this.beaconSpr = this.add.sprite(px, feetY, this.theme.tileSheet, 'beacon_unlit.0')
            .setOrigin(0.5, 1)
            .setDepth(5);
          this.beaconPos = { x: px, y: feetY };
          break;
        }
        case 'Y': {
          const variant = this.level.theme === 'mossgrave' ? 'warden' : 'rustjaw';
          this.bossSim = new BossSim(px, feetY, this.world.solidAt, variant);
          this.bossSpr = this.add.sprite(px, feetY, 'boss', `${variant}_walk.0`)
            .setOrigin(0.5, 1)
            .setDepth(9);
          this.bossShadow = this.add.image(px, feetY, 'pickups', 'shadow.0').setDepth(3).setAlpha(0.3).setScale(2.4, 1.3);
          this.bossPrevX = px;
          this.bossPrevY = feetY;
          break;
        }
      }
    }

    // crack blocks, doors, gates as individual sprites (they can open/break)
    for (let ty = 0; ty < this.level.height; ty++) {
      for (let tx = 0; tx < this.level.width; tx++) {
        const ch = this.level.grid[ty][tx];
        if (ch === 'C') {
          const img = this.add.image(tx * TILE, ty * TILE, this.theme.tileSheet, 'crack.0')
            .setOrigin(0).setDepth(-9);
          this.crackSprites.set(`${tx},${ty}`, img);
        } else if (ch === 'D') {
          const img = this.add.image(tx * TILE, ty * TILE, 'pickups', 'door_locked.0')
            .setOrigin(0).setDepth(-8);
          this.doorSprites.set(`${tx},${ty}`, img);
        } else if (ch === 'H') {
          const img = this.add.image(tx * TILE, ty * TILE, 'pickups', 'gate.0')
            .setOrigin(0).setDepth(-8);
          this.gateSprites.set(`${tx},${ty}`, img);
        }
      }
    }

    // water bodies (region-based) — objects sit inside, so build from waterSet
    const wset = this.level.waterSet;
    const wd = this.level.width;
    for (const key of wset) {
      const tx = key % wd;
      const ty = Math.floor(key / wd);
      this.waterTiles.push({ tx, ty, surface: !wset.has((ty - 1) * wd + tx) });
    }
    if (this.waterTiles.length > 0) {
      // body sits behind actors (depth 4); a faint "over" film sits in front
      // of submerged actors (depth 11.5) for real depth — see renderPass.
      this.waterGfx = this.add.graphics().setDepth(4);
      this.waterOverGfx = this.add.graphics().setDepth(11.5);
      this.drawWater(0);
    }
  }

  /** Draw the translucent water body with a gently rippling, glinting surface. */
  private drawWater(t: number): void {
    const g = this.waterGfx;
    if (!g) return;
    g.clear();
    const over = this.waterOverGfx;
    if (over) over.clear();
    for (const wt of this.waterTiles) {
      const x = wt.tx * TILE;
      const y = wt.ty * TILE;
      // a faint film over submerged actors for depth
      if (over) over.fillStyle(0x3c5068, 0.16).fillRect(x, y, TILE, TILE);
      // deeper, clearly-blue body so it reads against the grey stone
      g.fillStyle(0x3c5068, 0.62).fillRect(x, y, TILE, TILE);
      g.fillStyle(0x243049, 0.28).fillRect(x, y + TILE - 5, TILE, 5);
      // drifting caustic light bands — a soft diagonal flow that reads as depth
      const flow = (x * 0.12 + y * 0.2 - t * 22) % 24;
      if (flow >= 0 && flow < 6) g.fillStyle(0x5a7088, 0.2).fillRect(x, y + 2, TILE, TILE - 4);
      const fl = Math.sin(t * 2.4 + wt.tx * 0.8 + wt.ty * 1.3);
      if (fl > 0.6) g.fillStyle(0xa9c6d6, 0.18).fillRect(x + 4, y + 5, 3, 2);
      if (fl < -0.7) g.fillStyle(0xa9c6d6, 0.14).fillRect(x + 9, y + 9, 2, 2);
      if (wt.surface) {
        // a rolling two-wave surface with a bright glint crest
        const wob = Math.sin(t * 2.4 + wt.tx * 0.7) * 1.4 + Math.sin(t * 3.7 + wt.tx * 1.9) * 0.8;
        const sy = Math.round(wob);
        g.fillStyle(0x243049, 0.55).fillRect(x, y + sy, TILE, 2);
        g.fillStyle(0xa9c6d6, 0.8).fillRect(x, y + 1 + sy, TILE, 1);
        g.fillStyle(0xdceaf0, 0.55).fillRect(x + 2 + ((Math.floor(t * 8) + wt.tx) % 6), y + sy, 4, 1);
      }
    }
  }

  private wireEvents(): void {
    const b = this.bus;
    b.on('player:jump', () => {
      audio.sfx('jump');
      this.particles.dust(this.player.x, this.player.y, 3, 20);
      this.stretch = 0.14;
      this.save.bumpStat('jumps');
    });
    b.on('player:land', ({ impact }) => {
      audio.sfx('land');
      const n = impact > 500 ? 6 : 3;
      this.particles.dust(this.player.x, this.player.y, n, 34);
      this.squash = 0.16;
      if (impact > 600) this.addTrauma(0.15);
    });
    b.on('player:stomp', () => {
      audio.sfx('stomp');
      this.addHitstop(T.feel.hitstopMs.stomp);
      this.addTrauma(T.feel.traumaStomp);
      this.save.bumpStat('stomps');
    });
    b.on('player:pound', ({ x, y }) => {
      audio.sfx('pound');
      this.addHitstop(T.feel.hitstopMs.pound);
      this.addTrauma(T.feel.traumaPound);
      this.particles.dust(x, y, 10, 60);
      this.squash = 0.2;
    });
    b.on('player:shoot', ({ charged }) => audio.sfx(charged ? 'charge' : 'shoot'));
    b.on('player:walljump', () => {
      audio.sfx('walljump');
      this.particles.dust(this.player.x, this.player.y - 8, 3, 24);
    });
    b.on('player:spring', () => audio.sfx('spring'));
    b.on('player:hurt', () => {
      audio.sfx('hurt');
      this.addHitstop(T.feel.hitstopMs.hurt);
      this.addTrauma(T.feel.traumaHurt);
      this.flashVignette();
      this.damagedThisLevel = true; // disqualifies the no-hit clear
    });
    b.on('player:died', () => {
      audio.sfx('die');
      this.respawnTimer = 1.1;
      this.damagedThisLevel = true;
      this.save.bumpStat('deaths');
      this.save.save(); // deaths are infrequent — persist immediately
    });
    b.on('enemy:died', ({ x, y }) => {
      audio.sfx('enemyDie');
      this.addHitstop(T.feel.hitstopMs.enemyDie);
      this.particles.sparks(x, y - 6, 4);
      this.particles.leafBurst(x, y - 6, 4);
      this.save.bumpStat('enemiesDefeated');
    });
    b.on('pickup:gem', () => audio.sfx('gem'));
    b.on('pickup:berry', () => audio.sfx('berry'));
    b.on('pickup:token', () => audio.sfx('token'));
    b.on('checkpoint', ({ x, y }) => {
      audio.sfx('checkpoint');
      this.particles.sparks(x, y - 16, 6);
    });
    b.on('block:break', ({ tx, ty }) => {
      audio.sfx('break');
      const img = this.crackSprites.get(`${tx},${ty}`);
      img?.destroy();
      this.crackSprites.delete(`${tx},${ty}`);
      this.particles.dust(tx * TILE + 8, ty * TILE + 8, 6, 50);
      this.particles.sparks(tx * TILE + 8, ty * TILE + 8, 3);
    });
  }

  private showIntroCard(): void {
    // first steps into a new world get the full storybook interstitial
    const w = worldOf(this.levelIndex);
    if (!this.save.data.worldsSeen.includes(w.num)) {
      this.save.data.worldsSeen.push(w.num);
      this.save.save();
      this.showWorldCard(w.label, w.num);
      return;
    }
    const W = VIEW.w;
    const ui = uiScale();
    const cy = H / 2 - 40;
    const barH = ui > 1 ? 52 : 34;
    const card = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // banner bar + two amber rules that wipe in from the centre
    const bg = this.add.rectangle(W / 2, cy, W, barH, 0x2a1f1b, 0.86).setScale(0, 1);
    const ruleTop = this.add.rectangle(W / 2, cy - barH / 2, W, 2, 0xf2a03d, 0.9).setScale(0, 1);
    const ruleBot = this.add.rectangle(W / 2, cy + barH / 2, W, 2, 0xf2a03d, 0.9).setScale(0, 1);
    const name = new PixelText(this, W / 2, cy - 8, this.level.name.toUpperCase(), {
      scale: ui > 1 ? 3 : 2, color: 'O', align: 'center', shadow: true,
    }).setAlpha(0);
    const sub = new PixelText(this, W / 2, cy + 10, levelLabel(this.levelIndex), {
      scale: ui, color: 'c', align: 'center',
    }).setAlpha(0);
    card.add([bg, ruleTop, ruleBot, name, sub]);

    // entrance: bar wipes open, rules sweep, text rises in staggered
    this.tweens.add({ targets: bg, scaleX: 1, duration: 340, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: [ruleTop, ruleBot], scaleX: 1, delay: 70, duration: 440, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: name, alpha: 1, y: { from: cy - 14, to: cy - 8 }, delay: 200, duration: 300, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: sub, alpha: 1, delay: 360, duration: 300 });
    // exit: text fades, bar wipes shut
    this.tweens.add({ targets: [name, sub], alpha: 0, delay: 1550, duration: 240 });
    this.tweens.add({
      targets: [bg, ruleTop, ruleBot],
      scaleX: 0, delay: 1700, duration: 300, ease: 'Cubic.easeIn',
      onComplete: () => card.destroy(),
    });
  }

  /** One-shot world-entry interstitial: WORLD N, its name, its story lines. */
  private showWorldCard(label: string, num: number): void {
    const W = VIEW.w;
    const ui = uiScale();
    const lines = STORY.worldEntry[this.level.theme] ?? [];
    const card = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    const dim = this.add.rectangle(W / 2, H / 2, W + 4, H + 4, 0x14100d, 0.5);
    const bgH = ui > 1 ? 132 : 92;
    const bg = this.add.rectangle(W / 2, H / 2 - 30, W, bgH, 0x2a1f1b, 0.94);
    const rule = this.add.rectangle(W / 2, H / 2 - 30, W, bgH).setStrokeStyle(1, 0x7a5a3e);
    const kicker = new PixelText(this, W / 2, H / 2 - (ui > 1 ? 86 : 68), `WORLD ${num}`, {
      scale: ui, color: 'y', align: 'center', shadow: true,
    });
    const name = new PixelText(this, W / 2, H / 2 - (ui > 1 ? 72 : 56), label, {
      scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true,
    });
    const parts: Phaser.GameObjects.GameObject[] = [dim, bg, rule, kicker, name];
    lines.forEach((text, i) => {
      parts.push(new PixelText(this, W / 2, H / 2 - (ui > 1 ? 30 : 24) + i * 12 * ui, text, { scale: ui, color: 'c', align: 'center' }));
    });
    const sub = new PixelText(this, W / 2, H / 2 + (ui > 1 ? 22 : 4), this.level.name.toUpperCase(), {
      scale: ui, color: 't', align: 'center',
    });
    parts.push(sub);
    card.add(parts);
    card.setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, duration: 350 });
    this.tweens.add({
      targets: card,
      alpha: 0,
      delay: 3000,
      duration: 500,
      onComplete: () => card.destroy(),
    });
  }

  private addHitstop(ms: number): void {
    if (this.save.data.settings.flashReduction) ms *= 0.5;
    this.hitstop = Math.max(this.hitstop, ms);
  }

  private addTrauma(n: number): void {
    if (!this.save.data.settings.screenShake) return;
    this.trauma = Math.min(1, this.trauma + n);
  }

  private flashVignette(): void {
    if (this.save.data.settings.flashReduction) return;
    const W = VIEW.w;
    const r = this.add.rectangle(W / 2, H / 2, W, H, 0xc7402b, 0.22).setScrollFactor(0).setDepth(90);
    this.tweens.add({ targets: r, alpha: 0, duration: 220, onComplete: () => r.destroy() });
  }

  // ------------------------------------------------------------ main loop

  update(_time: number, delta: number): void {
    // a NaN/∞ delta (browser hiccup, tab wake) must never enter the sim or the
    // camera accumulators — one bad frame would poison them permanently
    const dt = Number.isFinite(delta) ? Math.min(delta, 100) : STEP_MS;

    if (this.hitstop > 0) {
      this.hitstop -= delta;
      this.renderPass(dt / 1000, 1);
      return;
    }

    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 8) {
      this.fixedStep();
      this.acc -= STEP_MS;
      steps++;
    }
    if (steps === 8) this.acc = 0; // throttled tab — drop the backlog, stay deterministic

    this.renderPass(dt / 1000, this.acc / STEP_MS);
  }

  private fixedStep(): void {
    const frame = this.inputSys.sample();

    if (frame.pause && !this.ending) {
      audio.sfx('pause');
      this.scene.launch('Pause', { from: 'Game' });
      this.scene.pause();
      return;
    }

    // record previous positions for interpolation
    this.pPrevX = this.player.x;
    this.pPrevY = this.player.y;
    for (const e of this.enemies) {
      e.prevX = e.sim.body.x;
      e.prevY = e.sim.body.y;
    }
    for (const p of this.projectiles.active) {
      p.prevX = p.sim.x;
      p.prevY = p.sim.y;
    }
    if (this.bossSim) {
      this.bossPrevX = this.bossSim.body.x;
      this.bossPrevY = this.bossSim.body.y;
    }

    const input: InputFrame = this.ending
      ? { ...frame, left: false, right: false, up: false, down: false, jumpHeld: false, jumpPressed: false, fireHeld: false, firePressed: false, poundPressed: false }
      : frame;

    this.player.step(input);
    if (this.player.airJumped) {
      // a ring of leaves under the mid-air kick, the Twinleaf flourish
      this.particles.leafBurst(this.player.x, this.player.y - 6, 6);
      this.particles.dust(this.player.x, this.player.y, 4, 36);
    }
    this.drainShots();
    this.stepProjectiles();
    this.stepEnemies();
    this.stepBoss(frame.jumpHeld);
    this.handlePoundShockwave();
    this.handlePlayerEnemyContact(frame.jumpHeld);
    this.player.checkSpikes();
    this.handlePickups();
    this.handleSprings();
    this.handleDoors();
    this.handleSwitchContact(frame.jumpHeld);
    this.handleWater();
    this.handleCheckpointAndGoal();
    this.handleDeath();
  }

  /** Stomping onto a switch flips it (shooting it is handled in stepProjectiles). */
  private handleSwitchContact(jumpHeld: boolean): void {
    if (this.switches.length === 0) return;
    for (const sw of this.switches) {
      if (sw.hit) continue;
      const sx = sw.tx * TILE + TILE / 2;
      const sy = sw.ty * TILE + TILE;
      if (Math.abs(this.player.x - sx) < 12 && this.player.y > sy - 16 && this.player.y <= sy + 2 && this.player.vy >= 0) {
        this.hitSwitch(sw);
        this.player.stompBounce(jumpHeld);
      }
    }
  }

  private stepBoss(jumpHeld: boolean): void {
    if (!this.bossSim) return;
    const boss = this.bossSim;
    if (boss.alive) {
      boss.step(this.player.x, this.player.y);
      if (boss.slammed) {
        this.addTrauma(0.4);
        this.addHitstop(60);
        this.particles.dust(boss.body.x, boss.body.y, 8, 60);
        this.bus.emit('boss:stunned', { x: boss.body.x, y: boss.coreY });
      }
      // spawn any hostile shots the boss fired this step
      for (const s of boss.shots) this.spawnHostile(s.x, s.y, s.vx, s.vy);

      // player vs boss body
      if (this.player.state !== 'dead' && this.player.state !== 'goal' &&
          boss.overlaps(this.player.x, this.player.y, this.player.body.w, this.player.body.h)) {
        const stompingCore =
          this.player.vy > 0 && this.player.y - boss.coreY < 12;
        if (boss.damageable && stompingCore) {
          const died = boss.hitCore(1);
          this.player.stompBounce(jumpHeld);
          this.onBossHit(boss, died);
        } else if (boss.damageable) {
          // touching a stunned boss from the side is safe (it's inert)
        } else {
          this.player.hurt(boss.body.x);
        }
      }
    }
    this.stepHostiles();
  }

  private onBossHit(boss: BossSim, died: boolean): void {
    this.particles.sparks(boss.body.x, boss.coreY, 8);
    this.addHitstop(90);
    this.bus.emit('boss:hit', { x: boss.body.x, y: boss.coreY });
    this.bus.emit('boss:hp', { hp: boss.hp, max: boss.maxHp });
    audio.sfx('enemyDie');
    if (died) this.onBossDefeated(boss);
  }

  private onBossDefeated(boss: BossSim): void {
    if (this.bossDefeated) return;
    this.bossDefeated = true;
    this.bus.emit('boss:died', { x: boss.body.x, y: boss.coreY });
    audio.sfx('goal');
    this.addTrauma(0.7);
    // a cascade of explosions, then the warm payoff + clear
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 130, () => {
        const ox = boss.body.x + (i % 2 === 0 ? -1 : 1) * (6 + i * 3);
        this.particles.sparks(ox, boss.body.y - 8 - i * 2, 6);
        this.particles.dust(ox, boss.body.y - 6, 5, 50);
        this.addTrauma(0.25);
      });
    }
    this.cameras.main.flash(600, 242, 160, 61); // warmth floods back (golden)
    this.time.delayedCall(900, () => {
      this.bossSpr?.setVisible(false);
      this.bossShadow?.setVisible(false);
      this.triggerClear();
    });
  }

  private spawnHostile(x: number, y: number, vx: number, vy: number): void {
    const img = this.add.image(x, y, 'pickups', 'ember_sh.0').setDepth(9).setTint(0xb0663f);
    this.hostiles.push({ x, y, vx, vy, life: 3.2, prevX: x, prevY: y, img });
  }

  private stepHostiles(): void {
    const dead: number[] = [];
    for (let i = 0; i < this.hostiles.length; i++) {
      const h = this.hostiles[i];
      h.prevX = h.x;
      h.prevY = h.y;
      h.vy += 260 * STEP_MS / 1000; // gentle gravity so shots arc
      h.x += h.vx * STEP_MS / 1000;
      h.y += h.vy * STEP_MS / 1000;
      h.life -= STEP_MS / 1000;
      const tileSolid = this.world.solidAt(Math.floor(h.x / TILE), Math.floor(h.y / TILE));
      if (h.life <= 0 || tileSolid === 'solid' || tileSolid === 'crack') {
        this.particles.sparks(h.x, h.y, 2);
        dead.push(i);
        continue;
      }
      if (this.player.state !== 'dead' && this.player.state !== 'goal' &&
          Math.abs(h.x - this.player.x) < 8 &&
          h.y > this.player.y - this.player.body.h && h.y < this.player.y + 2) {
        this.player.hurt(h.x);
        dead.push(i);
      }
    }
    for (let i = dead.length - 1; i >= 0; i--) {
      this.hostiles[dead[i]].img.destroy();
      this.hostiles.splice(dead[i], 1);
    }
  }

  private drainShots(): void {
    for (const s of this.player.shots) {
      const p = this.projectiles.obtain();
      fireProjectile(p.sim, s.x, s.y, s.dirX, s.dirY, s.charged, s.kind);
      p.prevX = s.x;
      p.prevY = s.y;
      p.img.setVisible(true)
        .setTexture('pickups', `${projectileGroup(p.sim.kind)}.0`)
        .setPosition(s.x, s.y);
    }
  }

  private stepProjectiles(): void {
    const toRelease: Projectile[] = [];
    for (const p of this.projectiles.active) {
      stepProjectile(p.sim, this.world.solidAt);
      if (p.sim.hitTile) {
        this.particles.sparks(p.sim.x, p.sim.y, 3);
      }
      if (!p.sim.active) {
        toRelease.push(p);
        continue;
      }
      // vs enemies
      for (const e of this.enemies) {
        if (!e.sim.alive || e.sim.flatTimer > 0) continue;
        if (e.sim.frozen > 0) continue; // frozen blocks absorb nothing; shoot past
        const b = e.sim.body;
        if (
          p.sim.x > b.x - b.w / 2 - 2 && p.sim.x < b.x + b.w / 2 + 2 &&
          p.sim.y > b.y - b.h - 2 && p.sim.y < b.y + 2
        ) {
          if (p.sim.freeze && e.sim.frozen <= 0) {
            e.sim.freeze();
            this.particles.sparks(b.x, b.y - b.h / 2, 6);
          }
          const died = e.sim.damage(p.sim.damage);
          this.bus.emit('enemy:hurt', { x: b.x, y: b.y });
          this.particles.sparks(p.sim.x, p.sim.y, 3);
          if (p.sim.kind === 'ember') this.particles.dust(p.sim.x, p.sim.y - 4, 2, 20);
          e.spr.setTint(p.sim.kind === 'frost' ? 0xa9c6d6 : 0xf7e6c4);
          this.time.delayedCall(60, () => e.spr.clearTint());
          if (died) this.bus.emit('enemy:died', { x: b.x, y: b.y, kind: e.sim.kind });
          if (!p.sim.pierce) {
            p.sim.active = false;
            toRelease.push(p);
          }
          break;
        }
      }
      // vs switches (a shot flips them)
      if (p.sim.active && this.switches.length > 0) {
        for (const sw of this.switches) {
          if (sw.hit) continue;
          const sx = sw.tx * TILE + TILE / 2;
          const sy = sw.ty * TILE + TILE / 2;
          if (Math.abs(p.sim.x - sx) < 9 && Math.abs(p.sim.y - sy) < 9) {
            this.hitSwitch(sw);
            if (!p.sim.pierce) { p.sim.active = false; toRelease.push(p); }
            break;
          }
        }
      }
      // vs boss core (only lands while stunned)
      if (p.sim.active && this.bossSim && this.bossSim.alive && this.bossSim.damageable) {
        const boss = this.bossSim;
        if (
          p.sim.x > boss.body.x - boss.body.w / 2 - 2 && p.sim.x < boss.body.x + boss.body.w / 2 + 2 &&
          p.sim.y > boss.coreY - 4 && p.sim.y < boss.coreY + 10
        ) {
          const died = boss.hitCore(p.sim.damage);
          this.onBossHit(boss, died);
          if (!p.sim.pierce) {
            p.sim.active = false;
            toRelease.push(p);
          }
        }
      }
    }
    for (const p of toRelease) this.projectiles.release(p);
  }

  private stepEnemies(): void {
    const margin = 340;
    for (const e of this.enemies) {
      if (!e.sim.alive) continue;
      const dx = Math.abs(e.sim.body.x - (this.camX + this.vw / 2));
      if (dx > this.vw / 2 + margin) continue; // culled: off-screen + margin
      e.sim.step(this.player.x, this.player.y, this.world.solidAt);
    }
  }

  private handlePoundShockwave(): void {
    if (!this.player.poundLanded) return;
    const px = this.player.x;
    const feetTy = Math.floor((this.player.y + 1) / TILE);
    const r = T.pound.radius;
    // break crack tiles under the shockwave
    for (let tx = Math.floor((px - r) / TILE); tx <= Math.floor((px + r) / TILE); tx++) {
      for (const ty of [feetTy, feetTy + 1]) {
        if (this.world.charAt(tx, ty) === 'C') {
          this.world.breakCrack(tx, ty);
          this.bus.emit('block:break', { tx, ty });
        }
      }
    }
    // stun nearby grounded enemies; shatter frozen ones outright
    for (const e of this.enemies) {
      if (!e.sim.alive) continue;
      const b = e.sim.body;
      if (Math.abs(b.x - px) < r * 2 && Math.abs(b.y - this.player.y) < r) {
        if (e.sim.frozen > 0) {
          e.sim.damage(999);
          this.bus.emit('enemy:died', { x: b.x, y: b.y, kind: e.sim.kind });
        } else {
          e.sim.stun = T.pound.stunS;
        }
      }
    }
  }

  private handlePlayerEnemyContact(jumpHeld: boolean): void {
    if (this.player.state === 'dead' || this.player.state === 'goal') return;
    for (const e of this.enemies) {
      if (!e.sim.alive || e.sim.flatTimer > 0) continue;
      if (!bodiesOverlap(this.player.body, e.sim.body)) continue;
      const enemyTop = e.sim.body.y - e.sim.body.h;
      // Frozen enemies are inert ice blocks: land on top and stand, like a
      // temporary platform (the Frostbloom platforming interplay).
      if (e.sim.frozen > 0) {
        if (this.player.vy >= 0 && this.player.y - enemyTop < 10) {
          this.player.body.y = enemyTop;
          this.player.body.vy = 0;
          this.player.onGround = true;
        }
        continue;
      }
      const stomping = this.player.vy > 0 && this.player.y - enemyTop < 9;
      if (stomping && e.sim.stompable) {
        if (e.sim.kind === 'beetle') {
          e.sim.squash();
        } else {
          e.sim.damage(999);
          this.bus.emit('enemy:died', { x: e.sim.body.x, y: e.sim.body.y, kind: e.sim.kind });
        }
        this.player.stompBounce(jumpHeld);
        this.particles.dust(e.sim.body.x, enemyTop, 4, 30);
      } else if (e.sim.stun > 0) {
        // stunned enemies are safe to touch
      } else {
        this.player.hurt(e.sim.body.x);
      }
    }
  }

  private handlePickups(): void {
    if (this.player.state === 'dead') return;
    const px = this.player.x;
    const py = this.player.y;
    for (const p of this.pickups) {
      if (p.taken) continue;
      if (Math.abs(p.x - px) > 14 || Math.abs(p.y - (py - 9)) > 16) continue;
      p.taken = true;
      switch (p.type) {
        case '*': {
          this.gemsCollected++;
          this.gemChain++;
          this.bus.emit('pickup:gem', { count: this.gemsCollected, chain: this.gemChain });
          this.particles.gemPop(p.x, p.y);
          break;
        }
        case 'B': {
          this.player.heal(1);
          this.bus.emit('pickup:berry', { hearts: this.player.hearts });
          this.particles.sparks(p.x, p.y, 4);
          break;
        }
        case 'M': {
          this.tokensGot.push(p.tokenIndex);
          this.save.collectToken(this.levelIndex, p.tokenIndex);
          this.bus.emit('pickup:token', { index: p.tokenIndex });
          this.particles.sparks(p.x, p.y, 8);
          break;
        }
        case 'j': {
          this.keysHeld += 1;
          this.bus.emit('keys:changed', { keys: this.keysHeld });
          audio.sfx('checkpoint');
          this.particles.sparks(p.x, p.y, 8);
          break;
        }
        case 'W': case 'e': case 'z': case 'h': {
          const power = POWER_PICKUPS[p.type] as PowerKind;
          this.player.setPower(power);
          audio.sfx('token');
          this.particles.sparks(p.x, p.y, 12);
          const label = POWER_TOAST[p.type];
          const toast = new PixelText(this, VIEW.w / 2, H / 2 - 60, label, {
            scale: 1, color: POWER_COLOR[power], align: 'center', shadow: true,
          }).setScrollFactor(0).setDepth(95);
          this.tweens.add({
            targets: toast, alpha: 0, delay: 1700, duration: 350,
            onComplete: () => toast.destroy(),
          });
          break;
        }
      }
      // arc the sprite up and fade — "coins arc into the HUD" feel
      this.tweens.add({
        targets: p.img,
        y: p.y - 14,
        alpha: 0,
        scale: p.type === 'M' ? 1.6 : 1.2,
        duration: 240,
        onComplete: () => p.img.setVisible(false),
      });
    }
  }

  private handleSprings(): void {
    if (this.player.vy < 0) return;
    for (const s of this.springs) {
      if (Math.abs(this.player.x - s.x) < 11 && Math.abs(this.player.y - (s.y - 4)) < 7) {
        this.player.springLaunch();
        s.timer = 0.18;
        this.particles.dust(s.x, s.y, 4, 26);
      }
    }
  }

  /** Open a locked door the player is pressed against, spending one key. */
  private handleDoors(): void {
    if (this.doorSprites.size === 0 || this.keysHeld <= 0) return;
    const b = this.player.body;
    const c0 = Math.floor((b.x - b.w / 2 - 1) / TILE);
    const c1 = Math.floor((b.x + b.w / 2 + 1) / TILE);
    const r0 = Math.floor((b.y - b.h) / TILE);
    const r1 = Math.floor((b.y - 1) / TILE);
    for (let ty = r0; ty <= r1; ty++) {
      for (let tx = c0; tx <= c1; tx++) {
        if (this.world.charAt(tx, ty) !== 'D') continue;
        // open the whole contiguous vertical door column
        this.keysHeld -= 1;
        this.bus.emit('keys:changed', { keys: this.keysHeld });
        for (let y = ty; this.world.charAt(tx, y) === 'D'; y++) this.openDoorTile(tx, y);
        for (let y = ty - 1; this.world.charAt(tx, y) === 'D'; y--) this.openDoorTile(tx, y);
        audio.sfx('break');
        this.addTrauma(0.12);
        return;
      }
    }
  }

  private openDoorTile(tx: number, ty: number): void {
    this.world.openTile(tx, ty);
    const key = `${tx},${ty}`;
    const spr = this.doorSprites.get(key);
    if (spr) {
      this.particles.dust(tx * TILE + 8, ty * TILE + 8, 5, 44);
      this.tweens.add({ targets: spr, alpha: 0, y: spr.y + 6, duration: 260, onComplete: () => spr.destroy() });
      this.doorSprites.delete(key);
    }
  }

  /** Strike a switch (by shot or stomp) → open every gate in the level. */
  private hitSwitch(sw: { tx: number; ty: number; spr: Phaser.GameObjects.Image; hit: boolean }): void {
    if (sw.hit) return;
    sw.hit = true;
    sw.spr.setTexture('pickups', 'switch_on.0');
    audio.sfx('spring');
    this.particles.sparks(sw.tx * TILE + 8, sw.ty * TILE + 6, 8);
    this.openAllGates();
  }

  private openAllGates(): void {
    if (this.gatesOpen) return;
    this.gatesOpen = true;
    this.addTrauma(0.18);
    for (const [key, spr] of this.gateSprites) {
      const [tx, ty] = key.split(',').map(Number);
      this.world.openTile(tx, ty);
      this.particles.dust(tx * TILE + 8, ty * TILE + 4, 3, 30);
      this.tweens.add({ targets: spr, alpha: 0, scaleY: 0.1, duration: 280, onComplete: () => spr.destroy() });
    }
    this.gateSprites.clear();
    audio.sfx('checkpoint');
  }

  /** Splash + bubble FX on entering/leaving water. */
  private handleWater(): void {
    const sub = this.player.submerged;
    if (sub !== this.wasSubmerged) {
      // splash at the actual water surface above the player's column
      const tx = Math.floor(this.player.x / TILE);
      let topTy = Math.floor(this.player.y / TILE);
      while (this.waterAt(tx, topTy - 1)) topTy--;
      const surfaceY = topTy * TILE;
      this.particles.dust(this.player.x, surfaceY, sub ? 9 : 6, 70);
      this.particles.sparks(this.player.x, surfaceY, 5);
      audio.sfx(sub ? 'land' : 'spring');
      this.wasSubmerged = sub;
    }
    if (sub) {
      // stroke kicks + a slow trickle of rising bubbles
      if (this.player.stroked) this.particles.dust(this.player.x, this.player.y - 4, 3, 22);
      this.bubbleTimer -= STEP_MS / 1000;
      if (this.bubbleTimer <= 0) {
        this.bubbleTimer = 0.32;
        this.particles.bubble(this.player.x + this.rng.range(-4, 4), this.player.y - this.player.body.h * 0.5);
      }
    }
  }

  private handleCheckpointAndGoal(): void {
    if (this.checkpointSpr && !this.checkpointLit) {
      const pos = this.checkpointSpr.getData('pos') as { x: number; y: number };
      if (Math.abs(this.player.x - pos.x) < 12 && Math.abs(this.player.y - pos.y) < 26) {
        this.checkpointLit = true;
        this.checkpointPos = pos;
        this.bus.emit('checkpoint', pos);
      }
    }
    // in a boss level, the beacon only lights once the boss is down
    if (this.level.boss && this.bossSim && this.bossSim.alive) return;
    if (!this.goalReached && this.beaconSpr) {
      if (Math.abs(this.player.x - this.beaconPos.x) < 14 && Math.abs(this.player.y - this.beaconPos.y) < 34) {
        this.triggerClear();
      }
    }
  }

  private triggerClear(): void {
    if (this.goalReached) return;
    this.goalReached = true;
    this.ending = true;
    this.player.enterGoal();
    audio.sfx('goal');
    this.addTrauma(0.28);

    // the beacon relights — warmth floods back (the level's golden payoff)
    const bx = this.beaconPos.x;
    const by = this.beaconPos.y - 20;
    if (!this.save.data.settings.flashReduction) this.cameras.main.flash(420, 242, 176, 80);
    // an expanding warmth ring
    const ring = this.add.circle(bx, by, 24, 0xf2a03d, 0).setStrokeStyle(3, 0xf2a03d, 0.85).setDepth(11).setScale(0.12);
    this.tweens.add({ targets: ring, scale: 4.5, alpha: 0, duration: 800, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    // a rising ember fountain, in three quick beats
    this.particles.sparks(bx, by, 14);
    this.particles.leafBurst(bx, by, 8);
    this.time.delayedCall(140, () => this.particles.sparks(bx, by - 6, 10));
    this.time.delayedCall(300, () => { this.particles.sparks(bx, by - 12, 8); this.particles.gemPop(bx, by - 4); });

    const timeMs = this.time.now - this.startTime;

    // record lifetime stats, then earn any achievements the clear unlocked
    this.save.bumpStat('gemsAllTime', this.gemsCollected);
    this.save.bumpStat('levelsCleared');
    this.save.bumpStat('playtimeMs', timeMs);
    if (!this.damagedThisLevel) {
      this.save.bumpStat('perfectClears');
      if (!this.save.data.flawless.includes(this.levelIndex)) this.save.data.flawless.push(this.levelIndex);
    }
    if (this.level.boss) this.save.bumpStat('bossesDefeated');
    this.save.clearLevel(this.levelIndex, timeMs, this.gemsCollected); // persists
    const earned = earnAchievements(this.save.data);
    if (earned.length) this.save.save();

    this.time.delayedCall(1500, () => {
      this.scene.launch('Clear', {
        levelIndex: this.levelIndex,
        timeMs,
        gems: this.gemsCollected,
        gemTotal: this.level.gemTotal,
        tokens: this.save.tokenCount(this.levelIndex),
        name: this.level.name,
        achievements: earned.map((a) => a.name),
      });
      this.scene.pause();
    });
  }

  private handleDeath(): void {
    // fell out of the world
    if (this.player.state !== 'dead' && this.player.y > (this.level.height + 2) * TILE) {
      this.player.kill();
    }
    if (this.player.state === 'dead' && this.respawnTimer > 0) {
      this.respawnTimer -= STEP_MS / 1000;
      if (this.respawnTimer <= 0) {
        const rp = this.checkpointPos ?? { x: this.level.playerStart.x, y: this.level.playerStart.y };
        this.gemChain = 0;
        this.player.respawnAt(rp.x, rp.y);
        this.pPrevX = rp.x;
        this.pPrevY = rp.y;
        this.camX = Phaser.Math.Clamp(rp.x - this.vw / 2, 0, Math.max(0, this.level.width * TILE - this.vw));
        this.camY = Phaser.Math.Clamp(rp.y - this.vh * 0.62, 0, Math.max(0, this.level.height * TILE - this.vh));
        this.cameras.main.flash(180, 42, 31, 27);
      }
    }
  }

  /** Contact shadow: pin it to the first floor under the actor's feet,
   *  fading and narrowing with height so nothing ever floats (art bible). */
  private updateShadow(img: Phaser.GameObjects.Image, x: number, feetY: number, baseScaleX = 1, baseAlpha = 0.26): void {
    const tx = Math.floor(x / TILE);
    const feetTy = Math.floor((feetY - 1) / TILE);
    if (this.waterAt(tx, feetTy)) {
      img.setVisible(false); // swimmers cast no contact shadow
      return;
    }
    for (let d = 0; d <= 5; d++) {
      const sol = this.world.solidAt(tx, feetTy + 1 + d);
      if (sol === 'water' || this.waterAt(tx, feetTy + 1 + d)) break;
      if (sol !== 'empty') {
        const top = (feetTy + 1 + d) * TILE;
        const dist = Math.max(0, (top - feetY) / TILE);
        if (dist > 4.5) break;
        img
          .setVisible(true)
          .setPosition(Math.round(x), top + 1)
          .setAlpha(baseAlpha * (1 - dist / 5.5))
          .setScale(baseScaleX * (1 - dist * 0.11), 1);
        return;
      }
    }
    img.setVisible(false);
  }

  // -------------------------------------------------------------- render

  private renderPass(dt: number, alpha: number): void {
    this.t += dt;
    // keep the visible view size current if the window/orientation changed
    this.vw = VIEW.w / this.camZoom;
    this.vh = H / this.camZoom;
    // parallax layers are tileSprites sized to VIEW.w at build time — rebuild
    // them when a rotation / URL-bar collapse changes the internal width
    if (VIEW.w !== this.parallaxW) {
      this.parallaxW = VIEW.w;
      this.parallax.destroy();
      this.parallax = buildParallax(this, this.theme.key as ThemeKey, this.level.daypart, 7 + this.levelIndex);
      this.atmosphere?.destroy();
      this.atmosphere = buildAtmosphere(this, this.theme.key, this.level.daypart, 5 + this.levelIndex);
    }
    const lerp = (a: number, b: number) => a + (b - a) * Math.min(alpha, 1);

    // player sprite: interpolate, animate, squash & stretch, i-frame flicker
    const px = lerp(this.pPrevX, this.player.x);
    const py = lerp(this.pPrevY, this.player.y);
    this.playerSpr.setPosition(Math.round(px), Math.round(py));
    this.updateShadow(this.playerShadow, px, py, 1.1);

    const key = this.player.animKey();
    if (key !== this.animKey) {
      this.animKey = key;
      this.animT = 0;
    }
    this.animT += dt;
    const fps: Record<string, [number, number]> = {
      idle: [4, 5], run: [6, 14], jump: [1, 1], fall: [1, 1],
      glide: [2, 8], pound: [2, 14], skid: [1, 1], hurt: [1, 1], shoot: [2, 10],
    };
    const [count, rate] = fps[key] ?? [1, 1];
    const fi = count > 1 ? Math.floor(this.animT * rate) % count : 0;
    this.playerSpr.setFrame(`${key}.${fi}`);
    this.playerSpr.setFlipX(this.player.facing === -1);

    this.squash = Math.max(0, this.squash - dt);
    this.stretch = Math.max(0, this.stretch - dt);
    let sx = 1;
    let sy = 1;
    if (this.squash > 0) {
      const k = this.squash / 0.16;
      sx = 1 + 0.18 * k;
      sy = 1 - 0.22 * k;
    } else if (this.stretch > 0) {
      const k = this.stretch / 0.14;
      sx = 1 - 0.12 * k;
      sy = 1 + 0.16 * k;
    }
    this.playerSpr.setScale(sx, sy);

    if (this.player.iframes > 0 && this.player.state !== 'goal') {
      this.playerSpr.setAlpha(Math.floor(this.t * 14) % 2 === 0 ? 0.35 : 1);
    } else {
      this.playerSpr.setAlpha(1);
    }
    if (this.player.submerged) {
      // underwater: cool blue tint + slight transparency so it reads as sunk
      this.playerSpr.setTint(0x8fb4cc);
      this.playerSpr.setAlpha(this.playerSpr.alpha * 0.9);
    } else if (this.player.charging) {
      this.playerSpr.setTint(Math.floor(this.t * 10) % 2 === 0 ? 0xf2a03d : 0xffffff);
    } else if (this.player.power !== 'sling') {
      // steady power glow, gently pulsing so the transformation always reads
      const pulse = Math.floor(this.t * 6) % 2 === 0;
      this.playerSpr.setTint(pulse ? POWER_TINT[this.player.power] : 0xffffff);
    } else {
      this.playerSpr.clearTint();
    }

    // enemies
    for (const e of this.enemies) {
      if (!e.sim.alive) {
        // death pop: puff up and fade once, drop the contact shadow immediately
        if (!e.dying && e.spr.visible) {
          e.dying = true;
          e.shadow.setVisible(false);
          e.spr.clearTint();
          this.tweens.add({
            targets: e.spr,
            scaleX: 1.5, scaleY: 1.5, alpha: 0,
            duration: 190, ease: 'Quad.easeOut',
            onComplete: () => e.spr.setVisible(false),
          });
        }
        continue;
      }
      const ex = lerp(e.prevX, e.sim.body.x);
      const ey = lerp(e.prevY, e.sim.body.y);
      e.spr.setPosition(Math.round(ex), Math.round(ey));
      const group = `${e.sim.kind}_${e.sim.anim}`;
      const counts: Record<string, number> = {
        beetle_walk: 2, beetle_flat: 1, toad_sit: 1, toad_leap: 1,
        owl_fly: 2, owl_dive: 1, burr_roll: 2,
      };
      const c = counts[group] ?? 1;
      const efi = c > 1 ? Math.floor(e.sim.animT * 8) % c : 0;
      e.spr.setFrame(`${group}.${efi}`);
      e.spr.setFlipX(e.sim.facing === -1);
      this.updateShadow(e.shadow, ex, ey);
      const submerged = this.waterTiles.length > 0 &&
        this.waterAt(Math.floor(e.sim.body.x / TILE), Math.floor((e.sim.body.y - e.sim.body.h / 2) / TILE));
      if (e.sim.frozen > 0) {
        // encased in ice: pale-blue tint, motionless
        e.spr.setTint(0xa9c6d6);
        e.spr.setAngle(0);
      } else if (e.sim.stun > 0) {
        e.spr.clearTint();
        e.spr.setAngle(Math.sin(this.t * 40) * 8);
      } else if (submerged) {
        e.spr.setTint(0x8fb4cc); // underwater tint
        e.spr.setAngle(0);
      } else {
        e.spr.clearTint();
        e.spr.setAngle(0);
      }
    }

    // projectiles
    for (const p of this.projectiles.active) {
      const group = projectileGroup(p.sim.kind);
      const frames = group === 'pellet' || group === 'charge' ? 2 : 2;
      const pfi = Math.floor(this.t * 16) % frames;
      p.img.setTexture('pickups', `${group}.${pfi}`);
      p.img.setPosition(Math.round(lerp(p.prevX, p.sim.x)), Math.round(lerp(p.prevY, p.sim.y)));
    }

    // hostile boss shots
    for (const h of this.hostiles) {
      h.img.setTexture('pickups', `ember_sh.${Math.floor(this.t * 16) % 2}`);
      h.img.setPosition(Math.round(lerp(h.prevX, h.x)), Math.round(lerp(h.prevY, h.y)));
    }

    // boss
    if (this.bossSim && this.bossSpr) {
      const boss = this.bossSim;
      if (boss.alive || !this.bossDefeated) {
        const bx = lerp(this.bossPrevX, boss.body.x);
        const by = lerp(this.bossPrevY, boss.body.y);
        this.bossSpr.setPosition(Math.round(bx), Math.round(by));
        if (this.bossShadow) this.updateShadow(this.bossShadow, bx, by, 2.4, 0.3);
        const key = boss.animKey();
        const nFrames = key.endsWith('_walk') ? 2 : 1;
        this.bossSpr.setFrame(`${key}.${Math.floor(this.t * 4) % nFrames}`);
        this.bossSpr.setFlipX(boss.facing === 1); // art faces left by default silhouette
        // telegraph shudder + hurt flash
        if (boss.state === 'telegraph') this.bossSpr.setX(Math.round(bx + Math.sin(this.t * 50) * 1.5));
        this.bossSpr.setTint(boss.hurtFlash > 0 && Math.floor(this.t * 20) % 2 === 0 ? 0xf7e6c4 : 0xffffff);
      }
    }

    // water surface ripple
    if (this.waterGfx) this.drawWater(this.t);

    // pickups idle motion
    for (const p of this.pickups) {
      if (p.taken) continue;
      const bob = Math.sin(this.t * 3 + p.x * 0.15) * 1.5;
      p.img.setY(Math.round(p.y + bob));
      if (p.type === '*') p.img.setFrame(`gem.${Math.floor(this.t * 6 + p.x * 0.1) % 4}`);
      else if (p.type === 'M') p.img.setFrame(`token.${Math.floor(this.t * 4) % 2}`);
      else if (p.type === 'j') p.img.setFrame(`key.${Math.floor(this.t * 4) % 2}`);
      else if (p.type in POWER_ICON) {
        const g = POWER_ICON[p.type].split('.')[0];
        p.img.setFrame(`${g.replace('.0', '')}.${Math.floor(this.t * 3) % 2}`);
      }
    }

    // springs / checkpoint / beacon animation
    for (const s of this.springs) {
      s.timer = Math.max(0, s.timer - dt);
      s.img.setFrame(s.timer > 0 ? 'spring.1' : 'spring.0');
    }
    if (this.checkpointSpr && this.checkpointLit) {
      this.checkpointSpr.setFrame(`checkpoint_lit.${Math.floor(this.t * 6) % 2}`);
    }
    if (this.beaconSpr) {
      this.beaconSpr.setFrame(
        this.goalReached ? `beacon_lit.${Math.floor(this.t * 8) % 2}` : 'beacon_unlit.0',
      );
    }

    // camera: look-ahead + vertical dead zone + trauma shake (FOV-aware)
    const lookMult = this.camZoom > 1 ? T.camera.lookAheadMobileMult : 1;
    const targetLook = this.player.facing * T.camera.lookAheadX * lookMult;
    this.lookAhead += (targetLook - this.lookAhead) * Math.min(1, dt * 4);
    const desiredX = this.player.x + this.lookAhead - this.vw / 2;
    const focusY = this.camY + this.vh * 0.62;
    let desiredY = this.camY;
    if (Math.abs(this.player.y - focusY) > T.camera.deadZoneY) {
      desiredY = this.camY + (this.player.y - focusY - Math.sign(this.player.y - focusY) * T.camera.deadZoneY);
    }
    const k = 1 - Math.pow(1 - T.camera.lerp, dt * 60);
    this.camX += (desiredX - this.camX) * k;
    this.camY += (desiredY - this.camY) * k;
    this.camX = Phaser.Math.Clamp(this.camX, 0, Math.max(0, this.level.width * TILE - this.vw));
    this.camY = Phaser.Math.Clamp(this.camY, 0, Math.max(0, this.level.height * TILE - this.vh));

    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const shake = this.trauma * this.trauma * T.camera.shakeMax;
    const shX = shake * this.rng.range(-1, 1);
    const shY = shake * this.rng.range(-1, 1);
    // camX/camY are the visible world top-left, but Phaser zooms around the
    // viewport CENTER — at zoom > 1 scroll must be pulled back by half the
    // zoom delta or the view drifts down-right past the level bounds (the
    // "world below the map edge" strip on mobile)
    const zoomOffX = (VIEW.w - this.vw) / 2;
    const zoomOffY = (H - this.vh) / 2;
    this.cameras.main.setScroll(Math.round(this.camX + shX - zoomOffX), Math.round(this.camY + shY - zoomOffY));

    this.parallax.update(this.camX, this.camY);
    this.atmosphere?.update(this.t, this.camX);

    // ambient life, in each world's own voice: drifting leaves in the
    // forest, sun-warmed dust over the canyon, slow gloom-motes in the ruins
    this.leafTimer -= dt;
    if (this.leafTimer <= 0) {
      if (this.theme.key === 'thornwood') {
        this.particles.ambientLeaf(this.camX, this.camY, this.vw, this.vh);
        this.leafTimer = 0.55;
      } else if (this.theme.key === 'canyon') {
        this.particles.ambientMote(this.camX, this.camY, this.vw, this.vh);
        this.leafTimer = 0.4;
      } else {
        this.particles.ambientMote(this.camX, this.camY, this.vw, this.vh);
        this.leafTimer = 0.9;
      }
    }
    this.particles.update(dt);
  }
}
