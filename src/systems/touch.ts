/**
 * On-screen touch controls for mobile — rendered as hand-drawn pixel-art
 * carved-wood buttons that belong to the game world, not generic mobile UI.
 * Each control is a <canvas> drawn from the master palette (warm wood + a
 * colored gemstone face + a cream icon), with a satisfying pressed state
 * (inset, amber glow). Each button independently tracks a finger via pointer
 * capture, so multitouch (move + jump + shoot at once) works. The pressed
 * state is exposed as a shared object the InputSystem folds into its sample.
 */
export interface TouchState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  fire: boolean;
  pound: boolean;
  pause: boolean;
  /** true once the player has touched the screen at least once */
  used: boolean;
}

export const touchState: TouchState = {
  left: false, right: false, up: false, down: false,
  jump: false, fire: false, pound: false, pause: false, used: false,
};

let installed = false;

// master-palette colors reused for the button art
const C = {
  K: '#2A1F1B', B: '#4A362B', b: '#7A5A3E', t: '#B58B5E', c: '#E6C79A', W: '#F7E6C4',
  O: '#F2A03D', o: '#E8622C', R: '#C7402B', d: '#8A2F22',
  G: '#3E5A2E', g: '#5F7D34', l: '#8FA84A', y: '#C2C56B',
};

function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    (('ontouchstart' in window) ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      window.matchMedia?.('(pointer: coarse)').matches)
  );
}

const STYLE = `
#touch-controls { position: fixed; inset: 0; z-index: 50; pointer-events: none;
  display: none; touch-action: none; user-select: none; -webkit-user-select: none; }
body.touch #touch-controls { display: block; }
#touch-controls canvas { position: absolute; pointer-events: auto; touch-action: none;
  image-rendering: pixelated; -webkit-tap-highlight-color: transparent;
  filter: drop-shadow(0 2px 3px rgba(20,16,13,0.45));
  /* translucent at rest so the world reads through them; solid while held */
  opacity: 0.62;
  transition: transform 60ms ease, opacity 80ms ease; }
/* contextual controls — screens only show the buttons they actually use, so
   gameplay buttons never float over menus (display:none also zeroes their
   hit-test rects, so hidden buttons can't swallow touches) */
#touch-controls[data-ctx='ui'] canvas { display: none; }
#touch-controls[data-ctx='ui'] #tc-pause-pause,
#touch-controls[data-ctx='ui'] #tc-used-fullscreen { display: block; }
#touch-controls[data-ctx='map'] #tc-fire-fire,
#touch-controls[data-ctx='map'] #tc-pound-pound { display: none; }
#touch-controls[data-ctx='clear'] #tc-left-left,
#touch-controls[data-ctx='clear'] #tc-right-right,
#touch-controls[data-ctx='clear'] #tc-pound-pound { display: none; }
#rotate-hint { position: fixed; inset: 0; z-index: 60; display: none;
  align-items: center; justify-content: center; text-align: center;
  background: #14100d; color: #E6C79A; font: 600 20px system-ui, sans-serif; padding: 24px; }
@media (orientation: portrait) and (pointer: coarse) {
  body.touch #rotate-hint { display: flex; }
}
`;

/** Which button set a screen needs. 'game' = everything; 'map' = rocker+jump;
 *  'clear' = jump+fire (Z/X prompts); 'ui' = pause+fullscreen only. */
export type TouchContext = 'game' | 'map' | 'clear' | 'ui';

export function setTouchContext(ctx: TouchContext): void {
  document.getElementById('touch-controls')?.setAttribute('data-ctx', ctx);
}

type IconType = 'left' | 'right' | 'up' | 'down' | 'jump' | 'fire' | 'pound' | 'pause' | 'fullscreen';
type Shape = 'round' | 'pad' | 'tab';

interface BtnDef {
  key: keyof TouchState;
  icon: IconType;
  shape: Shape;
  size: number;
  /** css positioning */
  css: Partial<Record<'left' | 'right' | 'top' | 'bottom', number>>;
  /** gemstone face color set */
  face: string;
  faceDark: string;
  faceHi: string;
}

