import { addSingleLayout, expect, test } from './fixtures';

test.describe('localStorage persistence', () => {
  test('reloading the page preserves layouts and edited content', async ({
    page,
  }) => {
    await addSingleLayout(page);
    await expect(page.locator('.layout-single')).toHaveCount(2);

    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    await macro
      .locator('.contact-editor textarea')
      .fill(JSON.stringify({ name: 'Ada Lovelace', email: 'ada@example.com' }));
    await macro.locator('.contact-editor textarea').blur();
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

  test('reloading preserves the editor panel visibility toggle', async ({
    page,
  }) => {
    await page.getByText('View', { exact: true }).click();
    await page.getByText('Toggle Editor').click();
    await expect(page.locator('#editor-manager')).toHaveClass(/hidden/);

    await page.reload();
    await page.waitForSelector('#res-gen', { timeout: 15000 });

    await expect(page.locator('#editor-manager')).toHaveClass(/hidden/);
  });
});
