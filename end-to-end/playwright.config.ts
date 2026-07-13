import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// `_frontend`'s basePath (see `_frontend/next.config.ts`) is baked into
// every route/asset reference the app itself makes, so tests always need
// to hit the app under this prefix, not the bare origin.
const baseURL = 'http://localhost:3330/app/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL,
    // Tall, not just wide: this app's page grows (adding layouts/content
    // scrolls the "Add Macro Button"/layout drop zones further down), and
    // Playwright's dragTo() -- the only thing that can drive react-dnd's
    // native HTML5 drag-and-drop backend -- does not reliably auto-scroll
    // an off-screen drop target into view mid-gesture (confirmed by
    // reproducing it: identical drag succeeds against an in-viewport
    // target, silently no-ops against one below the fold). Tall enough
    // that every test in this suite's drop targets stay in view without
    // relying on that scroll behavior at all.
    viewport: { width: 1280, height: 2400 },
    // On locally, off in CI: a developer debugging a failure gets the full
    // interactive trace + video without reproducing it first; CI runs are
    // frequent/unattended (see specs/end-to-end-testing.md) and the HTML
    // report is enough to see what broke, with tracing available locally
    // for anyone who needs to dig deeper.
    trace: isCI ? 'off' : 'on',
    video: isCI ? 'off' : 'on',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      // devices['Desktop Chrome'] carries its own 1280x720 viewport
      // preset, which -- spread last -- would silently override the
      // taller viewport set above; re-assert it after the spread.
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 2400 },
      },
    },
  ],

  // Boots the app itself so the suite is self-contained -- no separately
  // running dev server required. `next dev`, not `next start`: this app
  // builds as a static export (`output: "export"`) for GitHub Pages, and
  // `next start` refuses to run against that config at all. See
  // specs/end-to-end-testing.md for the full reasoning (and the `next
  // start` error message that ruled it out).
  webServer: {
    command: 'pnpm --filter @res-gen-3/frontend dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
