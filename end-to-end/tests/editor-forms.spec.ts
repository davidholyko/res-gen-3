import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './fixtures';

// Happy-path coverage for specs/editor-redesign.md, Phase 1: Header and
// Paragraph now render generated form fields (a text input and a
// textarea respectively) instead of a raw-JSON textarea, in both
// IN_EDITOR_MANAGER (the ribbon) and IN_LAYOUT_MANAGER (a focused
// block's inline editor) modes. Contact/Experience/AnyList are
// unmigrated and keep the JSON editor -- covered separately in
// json-editors.spec.ts.
test.describe('editor forms (specs/editor-redesign.md, Phase 1)', () => {
  test('the ribbon renders a labelled text input for Header and a labelled textarea for Paragraph, not raw JSON', async ({
    page,
  }) => {
    await page.locator('.header-editor [role="button"]').click();
    await page.locator('.paragraph-editor [role="button"]').click();

    const headerInput = page.locator('.header-editor input[name="header"]');
    const paragraphTextarea = page.locator(
      '.paragraph-editor textarea[name="paragraph"]',
    );

    await expect(headerInput).toBeVisible();
    await expect(page.locator('.header-editor')).toContainText('Header');
    await expect(paragraphTextarea).toBeVisible();
    await expect(page.locator('.paragraph-editor')).toContainText(
      'Paragraph',
    );

    // Neither field's own name/label text is raw JSON syntax.
    await expect(headerInput).not.toHaveValue(/[{}]/);
  });

  test('dragging a ribbon Header block after editing its field places the typed value, not the stale example', async ({
    page,
  }) => {
    await page.locator('.header-editor [role="button"]').click();
    await page
      .locator('.header-editor input[name="header"]')
      .fill('Custom Section Title');

    const target = page.locator('.layout-single').first();
    const source = page
      .locator('.header-editor')
      .locator('div[draggable="true"]')
      .first();
    await source.dragTo(target);

    await expect(
      target.locator(':text("Custom Section Title")'),
    ).toBeVisible();
  });

  test("editing a focused block's form field updates the canvas live, without needing to blur", async ({
    page,
  }) => {
    const target = page.locator('.layout-single').first();
    const source = page
      .locator('.header-editor')
      .locator('div[draggable="true"]')
      .first();
    await source.dragTo(target);

    const placedHeader = target.locator('.header-editor').first();
    await placedHeader.locator('[role="button"]').first().click();
    const input = placedHeader.locator('input[name="header"]');

    // No .blur()/.press('Tab') here on purpose -- this is the point of
    // the test: IN_LAYOUT_MANAGER's form saves as you type, unlike the
    // raw-JSON textarea it replaced (which only saved on blur).
    await input.fill('Updated While Typing');

    await expect(target.locator(':text("Updated While Typing")')).toBeVisible();
  });

  test('backspace inside a form field edits the text, not the macro', async ({
    page,
  }) => {
    const target = page.locator('.layout-single').first();
    const source = page
      .locator('.header-editor')
      .locator('div[draggable="true"]')
      .first();
    await source.dragTo(target);

    const placedHeader = target.locator('.header-editor').first();
    await placedHeader.locator('[role="button"]').first().click();
    const input = placedHeader.locator('input[name="header"]');
    await input.fill('Some Title');
    await input.press('Backspace');

    await expect(input).toHaveValue('Some Titl');
    // The block itself is still there -- backspace didn't bubble up to
    // BaseMacro's delete-on-Backspace/Delete listener.
    await expect(placedHeader).toBeVisible();
  });

  test('has no automatically detectable accessibility violations with both forms expanded and one focused', async ({
    page,
  }) => {
    await page.locator('.header-editor [role="button"]').click();
    await page.locator('.paragraph-editor [role="button"]').click();

    const target = page.locator('.layout-single').first();
    const source = page
      .locator('.header-editor')
      .locator('div[draggable="true"]')
      .first();
    await source.dragTo(target);
    await target.locator('.header-editor').first().locator('[role="button"]').first().click();
    // SavedIndicator's opacity fades in over 300ms (saved-indicator.tsx)
    // after the drag's onCreate -- scanning mid-transition catches axe
    // computing contrast against a partially-transparent, blended color,
    // not the settled one. Not a real violation, just a timing artifact.
    await page.waitForTimeout(350);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
