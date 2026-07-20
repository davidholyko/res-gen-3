import { addBlock, addDoubleLayout, expect, test } from './fixtures';

// specs/move-block-between-layouts.md: the block toolbar's "Move to…"
// menu is the only way to move an existing block into another layout,
// including a half of a two-column layout.
test.describe('move a block between layouts (specs/move-block-between-layouts.md)', () => {
  test("moves a block from a single layout into a double layout's right half", async ({
    page,
  }) => {
    // A distinguishable marker block in Layout 1: added blank via the
    // restructure view, then edited on the canvas.
    const layout1 = page.locator('.layout-single').first();
    const before = await layout1.locator('[role="group"]').count();
    await addBlock(page, 'Section heading');
    await layout1.locator('[role="group"]').nth(before).click();
    await page
      .locator('#canvas-edit-panel input[name="header"]')
      .fill('Mover Section');
    // Unfocus the block so its edit panel closes before we add a layout.
    await page.locator('header').first().click();

    // A two-column layout below it (Layout 2) to move the block into.
    await addDoubleLayout(page);

    // Focus the marker to reveal its toolbar, open "Move to…", pick the
    // right half of Layout 2.
    const mover = layout1
      .locator('[role="group"]')
      .filter({ hasText: 'Mover Section' });
    await mover.click();
    await mover.getByRole('button', { name: 'Move to another layout' }).click();
    await page.getByRole('menuitem', { name: 'Layout 2 (Right)' }).click();

    // It now lives in Layout 2's right half and has left Layout 1.
    const rightHalf = page.locator('.layout-double .layout-single').last();
    await expect(rightHalf.locator(':text("Mover Section")')).toBeVisible();
    await expect(layout1.locator(':text("Mover Section")')).toHaveCount(0);
  });
});
