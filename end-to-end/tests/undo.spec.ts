import { expect, test } from './fixtures';

// Happy-path coverage for specs/undo-destructive-actions.md's toast-based
// undo, which replaced window.confirm() on the two finer-grained
// destructive actions (delete a block, remove a layout) and layers on
// top of it for "New" (see the spec's Decisions section for why "New"
// keeps both guards). Declined/no-snapshot branches are already covered
// deterministically by Vitest (app-context.test.tsx, undo-toast.test.tsx).
test.describe('undo destructive actions', () => {
  test('removing a layout is not gated behind a confirmation dialog, and shows an undo toast', async ({
    page,
  }) => {
    let dialogFired = false;
    page.on('dialog', () => {
      dialogFired = true;
    });

    await page.getByLabel('Remove Layout 1 Button').click();

    expect(dialogFired).toBe(false);
    await expect(page.locator('.layout-single')).toHaveCount(0);
    await expect(
      page.getByRole('status').filter({ hasText: 'Layout 1 removed' }),
    ).toBeVisible();
  });

  test('removing a layout, then clicking Undo, restores it with its original content intact', async ({
    page,
  }) => {
    const macroCountBefore = await page
      .locator('.layout-single .macro-manager > *')
      .count();
    const contentBefore = await page
      .locator('.layout-single')
      .first()
      .textContent();

    await page.getByLabel('Remove Layout 1 Button').click();
    await expect(page.locator('.layout-single')).toHaveCount(0);

    const toast = page
      .getByRole('status')
      .filter({ hasText: 'Layout 1 removed' });
    await toast.getByText('Undo', { exact: true }).click();

    await expect(page.locator('.layout-single')).toHaveCount(1);
    await expect(
      page.locator('.layout-single .macro-manager > *'),
    ).toHaveCount(macroCountBefore);
    await expect(page.locator('.layout-single').first()).toHaveText(
      contentBefore ?? '',
    );
  });

  test('deleting a block, then clicking Undo, restores it', async ({
    page,
  }) => {
    const before = await page
      .locator('.layout-single .macro-manager > *')
      .count();

    await page.locator('.layout-single [role="group"]').first().click();
    await page.getByLabel('Delete Macro Button').click();
    await expect(
      page.locator('.layout-single .macro-manager > *'),
    ).toHaveCount(before - 1);

    const toast = page.getByRole('status').filter({ hasText: 'Block deleted' });
    await toast.getByText('Undo', { exact: true }).click();

    await expect(
      page.locator('.layout-single .macro-manager > *'),
    ).toHaveCount(before);
  });

  test('"New" still confirms, then shows an undo toast that restores the whole resume', async ({
    page,
  }) => {
    await expect(page.locator('.layout-single')).toHaveCount(1);

    await page.getByText('File', { exact: true }).click();
    await page.getByText('New', { exact: true }).click();

    await expect(page.locator('.layout-single')).toHaveCount(0);
    const toast = page
      .getByRole('status')
      .filter({ hasText: 'Resume cleared' });
    await expect(toast).toBeVisible();

    await toast.getByText('Undo', { exact: true }).click();

    await expect(page.locator('.layout-single')).toHaveCount(1);
  });

  test('a second destructive action replaces the toast instead of stacking', async ({
    page,
  }) => {
    await page.locator('.layout-single [role="group"]').first().click();
    await page.getByLabel('Delete Macro Button').click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Block deleted' }),
    ).toBeVisible();

    await page.getByLabel('Remove Layout 1 Button').click();

    await expect(page.getByRole('status')).toHaveCount(1);
    await expect(
      page.getByRole('status').filter({ hasText: 'Layout 1 removed' }),
    ).toBeVisible();
  });

  test('the toast auto-dismisses on its own after a while', async ({
    page,
  }) => {
    await page.getByLabel('Remove Layout 1 Button').click();
    const toast = page
      .getByRole('status')
      .filter({ hasText: 'Layout 1 removed' });
    await expect(toast).toBeVisible();

    // 8s auto-dismiss (undo-toast.tsx) -- give it real margin in CI.
    await expect(toast).not.toBeVisible({ timeout: 12000 });
  });
});
