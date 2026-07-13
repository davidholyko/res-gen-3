import { expect, test } from './fixtures';

// Editing JSON has two live surfaces: the left-panel editor cards (always
// IN_EDITOR_MANAGER mode) and, once a macro is focused, its own inline
// editor (IN_LAYOUT_MANAGER mode) rendered inside that macro. Both render
// with the same `.contact-editor` etc class, so every locator here is
// scoped to `.layout-single` to target the inline one specifically.
test.describe('json editors', () => {
  test('editing a focused macro\'s inline JSON updates the rendered content', async ({
    page,
  }) => {
    const macro = page.locator('.layout-single [role="group"]').first();
    await expect(macro.locator('h1')).toContainText('Monkey D. Luffy');

    await macro.click();
    const textarea = macro.locator('.contact-editor textarea');
    await expect(textarea).toBeVisible();

    await textarea.fill(
      JSON.stringify({ name: 'Ada Lovelace', email: 'ada@example.com' }),
    );
    await textarea.blur();

    await expect(macro.locator('h1')).toContainText('Ada Lovelace');
  });

  test('invalid JSON shows an error immediately, while still focused', async ({
    page,
  }) => {
    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    const textarea = macro.locator('.contact-editor textarea');

    await textarea.fill('{ not valid json');

    await expect(macro.getByRole('alert')).toBeVisible();
    await expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  test('invalid JSON is discarded, not saved, once the macro loses focus', async ({
    page,
  }) => {
    // Note: blurring away also unfocuses the macro (BaseMacro's
    // onFocus/onBlur), which unmounts its inline editor -- and the error
    // message with it, before a user gets a chance to read it after
    // clicking away. That's a real UX rough edge, tracked separately;
    // what this test guards is the more load-bearing property: an
    // in-progress invalid edit is discarded, not silently saved.
    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    const textarea = macro.locator('.contact-editor textarea');

    await textarea.fill('{ not valid json');
    await textarea.blur();

    await expect(macro.locator('h1')).toContainText('Monkey D. Luffy');

    // Re-focusing shows the original, unmodified content -- not the
    // discarded invalid text.
    await macro.click();
    await expect(macro.locator('.contact-editor textarea')).toHaveValue(
      /Monkey D\. Luffy/,
    );
  });

  test('the left-panel editor always shows example content, independent of a focused macro', async ({
    page,
  }) => {
    const leftPanelTextarea = page
      .locator('#editor-manager .contact-editor textarea')
      .first();
    await expect(leftPanelTextarea).toHaveValue(/Monkey D\. Luffy/);

    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    await macro
      .locator('.contact-editor textarea')
      .fill(JSON.stringify({ name: 'Someone Else', email: 'x@example.com' }));
    await macro.locator('.contact-editor textarea').blur();

    // Editing the placed macro's own copy must not mutate the left-panel
    // template editor's content.
    await expect(leftPanelTextarea).toHaveValue(/Monkey D\. Luffy/);
  });
});
