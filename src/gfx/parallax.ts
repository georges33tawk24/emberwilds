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
export type ThemeKey = 'thornwood' | 'canyon' | 'mossgrave' | 'cinder' | 'rimefell';

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
  cinder: {
    // ash mountains under foundry smoke: grey haze fading to charcoal
    day: { far: '#8a8a86', mid: '#5f5c58', near: '#3a3835' },
    dawn: { far: '#a38a7e', mid: '#6a5a50', near: '#423930' },
    dusk: { far: '#6a5f66', mid: '#484249', near: '#2e2b30' },
  },
  rimefell: {
    // snowfield: pale drifts fading to blue-slate treelines (thornwood's
    // hill + tree strips, wearing frost)
    day: { far: '#c2ccd2', mid: '#93a6b2', near: '#5f7484' },
    dawn: { far: '#d2b8ac', mid: '#a08a90', near: '#6a5f70' },
    dusk: { far: '#8a8aa0', mid: '#5f6180', near: '#3d4258' },
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

/** Jagged volcanic peak silhouette strip that tiles horizontally. */
function peakStrip(color: string, baseY: number, rng: Rng, count: number, maxH: number): HTMLCanvasElement {
  const W = VIEW.w;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = color;
  ctx.fillRect(0, baseY, W, H - baseY);
  for (let i = 0; i < count; i++) {
    const x = Math.round((i / count) * W + rng.range(-18, 18));
    const w = rng.range(36, 80);
    const h = rng.range(maxH * 0.5, maxH);
    const lean = rng.range(-w * 0.15, w * 0.15);
    for (const ox of [-W, 0, W]) {
      // asymmetric triangle with a notched summit — a cooled cone
      ctx.beginPath();
      ctx.moveTo(x + ox - w / 2, baseY);
      ctx.lineTo(x + ox + lean - 3, baseY - h);
      ctx.lineTo(x + ox + lean + 1, baseY - h + 4);
      ctx.lineTo(x + ox + lean + 4, baseY - h + 1);
      ctx.lineTo(x + ox + w / 2, baseY);
      ctx.closePath();
      ctx.fill();
    }
  }
  return c;
}

/** Charred snag trees + slag boulders for the cinder near layer. */
function snagStrip(color: string, baseY: number, rng: Rng, count: number): HTMLCanvasElement {
  const W = VIEW.w;
  const [c, ctx] = makeCanvas(W, H);
  ctx.fillStyle = color;
  ctx.fillRect(0, baseY, W, H - baseY);
  for (let i = 0; i < count; i++) {
    const x = Math.round((i / count) * W + rng.range(-12, 12));
    for (const ox of [-W, 0, W]) {
      if (rng.next() < 0.55) {
        // a burnt snag: bare trunk, one or two stub branches
        const h = rng.range(22, 46);
        const tx = mod(x, W) + ox;
        ctx.fillRect(tx - 2, baseY - h, 4, h);
        ctx.fillRect(tx - 9, baseY - h * 0.7, 8, 3);
        if (rng.next() < 0.6) ctx.fillRect(tx + 2, baseY - h * 0.45, 7, 3);
      } else {
        // slag boulder pile
        blob(ctx, mod(x, W) + ox, baseY - 4, rng.range(12, 20), 10);
        blob(ctx, mod(x, W) + ox + 6, baseY - 2, rng.range(8, 12), 7);
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
      if (theme === 'canyon' || theme === 'cinder') {
        // long thin streaks — desert haze / drifting foundry smoke
        ctx.fillRect(cx - 30, cy, 60, 3);
        ctx.fillRect(cx - 18, cy - 3, 36, 3);
      } else {
        for (let b = 0; b < 4; b++) blob(ctx, cx + b * 10 - 15, cy + (b % 2) * 3, 22 - b * 3, 10);
      }
    }
    ctx.globalAlpha = 1;
    scene.textures.addCanvas(`${keyBase}-sky`, c);
  }

  const factors: [string, number][] = [
    [`${keyBase}-far`, 0.12],
    [`${keyBase}-mid`, 0.3],
    [`${keyBase}-near`, 0.55],
  ];
  if (!scene.textures.exists(`${keyBase}-far`)) {
    if (theme === 'canyon') {
      scene.textures.addCanvas(`${keyBase}-far`, mesaStrip(tints.far, 215, rng, 5, 85));
      scene.textures.addCanvas(`${keyBase}-mid`, mesaStrip(tints.mid, 240, rng, 4, 60));
      scene.textures.addCanvas(`${keyBase}-near`, scrubStrip(tints.near, 260, rng, 8));
    } else if (theme === 'cinder') {
      scene.textures.addCanvas(`${keyBase}-far`, peakStrip(tints.far, 212, rng, 5, 95));
      scene.textures.addCanvas(`${keyBase}-mid`, peakStrip(tints.mid, 238, rng, 4, 62));
      scene.textures.addCanvas(`${keyBase}-near`, snagStrip(tints.near, 258, rng, 8));
    } else {
      scene.textures.addCanvas(`${keyBase}-far`, hillStrip(tints.far, 205, 60, rng, 5));
      scene.textures.addCanvas(`${keyBase}-mid`, treeStrip(tints.mid, 232, rng, 9, false));
      scene.textures.addCanvas(`${keyBase}-near`, treeStrip(tints.near, 258, rng, 7, true));
    }
  }

  const skyImg = scene.add.image(0, 0, `${keyBase}-sky`).setOrigin(0).setScrollFactor(0).setDepth(-100);
  const layers = factors.map(([key], i) =>
    scene.add.tileSprite(0, 0, W, H, key).setOrigin(0).setScrollFactor(0).setDepth(-99 + i),
  );

  return {
    update(scrollX: number, scrollY: number) {
      layers.forEach((layer, i) => {
        layer.tilePositionX = scrollX * factors[i][1];
        layer.tilePositionY = scrollY * factors[i][1] * 0.07;
      });
    },
    destroy() {
      skyImg.destroy();
      layers.forEach((l) => l.destroy());
    },
  };
}
