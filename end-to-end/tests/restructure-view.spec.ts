import { expect, test } from './fixtures';

// Happy-path coverage for the restructure view (specs/restructure-view.md).
// Native HTML5 drag is unreliable under Playwright (see the removed
// drag-autoscroll suite), so these drive the keyboard-accessible "Send
// to…" path -- the required non-drag equivalent -- which is also what a
// keyboard user uses.
test.describe('restructure view', () => {
  test('opens a two-pane view with the resume as a palette and a staging copy', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Restructure' }).click();

    await expect(page.getByLabel('Your resume')).toBeVisible();
    await expect(page.getByLabel('New structure')).toBeVisible();
    // The prepopulated resume has 11 blocks -> 11 palette cards, and a
    // copy-on-open staging zone.
    await expect(page.getByTestId('palette-card')).toHaveCount(11);
    await expect(page.getByTestId('staging-zone')).toHaveCount(1);
  });

  test('Clear, add a box, send one macro, Apply -> resume becomes just that macro', async ({
    page,
  }) => {
    await expect(page.locator('.layout-single [role="group"]')).toHaveCount(11);

    await page.getByRole('button', { name: 'Restructure' }).click();

    // Start from a blank right pane, add a single box.
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByTestId('staging-zone')).toHaveCount(0);
    await page.getByRole('button', { name: '+ One column' }).click();
    await expect(page.getByTestId('staging-zone')).toHaveCount(1);

    // Send the first palette macro into the new box via the keyboard menu.
    const firstCard = page.getByTestId('palette-card').first();
    await firstCard.getByRole('button', { name: /Send .* to a box/ }).click();
    await page.getByRole('menuitem', { name: 'Layout 1' }).click();

    await page.getByRole('button', { name: 'Apply', exact: true }).click();

    // Back on the canvas: a single layout holding just the one placed
    // macro, and an undoable "Resume restructured" toast.
    await expect(page.locator('.layout-single')).toHaveCount(1);
    await expect(page.locator('.layout-single [role="group"]')).toHaveCount(1);
    await expect(
      page.getByRole('status').filter({ hasText: 'Resume restructured' }),
    ).toBeVisible();
  });

  test('adds a new blank block of a chosen type into a box, then Apply puts it on the canvas', async ({
    page,
  }) => {
    const before = await page.locator('.layout-single [role="group"]').count();

    await page.getByRole('button', { name: 'Restructure' }).click();

    // Each staging zone carries the "+ Add block" menu (moved off the
    // canvas). Add a Section heading into the first (copied) box.
    await page.getByRole('button', { name: '+ Add block' }).first().click();
    await page.getByRole('menuitem', { name: 'Section heading' }).click();

    await page.getByRole('button', { name: 'Apply', exact: true }).click();

    // One more block on the canvas -- blank, ready to edit.
    await expect(page.locator('.layout-single [role="group"]')).toHaveCount(
      before + 1,
    );
  });

  test('Cancel discards staging changes and leaves the resume untouched', async ({
    page,
  }) => {
    await expect(page.locator('.layout-single [role="group"]')).toHaveCount(11);

    await page.getByRole('button', { name: 'Restructure' }).click();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByTestId('staging-zone')).toHaveCount(0);

    await page.getByRole('button', { name: 'Cancel' }).click();

    // The restructure view is gone and the resume is exactly as it was.
    await expect(page.getByLabel('New structure')).toHaveCount(0);
    await expect(page.locator('.layout-single [role="group"]')).toHaveCount(11);
  });
});
