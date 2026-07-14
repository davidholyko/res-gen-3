import { expect, test } from './fixtures';

// Happy-path coverage for specs/ribbon-layout.md. Two real regressions
// were caught building this (not hypothetical): the ribbon's narrower
// items moved the drag gesture's default center-click point onto the
// "Add to layout" <select> instead of the drag handle, and the Edit/
// File/View menu dropdowns rendered *behind* the ribbon's floating
// panels in their shared stacking context. Both are covered below, not
// just the layout shape itself.
test.describe('ribbon layout', () => {
  test('the 5 template editors render in a horizontal bar above the canvas', async ({
    page,
  }) => {
    const ribbon = page.locator('#editor-manager');
    const canvas = page.locator('#layout-manager');
    const ribbonBox = await ribbon.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(ribbonBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();
    // The ribbon sits entirely above the canvas, not beside it.
    expect(ribbonBox!.y + ribbonBox!.height).toBeLessThanOrEqual(
      canvasBox!.y + 1,
    );
  });

  test('expanding a ribbon item floats its editor over the canvas without shifting it down', async ({
    page,
  }) => {
    const canvas = page.locator('#layout-manager');
    const yBefore = (await canvas.boundingBox())!.y;

    await page.locator('.contact-editor [role="button"]').click();
    await expect(
      page.locator('.contact-editor input[name="name"]'),
    ).toBeVisible();

    const yAfter = (await canvas.boundingBox())!.y;
    expect(yAfter).toBe(yBefore);
  });

  test('dragging from a ribbon item still works (the compact layout regression)', async ({
    page,
  }) => {
    const target = page.locator('.layout-single').last();
    const before = await target.locator('.macro-manager > *').count();

    const source = page
      .locator('.paragraph-editor')
      .locator('div[draggable="true"]')
      .first();
    await source.dragTo(target);

    await expect(target.locator('.macro-manager > *')).toHaveCount(
      before + 1,
    );
  });

  test('a control panel dropdown renders above the ribbon, not behind it (the stacking regression)', async ({
    page,
  }) => {
    await page.getByText('Edit', { exact: true }).click();

    const menuItem = page.getByText('Add Single Column Layout');
    await expect(menuItem).toBeVisible();
    // A real click, not just a visibility check -- this is what actually
    // failed before the z-index fix (the ribbon intercepted the click
    // even though the text was technically "visible").
    await menuItem.click();
    await page.keyboard.press('Escape');

    await expect(page.locator('.layout-single')).toHaveCount(2);
  });
});
