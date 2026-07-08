/**
 * THE WARDROBE — the cosmetics shop (strictly cosmetic, gems only). Buy fur
 * colors, scarves, and the little cap; equip and unequip freely. A live
 * preview fox wears your choices immediately. Launched from the Grove.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { SaveManager } from '../systems/save';
import { COSMETICS, buildStyledFrames, PLAYER_TEX, type Cosmetic, type CosmeticKind } from '../systems/cosmetics';
import { registerSheet } from '../gfx/textures';
import { ParticleSystem } from '../gfx/particles';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';
import { attachMenuTouch } from '../systems/menuTouch';

const H = TUNING.view.height;

interface WardrobeRow {
  kind: CosmeticKind;
  /** null = the free default for this slot (Sorrel's own fur / amber scarf / bare head) */
  item: Cosmetic | null;
  label: string;
  desc: string;
}

const ROWS: WardrobeRow[] = [
  { kind: 'character', item: null, label: 'SORREL', desc: 'THE FOX HIMSELF' },
  ...COSMETICS.filter((c) => c.kind === 'character').map((c) => ({ kind: 'character' as const, item: c, label: c.name, desc: c.desc })),
  { kind: 'scarf', item: null, label: 'AMBER SCARF', desc: 'THE ONE HE LEFT HOME IN' },
  ...COSMETICS.filter((c) => c.kind === 'scarf').map((c) => ({ kind: 'scarf' as const, item: c, label: c.name, desc: c.desc })),
  ...COSMETICS.filter((c) => c.kind === 'hat').map((c) => ({ kind: 'hat' as const, item: c, label: c.name, desc: c.desc })),
];