// Left thumb: a wide LEFT/RIGHT rocker (no up/down — vertical actions live on
// the right cluster). Right thumb: JUMP (big), FIRE, POUND. POUND is
// contextual (ground-pound in air, drop-through on a one-way, dive in water).
// The whole cluster hugs the bottom edge — on short-wide tablets anything
// higher parks the buttons over the middle of the playfield.
const BUTTONS: BtnDef[] = [
  { key: 'left', icon: 'left', shape: 'pad', size: 82, css: { left: 22, bottom: 16 }, face: C.b, faceDark: C.B, faceHi: C.t },
  { key: 'right', icon: 'right', shape: 'pad', size: 82, css: { left: 112, bottom: 16 }, face: C.b, faceDark: C.B, faceHi: C.t },
  // actions (gemstone faces)
  { key: 'jump', icon: 'jump', shape: 'round', size: 92, css: { right: 26, bottom: 14 }, face: C.O, faceDark: C.o, faceHi: C.W },
  { key: 'fire', icon: 'fire', shape: 'round', size: 78, css: { right: 128, bottom: 24 }, face: C.g, faceDark: C.G, faceHi: C.l },
  { key: 'pound', icon: 'pound', shape: 'round', size: 70, css: { right: 40, bottom: 112 }, face: C.R, faceDark: C.d, faceHi: C.o },
  // pause + fullscreen (small carved tablets, top-right corner cluster — the
  // top-left corner belongs to the HUD hearts, never cover it)
  { key: 'pause', icon: 'pause', shape: 'tab', size: 46, css: { right: 16, top: 14 }, face: C.b, faceDark: C.B, faceHi: C.t },
  { key: 'used', icon: 'fullscreen', shape: 'tab', size: 46, css: { right: 74, top: 14 }, face: C.b, faceDark: C.B, faceHi: C.t },
];

// 9×9 cream icon glyphs ('#' = ink)
const ICONS: Record<IconType, string[]> = {
  left:  ['....#....', '...##....', '..###....', '.####....', '#####....', '.####....', '..###....', '...##....', '....#....'],
  right: ['....#....', '....##...', '....###..', '....####.', '....#####', '....####.', '....###..', '....##...', '....#....'],
  up:    ['....#....', '...###...', '..#####..', '.#######.', '#########', '....#....', '....#....', '....#....', '.........'],
  down:  ['.........', '....#....', '....#....', '....#....', '#########', '.#######.', '..#####..', '...###...', '....#....'],
  jump:  ['....#....', '...###...', '..#####..', '.#######.', '#########', '.........', '.##...##.', '###...###', '.........'],
  fire:  ['....#....', '.#..#..#.', '.##.#.##.', '..#####..', '####.####', '..#####..', '.##.#.##.', '.#..#..#.', '....#....'],
  pound: ['#########', '.#######.', '..#####..', '...###...', '....#....', '.........', '#.#.#.#.#', '.........', '#..#.#..#'],
  pause: ['.##...##.', '.##...##.', '.##...##.', '.##...##.', '.##...##.', '.##...##.', '.##...##.', '.##...##.', '.........'],
  fullscreen: ['##.....##', '#.......#', '.........', '.........', '.........', '.........', '.........', '#.......#', '##.....##'],
};

const BASE = 24; // internal pixel grid for the button body

