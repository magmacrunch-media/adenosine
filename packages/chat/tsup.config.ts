import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
});