export class WardrobeScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private save!: SaveManager;
  private particles!: ParticleSystem;
  private labels: { name: PixelText; desc: PixelText; state: PixelText; cursor: PixelText }[] = [];
  private preview!: Phaser.GameObjects.Sprite;
  private previewTag!: PixelText;
  private gemText!: PixelText;
  private sel = 0;
  private scroll = 0;
  private layoutW = 0;
  private grace = 0;
  private t = 0;
  private prev = { up: false, down: false };
  private returnTo = 'WorldMap';
  private rowTop = 96;
  private rowH = 24;

  constructor() {
    super('Wardrobe');
  }

  create(data: { returnTo?: string }): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.returnTo = data.returnTo ?? 'WorldMap';
    this.save = this.registry.get('save') as SaveManager;
    this.inputSys = new InputSystem(this);
    this.particles = new ParticleSystem(this);
    this.labels = [];
    this.sel = 0;
    this.scroll = 0;
    this.grace = 0.2;
    this.rowTop = ui > 1 ? 104 : 96;
    this.rowH = ui > 1 ? 30 : 22;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.88);
    new PixelText(this, W / 2, ui > 1 ? 26 : 34, 'THE WARDROBE', { scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true });
    new PixelText(this, W / 2, ui > 1 ? 54 : 62, 'WEAR THE WILDS - COSMETIC ONLY, GEMS ONLY', { scale: 1, color: 'c', align: 'center' });

    this.add.image(W / 2 - 40 * ui * 0.6, ui > 1 ? 74 : 80, 'pickups', 'gem.0').setScale(1.3);
    this.gemText = new PixelText(this, W / 2 - 28 * ui * 0.6, ui > 1 ? 70 : 76, '', { scale: 2, color: 'W', shadow: true });

    // the live preview fox — it tries on whatever row is highlighted, owned
    // or not, so you always see the look before you spend
    this.preview = this.add.sprite(W / 2 + (ui > 1 ? 170 : 140), ui > 1 ? 82 : 84, PLAYER_TEX, 'idle.0')
      .setOrigin(0.5, 1).setScale(2.2);
    this.previewTag = new PixelText(this, this.preview.x, this.preview.y + 6, '', {
      scale: 1, color: 'y', align: 'center', shadow: true,
    });
    this.rebakePreview();

    for (const row of ROWS) {
      const cursor = new PixelText(this, W / 2 - (ui > 1 ? 208 : 172), 0, '', { scale: 2, color: 'O' });
      const name = new PixelText(this, W / 2 - (ui > 1 ? 192 : 152), 0, row.label, { scale: ui, color: 'W', shadow: true });
      const desc = new PixelText(this, W / 2 - (ui > 1 ? 192 : 152), 0, row.desc, { scale: 1, color: 't' });
      const state = new PixelText(this, W / 2 + (ui > 1 ? 208 : 168), 0, '', { scale: ui, color: 'y', align: 'right', shadow: true });
      this.labels.push({ name, desc, state, cursor });
    }

    new PixelText(this, W / 2, H - (ui > 1 ? 20 : 26), ui > 1 ? 'TAP  CHOOSE / WEAR     II  BACK' : 'up/down  CHOOSE     Z  BUY / WEAR     ESC  BACK', {
      scale: ui > 1 ? 2 : 1, color: 'W', align: 'center', shadow: true,
    });

    attachMenuTouch(this, {
      rowAt: (_x, y) => {
        const i = Math.floor((y + this.scroll - (this.rowTop - this.rowH / 2)) / this.rowH);
        return i >= 0 && i < ROWS.length ? i : null;
      },
      onTapRow: (i) => {
        if (this.sel !== i) {
          this.sel = i;
          audio.sfx('menuMove');
          this.rebakePreview();
          this.redraw();
        } else {
          this.activate();
        }
      },
      onScroll: (dy) => {
        const max = Math.max(0, this.rowTop + ROWS.length * this.rowH + 34 - H);
        this.scroll = Phaser.Math.Clamp(this.scroll + dy, 0, max);
        this.redraw();
      },
    });

    this.redraw();
  }

  private equippedId(kind: CosmeticKind): string | null {
    const s = this.save.data.style;
    return kind === 'character' ? s.character : kind === 'scarf' ? s.scarf : s.hat;
  }

  private setEquipped(kind: CosmeticKind, id: string | null): void {
    const s = this.save.data.style;
    if (kind === 'character') s.character = id;
    else if (kind === 'scarf') s.scarf = id;
    else s.hat = id;
  }

  /** The style the preview wears: what's equipped, with the highlighted row
   *  tried on in its slot (even if unowned). */
  private previewStyle(): { owned: string[]; character: string | null; scarf: string | null; hat: string | null } {
    const s = { ...this.save.data.style };
    const row = ROWS[this.sel];
    if (row.kind === 'character') s.character = row.item?.id ?? null;
    else if (row.kind === 'scarf') s.scarf = row.item?.id ?? null;
    else s.hat = row.item?.id ?? null;
    return s;
  }

  /** Re-dress the preview fox for the highlighted row. */
  private rebakePreview(): void {
    const style = this.previewStyle();
    if (this.textures.exists('player-preview')) this.textures.remove('player-preview');
    registerSheet(this, 'player-preview', buildStyledFrames(style));
    const { x, y } = this.preview;
    this.preview.destroy();
    this.preview = this.add.sprite(x, y, 'player-preview', 'idle.0').setOrigin(0.5, 1).setScale(2.2);
    // does the tried-on look differ from what's actually worn?
    const worn = this.save.data.style;
    const trying =
      style.character !== worn.character || style.scarf !== worn.scarf || style.hat !== worn.hat;
    const row = ROWS[this.sel];
    const owned = row.item === null || this.save.data.style.owned.includes(row.item.id);
    this.previewTag.setText(trying ? (owned ? 'PREVIEW' : 'PREVIEW - NOT OWNED') : '');
  }

  /** Rebuild the real styled sheet so the equipped choice shows in game. */
  private refreshStyle(): void {
    if (this.textures.exists(PLAYER_TEX)) this.textures.remove(PLAYER_TEX);
    registerSheet(this, PLAYER_TEX, buildStyledFrames(this.save.data.style));
    this.rebakePreview();
  }

  private activate(): void {
    const row = ROWS[this.sel];
    const worn = this.equippedId(row.kind);
    if (row.item === null) {
      // the free default: wear it (unequip the slot)
      if (worn !== null) {
        this.setEquipped(row.kind, null);
        this.save.save();
        this.refreshStyle();
        audio.sfx('menuSelect');
      }
      this.redraw();
      return;
    }
    const owned = this.save.data.style.owned.includes(row.item.id);
    if (!owned) {
      if (this.save.data.gems >= row.item.cost) {
        this.save.data.gems -= row.item.cost;
        this.save.data.style.owned.push(row.item.id);
        this.setEquipped(row.kind, row.item.id); // wear it right away
        this.save.save();
        this.refreshStyle();
        audio.sfx('token');
        this.particles.sparks(this.preview.x, this.preview.y - 20, 10);
        this.cameras.main.flash(120, 90, 60, 20);
      } else {
        audio.sfx('pause');
        const s = this.labels[this.sel].state;
        this.tweens.add({ targets: s, x: '+=3', duration: 40, yoyo: true, repeat: 3 });
      }
    } else {
      // toggle wear
      this.setEquipped(row.kind, worn === row.item.id ? null : row.item.id);
      this.save.save();
      this.refreshStyle();
      audio.sfx('menuSelect');
    }
    this.redraw();
  }

  private redraw(): void {
    const W = VIEW.w;
    const ui = uiScale();
    this.gemText.setText(`${this.save.data.gems}`);
    ROWS.forEach((row, i) => {
      const l = this.labels[i];
      const y = this.rowTop + i * this.rowH - this.scroll;
      const visible = y > this.rowTop - this.rowH && y < H - 20;
      for (const o of [l.name, l.desc, l.state, l.cursor]) o.setVisible(visible);
      l.cursor.setPosition(W / 2 - (ui > 1 ? 208 : 172), y).setText(i === this.sel ? '>' : '');
      l.name.setPosition(W / 2 - (ui > 1 ? 192 : 152), y - (ui > 1 ? 8 : 4)).setColor(i === this.sel ? 'O' : 'W');
      l.desc.setPosition(W / 2 - (ui > 1 ? 192 : 152), y + (ui > 1 ? 7 : 7));
      l.state.setPosition(W / 2 + (ui > 1 ? 208 : 168), y);
      const worn = this.equippedId(row.kind) === (row.item?.id ?? null);
      if (row.item === null) {
        l.state.setText(worn ? 'WORN' : 'FREE').setColor(worn ? 'O' : 'l');
      } else if (this.save.data.style.owned.includes(row.item.id)) {
        l.state.setText(worn ? 'WORN' : 'OWNED').setColor(worn ? 'O' : 'l');
      } else {
        const afford = this.save.data.gems >= row.item.cost;
        l.state.setText(`${row.item.cost}`).setColor(afford ? 'y' : 'd');
      }
    });
  }

  private leave(): void {
    audio.sfx('menuSelect');
    setTouchContext(this.returnTo === 'WorldMap' ? 'map' : 'game');
    this.scene.stop();
    // restart the destination so every fox sprite rebinds to the new sheet
    this.scene.stop(this.returnTo);
    this.scene.start(this.returnTo);
  }

  update(_time: number, delta: number): void {
    if (VIEW.w !== this.layoutW) {
      this.scene.restart({ returnTo: this.returnTo });
      return;
    }
    this.t += delta / 1000;
    this.preview.setFrame(`idle.${Math.floor(this.t * 5) % 4}`);
    this.particles.update(delta / 1000);
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    const f = this.inputSys.sample();
    const up = f.up && !this.prev.up;
    const down = f.down && !this.prev.down;
    this.prev = { up: f.up, down: f.down };
    if (up || down) {
      this.sel = (this.sel + (down ? 1 : ROWS.length - 1)) % ROWS.length;
      // keep the selection on screen
      const y = this.rowTop + this.sel * this.rowH - this.scroll;
      if (y < this.rowTop) this.scroll = this.sel * this.rowH;
      else if (y > H - 40) this.scroll = this.rowTop + this.sel * this.rowH - (H - 40);
      audio.sfx('menuMove');
      this.rebakePreview();
      this.redraw();
    } else if (f.jumpPressed) {
      this.activate();
    } else if (f.pause) {
      this.leave();
    }
  }
}
