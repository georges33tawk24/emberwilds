/**
 * HOW TO PLAY — a plain reference for the full moveset, so the hidden verbs
 * (glide, wall-jump, pound, power-ups) are discoverable instead of secret.
 * Reachable from the title menu and the pause menu. Scroll on touch/wheel.
 */
import Phaser from 'phaser';
import { PixelText } from '../gfx/text';
import { InputSystem } from '../systems/input';
import { setTouchContext } from '../systems/touch';
import { audio } from '../audio/engine';
import { TUNING } from '../data/tuning';
import { VIEW } from '../gfx/viewport';
import { uiScale } from '../systems/platform';
import { attachMenuTouch } from '../systems/menuTouch';
import { PixelButton } from '../gfx/ui';

const H = TUNING.view.height;

/** [move, how] — the whole kit, plainly. */
const MOVES: [string, string][] = [
  ['MOVE', 'ARROWS or A / D'],
  ['JUMP', 'Z or SPACE  (hold to jump higher)'],
  ['GLIDE', 'HOLD JUMP as you fall - the scarf catches the air'],
  ['WALL JUMP', 'JUMP toward a wall while sliding down it'],
  ['GROUND POUND', 'C, or DOWN + JUMP in the air - smashes cracked blocks'],
  ['SHOOT', 'X  (hold to charge a bigger shot)'],
  ['SWIM', 'in water, tap JUMP to stroke upward'],
  ['POWER-UPS', 'EMBER burns / FROST freezes foes into platforms / GALE hovers'],
  ['KEYS + GATES', 'carry a key to a door; strike a switch to open gates'],
  ['IN THE GROVE', 'spend gems on a double jump, a longer glide, and more'],
];

export class HowToPlayScene extends Phaser.Scene {
  private inputSys!: InputSystem;
  private rows: PixelText[] = [];
  private scroll = 0;
  private maxScroll = 0;
  private rowTop = 0;
  private rowH = 0;
  private grace = 0;
  private layoutW = 0;
  private returnTo = 'Title';

  constructor() {
    super('HowToPlay');
  }

  create(data: { returnTo?: string }): void {
    setTouchContext('ui');
    const W = VIEW.w;
    const ui = uiScale();
    this.layoutW = W;
    this.returnTo = data.returnTo ?? 'Title';
    this.inputSys = new InputSystem(this);
    this.grace = 0.2;
    this.rows = [];
    this.scroll = 0;

    this.add.rectangle(W / 2, H / 2, W, H, 0x14100d, 0.9);
    new PixelText(this, W / 2, ui > 1 ? 24 : 30, 'HOW TO PLAY', { scale: ui > 1 ? 4 : 3, color: 'O', align: 'center', shadow: true });

    this.rowTop = ui > 1 ? 78 : 66;
    this.rowH = ui > 1 ? 40 : 30;
    // mobile readability: the instructions render at full ui scale — but only
    // when the internal width has room for the longest line. Narrow (4:3)
    // screens render at a much higher zoom (e.g. iPad: 480 units over 1024 CSS
    // px), so scale-1 text is already as readable there as 2x is on a phone.
    const dscale = ui > 1 && W >= 640 ? ui : 1;
    MOVES.forEach(([move, how], i) => {
      const y = this.rowTop + i * this.rowH;
      const name = new PixelText(this, ui > 1 ? 24 : 20, y, move, { scale: ui, color: 'O', shadow: true });
      const desc = new PixelText(this, ui > 1 ? 24 : 20, y + (ui > 1 ? 16 : 11), how, { scale: dscale, color: 'c' });
      this.rows.push(name, desc);
    });
    this.maxScroll = Math.max(0, this.rowTop + MOVES.length * this.rowH + 16 - (H - 20));

    // BACK plaque, top-left (the DOM pause/fullscreen cluster owns top-right)
    const bw = ui > 1 ? 88 : 64;
    new PixelButton(this, VIEW.insetL + 10 + bw / 2, ui > 1 ? 24 : 18, {
      w: bw, h: ui > 1 ? 26 : 20, label: 'BACK', scale: ui, face: 'wood', onTap: () => this.leave(),
    });
    new PixelText(this, W / 2, H - (ui > 1 ? 14 : 16), 'ESC / TAP BACK', { scale: ui, color: 'W', align: 'center', shadow: true });

    attachMenuTouch(this, {
      rowAt: () => null, // no selectable rows, just scroll
      onTapRow: () => undefined,
      onScroll: (dy) => { this.scroll = Phaser.Math.Clamp(this.scroll + dy, 0, this.maxScroll); this.redraw(); },
    });
    this.redraw();
  }

  private redraw(): void {
    const ui = uiScale();
    MOVES.forEach(([, ], i) => {
      const y = this.rowTop + i * this.rowH - this.scroll;
      const name = this.rows[i * 2];
      const desc = this.rows[i * 2 + 1];
      name.setPosition(name.x, y).setVisible(y > this.rowTop - this.rowH && y < H);
      desc.setPosition(desc.x, y + (ui > 1 ? 16 : 11)).setVisible(y > this.rowTop - this.rowH && y < H);
    });
  }

  private leave(): void {
    audio.sfx('menuSelect');
    if (this.returnTo === 'Game') {
      setTouchContext('game');
      this.scene.stop();
      this.scene.resume('Game');
    } else {
      this.scene.stop();
      this.scene.start(this.returnTo);
    }
  }

  update(_t: number, delta: number): void {
    if (VIEW.w !== this.layoutW) { this.scene.restart({ returnTo: this.returnTo }); return; }
    this.grace -= delta / 1000;
    if (this.grace > 0) return;
    const f = this.inputSys.sample();
    if (f.pause || f.firePressed || f.jumpPressed) this.leave();
  }
}
