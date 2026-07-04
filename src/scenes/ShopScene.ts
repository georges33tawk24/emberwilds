/**
 * The Grove — the upgrade shop (spec §8). Spend gems on lasting upgrades:
 * max hearts, a mid-air double jump, a broader glide, a faster charge. A warm
 * overlay launched from the world map; keyboard / gamepad / touch navigable.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { SaveManager, SHOP_ITEMS, type Upgrades } from '../systems/save';
import { ParticleSystem } from '../gfx/particles';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';
import { attachMenuTouch } from '../systems/menuTouch';

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
  private scroll = 0;
  private layoutW = 0;
  private gemText!: PixelText;
  private grace = 0;
  private prev = { up: false, down: false };
  private returnTo = 'WorldMap';
  // ui-scaled layout, set in create (×2 text on touch devices)
  private rowTop = 128;
  private rowH = 42;

  constructor() {
    super('Shop');
  }

  create(data: { returnTo?: string }): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.rowTop = ui > 1 ? 116 : 128;
    this.rowH = ui > 1 ? 56 : 42;
    this.returnTo = data.returnTo ?? 'WorldMap';
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.particles = new ParticleSystem(this);
    this.rows = [];
    this.sel = 0;
    this.grace = 0.2;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.72);
    const panel = this.add
      .rectangle(W / 2, H / 2 + (ui > 1 ? 8 : 0), ui > 1 ? Math.min(W - 16, 470) : 380, ui > 1 ? 296 : 250, 0x2a1f1b, 0.96)
      .setStrokeStyle(2, 0x7a5a3e);
    void panel;

    new PixelText(this, W / 2, ui > 1 ? 32 : 44, 'THE GROVE', { scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true });
    new PixelText(this, W / 2, ui > 1 ? 62 : 74, 'SPEND EMBER-GEMS ON LASTING GIFTS', { scale: 1, color: 'c', align: 'center' });

    this.add.image(W / 2 - 44 * ui * 0.7, ui > 1 ? 84 : 96, 'pickups', 'gem.0').setScale(1.4 * (ui > 1 ? 1.3 : 1));
    this.gemText = new PixelText(this, W / 2 - 30 * ui * 0.7, ui > 1 ? 80 : 92, '', { scale: 2, color: 'W', shadow: true });

    this.scroll = 0;
    SHOP_ITEMS.forEach((item) => {
      const cursor = new PixelText(this, W / 2 - (ui > 1 ? 216 : 180), 0, '', { scale: 2, color: 'O' });
      const name = new PixelText(this, W / 2 - (ui > 1 ? 200 : 160), 0, item.name, { scale: ui, color: 'W', shadow: true });
      const desc = new PixelText(this, W / 2 - (ui > 1 ? 200 : 160), 0, item.desc, { scale: 1, color: 't' });
      const pips = this.add.graphics();
      const cost = new PixelText(this, W / 2 + (ui > 1 ? 216 : 172), 0, '', { scale: ui, color: 'y', align: 'right', shadow: true });
      this.rows.push({ name, desc, pips, cost, cursor });
    });

    new PixelText(this, W / 2, H - (ui > 1 ? 22 : 30), ui > 1 ? 'TAP  CHOOSE / BUY     II  BACK' : 'up/down  CHOOSE     Z  BUY     ESC  BACK', {
      scale: ui > 1 ? 2 : 1, color: 'W', align: 'center', shadow: true,
    });

    // tap a row to select it, tap the selection to buy; drag/wheel scrolls
    // once the list outgrows the screen (touch phones have no up/down rocker)
    attachMenuTouch(this, {
      rowAt: (_x, y) => {
        const i = Math.floor((y + this.scroll - (this.rowTop - this.rowH / 2)) / this.rowH);
        return i >= 0 && i < SHOP_ITEMS.length ? i : null;
      },
      onTapRow: (i) => {
        if (this.sel !== i) {
          this.sel = i;
          audio.sfx('menuMove');
          this.redraw();
        } else {
          this.buy();
        }
      },
      onScroll: (dy) => {
        const max = Math.max(0, this.rowTop + SHOP_ITEMS.length * this.rowH + 40 - H);
        this.scroll = Phaser.Math.Clamp(this.scroll + dy, 0, max);
        this.redraw();
      },
    });

    this.redraw();
  }

  private rowY(i: number): number {
    return this.rowTop + i * this.rowH - this.scroll;
  }

  private redraw(): void {
    const W = VIEW.w;
    const ui = uiScale();
    this.gemText.setText(`${this.save.data.gems}`);
    SHOP_ITEMS.forEach((item, i) => {
      const row = this.rows[i];
      const owned = this.save.data.upgrades[item.key as keyof Upgrades];
      const cost = this.save.upgradeCost(item.key);
      const selected = i === this.sel;
      const y = this.rowY(i);
      row.cursor.setPosition(W / 2 - (ui > 1 ? 216 : 180), y);
      row.name.setPosition(W / 2 - (ui > 1 ? 200 : 160), y - (ui > 1 ? 10 : 4));
      row.desc.setPosition(W / 2 - (ui > 1 ? 200 : 160), y + (ui > 1 ? 6 : 8));
      row.cost.setPosition(W / 2 + (ui > 1 ? 216 : 172), y);
      row.cursor.setText(selected ? '>' : '');
      row.name.setColor(selected ? 'O' : 'W');

      // ownership pips
      const g = row.pips;
      g.clear();
      const total = item.costs.length;
      const baseX = W / 2 + (ui > 1 ? 92 : 78);
      const pr = ui > 1 ? 4.4 : 3.2;
      for (let k = 0; k < total; k++) {
        const px = baseX + k * (ui > 1 ? 14 : 10);
        g.fillStyle(0x2a1f1b, 1).fillCircle(px + 1, y + 1, pr + 0.2);
        g.fillStyle(k < owned ? 0xf2a03d : 0x4a362b, 1).fillCircle(px, y, pr);
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
      const y = this.rowY(this.sel);
      this.particles.sparks(VIEW.w / 2 + 90, y, 8);
      this.cameras.main.flash(120, 90, 60, 20);
      this.redraw();
    } else {
      audio.sfx('pause'); // not enough gems
      const row = this.rows[this.sel];
      this.tweens.add({ targets: row.cost, x: '+=3', duration: 40, yoyo: true, repeat: 3 });
    }
  }

  update(_time: number, delta: number): void {
    // live width change (rotation, URL-bar collapse) — rebuild the layout
    if (VIEW.w !== this.layoutW) {
      this.scene.restart({ returnTo: this.returnTo });
      return;
    }
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
      setTouchContext(this.returnTo === 'WorldMap' ? 'map' : 'game');
      this.scene.stop();
      this.scene.resume(this.returnTo);
    }
  }
}
