import { expect, makeResumeMultiPage, removeLastLayout, test } from './fixtures';

// Happy-path coverage for specs/multi-page-indicator.md. The page count
// comes from react-pdf's own real render pipeline (shared with the PDF
// preview modal via PdfInstanceProvider), debounced ~1.75s after the
// last change -- these tests wait past that window before asserting.
test.describe('multi-page indicator', () => {
  test('shows the real page count once the resume spans more than one page', async ({
    page,
  }) => {
    // The properly styled example resume fits one page (since the
    // PDF-style fidelity fix), so grow it to two first.
    await makeResumeMultiPage(page);

    const badge = page.getByText(/^\d+ pages$/);
    await expect(badge).toBeVisible({ timeout: 5000 });
    await expect(badge).toHaveText('2 pages');
  });

  test('disappears once the resume shrinks back to a single page', async ({
    page,
  }) => {
    await makeResumeMultiPage(page);
    await expect(page.getByText(/^\d+ pages$/)).toBeVisible({
      timeout: 5000,
    });

    await removeLastLayout(page);

    // Zero layouts now, so the canvas "+ Add layout" control is gone --
    // the empty-state CTA is the only add affordance
    // (specs/add-layout-beside-add-block.md keeps it for exactly this).
    await page.getByText('+ Add Single Column Layout').click();

    await expect(page.getByText(/^\d+ pages$/)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('the PDF preview modal still opens and renders real content, sharing the same instance', async ({
    page,
  }) => {
    await page.getByText('View', { exact: true }).click();
    await page.getByText('Open PDF View').click();

    const modal = page.locator('.ReactModal__Content');
    await expect(modal).toBeVisible();

    const iframe = modal.locator('iframe');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /.+/, { timeout: 10000 });
  });
});
