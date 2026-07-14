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

  test('shows the canvas with prepopulated resume content and per-zone add controls', async ({
    page,
  }) => {
    // No Template ribbon anymore (specs/editor-redesign.md, Phase 6):
    // adding content happens via each zone's "+ Add block" control.
    await expect(page.locator('#editor-manager')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: '+ Add block' }),
    ).toBeVisible();

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
