import path from 'node:path';

import { addSingleLayout, expect, removeLastLayout, test } from './fixtures';

test.describe('control panel', () => {
  test('File/Edit/View menus open on click and close on Escape', async ({
    page,
  }) => {
    for (const [menu, item] of [
      ['File', 'Download JSON'],
      ['Edit', 'Add Single Column Layout'],
      ['View', 'Open PDF View'],
    ] as const) {
      await page.getByText(menu, { exact: true }).click();
      await expect(page.getByText(item)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByText(item)).not.toBeVisible();
    }
  });

  test('Edit menu adds layouts; the canvas Remove layout link removes them', async ({
    page,
  }) => {
    const before = await page.locator('.layout-single').count();

    await addSingleLayout(page);
    await expect(page.locator('.layout-single')).toHaveCount(before + 1);

    // Removal is canvas-only now -- the Edit menu's "Remove Last Layout"
    // retired with specs/editor-redesign.md Phase 6.
    await removeLastLayout(page);
    await expect(page.locator('.layout-single')).toHaveCount(before);
  });

  test('View menu toggles the editor panel visibility', async ({ page }) => {
    const editorManager = page.locator('#editor-manager');
    await expect(editorManager).not.toHaveClass(/hidden/);

    await page.getByText('View', { exact: true }).click();
    await page.getByText('Toggle Editor').click();

    await expect(editorManager).toHaveClass(/hidden/);
  });

  test('JSON export downloads a file, and re-importing it round-trips the state', async ({
    page,
  }) => {
    await page.getByText('File', { exact: true }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByText('Download JSON').click(),
    ]);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const savedPath = path.join(
      test.info().outputDir,
      'exported-resume.json',
    );
    await download.saveAs(savedPath);

    // Wipe state, then re-import the exported file -- the resume should
    // come back exactly as it was exported.
    await removeLastLayout(page);
    await expect(page.locator('.layout-single')).toHaveCount(0);

    // The upload <input> only exists in the DOM while its menu is open
    // (BaseMenu doesn't render dropdown items when closed).
    await page.getByText('File', { exact: true }).click();
    await page.locator('#res-gen-file-input').setInputFiles(savedPath);

    await expect(page.locator('.layout-single')).toHaveCount(1);
    await expect(page.locator('.layout-single h1')).toContainText(
      'Monkey D. Luffy',
    );
  });
});
