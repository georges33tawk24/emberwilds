import { defineConfig } from 'vite';

export default defineConfig({
  // relative base so the build runs from any static host path
  // (root domain, GitHub Pages subpath, or itch.io zip)
  base: './',
  build: {
    chunkSizeWarningLimit: 1600, // Phaser is one large vendor chunk by design
  },
});
