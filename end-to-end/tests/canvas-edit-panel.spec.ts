import { expect, test } from './fixtures';

// Happy-path coverage for specs/canvas-edit-panel.md: the focused
// block's form docks beside the canvas instead of rendering inline
// beneath the block, so editing never reflows the preview.
test.describe('canvas edit panel', () => {
  const panel = (page: import('@playwright/test').Page) =>
    page.locator('#canvas-edit-panel');

  test('opening and closing the panel never moves the canvas', async ({
    page,
  }) => {
    const canvas = page.locator('#layout-manager');
    const before = (await canvas.boundingBox())!;

    await page.locator('.layout-single [role="group"]').first().click();
    await expect(panel(page)).toBeVisible();
    const whileOpen = (await canvas.boundingBox())!;

    expect(whileOpen.x).toBe(before.x);
    expect(whileOpen.y).toBe(before.y);

    await panel(page).getByText('Done').click();
    await expect(panel(page)).toHaveCount(0);
    const afterClose = (await canvas.boundingBox())!;
    expect(afterClose.x).toBe(before.x);
    expect(afterClose.y).toBe(before.y);
  });

  test('clicking into the panel keeps it open; clicking another block switches it', async ({
    page,
  }) => {
    // Focus the contact block: the panel shows its form.
    await page.locator('.layout-single [role="group"]').first().click();
    const nameInput = panel(page).locator('input[name="name"]');
    await expect(nameInput).toBeVisible();

    // Clicking (typing) inside the panel must not close it.
    await nameInput.click();
    await expect(panel(page)).toBeVisible();

    // Clicking a different block switches the docked form to it.
    await page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Summary' })
      .first()
      .click();
    await expect(panel(page).locator('input[name="header"]')).toBeVisible();
    await expect(panel(page).locator('input[name="name"]')).toHaveCount(0);
  });

  test('clicking empty canvas closes the panel and unfocuses the block', async ({
    page,
  }) => {
    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    await expect(panel(page)).toBeVisible();

    await page.locator('header').first().click();

    await expect(panel(page)).toHaveCount(0);
    await expect(macro.getByLabel('Delete block')).toHaveCount(0);
  });

  test('nothing renders inline inside a focused block anymore', async ({
    page,
  }) => {
    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();

    await expect(macro.getByLabel('Delete block')).toBeVisible();
    // The form fields live in the panel, not the block.
    await expect(macro.locator('input, textarea')).toHaveCount(0);
    await expect(panel(page).locator('input[name="name"]')).toBeVisible();
  });
});
