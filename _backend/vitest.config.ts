import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      // Nest bootstrap has no branches/logic to unit test; excluded from the coverage gate.
      exclude: ['src/main.ts'],
      thresholds: {
        statements: 100,
        functions: 100,
        lines: 100,
        // Branches excluded: SWC's decorator-metadata output emits a
        // `typeof X === "undefined" ? Object : X` guard for every
        // constructor-injected class, which is an unreachable synthetic
        // branch on every Nest provider/controller, not untested logic.
      },
    },
  },
  plugins: [swc.vite()],
});
