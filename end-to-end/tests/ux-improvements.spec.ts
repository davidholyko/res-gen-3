import { addSingleLayout, clearResume, expect, test } from './fixtures';

// Happy-path coverage for the new interactive elements added by
// specs/app-ux-improvements.md. Declined-confirmation branches (still
// relevant for "New", the one action that kept window.confirm) and other
// edge cases are already covered deterministically by Vitest component
// tests (see macro-top-bar.test.tsx, new-resume-button.test.tsx) -- this
// suite only needs to prove these flows work through a real browser.
// Undo-specific flows live in undo.spec.ts.
test.describe('UX improvements', () => {
  test('the empty-state CTA opens the restructure view to rebuild', async ({
    page,
  }) => {
    await clearResume(page);

    await expect(page.getByText('Your resume is empty.')).toBeVisible();

    // The CTA opens the restructure view now (specs/restructure-view.md),
    // where layouts and blocks are built, rather than adding a layout
    // inline.
    await page.getByText('Restructure to build it').click();
    await page.getByRole('button', { name: '+ One column' }).click();
    await page.getByRole('button', { name: 'Apply', exact: true }).click();

    await expect(page.locator('.layout-single')).toHaveCount(1);
    await expect(page.getByText('Your resume is empty.')).not.toBeVisible();
  });

  test('deleting a block removes it immediately, with no confirmation dialog', async ({
    page,
  }) => {
    // Superseded by undo.spec.ts: delete-block used to be gated behind
    // window.confirm() (specs/app-ux-improvements.md, Finding 4), but
    // specs/undo-destructive-actions.md replaced that with an undo toast
    // for this action specifically -- see undo.spec.ts for that flow.
    let dialogFired = false;
    page.on('dialog', () => {
      dialogFired = true;
    });
    const before = await page
      .locator('.layout-single .macro-manager > *')
      .count();

    // Delete block only renders once a block is focused (BaseMacro
    // only mounts MacroTopBar while isFocused), same trigger used by
    // accessibility.spec.ts's "with a macro focused" test.
    await page.locator('.layout-single [role="group"]').first().click();
    await page.getByLabel('Delete block').click();

    await expect(page.locator('.layout-single .macro-manager > *')).toHaveCount(
      before - 1,
    );
    expect(dialogFired).toBe(false);
  });

  test('File > New clears the resume back to the empty state, behind a confirmation', async ({
    page,
  }) => {
    await expect(page.locator('.layout-single')).toHaveCount(1);

    await page.getByText('File', { exact: true }).click();
    await page.getByText('New', { exact: true }).click();

    await expect(page.locator('.layout-single')).toHaveCount(0);
    await expect(page.getByText('Your resume is empty.')).toBeVisible();
  });

  test('File > Download PDF downloads a real PDF file', async ({ page }) => {
    await page.getByText('File', { exact: true }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByText('Download PDF', { exact: true }).click(),
    ]);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    const fs = await import('node:fs/promises');
    const bytes = await fs.readFile(downloadPath as string);
    expect(bytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  test('a transient "Saved" indicator appears after a change', async ({
    page,
  }) => {
    const indicator = page.getByText('Saved', { exact: true });
    await expect(indicator).not.toBeVisible();

    await addSingleLayout(page);

    await expect(indicator).toBeVisible();
    await expect(indicator).not.toBeVisible({ timeout: 5000 });
  });
});
