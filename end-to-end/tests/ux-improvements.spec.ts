import { expect, removeLastLayout, test } from './fixtures';

// Happy-path coverage for the new interactive elements added by
// specs/app-ux-improvements.md. Declined-confirmation branches (still
// relevant for "New", the one action that kept window.confirm) and other
// edge cases are already covered deterministically by Vitest component
// tests (see layout-header.test.tsx, macro-top-bar.test.tsx,
// remove-bottom-layout-button.test.tsx, new-resume-button.test.tsx) --
// this suite only needs to prove these flows work through a real browser.
// Undo-specific flows (delete-block/remove-layout no longer confirm at
// all; "New" now confirms *and* gets undo) live in undo.spec.ts.
test.describe('UX improvements', () => {
  test('removing every layout shows the empty-state CTA, which adds a new layout', async ({
    page,
  }) => {
    await removeLastLayout(page);
    await expect(page.locator('.layout-single')).toHaveCount(0);

    await expect(page.getByText('Your resume is empty.')).toBeVisible();

    await page.getByText('+ Add Single Column Layout').click();

    await expect(page.locator('.layout-single')).toHaveCount(1);
    await expect(page.getByText('Your resume is empty.')).not.toBeVisible();
  });

  test('a per-layout "Remove layout" link removes just that layout, not just the last one', async ({
    page,
  }) => {
    // The prepopulated layout (Layout 1) has content; the freshly-added
    // one (Layout 2) starts empty -- removing Layout 1 specifically and
    // checking the survivor is still empty proves this targeted the first
    // layout, not just whichever was added last.
    await page.getByText('Edit', { exact: true }).click();
    await page.getByText('Add Single Column Layout').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.layout-single')).toHaveCount(2);

    await page.getByLabel('Remove Layout 1 Button').click();

    await expect(page.locator('.layout-single')).toHaveCount(1);
    await expect(
      page.locator('.layout-single .macro-manager > *'),
    ).toHaveCount(0);
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

    // Delete Macro Button only renders once a block is focused (BaseMacro
    // only mounts MacroTopBar while isFocused), same trigger used by
    // accessibility.spec.ts's "with a macro focused" test.
    await page.locator('.layout-single [role="group"]').first().click();
    await page.getByLabel('Delete Macro Button').click();

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

    await page.getByText('Edit', { exact: true }).click();
    await page.getByText('Add Single Column Layout').click();
    await page.keyboard.press('Escape');

    await expect(indicator).toBeVisible();
    await expect(indicator).not.toBeVisible({ timeout: 5000 });
  });
});
