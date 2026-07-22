import path from 'node:path';

import { addSingleLayout, clearResume, expect, test } from './fixtures';

test.describe('control panel', () => {
  test('the File menu opens on click and closes on Escape', async ({
    page,
  }) => {
    // File is the only control-bar menu now: the Edit menu's add-layout
    // moved onto the canvas (specs/add-layout-beside-add-block.md), and
    // the View menu was retired -- its one action is the top-level "PDF"
    // button (specs/edit-with-live-pdf-preview.md).
    await page.getByText('File', { exact: true }).click();
    await expect(page.getByText('Download JSON')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Download JSON')).not.toBeVisible();
  });

  test('layouts are added through the restructure view', async ({ page }) => {
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
