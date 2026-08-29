import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      reporter: ['text-summary'],
      // A ratchet, not a target: the numbers this suite actually reaches,
      // floored to the integer below. Raise them when coverage improves.
      //
      // Re-baselined for vitest 4. These are LOWER than the vitest 3 figures
      // (50.79/90.07/80.30) and no test was removed or weakened -- v4 counts
      // differently, so the denominators moved: 628->413 stmts, 66->105 functions.
      // The two instruments do not produce comparable percentages, which is
      // why this is a re-baseline rather than a lowering. Do not read the drop
      // as lost coverage, and do not lower one of these to land a change.
      thresholds: {
        statements: 51,
        branches: 47,
        functions: 51,
        lines: 49,
      },
    },
  },
});
