/**
 * Hand-painted-feel parallax backdrops, generated procedurally at boot from
 * the master palette (spec §3): gradient sky, sun, soft clouds, and layered
 * silhouettes with warm/cool aerial desaturation. Theme-aware: Thornwood gets
 * rolling hills and tree lines; Ochre Canyon gets flat-topped mesas and scrub.
 * Deterministic via seeded RNG so the world always looks the same.
 */
import Phaser from 'phaser';
import { PALETTE } from './palette';
import { Rng } from '../core/rng';
import { TUNING } from '../data/tuning';
import { VIEW } from './viewport';

const H = TUNING.view.height;

type Daypart = 'day' | 'dawn' | 'dusk';
export type ThemeKey = 'thornwood' | 'canyon' | 'mossgrave';

interface SkySpec {
  top: string;
  bottom: string;
  sun: string;
  sunY: number;
  cloud: string;
}

const SKIES: Record<Daypart, SkySpec> = {
  day: { top: PALETTE.A, bottom: PALETTE.a, sun: PALETTE.W, sunY: 52, cloud: PALETTE.a },
  dawn: { top: PALETTE.D, bottom: PALETTE.e, sun: PALETTE.O, sunY: 84, cloud: PALETTE.D },
  dusk: { top: PALETTE.p, bottom: PALETTE.P, sun: PALETTE.O, sunY: 96, cloud: PALETTE.P },
};

interface LayerTints {
  far: string;
  mid: string;
  near: string;
}

const THEME_TINTS: Record<ThemeKey, Record<Daypart, LayerTints>> = {
  thornwood: {
    day: { far: '#8fa6a0', mid: '#5F7D34', near: '#3E5A2E' },
    dawn: { far: '#b58a80', mid: '#7A5A3E', near: '#4A362B' },
    dusk: { far: '#6d5f80', mid: '#4d4a58', near: '#33303f' },
  },
  canyon: {
    day: { far: '#c9a289', mid: '#a06a48', near: '#5d4433' },
    dawn: { far: '#d8a88c', mid: '#a56b50', near: '#6b4a38' },
    dusk: { far: '#8a6a80', mid: '#6d5060', near: '#453542' },
  },
  mossgrave: {
    // overgrown temple: cool grey-green silhouettes of ruined columns/canopy
    day: { far: '#7d8a78', mid: '#4d5a44', near: '#333d2e' },
    dawn: { far: '#8f8a7a', mid: '#5a5a3e', near: '#3a3a2a' },
    dusk: { far: '#5f6a68', mid: '#3e4a44', near: '#28302c' },
  },
};

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** Soft rounded hill silhouette strip that tiles horizontally. */
function hillStrip(color: string, baseY: number, amp: number, rng: Rng, bumps: number): HTMLCanvasElement {
  const W = VIEW.w;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = color;
  const pts: number[] = [];
  for (let i = 0; i <= bumps; i++) pts.push(baseY - rng.range(0, amp));
  pts[bumps] = pts[0]; // seamless wrap
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x++) {
    const f = (x / W) * bumps;
    const i = Math.floor(f);
    const t = f - i;
    const s = t * t * (3 - 2 * t);
    const y = pts[i] * (1 - s) + pts[Math.min(i + 1, bumps)] * s;
    ctx.lineTo(x, Math.round(y));
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  return c;
}

/** Flat-topped mesa/butte silhouette strip that tiles horizontally. */
function mesaStrip(color: string, baseY: number, rng: Rng, count: number, maxH: number): HTMLCanvasElement {
  const W = VIEW.w;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = color;
  ctx.fillRect(0, baseY, W, H - baseY);
  for (let i = 0; i < count; i++) {
    const x = Math.round((i / count) * W + rng.range(-16, 16));
    const w = rng.range(28, 64);
    const h = rng.range(maxH * 0.4, maxH);
    const top = baseY - h;
    for (const ox of [-W, 0, W]) {
      // stepped trapezoid: cap, shoulder, skirt — the classic butte profile
      ctx.fillRect(x + ox + w * 0.18, top, w * 0.64, h);
      ctx.fillRect(x + ox + w * 0.08, top + h * 0.3, w * 0.84, h * 0.7);
      ctx.fillRect(x + ox, top + h * 0.62, w, h * 0.38);
    }
  }
  return c;
}

/** Stylized tree line that tiles horizontally. */
function treeStrip(color: string, baseY: number, rng: Rng, count: number, trunk: boolean): HTMLCanvasElement {
  const W = VIEW.w;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = color;
  ctx.fillRect(0, baseY, W, H - baseY);
  for (let i = 0; i < count; i++) {
    const x = Math.round((i / count) * W + rng.range(-14, 14));
    const th = rng.range(26, 64);
    const cw = rng.range(14, 30);
    const topY = baseY - th;
    if (trunk) ctx.fillRect(mod(x, W) - 2, topY + cw * 0.4, 4, th);
    for (let b = 0; b < 3; b++) {
      const bw = cw - b * 4;
      if (bw <= 2) break;
      const by = topY + b * -6;
      for (const ox of [-W, 0, W]) blob(ctx, mod(x, W) + ox, by, bw, bw * 0.7);
    }
  }
  return c;
}

