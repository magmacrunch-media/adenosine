import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm', 'iife'],
  globalName: 'AdCards',
  dts: false,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
});
