import { expect, test } from './fixtures';

// Happy-path coverage for specs/canvas-edit-panel.md: the focused
// block's form docks beside the canvas instead of rendering inline
// beneath the block, so editing never reflows the preview.
test.describe('canvas edit panel', () => {
  const panel = (page: import('@playwright/test').Page) =>
    page.locator('#canvas-edit-panel');

  test('the canvas sits centered while idle and slides left while the panel is open', async ({
    page,
  }) => {
    const canvas = page.locator('#layout-manager');
    const before = (await canvas.boundingBox())!;
    // Idle: centered in the viewport (1280 wide in this suite).
    const viewport = page.viewportSize()!;
    expect(Math.abs(before.x + before.width / 2 - viewport.width / 2)).toBeLessThan(2);

    await page.locator('.layout-single [role="group"]').first().click();
    await expect(panel(page)).toBeVisible();
    // The gutter animates open (~300ms): the canvas slides left to make
    // room, its vertical position untouched.
    await expect
      .poll(async () => (await canvas.boundingBox())!.x)
      .toBeLessThan(before.x - 100);
    expect((await canvas.boundingBox())!.y).toBe(before.y);

    await panel(page).getByText('Done').click();
    await expect(panel(page)).toHaveCount(0);
    // And recenters once the panel closes.
    await expect
      .poll(async () => (await canvas.boundingBox())!.x)
      .toBe(before.x);
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

  test('a click whose mouseup drifts outside the block still opens (and keeps) its panel', async ({
    page,
  }) => {
    // Regression (user report): focusing a block reflows the page mid-
    // click -- the toolbar appears, the previously focused block
    // collapses, the browser may scroll the focused block into view --
    // so a real click's mousedown and mouseup can land on different
    // elements. The click event then targets their common ancestor,
    // outside every block, which used to read as "clicked outside" and
    // close the panel the same gesture had just opened. Exaggerated
    // here: press on the block, release over the page header.
    await page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Gears' })
      .first()
      .click();
    await expect(panel(page)).toBeVisible();

    const exp = page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Red Hair Pirates' })
      .first();
    const src = (await exp.boundingBox())!;
    await page.mouse.move(src.x + src.width / 2, src.y + 10);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(640, 20, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    await expect(panel(page)).toBeVisible();
    await expect(panel(page).locator('input[name="company"]')).toBeVisible();
  });

  test('focusing a block near the bottom of the page does not scroll the page to the top', async ({
    page,
  }) => {
    // Regression (user report): the docked panel is sticky near the top,
    // and it used to focus its first field with a plain focus() -- which
    // yanked the sticky panel (and the whole page) to the top the moment
    // you clicked a block near the bottom. A short viewport so the
    // one-page resume overflows and the page actually scrolls.
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(100);

    await page.locator('.layout-single [role="group"]').last().click();
    await expect(panel(page)).toBeVisible();

    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThan(50);
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
