import { collectConsoleErrors, expect, test } from './fixtures';

test.describe('page load', () => {
  test('renders the editor UI with no console errors', async ({ page }) => {
    const errors = await collectConsoleErrors(page, async () => {
      await page.reload();
      await page.waitForSelector('#res-gen', { timeout: 15000 });
    });

    // The client-side "Loading..." gate (src/app/page.tsx) must have
    // resolved -- it waits on window.document.styleSheets before
    // rendering the real app.
    await expect(page.getByText('Loading...')).toHaveCount(0);
    await expect(page.getByText('Res Gen 3')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('shows the prepopulated resume on a display-only canvas', async ({
    page,
  }) => {
    // The canvas is display-only: adding content moved into the
    // restructure view (specs/restructure-view.md), so there are no
    // "+ Add block" / "+ Add layout" controls here anymore.
    await expect(page.getByRole('button', { name: '+ Add block' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('button', { name: 'Restructure' })).toBeVisible();

    // Fresh localStorage falls back to a prepopulated example resume
    // (src/utils/prepopulate-util.ts) rather than an empty layout area.
    await expect(page.locator('.layout-single')).toHaveCount(1);
    await expect(page.locator('.layout-single h1')).toContainText(
      'Monkey D. Luffy',
    );
  });

  test('has the correct document title', async ({ page }) => {
    await expect(page).toHaveTitle('Res Gen 3');
  });
});
