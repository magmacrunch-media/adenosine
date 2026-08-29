import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      reporter: ['text-summary'],
      // A ratchet, not a target: these are the numbers this suite actually
      // reaches today, floored to the integer below. Raise them when coverage
      // improves. Never lower one to make a change fit -- that is the whole
      // point of writing them down.
      thresholds: {
        statements: 98,
        branches: 93,
        functions: 91,
        lines: 98,
      },
    },
  },
});
