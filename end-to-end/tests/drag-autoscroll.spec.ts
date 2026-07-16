import { addSingleLayout, expect, test } from './fixtures';

// Happy-path coverage for specs/editor-redesign.md, Phase 2: dragging
// near the top/bottom viewport edge auto-scrolls the page, reported
// directly by a user who couldn't reach an off-screen target mid-drag.
// Originally exercised via ribbon-item drags; since the ribbon retired
// (Phase 6) the surviving drag surface is a layout header being
// reordered, which this now drives. Native HTML5 drag-and-drop doesn't
// auto-scroll on its own, so this exercises a real, multi-step drag (not
// `dragTo()`'s single-shot helper, which can't pause mid-gesture) via
// the low-level mouse API.
test.describe('drag auto-scroll', () => {
  test.beforeEach(async ({ page }) => {
    // A short viewport, deliberately overriding the suite's default tall
    // one, so the page is reliably taller than the viewport after adding
    // a few layouts.
    await page.setViewportSize({ width: 1280, height: 800 });
    for (let i = 0; i < 6; i++) {
      await addSingleLayout(page);
    }
    // addSingleLayout clicks the last "+ Add layout" control, which
    // Playwright scrolls into view once layouts run past the fold --
    // reset so each test starts from a known scrollY of 0.
    await page.evaluate(() => window.scrollTo(0, 0));
  });

  test('holding a drag near the bottom edge scrolls the page down', async ({
    page,
  }) => {
    const scrollYBefore = await page.evaluate(() => window.scrollY);
    expect(scrollYBefore).toBe(0);

    const source = page.getByTitle('Drag to move Layout 1');
    const box = (await source.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // A short move first to cross HTML5 DnD's own drag-start threshold,
    // then to near the bottom edge of the (800px tall) viewport.
    await page.mouse.move(
      box.x + box.width / 2,
      box.y + box.height / 2 + 10,
      { steps: 5 },
    );
    await page.mouse.move(640, 790, { steps: 10 });

    await expect
      .poll(async () => page.evaluate(() => window.scrollY), {
        timeout: 3000,
      })
      .toBeGreaterThan(0);

    await page.mouse.up();
  });

  test('holding a drag near the top edge scrolls the page up', async ({
    page,
  }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const scrollYBefore = await page.evaluate(() => window.scrollY);
    expect(scrollYBefore).toBeGreaterThan(0);

    // The page is scrolled to the bottom, so grab the last layout's
    // header -- the only one reliably in view.
    const source = page.getByTitle('Drag to move Layout 7');
    const box = (await source.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2,
      box.y + box.height / 2 + 10,
      { steps: 5 },
    );
    await page.mouse.move(640, 5, { steps: 10 });

    await expect
      .poll(async () => page.evaluate(() => window.scrollY), {
        timeout: 3000,
      })
      .toBeLessThan(scrollYBefore);

    await page.mouse.up();
  });

  test('releasing the drag stops the auto-scroll', async ({ page }) => {
    const source = page.getByTitle('Drag to move Layout 1');
    const box = (await source.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2,
      box.y + box.height / 2 + 10,
      { steps: 5 },
    );
    await page.mouse.move(640, 790, { steps: 10 });

    await expect
      .poll(async () => page.evaluate(() => window.scrollY), {
        timeout: 3000,
      })
      .toBeGreaterThan(0);

    await page.mouse.up();

    // Chromium has some native drag auto-scroll of its own (confirmed
    // live, independent of this feature's own component) that carries a
    // little momentum past the actual mouseup, so this doesn't assert an
    // instantaneous freeze -- it asserts scrolling isn't perpetual: give
    // any momentum time to settle, then confirm scrollY has actually
    // stabilized (not still climbing) rather than growing forever.
    await page.waitForTimeout(500);
    const settled = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(settled);
  });

  test('dragging in the middle of the viewport does not scroll the page', async ({
    page,
  }) => {
    const source = page.getByTitle('Drag to move Layout 1');
    const box = (await source.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width / 2,
      box.y + box.height / 2 + 10,
      { steps: 5 },
    );
    await page.mouse.move(640, 400, { steps: 10 });
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.mouse.up();
  });
});
