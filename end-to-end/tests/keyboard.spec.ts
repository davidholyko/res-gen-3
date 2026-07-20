import { expect, test } from './fixtures';

type FocusInfo = {
  tag: string;
  ariaLabel: string | null;
  text: string;
  // Distinguishes adjacent same-looking controls: a focused contact
  // block's form is 8 consecutive <input>s with no text content and no
  // aria-label (each is labelled by a separate <label> element), which
  // the trap check below would otherwise misread as focus being stuck
  // on one element.
  id: string;
};

async function currentFocus(page: import('@playwright/test').Page) {
  return page.evaluate<FocusInfo>(() => {
    const el = document.activeElement as HTMLElement | null;
    return {
      tag: el?.tagName ?? '',
      ariaLabel: el?.getAttribute('aria-label') ?? null,
      text: (el?.textContent ?? '').trim().slice(0, 40),
      id: el?.id ?? '',
    };
  });
}

/**
 * Tabs until focus lands on an element whose text is `text`, skipping any
 * leading stops. `next dev`'s error-overlay portal (an empty, focusable
 * element the production build doesn't have -- this suite always runs
 * against `next dev`, see specs/end-to-end-testing.md) is one extra stop
 * before the app's own first control; this makes every test robust to
 * however many of those precede the real content, rather than hardcoding
 * a specific count.
 */
async function tabUntil(
  page: import('@playwright/test').Page,
  text: string,
  maxTabs = 15,
) {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    if ((await currentFocus(page)).text === text) return;
  }
  throw new Error(`Never reached an element with text "${text}"`);
}

test.describe('keyboard navigation', () => {
  test('Tab reaches the control panel menus, then the Restructure button, in order', async ({
    page,
  }) => {
    await tabUntil(page, 'File');

    const seen: FocusInfo[] = [];
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('Tab');
      seen.push(await currentFocus(page));
    }

    // File -> View -> Restructure. The canvas itself is display-only now
    // (add controls moved into the restructure view,
    // specs/restructure-view.md), so Restructure is the last control-bar
    // stop before the canvas content.
    expect(seen.map((f) => f.text)).toEqual(['View', 'Restructure']);
  });

  test('no keyboard trap across a long Tab run', async ({ page }) => {
    let previous: FocusInfo | null = null;
    let stuckCount = 0;

    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const current = await currentFocus(page);
      if (
        previous &&
        current.tag === previous.tag &&
        current.text === previous.text &&
        current.ariaLabel === previous.ariaLabel &&
        current.id === previous.id
      ) {
        stuckCount += 1;
      } else {
        stuckCount = 0;
      }
      // Two consecutive Tab presses landing on the literal same element is
      // the signature of a trap (focus stuck, unable to advance).
      expect(stuckCount, `stuck on ${JSON.stringify(current)}`).toBeLessThan(
        2,
      );
      previous = current;
    }
  });

  test('Enter opens a control panel menu from the keyboard', async ({
    page,
  }) => {
    await tabUntil(page, 'File');
    await expect(
      page.locator('[role="button"]').filter({ hasText: 'File' }),
    ).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.getByText('Download JSON')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Download JSON')).not.toBeVisible();
  });

  test("focusing a block reveals its controls and lands typing focus in the edit panel", async ({
    page,
  }) => {
    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.focus();

    // Reveals MacroTopBar (move up/down/delete)...
    await expect(macro.getByLabel('Delete block')).toBeVisible();
    // ...while typing focus moves into the docked panel's first field
    // (specs/canvas-edit-panel.md) -- the block is immediately typable.
    const firstField = page
      .locator('#canvas-edit-panel input, #canvas-edit-panel textarea')
      .first();
    await expect(firstField).toBeFocused();

    // And Tab keeps advancing from there -- no trap.
    await page.keyboard.press('Tab');
    await expect(firstField).not.toBeFocused();
  });
});
