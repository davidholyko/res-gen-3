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
    // Destructive actions (remove layout, delete block, "New") are now
    // gated behind window.confirm (specs/app-ux-improvements.md, Finding
    // 4/6). Playwright auto-dismisses native dialogs unless a listener is
    // registered, which would silently turn every one of those clicks into
    // a no-op -- accept by default so existing and new happy-path flows
    // keep working; tests covering the "declined" branch belong in Vitest
    // component tests, not here.
    page.on('dialog', (dialog) => dialog.accept());
    // NOT `page.goto('/')`: a leading slash resolves against the origin
    // root, discarding baseURL's own `/res-gen-3` path entirely (a bare
    // `new URL('/', baseURL)` gotcha). An empty string resolves relative
    // to the full baseURL, path included.
    await page.goto('');
    await page.waitForSelector('#res-gen', { timeout: 15000 });
    await use(page);
  },
});

export { expect };

/**
 * Removes the last layout via its own canvas "Remove layout" link -- the
 * Edit menu's "Remove Last Layout" retired with specs/editor-redesign.md
 * Phase 6.
 */
export async function removeLastLayout(page: Page) {
  const before = await page.getByText('Remove layout').count();
  await page.getByText('Remove layout').last().click();
  await expect(page.getByText('Remove layout')).toHaveCount(before - 1);
}

/**
 * Grows the stored resume past one real PDF page by duplicating the
 * prepopulated items (fresh contentIds, same layout), then reloading so
 * the app re-reads localStorage. Needed since the PDF-style fidelity
 * fix: a properly styled example resume fits a single page, so tests
 * about multi-page behavior must build their own second page.
 */
export async function makeResumeMultiPage(page: Page) {
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('res-gen-data');
    const data = JSON.parse(raw as string);
    const clones = data.items.map(
      (item: { contentId: string }, index: number) => ({
        ...item,
        contentId: `${item.contentId}-clone-${index}`,
      }),
    );
    data.items = [...data.items, ...clones];
    window.localStorage.setItem('res-gen-data', JSON.stringify(data));
  });
  await page.reload();
  await page.waitForSelector('#res-gen', { timeout: 15000 });
}

/**
 * Adds a SINGLE-column layout below the last layout via its canvas
 * "+ Add layout" control (the Edit menu retired with
 * specs/add-layout-beside-add-block.md).
 */
export async function addSingleLayout(page: Page) {
  const before = await page.locator('.layout-single').count();
  await page.getByRole('button', { name: '+ Add layout' }).last().click();
  await page.getByRole('menuitem', { name: 'One column' }).click();
  await expect(page.locator('.layout-single')).toHaveCount(before + 1);
}

/** Adds a DOUBLE-column layout below the last layout via the canvas control. */
export async function addDoubleLayout(page: Page) {
  const before = await page.locator('.layout-double').count();
  await page.getByRole('button', { name: '+ Add layout' }).last().click();
  await page.getByRole('menuitem', { name: 'Two columns' }).click();
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
