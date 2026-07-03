/**
 * The Grove — the upgrade shop (spec §8). Spend gems on lasting upgrades:
 * max hearts, a mid-air double jump, a broader glide, a faster charge. A warm
 * overlay launched from the world map; keyboard / gamepad / touch navigable.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { SaveManager, SHOP_ITEMS, type Upgrades } from '../systems/save';
import { ParticleSystem } from '../gfx/particles';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';

const W = TUNING.view.width;
const H = TUNING.view.height;

interface Row {
  name: PixelText;
  desc: PixelText;
  pips: Phaser.GameObjects.Graphics;
  cost: PixelText;
  cursor: PixelText;
}

export class ShopScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private save!: SaveManager;
  private particles!: ParticleSystem;
  private rows: Row[] = [];
  private sel = 0;
  private gemText!: PixelText;
  private grace = 0;
  private prev = { up: false, down: false };
  private returnTo = 'WorldMap';

  constructor() {
    super('Shop');
  }

  create(data: { returnTo?: string }): void {
    this.returnTo = data.returnTo ?? 'WorldMap';
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.particles = new ParticleSystem(this);
    this.rows = [];
    this.sel = 0;
    this.grace = 0.2;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.72);
    const panel = this.add.rectangle(W / 2, H / 2, 380, 250, 0x2a1f1b, 0.96).setStrokeStyle(2, 0x7a5a3e);
    void panel;

    new PixelText(this, W / 2, 44, 'THE GROVE', { scale: 3, color: 'O', align: 'center', shadow: true });
    new PixelText(this, W / 2, 74, 'SPEND EMBER-GEMS ON LASTING GIFTS', { scale: 1, color: 'c', align: 'center' });

    this.add.image(W / 2 - 44, 96, 'pickups', 'gem.0').setScale(1.4);
    this.gemText = new PixelText(this, W / 2 - 30, 92, '', { scale: 2, color: 'W', shadow: true });

    const top = 128;
    SHOP_ITEMS.forEach((item, i) => {
      const y = top + i * 42;
      const cursor = new PixelText(this, W / 2 - 180, y, '', { scale: 2, color: 'O' });
      const name = new PixelText(this, W / 2 - 160, y - 4, item.name, { scale: 1, color: 'W', shadow: true });
      const desc = new PixelText(this, W / 2 - 160, y + 8, item.desc, { scale: 1, color: 't' });
      const pips = this.add.graphics();
      const cost = new PixelText(this, W / 2 + 172, y, '', { scale: 1, color: 'y', align: 'right', shadow: true });
      this.rows.push({ name, desc, pips, cost, cursor });
    });

    new PixelText(this, W / 2, H - 30, 'up/down  CHOOSE     Z  BUY     ESC  BACK', {
      scale: 1, color: 'W', align: 'center', shadow: true,
    });

    this.redraw();
  }

  private redraw(): void {
    this.gemText.setText(`${this.save.data.gems}`);
    SHOP_ITEMS.forEach((item, i) => {
      const row = this.rows[i];
      const owned = this.save.data.upgrades[item.key as keyof Upgrades];
      const cost = this.save.upgradeCost(item.key);
      const selected = i === this.sel;
      row.cursor.setText(selected ? '>' : '');
      row.name.setColor(selected ? 'O' : 'W');

      // ownership pips
      const g = row.pips;
      g.clear();
      const total = item.costs.length;
      const baseX = W / 2 + 78;
      const y = 128 + i * 42;
      for (let k = 0; k < total; k++) {
        const px = baseX + k * 10;
        g.fillStyle(0x2a1f1b, 1).fillCircle(px + 1, y + 1, 3.4);
        g.fillStyle(k < owned ? 0xf2a03d : 0x4a362b, 1).fillCircle(px, y, 3.2);
      }

      if (cost === null) {
        row.cost.setText('MAX').setColor('l');
      } else {
        const afford = this.save.data.gems >= cost;
        row.cost.setText(`${cost}`).setColor(afford ? 'y' : 'd');
      }
    });
  }

  private buy(): void {
    const item = SHOP_ITEMS[this.sel];
    const cost = this.save.upgradeCost(item.key);
    if (cost === null) {
      audio.sfx('pause');
      return;
    }
    if (this.save.buyUpgrade(item.key)) {
      audio.sfx('token');
      const y = 128 + this.sel * 42;
      this.particles.sparks(W / 2 + 90, y, 8);
      this.cameras.main.flash(120, 90, 60, 20);
      this.redraw();
    } else {
      audio.sfx('pause'); // not enough gems
      const row = this.rows[this.sel];
      this.tweens.add({ targets: row.cost, x: '+=3', duration: 40, yoyo: true, repeat: 3 });
    }
  }

  update(_time: number, delta: number): void {
    this.particles.update(delta / 1000);
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    const f = this.inputSys.sample();

    const up = f.up && !this.prev.up;
    const down = f.down && !this.prev.down;
    this.prev = { up: f.up, down: f.down };

    if (up || down) {
      this.sel = (this.sel + (down ? 1 : SHOP_ITEMS.length - 1)) % SHOP_ITEMS.length;
      audio.sfx('menuMove');
      this.redraw();
    } else if (f.jumpPressed) {
      this.buy();
    } else if (f.pause) {
      audio.sfx('menuSelect');
      this.scene.stop();
      this.scene.resume(this.returnTo);
    }
  }
}
