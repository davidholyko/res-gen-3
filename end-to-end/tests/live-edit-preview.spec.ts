import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './fixtures';

// Happy-path coverage for specs/edit-with-live-pdf-preview.md: editing a
// block opens its form in a panel docked beside the live PDF preview,
// and the preview re-renders (double-buffered) as fields change. The
// preview is an inline view now, not a react-modal, and it closes on
// Escape (the exit ✕ button and page stepper were removed -- see the
// spec's "Later change" notes).
test.describe('edit beside live PDF preview', () => {
  // Opens the editing view on the prepopulated Summary header block and
  // returns the inline PDF-view container.
  async function openEditingView(page: import('@playwright/test').Page) {
    const macro = page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Summary' })
      .first();
    await macro.click();
    await macro.getByText('Edit with preview').click();

    const view = page.getByTestId('pdf-view');
    await expect(view).toBeVisible();
    return view;
  }

  test('opens with the block form docked beside the preview, focus in the first field', async ({
    page,
  }) => {
    const view = await openEditingView(page);

    const input = view.locator('input[name="header"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('Summary');
    await expect(input).toBeFocused();
    // The preview area is mounted alongside, not covered: the panel and
    // the frame region are siblings in the same row.
    await expect(view.getByRole('navigation', { name: 'Blocks' })).toBeVisible();
  });

  test('typing updates the live preview without further action', async ({
    page,
  }) => {
    const view = await openEditingView(page);

    // Wait for the initial render to land in the visible frame.
    const visible = view.locator('[data-testid="pdf-frame-visible"]');
    await expect(visible).toBeVisible({ timeout: 10000 });
    const srcBefore = await visible.getAttribute('src');

    await view.locator('input[name="header"]').fill('Career Highlights');

    // The ~450ms live debounce + render + double-buffered swap: the
    // visible frame's blob URL changes with no further user action.
    await expect
      .poll(async () => visible.getAttribute('src'), { timeout: 15000 })
      .not.toBe(srcBefore);
  });

  test('the block picker switches which form is docked, keeping the same session', async ({
    page,
  }) => {
    const view = await openEditingView(page);
    const picker = view.getByRole('navigation', { name: 'Blocks' });

    await picker.getByText('Contact details').click();

    await expect(view.locator('input[name="name"]')).toBeVisible();
    await expect(view.locator('input[name="header"]')).toHaveCount(0);
  });

  test('closing after an edit offers a "Block edited" undo that reverts the session', async ({
    page,
  }) => {
    const view = await openEditingView(page);
    await view.locator('input[name="header"]').fill('Changed Title');
    // Close via the control-bar PDF button: the always-visible toggle for
    // this view, and the primary close affordance while a field is focused
    // (a focused form field swallows Escape -- use-stop-keydown-propagation.ts).
    await page.getByRole('button', { name: 'PDF' }).click();
    await expect(view).toHaveCount(0);

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
    await page.getByRole('button', { name: 'PDF' }).click();
    await expect(page.getByTestId('pdf-view')).toHaveCount(0);

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