function drawButton(cvs: HTMLCanvasElement, def: BtnDef, pressed: boolean): void {
  const S = cvs.width;
  const cell = S / BASE;
  const ctx = cvs.getContext('2d')!;
  ctx.clearRect(0, 0, S, S);
  const cx = BASE / 2;
  const cy = BASE / 2;
  const yOff = pressed ? 1 : 0;
  const px = (gx: number, gy: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(gx * cell), Math.floor((gy + yOff) * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
  };

  for (let gy = 0; gy < BASE; gy++) {
    for (let gx = 0; gx < BASE; gx++) {
      let col: string | null = null;
      if (def.shape === 'round') {
        const dx = gx + 0.5 - cx;
        const dy = gy + 0.5 - cy;
        const r = Math.hypot(dx, dy);
        const R = BASE / 2 - 0.5;
        if (r <= R) {
          col = dy < -3 ? def.faceHi : dy > 4 ? def.faceDark : def.face;
          if (dx < -3 && dy < -3 && r < R - 3) col = C.W; // top-left glint
          if (r > R - 2) col = C.K; // dark carved ring
          if (r > R - 3.2 && r <= R - 2 && dy < 0) col = def.faceHi; // inner bevel light
        }
      } else {
        // rounded tile (d-pad / pause tablet)
        const inset = 2;
        const corner = (a: number, b: number) => a < inset + 1 && b < inset + 1;
        const inX = gx >= inset && gx < BASE - inset;
        const inY = gy >= inset && gy < BASE - inset;
        const cut =
          corner(gx, gy) || corner(BASE - 1 - gx, gy) || corner(gx, BASE - 1 - gy) || corner(BASE - 1 - gx, BASE - 1 - gy);
        if (inX && inY && !cut) {
          col = gy < BASE / 2 - 2 ? def.faceHi : gy > BASE - inset - 3 ? def.faceDark : def.face;
          const edge = gx === inset || gx === BASE - inset - 1 || gy === inset || gy === BASE - inset - 1;
          if (edge) col = C.K;
          // wood grain streaks
          if (!edge && (gx + gy) % 5 === 0 && col === def.face) col = def.faceDark;
        }
      }
      if (col) px(gx, gy, col);
    }
  }

  // icon, centered (9×9 grid), cream with a dark drop
  const glyph = ICONS[def.icon];
  const gs = glyph.length;
  const ox = Math.round((BASE - gs) / 2);
  const oy = Math.round((BASE - gs) / 2);
  for (let iy = 0; iy < gs; iy++) {
    for (let ix = 0; ix < gs; ix++) {
      if (glyph[iy][ix] !== '#') continue;
      px(ox + ix, oy + iy + 1, C.K); // shadow
      px(ox + ix, oy + iy, C.W); // ink
    }
  }

  cvs.style.transform = pressed ? 'translateY(2px) scale(0.96)' : 'none';
  // solid under the thumb, translucent (CSS default) at rest
  cvs.style.opacity = pressed ? '1' : '';
}

export function initTouchControls(onFullscreen?: () => void): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'touch-controls';
  root.setAttribute('data-ctx', 'ui'); // boot/title until a scene claims its set

  interface Built { def: BtnDef; cvs: HTMLCanvasElement; pressed: boolean }
  const built: Built[] = [];

  // installed PWAs already run edge to edge — the fullscreen button is noise
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const buttons = standalone ? BUTTONS.filter((b) => b.icon !== 'fullscreen') : BUTTONS;

  // tablets get bigger thumb targets — hands sit wider on a big slab, and
  // phone-sized buttons look lost on an iPad. Offsets scale with the size so
  // the cluster keeps its geometry. (Phones: min screen dimension < 600.)
  const minScreen = Math.min(window.screen?.width ?? 9999, window.screen?.height ?? 9999);
  const mult = minScreen >= 600 ? 1.3 : 1;

  for (const def of buttons) {
    const cvs = document.createElement('canvas');
    cvs.id = `tc-${def.key}-${def.icon}`;
    const size = Math.round(def.size * mult);
    const dpr = Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1)));
    // internal resolution: an integer multiple of BASE for crisp cells
    const res = BASE * Math.max(2, Math.round((size * dpr) / BASE));
    cvs.width = res;
    cvs.height = res;
    cvs.style.width = `${size}px`;
    cvs.style.height = `${size}px`;
    // offset by the safe-area inset so buttons stay clear of notches and the
    // home indicator while the canvas paints edge to edge beneath them
    for (const [k, v] of Object.entries(def.css)) {
      cvs.style[k as 'left'] = `calc(${Math.round(v * mult)}px + env(safe-area-inset-${k}, 0px))`;
    }
    drawButton(cvs, def, false);
    root.appendChild(cvs);
    built.push({ def, cvs, pressed: false });
  }
  document.body.appendChild(root);

  const rotate = document.createElement('div');
  rotate.id = 'rotate-hint';
  rotate.textContent = '↻  Rotate to landscape to play EMBERWILDS';
  document.body.appendChild(rotate);

  installInput(built, () => onFullscreen?.());

  if (isTouchDevice()) document.body.classList.add('touch');
}

/**
 * A single global handler that hit-tests every active touch against every
 * button each event. This is the robust pattern for on-screen game pads: it
 * survives iOS's suppression of compat pointer events, supports true multitouch
 * (move + jump + fire at once), and handles sliding a thumb between buttons.
 * Mouse events are handled per-button for desktop testing.
 */
