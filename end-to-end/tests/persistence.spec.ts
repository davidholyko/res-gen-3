import { addSingleLayout, expect, test } from './fixtures';

test.describe('localStorage persistence', () => {
  test('reloading the page preserves layouts and edited content', async ({
    page,
  }) => {
    await addSingleLayout(page);
    await expect(page.locator('.layout-single')).toHaveCount(2);

    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    // The contact block edits through real form fields now
    // (specs/editor-redesign.md, Phase 3), saving live as you type -- no
    // blur needed.
    await macro
      .locator('.contact-editor input[name="name"]')
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