/** Low desert scrub + rock spires for the canyon near layer. */
function scrubStrip(color: string, baseY: number, rng: Rng, count: number): HTMLCanvasElement {
  const W = VIEW.w;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = color;
  ctx.fillRect(0, baseY, W, H - baseY);
  for (let i = 0; i < count; i++) {
    const x = Math.round((i / count) * W + rng.range(-12, 12));
    for (const ox of [-W, 0, W]) {
      if (rng.next() < 0.45) {
        // rock spire
        const h = rng.range(14, 34);
        ctx.fillRect(mod(x, W) + ox - 3, baseY - h, 6, h);
        ctx.fillRect(mod(x, W) + ox - 5, baseY - h * 0.5, 10, h * 0.5);
      } else {
        // scrub bush
        blob(ctx, mod(x, W) + ox, baseY - 5, rng.range(10, 18), 9);
      }
    }
  }
  return c;
}

function blob(ctx: CanvasRenderingContext2D, cx: number, cy: number, rw: number, rh: number): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rw / 2, rh / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// ---- color helpers for aerial perspective (derive far/near neighbours) ------
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function toHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** Blend a→b by t (0..1). Farthest layers blend toward the sky = aerial haze. */
function blendHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}
/** Darken toward black by t (near foreground = darker + a touch warmer). */
function shadeHex(a: string, t: number, warm = 0): string {
  const [r, g, b] = parseHex(a);
  return toHex(r * (1 - t) + warm, g * (1 - t), b * (1 - t));
}

/**
 * Top-edge foreground occluder that drifts past the camera (scrollFactor > 1)
 * for depth — placed ONLY in the top band so it never hides the gameplay floor.
 * Thornwood = hanging leafy branches; Canyon = a rugged rock overhang lip;
 * Mossgrave = drooping vines and roots. Mostly-transparent canvas.
 */
function foregroundStrip(theme: ThemeKey, color: string, rng: Rng): HTMLCanvasElement {
  const W = VIEW.w;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = color;
  if (theme === 'canyon') {
    // a broken rock lip clinging to the top, with a few hanging chunks
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= W; x += 8) {
      const y = 10 + Math.sin(x * 0.05) * 5 + Math.cos(x * 0.11) * 4 + rng.range(0, 4);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, 0);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const x = rng.range(0, W);
      const h = rng.range(10, 26);
      ctx.fillRect(x - 3, 12, 6, h);
      ctx.fillRect(x - 5, 12, 10, h * 0.4);
    }
  } else if (theme === 'mossgrave') {
    // drooping vines from the top, occasional leaves
    for (let i = 0; i < 10; i++) {
      const x = mod(Math.round(rng.range(0, W)), W);
      const len = rng.range(22, 58);
      ctx.fillRect(x - 1, 0, 3, len);
      for (let l = 8; l < len; l += rng.range(9, 16)) {
        blob(ctx, x + (l % 2 ? 4 : -4), l, 8, 5);
      }
      blob(ctx, x, len, 6, 6); // a heavier leaf at the tip
    }
  } else {
    // thornwood: a leafy canopy corner — a thick bough sweeps in from each top
    // corner, hung with dense overlapping foliage; a couple of leaf sprigs droop
    // between them so the top reads as looking out from under the trees
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let side = 0; side < 2; side++) {
      const baseX = side === 0 ? 0 : W;
      const dir = side === 0 ? 1 : -1;
      // the main bough (thick, tapering) + one offshoot
      for (const [reach, drop, w] of [[150, 34, 9], [92, 20, 6]] as const) {
        ctx.beginPath();
        ctx.moveTo(baseX - dir * 6, -4);
        ctx.quadraticCurveTo(baseX + dir * reach * 0.5, drop * 0.4, baseX + dir * reach, drop);
        ctx.lineWidth = w;
        ctx.stroke();
      }
      // dense foliage clustered over the corner
      const leaf = (lx: number, ly: number, r: number) => blob(ctx, lx, ly, r, r * 0.72);
      for (let i = 0; i < 14; i++) {
        const t = rng.range(0.15, 1);
        const lx = baseX + dir * 150 * t + rng.range(-14, 14);
        const ly = 34 * t * t + rng.range(-8, 10);
        leaf(lx, ly, rng.range(16, 26));
      }
      // solid mass filling the very corner
      leaf(baseX, 2, 40);
      leaf(baseX + dir * 26, 10, 30);
    }
    // two hanging sprigs between the boughs
    for (const sx of [W * 0.4, W * 0.62]) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, -2);
      ctx.quadraticCurveTo(sx + 4, 14, sx, 30);
      ctx.stroke();
      blob(ctx, sx, 30, 12, 9);
      blob(ctx, sx + 3, 20, 9, 7);
    }
  }
  return c;
}

