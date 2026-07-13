import { test as base, expect, type Page } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Every test starts from a clean slate: AppProvider reads localStorage
    // synchronously on mount, so this has to run before the app's own
    // script does (a plain `page.evaluate` after `goto` would run too
    // late). A clean slate still shows real content -- localStorageUtil
    // falls back to a prepopulated example resume (one SINGLE layout,
    // 11 items) whenever localStorage is empty, matching what an actual
    // first-time visitor sees.
    //
    // `addInitScript` re-runs on every navigation in this page, including
    // a same-test `page.reload()` -- persistence.spec.ts's whole point is
    // reloading and expecting state to survive, so this can only clear
    // once. `window.name` is one of the few things that survives a
    // reload/navigation within the same tab, so it doubles as a
    // "have I already cleared for this test" marker.
    await page.addInitScript(() => {
      if (window.name !== 'e2e-cleared') {
        window.localStorage.clear();
        window.name = 'e2e-cleared';
      }
    });
    // NOT `page.goto('/')`: a leading slash resolves against the origin
    // root, discarding baseURL's own `/app` path entirely (a bare
    // `new URL('/', baseURL)` gotcha). An empty string resolves relative
    // to the full baseURL, path included.
    await page.goto('');
    await page.waitForSelector('#res-gen', { timeout: 15000 });
    await use(page);
  },
});

export { expect };

/** Adds a SINGLE-column layout via the Edit menu and waits for it to render. */
export async function addSingleLayout(page: Page) {
  const before = await page.locator('.layout-single').count();
  await page.getByText('Edit', { exact: true }).click();
  await page.getByText('Add Single Column Layout').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.layout-single')).toHaveCount(before + 1);
}

/** Adds a DOUBLE-column layout via the Edit menu and waits for it to render. */
export async function addDoubleLayout(page: Page) {
  const before = await page.locator('.layout-double').count();
  await page.getByText('Edit', { exact: true }).click();
  await page.getByText('Add Double Column Layout').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.layout-double')).toHaveCount(before + 1);
}

/** Every console error captured while `fn` runs; asserts none by default. */
export async function collectConsoleErrors(
  page: Page,
  fn: () => Promise<void>,
) {
  const errors: string[] = [];
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', onConsole);
  try {
    await fn();
  } finally {
    page.off('console', onConsole);
  }
  return errors;
}
