/**
 * Screen-space atmosphere — the "lavish" layer over every level (Phase 2B):
 *   - soft diagonal LIGHT SHAFTS in sunlit forests and ruins (day/dawn)
 *   - FIREFLIES that drift and pulse at dusk
 *   - a gentle radial VIGNETTE that frames the screen
 * Everything is warm and natural per the art bible (light is sun and fire,
 * never LED); everything is scrollFactor-0 with zero per-frame allocation.
 * Rebuild on width change like the parallax (textures are width-keyed).
 */
import Phaser from 'phaser';
import { Rng } from '../core/rng';
import { VIEW } from './viewport';
import { TUNING } from '../data/tuning';

const H = TUNING.view.height;

export interface Atmosphere {
  update(t: number, camX: number): void;
  destroy(): void;
}

interface Firefly {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  phase: number;
  speed: number;
}

export function buildAtmosphere(
  scene: Phaser.Scene,
  theme: string,
  daypart: string,
  seed = 5,
): Atmosphere {
  const W = VIEW.w;
  const rng = new Rng(seed);
  const items: Phaser.GameObjects.GameObject[] = [];

  // ---- vignette: baked radial gradient, width-keyed like the parallax -------
  const vigKey = `vignette-${W}`;
  if (!scene.textures.exists(vigKey)) {
    const cvs = document.createElement('canvas');
    cvs.width = W;
    cvs.height = H;
    const ctx = cvs.getContext('2d')!;
    const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    grad.addColorStop(0, 'rgba(20, 16, 13, 0)');
    grad.addColorStop(1, 'rgba(20, 16, 13, 0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    scene.textures.addCanvas(vigKey, cvs);
  }
  const vignette = scene.add.image(0, 0, vigKey).setOrigin(0).setScrollFactor(0).setDepth(55).setAlpha(0.5);
  items.push(vignette);

  // ---- light shafts: sun through the canopy / the ruin oculi ----------------
  const shafts: Phaser.GameObjects.Graphics[] = [];
  const shaftPhase: number[] = [];
  const sunlit = daypart === 'day' || daypart === 'dawn';
  if (sunlit && (theme === 'thornwood' || theme === 'mossgrave')) {
    for (let i = 0; i < 3; i++) {
      const g = scene.add.graphics().setScrollFactor(0).setDepth(30);
      const bx = rng.range(W * 0.12, W * 0.85);
      const wTop = rng.range(14, 22);
      const wBot = wTop * 2.2;
      const drop = H * 0.85;
      const lean = drop * 0.35; // beams lean with the upper-left key light
      g.fillStyle(0xf7e6c4, 1);
      g.beginPath();
      g.moveTo(bx, -8);
      g.lineTo(bx + wTop, -8);
      g.lineTo(bx + wTop + lean, drop);
      g.lineTo(bx + lean - (wBot - wTop), drop);
      g.closePath();
      g.fillPath();
      g.setAlpha(0.05);
      shafts.push(g);
      shaftPhase.push(rng.range(0, Math.PI * 2));
      items.push(g);
    }
  }

  // ---- fireflies at dusk -----------------------------------------------------
  const flies: Firefly[] = [];
  if (daypart === 'dusk') {
    for (let i = 0; i < 9; i++) {
      const img = scene.add
        .image(0, 0, '__WHITE')
        .setScrollFactor(0)
        .setDepth(32)
        .setScale(0.5)
        .setTint(i % 3 === 0 ? 0xe8622c : 0xf2a03d);
      flies.push({
        img,
        x: rng.range(0, W),
        y: rng.range(H * 0.25, H * 0.85),
        phase: rng.range(0, Math.PI * 2),
        speed: rng.range(4, 9),
      });
      items.push(img);
    }
  }

  return {
    update(t: number, camX: number) {
      for (let i = 0; i < shafts.length; i++) {
        // breathe, and drift gently against the camera for depth
        shafts[i].setAlpha(0.04 + Math.sin(t * 0.5 + shaftPhase[i]) * 0.025);
        shafts[i].x = -((camX * 0.06 + i * 37) % (VIEW.w + 80)) + 40;
      }
      for (const f of flies) {
        f.x -= f.speed * 0.016;
        if (f.x < -4) f.x += VIEW.w + 8;
        const wob = Math.sin(t * 1.3 + f.phase);
        f.img.setPosition(f.x, f.y + wob * 6);
        f.img.setAlpha(0.35 + Math.max(0, Math.sin(t * 2.1 + f.phase * 2)) * 0.55);
      }
      void camX;
    },
    destroy() {
      for (const o of items) o.destroy();
    },
  };
}
