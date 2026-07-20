import { addBlock, addSingleLayout, expect, test } from './fixtures';

// Phase 7: canvas Move up/down is zone-aware -- an item only ever swaps
// with the nearest item in its *own* zone, never silently reordering
// relative to a different layout's content in the flat items array.
// (Phase 6's canvas gap inserters were removed: adding/reordering layouts
// moved into the restructure view, specs/restructure-view.md.)
test.describe('zone-aware content reordering (specs/editor-redesign.md, Phase 7)', () => {
  test("moving a block up skips other layouts' items and swaps within its own zone", async ({
    page,
  }) => {
    // Blocks are added blank via the restructure view, then labelled on
    // the canvas. Build the flat array [ ...prepopulated (L1), Marker
    // (L2), Mover (L1) ] -- Marker added before Mover so it sits between
    // L1's items in flat order.
    await addSingleLayout(page);
    const layout1 = page.locator('.layout-single').first();
    const layout2 = page.locator('.layout-single').last();

    await addBlock(page, 'Section heading', 2); // into L2
    await layout2.locator('[role="group"]').last().click();
    await page.locator('#canvas-edit-panel input[name="header"]').fill('Marker');
    await page.locator('header').first().click();

    await addBlock(page, 'Section heading', 1); // into L1
    const mover = layout1.locator('[role="group"]').last();
    await mover.click();
    await page.locator('#canvas-edit-panel input[name="header"]').fill('Mover');

    // One press. The flat-adjacent item is Marker (layout 2) -- the old
    // splice would have swapped with it invisibly, making the first
    // press appear to do nothing.
    await mover.getByRole('button', { name: 'Move block up' }).click();

    // Mover moved above layout 1's last prepopulated block...
    await expect(layout1.locator('[role="group"]').last()).toContainText(
      'Foods:',
    );
    await expect(layout1.locator('[role="group"]').nth(-2)).toContainText(
      'Mover',
    );
    // ...and layout 2 is untouched.
    await expect(layout2.locator('[role="group"]')).toContainText('Marker');
  });
});