function installInput(built: { def: BtnDef; cvs: HTMLCanvasElement; pressed: boolean }[], onFullscreen: () => void): void {
  const holdKeys = built.filter((b) => b.def.icon !== 'fullscreen');
  const fullscreenBtn = built.find((b) => b.def.icon === 'fullscreen');

  const setPressed = (b: { def: BtnDef; cvs: HTMLCanvasElement; pressed: boolean }, v: boolean): void => {
    if (b.pressed === v) return;
    b.pressed = v;
    (touchState as unknown as Record<string, boolean>)[b.def.key] = v;
    touchState.used = true;
    drawButton(b.cvs, b.def, v);
  };

  const hits = (b: { cvs: HTMLCanvasElement }, x: number, y: number): boolean => {
    const r = b.cvs.getBoundingClientRect();
    // a little slop around each button for fat-finger forgiveness
    return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6;
  };

  /** Recompute every hold-button's pressed state from the live touch list. */
  const recompute = (touches: TouchList): void => {
    for (const b of holdKeys) {
      let on = false;
      for (let i = 0; i < touches.length; i++) {
        if (hits(b, touches[i].clientX, touches[i].clientY)) { on = true; break; }
      }
      setPressed(b, on);
    }
    touchState.used = true;
  };

  const anyTouchHitsControls = (touches: TouchList): boolean => {
    for (let i = 0; i < touches.length; i++) {
      const x = touches[i].clientX, y = touches[i].clientY;
      if (holdKeys.some((b) => hits(b, x, y)) || (fullscreenBtn && hits(fullscreenBtn, x, y))) return true;
    }
    return false;
  };

  // Fullscreen must fire on touchEND: WebKit only grants user activation when
  // the gesture completes and silently rejects requests made during
  // touchstart. Track which touches began on the button so a finger sliding
  // in from elsewhere doesn't trigger it.
  const fsTouches = new Set<number>();

  window.addEventListener('touchstart', (e) => {
    document.body.classList.add('touch');
    if (fullscreenBtn) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (hits(fullscreenBtn, t.clientX, t.clientY)) {
          fsTouches.add(t.identifier);
          drawButton(fullscreenBtn.cvs, fullscreenBtn.def, true);
        }
      }
    }
    recompute(e.touches);
    if (anyTouchHitsControls(e.touches)) e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    recompute(e.touches);
    // block page scroll / rubber-banding while playing on a touch device
    if (document.body.classList.contains('touch')) e.preventDefault();
  }, { passive: false });

  const endHandler = (e: TouchEvent): void => {
    if (fullscreenBtn) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (!fsTouches.delete(t.identifier)) continue;
        drawButton(fullscreenBtn.cvs, fullscreenBtn.def, false);
        // completed tap on the button (touchend only — not touchcancel)
        if (e.type === 'touchend' && hits(fullscreenBtn, t.clientX, t.clientY)) onFullscreen();
      }
    }
    recompute(e.touches);
  };
  window.addEventListener('touchend', endHandler, { passive: false });
  window.addEventListener('touchcancel', endHandler, { passive: false });

  // When the OS steals the touches (notification shade, control center, app
  // switch, gesture nav) some browsers never deliver touchend OR touchcancel —
  // a held button then sticks "down" forever, and the InputSystem's rising-edge
  // detection (pressed = down && !prevDown) eats the player's next tap on it:
  // "the button stopped working". Release everything whenever the page loses
  // the foreground; real fingers still touching will re-press on the next event.
  const releaseAll = (): void => {
    fsTouches.clear();
    if (fullscreenBtn) drawButton(fullscreenBtn.cvs, fullscreenBtn.def, false);
    for (const b of holdKeys) setPressed(b, false);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAll();
  });
  window.addEventListener('pagehide', releaseAll);
  window.addEventListener('blur', releaseAll);

  // desktop mouse (also drives the preview harness): press/hold/release
  for (const b of holdKeys) {
    b.cvs.addEventListener('mousedown', (e) => { e.preventDefault(); setPressed(b, true); });
  }
  window.addEventListener('mouseup', () => { for (const b of holdKeys) setPressed(b, false); });
  if (fullscreenBtn) {
    // click, not mousedown — fullscreen needs the completed-gesture activation
    fullscreenBtn.cvs.addEventListener('click', (e) => {
      e.preventDefault();
      drawButton(fullscreenBtn.cvs, fullscreenBtn.def, true);
      setTimeout(() => drawButton(fullscreenBtn.cvs, fullscreenBtn.def, false), 120);
      onFullscreen();
    });
  }
}
