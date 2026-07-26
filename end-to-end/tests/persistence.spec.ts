import { addBlock, addSingleLayout, expect, test } from './fixtures';

test.describe('localStorage persistence', () => {
  test('reloading the page preserves layouts and edited content', async ({
    page,
  }) => {
    // Add a layout and a block into it: empty layouts are hidden on the
    // canvas (specs/continuous-page-canvas.md, Later change), so the
    // block is what makes the second layout visible to assert on.
    await addSingleLayout(page);
    await addBlock(page, 'Section heading', 2);
    await expect(page.locator('.layout-single')).toHaveCount(2);

    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    // The form docks in the canvas-side panel (specs/canvas-edit-panel.md),
    // saving live as you type -- no blur needed.
    await page
      .locator('#canvas-edit-panel input[name="name"]')
      .fill('Ada Lovelace');
    await expect(macro.locator('h1')).toContainText('Ada Lovelace');

    // A real reload, not client-side navigation -- exercises the same
    // localStorage-on-mount read path a returning visitor hits.
    await page.reload();
    await page.waitForSelector('#res-gen', { timeout: 15000 });

    await expect(page.locator('.layout-single')).toHaveCount(2);
    await expect(
      page.locator('.layout-single [role="group"]').first().locator('h1'),
    ).toContainText('Ada Lovelace');
  });
});
