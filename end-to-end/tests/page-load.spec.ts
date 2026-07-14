import { collectConsoleErrors, expect, test } from './fixtures';

test.describe('page load', () => {
  test('renders the editor UI with no console errors', async ({ page }) => {
    const errors = await collectConsoleErrors(page, async () => {
      await page.reload();
      await page.waitForSelector('#res-gen', { timeout: 15000 });
    });

    // The client-side "Loading..." gate (src/app/page.tsx) must have
    // resolved -- it waits on window.document.styleSheets before
    // rendering the real app.
    await expect(page.getByText('Loading...')).toHaveCount(0);
    await expect(page.getByText('Res Gen 3')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('shows the JSON editors panel and prepopulated resume content', async ({
    page,
  }) => {
    // Contact/Header/Experience have field specs now
    // (specs/editor-redesign.md, Phases 1/3/4) -- their `text`-kind
    // fields render as <input>s, not a <textarea>. Paragraph's field is
    // the `textarea` kind, and AnyList is the one type still on the
    // raw-JSON editor.
    await expect(page.locator('.contact-editor input[name="name"]')).toBeVisible();
    await expect(page.locator('.header-editor input[name="header"]')).toBeVisible();
    await expect(page.locator('.paragraph-editor textarea')).toBeVisible();
    await expect(
      page.locator('.experience-editor input[name="title"]'),
    ).toBeVisible();
    await expect(page.locator('.any-list-editor textarea')).toBeVisible();

    // Fresh localStorage falls back to a prepopulated example resume
    // (src/utils/prepopulate-util.ts) rather than an empty layout area.
    await expect(page.locator('.layout-single')).toHaveCount(1);
    await expect(page.locator('.layout-single h1')).toContainText(
      'Monkey D. Luffy',
    );
  });

  test('has the correct document title', async ({ page }) => {
    await expect(page).toHaveTitle('Res Gen 3');
  });
});
