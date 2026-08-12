import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'iife'],
  globalName: 'AdScore',
  dts: false,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
});
