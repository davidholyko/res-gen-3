import { addSingleLayout, expect, test } from './fixtures';

// Happy-path coverage for specs/editor-redesign.md, Phase 6 (Design →
// Layout management): layouts are inserted at a specific position via
// the gap inserters. (Drag-to-reorder was removed --
// specs/inline-layout-toolbar.md.)
test.describe('layout direct manipulation (specs/editor-redesign.md, Phase 6)', () => {
  test('the gap above the first layout inserts a one-column layout there, renumbering the rest', async ({
    page,
  }) => {
    await expect(page.locator('.layout-single')).toHaveCount(1);

    await page
      .getByRole('button', { name: 'Insert one-column layout at position 1' })
      .click();

    await expect(page.locator('.layout-single')).toHaveCount(2);
    // The new layout is inserted first (and empty); the prepopulated
    // resume shifts down to second -- so the first layout now has no
    // blocks and none of the prepopulated content.
    const firstLayout = page.locator('.layout-single').first();
    await expect(firstLayout.locator('[role="group"]')).toHaveCount(0);
    await expect(
      firstLayout.locator(':text("Monkey D. Luffy")'),
    ).toHaveCount(0);
  });

  test('the gap below the last layout inserts a two-column layout at the end', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: 'Insert two-column layout at position 2' })
      .click();

    await expect(page.locator('.layout-double')).toHaveCount(1);
    // The two-column layout is appended at the end; the prepopulated
    // content stays in the first layout, untouched.
    await expect(
      page.locator('.layout-single').first().locator(':text("Monkey D. Luffy")').first(),
    ).toBeVisible();
  });

  test('has no automatically detectable accessibility violations with the inserters revealed', async ({
    page,
  }) => {
    // Focus (not just hover) reveals the inserters -- also proves the
    // keyboard path works.
    await page
      .getByRole('button', { name: 'Insert one-column layout at position 1' })
      .focus();

    const AxeBuilder = (await import('@axe-core/playwright')).default;
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

// Phase 7: move up/down is zone-aware -- an item only ever swaps with
// the nearest item in its *own* zone, never silently reordering
// relative to a different layout's content in the flat items array.
test.describe('zone-aware content reordering (specs/editor-redesign.md, Phase 7)', () => {
  test("moving a block up skips other layouts' items and swaps within its own zone", async ({
    page,
  }) => {
    // A second layout whose block sits between the first layout's items
    // in the flat array: [ ...prepopulated (L1), Marker (L2), Mover (L1) ].
    await addSingleLayout(page);
    const layout2 = page.locator('.layout-single').last();
    await layout2.getByRole('button', { name: '+ Add block' }).click();
    await page.getByRole('menuitem', { name: 'Section heading' }).click();
    await page.locator('#canvas-edit-panel input[name="header"]').fill('Marker');

    const layout1 = page.locator('.layout-single').first();
    await layout1.getByRole('button', { name: '+ Add block' }).click();
    await page.getByRole('menuitem', { name: 'Section heading' }).click();
    const mover = layout1.locator('[role="group"]').last();
    await page.locator('#canvas-edit-panel input[name="header"]').fill('Mover');

    // One press. The flat-adjacent item is Marker (layout 2) -- the old
    // splice would have swapped with it invisibly, making the first
    // press appear to do nothing.
    await mover.getByRole('button', { name: 'Move block up' }).click();

    // Mover moved above layout 1's last prepopulated block...
    await expect(layout1.locator('[role="group"]').last()).toContainText(
      'Foods:',
    );
    await expect(
      layout1.locator('[role="group"]').nth(-2),
    ).toContainText('Mover');
    // ...and layout 2 is untouched.
    await expect(layout2.locator('[role="group"]')).toContainText('Marker');
  });
});
