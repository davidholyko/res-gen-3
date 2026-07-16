import { addDoubleLayout, addSingleLayout, expect, test } from './fixtures';

// Happy-path coverage for specs/editor-redesign.md, Phase 6: every
// layout zone carries its own "+ Add block" control -- adding content
// happens at the layout it lands in, blocks start blank, and the menu
// speaks plain language (no internal type names).
test.describe('per-zone Add block (specs/editor-redesign.md, Phase 6)', () => {
  test('every zone shows the control, including both halves of a double layout', async ({
    page,
  }) => {
    await addDoubleLayout(page);

    // 1 prepopulated single + 2 halves of the new double.
    await expect(page.getByRole('button', { name: '+ Add block' })).toHaveCount(
      3,
    );
  });

  test('the menu lists the five block types in plain language', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '+ Add block' }).first().click();

    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Contact details',
      'Section heading',
      'Paragraph',
      'Experience',
      'Custom list',
    ]);
    await expect(menu).not.toContainText('AnyList');
  });

  test('picking a type inserts a blank block in that zone with its form open and focused', async ({
    page,
  }) => {
    // A fresh empty layout keeps "which zone did it land in" unambiguous.
    await addSingleLayout(page);
    const newLayout = page.locator('.layout-single').last();

    await newLayout.getByRole('button', { name: '+ Add block' }).click();
    await page.getByRole('menuitem', { name: 'Section heading' }).click();

    // The block landed in the new layout, focused, with its form open in
    // the canvas-side panel (specs/canvas-edit-panel.md) -- and blank,
    // not seeded with example content.
    const block = newLayout.locator('[role="group"]').first();
    const input = page.locator('#canvas-edit-panel input[name="header"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');

    await input.fill('Skills');
    await expect(block.locator('h2, h1, h3, p, span').first()).toContainText(
      'Skills',
    );
  });

  test('a blank contact block starts empty and only saves once valid', async ({
    page,
  }) => {
    await addSingleLayout(page);
    const newLayout = page.locator('.layout-single').last();

    await newLayout.getByRole('button', { name: '+ Add block' }).click();
    await page.getByRole('menuitem', { name: 'Contact details' }).click();

    const block = newLayout.locator('[role="group"]').first();
    const panel = page.locator('#canvas-edit-panel');
    await expect(panel.locator('input[name="name"]')).toHaveValue('');

    // Filling just the name flags the still-invalid email inline...
    await panel.locator('input[name="name"]').fill('Ada Lovelace');
    await expect(panel.getByRole('alert')).toContainText(/valid email/i);

    // ...and completing the email saves the block onto the canvas.
    await panel.locator('input[name="email"]').fill('ada@example.com');
    await expect(panel.getByRole('alert')).toHaveCount(0);
    await expect(block.locator('h1')).toContainText('Ada Lovelace');
  });

  test('a block added into a double-layout half lands in that half only', async ({
    page,
  }) => {
    await addDoubleLayout(page);

    const double = page.locator('.layout-double').last();
    const left = double.locator('.layout-single').first();
    const right = double.locator('.layout-single').last();

    await left.getByRole('button', { name: '+ Add block' }).click();
    await page.getByRole('menuitem', { name: 'Paragraph' }).click();

    await expect(left.locator('[role="group"]')).toHaveCount(1);
    await expect(right.locator('[role="group"]')).toHaveCount(0);
  });
});


// specs/add-layout-beside-add-block.md: "+ Add layout" lives beside each
// layout's "+ Add block", and inserts the new layout directly below its
// host layout.
test.describe('per-layout Add layout (specs/add-layout-beside-add-block.md)', () => {
  test('every layout footer pairs "+ Add block" with "+ Add layout"', async ({
    page,
  }) => {
    const layout1 = page.locator('.layout-single').first();
    await expect(
      layout1.getByRole('button', { name: '+ Add block' }),
    ).toBeVisible();
    await expect(
      layout1.getByRole('button', { name: '+ Add layout' }),
    ).toBeVisible();
  });

  test('picking a column count inserts the new layout directly below its host', async ({
    page,
  }) => {
    // Give the first layout a marker block so we can tell layouts apart.
    const layout1 = page.locator('.layout-single').first();
    await layout1.getByRole('button', { name: '+ Add block' }).click();
    await page.getByRole('menuitem', { name: 'Section heading' }).click();
    await page
      .locator('#canvas-edit-panel input[name="header"]')
      .fill('First Layout Marker');
    await page.locator('header').first().click();

    // Add a layout below layout 1 (the last one here).
    await layout1.getByRole('button', { name: '+ Add layout' }).click();
    await page.getByRole('menuitem', { name: 'One column' }).click();

    await expect(page.locator('.layout-single')).toHaveCount(2);
    await expect(page.locator('.layout-single').first()).toContainText(
      'First Layout Marker',
    );
    await expect(
      page.locator('.layout-single').last().locator('[role="group"]'),
    ).toHaveCount(0);
  });

  test('a double layout carries one "+ Add layout" for the whole layout', async ({
    page,
  }) => {
    await addDoubleLayout(page);
    const wrapper = page
      .locator('[data-layout-id]')
      .filter({ has: page.locator('.layout-double') })
      .last();
    await expect(
      wrapper.getByRole('button', { name: '+ Add layout' }),
    ).toHaveCount(1);
    await expect(
      wrapper.getByRole('button', { name: '+ Add block' }),
    ).toHaveCount(2);
  });
});
