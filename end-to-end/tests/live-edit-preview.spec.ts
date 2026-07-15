import AxeBuilder from '@axe-core/playwright';

import { expect, makeResumeMultiPage, test } from './fixtures';

// Happy-path coverage for specs/edit-with-live-pdf-preview.md: editing a
// block opens its form in a panel docked beside the live PDF preview,
// and the preview re-renders (double-buffered, page-anchored) as fields
// change.
test.describe('edit beside live PDF preview', () => {
  // Opens the editing view on the prepopulated Summary header block.
  async function openEditingView(page: import('@playwright/test').Page) {
    const macro = page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Summary' })
      .first();
    await macro.click();
    await macro.getByText('Edit with preview').click();

    const modal = page.locator('.ReactModal__Content');
    await expect(modal).toBeVisible();
    return modal;
  }

  test('opens with the block form docked beside the preview, focus in the first field', async ({
    page,
  }) => {
    const modal = await openEditingView(page);

    const input = modal.locator('input[name="header"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('Summary');
    await expect(input).toBeFocused();
    // The preview area is mounted alongside, not covered: the panel and
    // the frame region are siblings in the same row.
    await expect(modal.getByRole('navigation', { name: 'Blocks' })).toBeVisible();
  });

  test('typing updates the live preview without further action', async ({
    page,
  }) => {
    const modal = await openEditingView(page);

    // Wait for the initial render to land in the visible frame.
    const visible = modal.locator('[data-testid="pdf-frame-visible"]');
    await expect(visible).toBeVisible({ timeout: 10000 });
    const srcBefore = await visible.getAttribute('src');

    await modal.locator('input[name="header"]').fill('Career Highlights');

    // The ~450ms live debounce + render + double-buffered swap: the
    // visible frame's blob URL changes with no further user action.
    await expect
      .poll(async () => visible.getAttribute('src'), { timeout: 15000 })
      .not.toBe(srcBefore);
  });

  test('the block picker switches which form is docked, keeping the same session', async ({
    page,
  }) => {
    const modal = await openEditingView(page);
    const picker = modal.getByRole('navigation', { name: 'Blocks' });

    await picker.getByText('Contact details').click();

    await expect(modal.locator('input[name="name"]')).toBeVisible();
    await expect(modal.locator('input[name="header"]')).toHaveCount(0);
  });

  test('the page stepper re-anchors the preview on a multi-page resume', async ({
    page,
  }) => {
    // The styled example resume fits one page; grow it to several so
    // the stepper appears.
    await makeResumeMultiPage(page);
    const modal = await openEditingView(page);

    const next = modal.getByLabel('Next page');
    await expect(next).toBeVisible({ timeout: 10000 });
    await next.click();

    await expect(modal.getByText(/^Page 2 of \d+$/)).toBeVisible();
    // The anchor reaches the frame: whichever frame loads next carries
    // the page fragment.
    await expect
      .poll(
        async () =>
          modal
            .locator('[data-testid="pdf-frame-visible"]')
            .getAttribute('src'),
        { timeout: 15000 },
      )
      .toContain('page=2');
  });

  test('closing after an edit offers a "Block edited" undo that reverts the session', async ({
    page,
  }) => {
    const modal = await openEditingView(page);
    await modal.locator('input[name="header"]').fill('Changed Title');
    await page.getByLabel('Exit PDF View Button').click();

    await expect(page.locator('.layout-single')).toContainText(
      'Changed Title',
    );

    const toast = page.getByRole('status').filter({ hasText: 'Block edited' });
    await toast.getByText('Undo', { exact: true }).click();

    await expect(page.locator('.layout-single')).toContainText('Summary');
    await expect(page.locator('.layout-single')).not.toContainText(
      'Changed Title',
    );
  });

  test('closing without an edit shows no undo toast', async ({ page }) => {
    await openEditingView(page);
    await page.getByLabel('Exit PDF View Button').click();

    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('has no automatically detectable accessibility violations with the editing view open', async ({
    page,
  }) => {
    await openEditingView(page);
    await expect(
      page.locator('[data-testid="pdf-frame-visible"]'),
    ).toBeVisible({ timeout: 10000 });

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
