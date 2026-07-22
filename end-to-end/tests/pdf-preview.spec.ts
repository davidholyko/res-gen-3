import { clearResume, expect, test } from './fixtures';

// The PDF preview is an inline view now (specs/edit-with-live-pdf-preview.md,
// "Later change"): the "PDF" control-bar button replaces the editor area
// with the preview instead of opening a react-modal, the control bar stays
// visible above it, and it closes on Escape or by toggling the PDF button
// (there is no exit ✕ button, and no page stepper).
test.describe('PDF preview view', () => {
  test('opens, renders a real PDF in the iframe, and is properly labelled', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'PDF' }).click();

    const view = page.getByTestId('pdf-view');
    await expect(view).toBeVisible();

    // The visible frame specifically: the preview is double-buffered
    // now (specs/edit-with-live-pdf-preview.md), so a hidden staging
    // iframe can coexist with it during refreshes.
    const iframe = view.locator('[data-testid="pdf-frame-visible"]');
    await expect(iframe).toBeVisible({ timeout: 10000 });
    const title = await iframe.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title).toMatch(/\.pdf$/);

    // The iframe's blob URL is only resolvable from inside the page's own
    // JS context (not via an external HTTP fetch), so fetch and inspect
    // the raw bytes from there -- same check ("%PDF-1." magic header) used
    // to manually verify PDF output during the res-gen-2 port. PDF
    // generation (usePDF) is async, so the `src` attribute isn't there
    // the instant the iframe mounts -- wait for it with a real assertion
    // rather than a one-shot read.
    await expect(iframe).toHaveAttribute('src', /.+/);
    const src = await iframe.getAttribute('src');
    const header = await page.evaluate(async (url) => {
      const res = await fetch(url as string);
      const buf = await res.arrayBuffer();
      return new TextDecoder().decode(new Uint8Array(buf).slice(0, 8));
    }, src);
    expect(header).toMatch(/^%PDF-1\./);
  });

  test('replaces the canvas while the control bar stays visible', async ({
    page,
  }) => {
    // The canvas is present to begin with.
    await expect(page.locator('.layout-single')).not.toHaveCount(0);

    await page.getByRole('button', { name: 'PDF' }).click();

    // The inline view takes over the editor area -- the canvas is gone --
    // but the control bar (and its PDF button) stay put above it, unlike
    // the old modal that covered the whole app.
    await expect(page.getByTestId('pdf-view')).toBeVisible();
    await expect(page.locator('.layout-single')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible();
  });

  test('closes on Escape and by toggling the PDF button', async ({ page }) => {
    const pdfButton = page.getByRole('button', { name: 'PDF' });
    const view = page.getByTestId('pdf-view');

    await pdfButton.click();
    await expect(view).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(view).toHaveCount(0);

    // Reopen, then close by pressing the (now active) PDF button again.
    await pdfButton.click();
    await expect(view).toBeVisible();
    await pdfButton.click();
    await expect(view).toHaveCount(0);
  });

  test('the PDF button is disabled when there is nothing to preview', async ({
    page,
  }) => {
    // Clear the resume to reach the true empty state.
    await clearResume(page);

    await expect(page.getByRole('button', { name: 'PDF' })).toBeDisabled();
  });
});
