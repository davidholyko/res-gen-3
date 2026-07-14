import { expect, test } from './fixtures';

// Editing JSON has two live surfaces: the ribbon's editor cards (always
// IN_EDITOR_MANAGER mode) and, once a macro is focused, its own inline
// editor (IN_LAYOUT_MANAGER mode) rendered inside that macro. Both render
// with the same `.any-list-editor` etc class, so every locator here is
// scoped to `.layout-single` to target the inline one specifically.
//
// AnyList, not Contact, since specs/editor-redesign.md's Phase 3: it and
// Experience are the last types still on the raw-JSON textarea; this
// whole file retires with them once Phases 4/5 land. Form-based editing
// is covered in editor-forms.spec.ts.
test.describe('json editors', () => {
  test('editing a focused macro\'s inline JSON updates the rendered content', async ({
    page,
  }) => {
    const macro = page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Gears' })
      .first();
    await expect(macro).toContainText('Gear First');

    await macro.click();
    const textarea = macro.locator('.any-list-editor textarea');
    await expect(textarea).toBeVisible();

    await textarea.fill(JSON.stringify({ Skills: ['TypeScript', 'React'] }));
    await textarea.blur();

    // Not asserted through `macro`: that locator filters on the old
    // 'Gears' text, which this edit just replaced.
    await expect(page.locator('.layout-single')).toContainText(
      'Skills: TypeScript, React',
    );
  });

  test('invalid JSON shows an error immediately, while still focused', async ({
    page,
  }) => {
    const macro = page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Gears' })
      .first();
    await macro.click();
    const textarea = macro.locator('.any-list-editor textarea');

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
    const macro = page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Gears' })
      .first();
    await macro.click();
    const textarea = macro.locator('.any-list-editor textarea');

    await textarea.fill('{ not valid json');
    await textarea.blur();

    await expect(macro).toContainText('Gear First');

    // Re-focusing shows the original, unmodified content -- not the
    // discarded invalid text.
    await macro.click();
    await expect(macro.locator('.any-list-editor textarea')).toHaveValue(
      /Gear First/,
    );
  });

  test('the ribbon editor always shows example content, independent of a focused macro', async ({
    page,
  }) => {
    const ribbonTextarea = page
      .locator('#editor-manager .any-list-editor textarea')
      .first();
    await expect(ribbonTextarea).toHaveValue(/Gear First/);

    const macro = page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Gears' })
      .first();
    await macro.click();
    await macro
      .locator('.any-list-editor textarea')
      .fill(JSON.stringify({ Skills: ['Solidity'] }));
    await macro.locator('.any-list-editor textarea').blur();

    // Editing the placed macro's own copy must not mutate the ribbon
    // template editor's content.
    await expect(ribbonTextarea).toHaveValue(/Gear First/);
  });
});
