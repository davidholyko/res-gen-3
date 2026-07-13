import { addSingleLayout, expect, test } from './fixtures';

test.describe('drag-and-drop', () => {
  test('dragging an editor card onto a layout places its content there', async ({
    page,
  }) => {
    await addSingleLayout(page);
    const newLayout = page.locator('.layout-single').last();
    await expect(newLayout.locator('.macro-manager > *')).toHaveCount(0);

    // The draggable region is the whole top bar (draggable="true"),
    // registered as react-dnd's HTML5 drag source in BaseEditor.
    const source = page
      .locator('.paragraph-editor')
      .locator('div[draggable="true"]')
      .first();

    await source.dragTo(newLayout);

    await expect(newLayout.locator('.macro-manager > *')).toHaveCount(1);
    await expect(newLayout.locator('p')).toContainText('young and ambitious');
  });

  test('dragging onto a specific layout does not affect other layouts', async ({
    page,
  }) => {
    await addSingleLayout(page);
    await addSingleLayout(page);
    const layouts = page.locator('.layout-single');
    const firstBefore = await layouts
      .nth(0)
      .locator('.macro-manager > *')
      .count();
    const secondBefore = await layouts
      .nth(1)
      .locator('.macro-manager > *')
      .count();

    const source = page
      .locator('.header-editor')
      .locator('div[draggable="true"]')
      .first();
    await source.dragTo(layouts.last());

    await expect(layouts.nth(0).locator('.macro-manager > *')).toHaveCount(
      firstBefore,
    );
    await expect(layouts.nth(1).locator('.macro-manager > *')).toHaveCount(
      secondBefore,
    );
    await expect(layouts.last().locator('.macro-manager > *')).toHaveCount(1);
  });
});
