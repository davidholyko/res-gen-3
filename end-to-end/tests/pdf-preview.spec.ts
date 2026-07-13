import { expect, test } from './fixtures';

test.describe('PDF preview modal', () => {
  test('opens, renders a real PDF in the iframe, and is properly labelled', async ({
    page,
  }) => {
    await page.getByText('View', { exact: true }).click();
    await page.getByText('Open PDF View').click();

    const modal = page.locator('.ReactModal__Content');
    await expect(modal).toBeVisible();

    const iframe = modal.locator('iframe');
    await expect(iframe).toBeVisible();
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

  test('hides the app behind it from assistive tech while open', async ({
    page,
  }) => {
    const appRoot = page.locator('#res-gen');
    await expect(appRoot).not.toHaveAttribute('aria-hidden', 'true');

    await page.getByText('View', { exact: true }).click();
    await page.getByText('Open PDF View').click();
    await expect(page.locator('.ReactModal__Content')).toBeVisible();

    await expect(appRoot).toHaveAttribute('aria-hidden', 'true');
  });

  test('closes on Escape and via the exit button', async ({ page }) => {
    await page.getByText('View', { exact: true }).click();
    await page.getByText('Open PDF View').click();
    const modal = page.locator('.ReactModal__Content');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    await page.getByText('View', { exact: true }).click();
    await page.getByText('Open PDF View').click();
    await expect(modal).toBeVisible();

    await page.getByLabel('Exit PDF View Button').click();
    await expect(modal).not.toBeVisible();
  });

  test('the "Open PDF View" action is disabled when there is nothing to preview', async ({
    page,
  }) => {
    // Remove the prepopulated layout to reach the true empty state.
    await page.getByText('Edit', { exact: true }).click();
    await page.getByText('Remove Last Layout').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.layout-single')).toHaveCount(0);

    await page.getByText('View', { exact: true }).click();
    await expect(page.getByText('Open PDF View')).toBeDisabled();
  });
});
