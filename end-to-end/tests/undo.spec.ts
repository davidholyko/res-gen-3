import { expect, test } from './fixtures';

// Happy-path coverage for specs/undo-destructive-actions.md's toast-based
// undo, which replaced window.confirm() on delete-a-block and layers on
// top of it for "New" (see the spec's Decisions section for why "New"
// keeps both guards). (Layout removal was removed from the app, so its
// undo flow is gone too.) Declined/no-snapshot branches are already
// covered deterministically by Vitest (app-context.test.tsx,
// undo-toast.test.tsx).
test.describe('undo destructive actions', () => {
  test('deleting a block, then clicking Undo, restores it', async ({
    page,
  }) => {
    const before = await page
      .locator('.layout-single .macro-manager > *')
      .count();

    await page.locator('.layout-single [role="group"]').first().click();
    await page.getByLabel('Delete block').click();
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
    // Delete one block, then delete another -- the second toast should
    // replace the first, not stack on top of it.
    await page.locator('.layout-single [role="group"]').first().click();
    await page.getByLabel('Delete block').click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Block deleted' }),
    ).toBeVisible();

    await page.locator('.layout-single [role="group"]').first().click();
    await page.getByLabel('Delete block').click();

    await expect(page.getByRole('status')).toHaveCount(1);
    await expect(
      page.getByRole('status').filter({ hasText: 'Block deleted' }),
    ).toBeVisible();
  });

  test('deleting a block with the Backspace key shows the same undo toast as the button', async ({
    page,
  }) => {
    const before = await page
      .locator('.layout-single .macro-manager > *')
      .count();

    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    // Clicking a block lands typing focus in the edit panel's first
    // field (specs/canvas-edit-panel.md), where Backspace edits text --
    // the delete shortcut applies to the block itself, so put focus
    // back on it first.
    await expect(
      page.locator('#canvas-edit-panel input, #canvas-edit-panel textarea').first(),
    ).toBeFocused();
    await macro.focus();
    await page.keyboard.press('Backspace');
    await expect(
      page.locator('.layout-single .macro-manager > *'),
    ).toHaveCount(before - 1);

    const toast = page.getByRole('status').filter({ hasText: 'Block deleted' });
    await toast.getByText('Undo', { exact: true }).click();

    await expect(
      page.locator('.layout-single .macro-manager > *'),
    ).toHaveCount(before);
  });

  test('moving a block shows a "Block moved" toast, and Undo restores the order', async ({
    page,
  }) => {
    // The second prepopulated block (the "Summary" header) moved up
    // above the Contact block.
    const macro = page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Summary' })
      .first();
    await macro.click();
    await macro.getByLabel('Move block up').click();

    await expect(
      page.locator('.layout-single [role="group"]').first(),
    ).toContainText('Summary');

    const toast = page.getByRole('status').filter({ hasText: 'Block moved' });
    await toast.getByText('Undo', { exact: true }).click();

    await expect(
      page.locator('.layout-single [role="group"]').first(),
    ).toContainText('Monkey D. Luffy');
  });

  test('Reset to Example restores the demo resume, and Undo brings back your work', async ({
    page,
  }) => {
    // Mangle the resume first so the reset visibly changes something.
    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    await page
      .locator('#canvas-edit-panel input[name="name"]')
      .fill('Changed Name');
    await expect(macro.locator('h1')).toContainText('Changed Name');

    // The suite's fixtures already auto-accept native dialogs.
    await page.getByText('File', { exact: true }).click();
    await page.getByText('Reset to Example').click();

    // The demo content is back...
    await expect(page.locator('.layout-single h1')).toContainText(
      'Monkey D. Luffy',
    );

    // ...and Undo restores the mangled version.
    const toast = page.getByRole('status').filter({ hasText: 'Resume reset' });
    await toast.getByText('Undo', { exact: true }).click();
    await expect(page.locator('.layout-single h1')).toContainText(
      'Changed Name',
    );
  });

  test('the toast auto-dismisses on its own after a while', async ({
    page,
  }) => {
    await page.locator('.layout-single [role="group"]').first().click();
    await page.getByLabel('Delete block').click();
    const toast = page.getByRole('status').filter({ hasText: 'Block deleted' });
    await expect(toast).toBeVisible();

    // 8s auto-dismiss (undo-toast.tsx) -- give it real margin in CI.
    await expect(toast).not.toBeVisible({ timeout: 12000 });
  });
});