export interface ParallaxLayers {
  destroy(): void;
  update(scrollX: number, scrollY: number): void;
}

/** Build the full backdrop stack in the given scene. */
export function buildParallax(
  scene: Phaser.Scene,
  theme: ThemeKey,
  daypart: Daypart,
  seed = 7,
): ParallaxLayers {
  const W = VIEW.w;
  const sky = SKIES[daypart];
  const tints = (THEME_TINTS[theme] ?? THEME_TINTS.thornwood)[daypart];
  const rng = new Rng(seed);
  // width is baked into the key so a different aspect ratio regenerates cleanly
  const keyBase = `bg-${theme}-${daypart}-${seed}-${W}`;

  if (!scene.textures.exists(`${keyBase}-sky`)) {
    const [c, ctx] = makeCanvas(W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, sky.top);
    grad.addColorStop(1, sky.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // sun with soft warm halo (fire-warm, never LED)
    ctx.fillStyle = sky.sun;
    blob(ctx, W * 0.72, sky.sunY, 22, 22);
    ctx.globalAlpha = 0.25;
    blob(ctx, W * 0.72, sky.sunY, 34, 34);
    ctx.globalAlpha = 1;
    // clouds — long and thin over the canyon, puffy over the forest
    ctx.fillStyle = sky.cloud;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 5; i++) {
      const cx = rng.range(0, W);
      const cy = rng.range(16, 90);
      if (theme === 'canyon') {
        ctx.fillRect(cx - 30, cy, 60, 3);
        ctx.fillRect(cx - 18, cy - 3, 36, 3);
      } else {
        for (let b = 0; b < 4; b++) blob(ctx, cx + b * 10 - 15, cy + (b % 2) * 3, 22 - b * 3, 10);
      }
    }
    ctx.globalAlpha = 1;
    scene.textures.addCanvas(`${keyBase}-sky`, c);
  }

  // aerial-perspective neighbours: a distant layer hazed toward the sky, and a
  // dark near-foreground occluder drawn warmer (art bible: far = lighter/cooler,
  // near = darker/warmer)
  const farthestTint = blendHex(tints.far, sky.bottom, 0.5);
  const fgTint = shadeHex(tints.near, 0.3, 8);

  const factors: [string, number][] = [
    [`${keyBase}-farthest`, 0.05],
    [`${keyBase}-far`, 0.12],
    [`${keyBase}-mid`, 0.3],
    [`${keyBase}-near`, 0.55],
  ];
  if (!scene.textures.exists(`${keyBase}-far`)) {
    if (theme === 'canyon') {
      scene.textures.addCanvas(`${keyBase}-farthest`, mesaStrip(farthestTint, 195, new Rng(seed + 91), 4, 55));
      scene.textures.addCanvas(`${keyBase}-far`, mesaStrip(tints.far, 215, rng, 5, 85));
      scene.textures.addCanvas(`${keyBase}-mid`, mesaStrip(tints.mid, 240, rng, 4, 60));
      scene.textures.addCanvas(`${keyBase}-near`, scrubStrip(tints.near, 260, rng, 8));
    } else {
      scene.textures.addCanvas(`${keyBase}-farthest`, hillStrip(farthestTint, 188, 44, new Rng(seed + 91), 4));
      scene.textures.addCanvas(`${keyBase}-far`, hillStrip(tints.far, 205, 60, rng, 5));
      scene.textures.addCanvas(`${keyBase}-mid`, treeStrip(tints.mid, 232, rng, 9, false));
      scene.textures.addCanvas(`${keyBase}-near`, treeStrip(tints.near, 258, rng, 7, true));
    }
    scene.textures.addCanvas(`${keyBase}-fg`, foregroundStrip(theme, fgTint, new Rng(seed + 137)));
  }

  const skyImg = scene.add.image(0, 0, `${keyBase}-sky`).setOrigin(0).setScrollFactor(0).setDepth(-100);
  const layers = factors.map(([key], i) =>
    scene.add.tileSprite(0, 0, W, H, key).setOrigin(0).setScrollFactor(0).setDepth(-99 + i),
  );
  // foreground occluder: top-band only, drifts past the camera (factor > 1),
  // depth 15 so it sits in front of actors but below HUD/atmosphere
  const FG_FACTOR = 1.15;
  const fg = scene.add.tileSprite(0, 0, W, H, `${keyBase}-fg`).setOrigin(0).setScrollFactor(0).setDepth(15).setAlpha(0.92);

  return {
    update(scrollX: number, scrollY: number) {
      layers.forEach((layer, i) => {
        layer.tilePositionX = scrollX * factors[i][1];
        layer.tilePositionY = scrollY * factors[i][1] * 0.07;
      });
      fg.tilePositionX = scrollX * FG_FACTOR;
    },
    destroy() {
      skyImg.destroy();
      fg.destroy();
      layers.forEach((l) => l.destroy());
    },
  };
}
