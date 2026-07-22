import { expect, test } from './fixtures';

// Happy-path coverage for the restructure view (specs/restructure-view.md,
// specs/restructure-palette-mirror.md). Native HTML5 drag is unreliable
// under Playwright (see the removed drag-autoscroll suite), so these drive
// the keyboard-accessible "Move to…" path -- the required non-drag
// equivalent -- which is also what a keyboard user uses.
test.describe('restructure view', () => {
  test('opens a two-pane view: the staging copy and its mirroring outline', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Restructure' }).click();

    await expect(page.getByLabel('Staging outline')).toBeVisible();
    await expect(page.getByLabel('New structure')).toBeVisible();
    // The prepopulated resume has 11 blocks -> 11 outline cards, and a
    // copy-on-open staging zone.
    await expect(page.getByTestId('palette-card')).toHaveCount(11);
    await expect(page.getByTestId('staging-zone')).toHaveCount(1);
  });

  test('add a box, move one macro into it, Apply -> the block lands in the new layout', async ({
    page,
  }) => {
    await expect(page.locator('.layout-single [role="group"]')).toHaveCount(11);

    await page.getByRole('button', { name: 'Restructure' }).click();

    // Add a second box, then move the first outline macro into it via the
    // keyboard menu (a move -- the block leaves Layout 1).
    await page.getByRole('button', { name: '+ One column' }).click();
    await expect(page.getByTestId('staging-zone')).toHaveCount(2);

    const firstCard = page.getByTestId('palette-card').first();
    await firstCard.getByRole('button', { name: /Move .* to a box/ }).click();
    await page.getByRole('menuitem', { name: 'Layout 2' }).click();

    // The outline mirrors staging: still 11 cards, and the moved one now
    // sits at the end, under the Layout 2 group.
    await expect(page.getByTestId('palette-card')).toHaveCount(11);

    await page.getByRole('button', { name: 'Apply', exact: true }).click();

    // Back on the canvas: two layouts, 11 blocks total (10 + the moved 1),
    // and an undoable "Resume restructured" toast.
    await expect(page.locator('.layout-single')).toHaveCount(2);
    await expect(page.locator('.layout-single [role="group"]')).toHaveCount(11);
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
