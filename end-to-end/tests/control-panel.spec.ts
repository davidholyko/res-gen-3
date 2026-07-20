import path from 'node:path';

import { addSingleLayout, clearResume, expect, test } from './fixtures';

test.describe('control panel', () => {
  test('File/View menus open on click and close on Escape', async ({
    page,
  }) => {
    // No Edit menu anymore: add-layout moved onto the canvas beside
    // "+ Add block" (specs/add-layout-beside-add-block.md).
    for (const [menu, item] of [
      ['File', 'Download JSON'],
      ['View', 'Open PDF View'],
    ] as const) {
      await page.getByText(menu, { exact: true }).click();
      await expect(page.getByText(item)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByText(item)).not.toBeVisible();
    }
  });

  test('the canvas adds layouts (no menus involved)', async ({ page }) => {
    const before = await page.locator('.layout-single').count();

    await addSingleLayout(page);
    await expect(page.locator('.layout-single')).toHaveCount(before + 1);
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

    // Downloading a JSON leaves the File menu open; close it before
    // touching the canvas.
    await page.keyboard.press('Escape');

    // Wipe state, then re-import the exported file -- the resume should
    // come back exactly as it was exported.
    await clearResume(page);

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
