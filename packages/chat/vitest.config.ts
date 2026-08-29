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
      // (54.48/58.94/52.38) and no test was removed or weakened -- v4 counts
      // differently, so the denominators moved: 613->480 stmts, 95->279 branches.
      // The two instruments do not produce comparable percentages, which is
      // why this is a re-baseline rather than a lowering. Do not read the drop
      // as lost coverage, and do not lower one of these to land a change.
      thresholds: {
        statements: 39,
        branches: 28,
        functions: 39,
        lines: 44,
      },
    },
  },
});
