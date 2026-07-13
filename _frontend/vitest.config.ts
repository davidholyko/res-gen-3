import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // jsdom emulates a browser, so packages should resolve their browser
  // build here, matching what actually runs at runtime -- Vite/Vitest
  // doesn't infer this from `environment`. @react-pdf/renderer in
  // particular uses the legacy package.json "browser" field (not modern
  // "exports" conditions) to swap in a browser-only PDFViewer.
  resolve: {
    mainFields: ['browser', 'module', 'main'],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        // Root layout uses next/font/google, a Next.js build-time compiler
        // macro that only works inside Next's own build, not under Vite/Vitest.
        'src/app/layout.tsx',
        // res-gen-2 port (PR 1 of specs/port-res-gen-2.md): raw port only,
        // tests land in PR 2. Remove this whole block once that PR lands --
        // it is a deliberate, temporary carve-out, not a permanent one.
        'src/app/app.tsx',
        'src/app/main.tsx',
        'src/app/page.tsx',
        'src/components/**',
        'src/managers/**',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
