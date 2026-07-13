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
