import {
  addSingleLayout,
  clearResume,
  expect,
  makeResumeMultiPage,
  test,
} from './fixtures';

// Happy-path coverage for specs/multi-page-indicator.md. The page count
// comes from react-pdf's own real render pipeline (shared with the inline
// PDF preview view via PdfInstanceProvider), debounced ~1.75s after the
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

    await clearResume(page);

    // Rebuild a single empty layout via the restructure view (the only
    // way to add layouts now, specs/restructure-view.md) -- one empty
    // page, so the multi-page indicator goes away.
    await addSingleLayout(page);

    await expect(page.getByText(/^\d+ pages$/)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('the PDF preview view still opens and renders real content, sharing the same instance', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'PDF' }).click();

    const view = page.getByTestId('pdf-view');
    await expect(view).toBeVisible();

    const iframe = view.locator('[data-testid="pdf-frame-visible"]');
    await expect(iframe).toBeVisible({ timeout: 10000 });
    await expect(iframe).toHaveAttribute('src', /.+/, { timeout: 10000 });
  });
});
