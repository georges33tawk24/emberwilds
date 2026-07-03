/**
 * Pooled sprite particles — dust, sparks, leaves, gem glints, debris.
 * Purely presentational (variable dt is fine here); the pool guarantees no
 * per-frame allocation in the hot path.
 */
import Phaser from 'phaser';
import { Pool } from '../core/pool';
import { Rng } from '../core/rng';

interface Particle {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grav: number;
  life: number;
  maxLife: number;
  sheet: string;
  group: string;
  frames: number;
  flutter: number;
}

export class ParticleSystem {
  private pool: Pool<Particle>;
  private rng = new Rng(0xfeed);

  constructor(private scene: Phaser.Scene, private depth = 20) {
    this.pool = new Pool<Particle>(
      () => ({
        img: scene.add.image(-100, -100, '__WHITE').setVisible(false).setDepth(this.depth),
        x: 0, y: 0, vx: 0, vy: 0, grav: 0, life: 0, maxLife: 1,
        sheet: '', group: '', frames: 1, flutter: 0,
      }),
      (p) => p.img.setVisible(false),
      48,
    );
  }

  private spawn(
    sheet: string, group: string, frames: number,
    x: number, y: number, vx: number, vy: number,
    life: number, grav = 0, flutter = 0,
  ): void {
    const p = this.pool.obtain();
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.grav = grav; p.life = life; p.maxLife = life;
    p.sheet = sheet; p.group = group; p.frames = frames; p.flutter = flutter;
    p.img.setVisible(true).setTexture(sheet, `${group}.0`).setPosition(x, y).setAlpha(1);
  }

  dust(x: number, y: number, n = 4, spread = 30): void {
    for (let i = 0; i < n; i++) {
      this.spawn('pickups', 'dust', 3, x + this.rng.range(-4, 4), y - 1,
        this.rng.range(-spread, spread), this.rng.range(-24, -6), this.rng.range(0.25, 0.45));
    }
  }

  sparks(x: number, y: number, n = 5): void {
    for (let i = 0; i < n; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const sp = this.rng.range(40, 110);
      this.spawn('pickups', 'spark', 3, x, y, Math.cos(a) * sp, Math.sin(a) * sp,
        this.rng.range(0.18, 0.32), 180);
    }
  }

  gemPop(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      this.spawn('pickups', 'spark', 3, x + this.rng.range(-3, 3), y + this.rng.range(-3, 3),
        this.rng.range(-20, 20), this.rng.range(-50, -20), 0.3, 80);
    }
  }

  leafBurst(x: number, y: number, n = 6): void {
    for (let i = 0; i < n; i++) {
      this.spawn('pickups', 'leaf', 2, x, y,
        this.rng.range(-50, 50), this.rng.range(-70, -20), this.rng.range(0.5, 0.9), 120, 3);
    }
  }

  /** Ambient drifting leaf somewhere in the camera view. */
  ambientLeaf(camX: number, camY: number, w: number, h: number): void {
    this.spawn('pickups', 'leaf', 2,
      camX + this.rng.range(0, w + 60) - 30, camY - 8,
      this.rng.range(-18, -6), this.rng.range(14, 26), this.rng.range(6, 10), 0, 8);
  }

  update(dt: number): void {
    for (const p of this.pool.active) {
      p.life -= dt;
      if (p.life <= 0) {
        this.pool.release(p);
        continue;
      }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.flutter > 0) p.x += Math.sin(p.life * 5) * p.flutter * dt * 10;
      const t = 1 - p.life / p.maxLife;
      const fi = Math.min(p.frames - 1, Math.floor(t * p.frames));
      p.img.setTexture(p.sheet, `${p.group}.${fi}`);
      p.img.setPosition(Math.round(p.x), Math.round(p.y));
      p.img.setAlpha(p.life < 0.15 ? p.life / 0.15 : 1);
    }
  }

  destroy(): void {
    this.pool.releaseAll();
  }
}
