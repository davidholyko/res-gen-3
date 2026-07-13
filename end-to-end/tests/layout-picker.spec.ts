import { addSingleLayout, expect, test } from './fixtures';

// The "Add to layout" picker is the non-drag alternative WCAG SC 2.5.7
// requires for the drag-and-drop content-placement flow (see
// specs/port-res-gen-2.md's audit). These drive it entirely through
// clicks/keyboard on the picker + Add button -- no drag gesture at all.
test.describe('layout picker (non-drag content placement)', () => {
  test('adding content with no layout picked targets the last layout by default', async ({
    page,
  }) => {
    await addSingleLayout(page);
    const newLayout = page.locator('.layout-single').last();

    await page
      .locator('.paragraph-editor')
      .getByLabel('Add Macro Button')
      .click();

    await expect(newLayout.locator('.macro-manager > *')).toHaveCount(1);
  });

  test('picking an earlier layout places content there instead of the last one', async ({
    page,
  }) => {
    await addSingleLayout(page);
    await addSingleLayout(page);
    const layouts = page.locator('.layout-single');
    const targetLayout = layouts.nth(1); // first newly-added layout, not the last

    const editor = page.locator('.header-editor');
    await editor.getByLabel('Add to layout').selectOption({ label: 'Layout 2' });
    await editor.getByLabel('Add Macro Button').click();

    await expect(targetLayout.locator('.macro-manager > *')).toHaveCount(1);
    await expect(layouts.last().locator('.macro-manager > *')).toHaveCount(0);
  });

  test('a DOUBLE layout offers separate Left/Right zones and targets the chosen side', async ({
    page,
  }) => {
    await page.getByText('Edit', { exact: true }).click();
    await page.getByText('Add Double Column Layout').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.layout-double')).toHaveCount(1);

    const editor = page.locator('.any-list-editor');
    const picker = editor.getByLabel('Add to layout');
    await expect(picker.locator('option')).toContainText([
      'Layout 2 (Left)',
      'Layout 2 (Right)',
    ]);

    await picker.selectOption({ label: 'Layout 2 (Right)' });
    await editor.getByLabel('Add Macro Button').click();

    const doubleLayout = page.locator('.layout-double');
    const [leftZone, rightZone] = await doubleLayout
      .locator('.layout-single')
      .all();
    await expect(leftZone.locator('.macro-manager > *')).toHaveCount(0);
    await expect(rightZone.locator('.macro-manager > *')).toHaveCount(1);
  });

  test('the picker and add button are disabled when no layout exists', async ({
    page,
  }) => {
    // The prepopulated example resume always has a layout, so remove it
    // via the Edit menu to reach the true "no layouts" state.
    await page.getByText('Edit', { exact: true }).click();
    await page.getByText('Remove Last Layout').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.layout-single')).toHaveCount(0);

    const editor = page.locator('.contact-editor');
    await expect(editor.getByLabel('Add to layout')).toBeDisabled();
    await expect(editor.getByLabel('Add Macro Button')).toBeDisabled();
  });
});
