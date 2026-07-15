import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './fixtures';

// Happy-path coverage for specs/editor-redesign.md: every content type
// edits through generated form fields. Since specs/canvas-edit-panel.md
// the focused block's form renders in the #canvas-edit-panel docked
// beside the canvas, not inline inside the block. Blocks are placed via
// each zone's "+ Add block" control (add-block.spec.ts covers that flow
// itself). Contact (Phase 3), Experience (Phase 4), and AnyList
// (Phase 5) each have their own describe below.
test.describe('editor forms (specs/editor-redesign.md, Phase 1)', () => {
  // Adds a blank Section heading block into the first layout and returns
  // its macro locator (already focused, form open, per BaseMacro's
  // focus-on-create).
  async function addHeaderBlock(page: import('@playwright/test').Page) {
    const target = page.locator('.layout-single').first();
    await target.getByRole('button', { name: '+ Add block' }).click();
    await page.getByRole('menuitem', { name: 'Section heading' }).click();
    return target.locator('[role="group"]').last();
  }

  test("editing a focused block's form field updates the canvas live, without needing to blur", async ({
    page,
  }) => {
    await addHeaderBlock(page);
    const input = page.locator('#canvas-edit-panel input[name="header"]');

    // No .blur()/.press('Tab') here on purpose -- this is the point of
    // the test: the form saves as you type, unlike the raw-JSON textarea
    // it replaced (which only saved on blur).
    await input.fill('Updated While Typing');

    await expect(
      page.locator('.layout-single :text("Updated While Typing")').first(),
    ).toBeVisible();
  });

  test('backspace inside a form field edits the text, not the macro', async ({
    page,
  }) => {
    const block = await addHeaderBlock(page);
    const input = page.locator('#canvas-edit-panel input[name="header"]');
    await input.fill('Some Title');
    await input.press('Backspace');

    await expect(input).toHaveValue('Some Titl');
    // The block itself is still there -- backspace didn't bubble up to
    // BaseMacro's delete-on-Backspace/Delete listener.
    await expect(block).toBeVisible();
  });

  test('has no automatically detectable accessibility violations with a focused header form', async ({
    page,
  }) => {
    await addHeaderBlock(page);
    await page.locator('#canvas-edit-panel input[name="header"]').fill('Skills');
    // SavedIndicator's opacity fades in over 300ms (saved-indicator.tsx)
    // after a save -- scanning mid-transition catches axe computing
    // contrast against a partially-transparent, blended color, not the
    // settled one. Not a real violation, just a timing artifact.
    await page.waitForTimeout(350);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

// Phase 3: Contact -- the first migrated type with real per-field
// constraints (required name, well-formed email), so this is also where
// the per-field inline error UX becomes observable end-to-end.
test.describe('contact form (specs/editor-redesign.md, Phase 3)', () => {
  test("editing the focused contact block's name updates the canvas live", async ({
    page,
  }) => {
    const macro = page.locator('.layout-single [role="group"]').first();
    await expect(macro.locator('h1')).toContainText('Monkey D. Luffy');

    await macro.click();
    // The form docks in the canvas-side panel (specs/canvas-edit-panel.md).
    const panel = page.locator('#canvas-edit-panel');
    const name = panel.locator('input[name="name"]');
    await expect(name).toBeVisible();
    await expect(panel.locator('textarea')).toHaveCount(0);

    await name.fill('Ada Lovelace');

    await expect(macro.locator('h1')).toContainText('Ada Lovelace');
  });

  test('a malformed email flags just the email field, inline, and does not save', async ({
    page,
  }) => {
    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    const panel = page.locator('#canvas-edit-panel');
    const email = panel.locator('input[name="email"]');

    await email.fill('not-an-email');

    const alert = panel.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/valid email/i);
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    // Only the email field is implicated...
    await expect(panel.locator('input[name="name"]')).toHaveAttribute(
      'aria-invalid',
      'false',
    );
    // ...and the invalid value was not saved into the rendered block.
    await expect(macro).not.toContainText('not-an-email');

    // Fixing the field clears the error and saves.
    await email.fill('ada@example.com');
    await expect(panel.getByRole('alert')).toHaveCount(0);
    await expect(macro).toContainText('ada@example.com');
  });

  test('has no automatically detectable accessibility violations with a field error shown', async ({
    page,
  }) => {
    const macro = page.locator('.layout-single [role="group"]').first();
    await macro.click();
    const panel = page.locator('#canvas-edit-panel');
    await panel.locator('input[name="email"]').fill('not-an-email');
    await expect(panel.getByRole('alert')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

// Phase 4: Experience -- introduces the `tags` (chip entry) and `list`
// (repeating rows) field kinds.
test.describe('experience form (specs/editor-redesign.md, Phase 4)', () => {
  // The first prepopulated experience block ("Red Hair Pirates",
  // experience-1.json): empty tags, three descriptions.
  function experienceMacro(page: import('@playwright/test').Page) {
    return page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Red Hair Pirates' })
      .first();
  }

  test('typing a tag and pressing Enter draws the chip on the canvas immediately', async ({
    page,
  }) => {
    const macro = experienceMacro(page);
    await macro.click();

    const tagsInput = page.locator('#canvas-edit-panel input[name="tags"]');
    await tagsInput.fill('Navigation');
    await tagsInput.press('Enter');

    // The chip appears both in the form and in the rendered block; the
    // rendered block's pill is the one that proves the content saved.
    await expect(
      macro.locator('span.bg-black', { hasText: 'Navigation' }).first(),
    ).toBeVisible();
    // The entry input cleared, ready for the next tag.
    await expect(tagsInput).toHaveValue('');
  });

  test("removing a chip via its × removes the tag from the block's content", async ({
    page,
  }) => {
    const macro = experienceMacro(page);
    await macro.click();

    const tagsInput = page.locator('#canvas-edit-panel input[name="tags"]');
    await tagsInput.fill('Sailing');
    await tagsInput.press('Enter');
    await expect(
      macro.locator('span.bg-black', { hasText: 'Sailing' }).first(),
    ).toBeVisible();

    await page
      .locator('#canvas-edit-panel')
      .getByRole('button', { name: 'Remove Tags Sailing' })
      .click();

    await expect(
      macro.locator('span.bg-black', { hasText: 'Sailing' }),
    ).toHaveCount(0);
  });

  test('adding, editing, and reordering description rows updates the rendered bullets', async ({
    page,
  }) => {
    const macro = experienceMacro(page);
    await macro.click();

    const panel = page.locator('#canvas-edit-panel');
    await panel.getByRole('button', { name: 'Add Descriptions entry' }).click();
    const newRow = panel.getByRole('textbox', {
      name: 'Descriptions 4',
      exact: true,
    });
    await newRow.fill('Learned to tie knots');
    await expect(macro.locator('li').last()).toContainText(
      'Learned to tie knots',
    );

    await panel.getByRole('button', { name: 'Move Descriptions 4 up' }).click();
    await expect(macro.locator('li').nth(2)).toContainText(
      'Learned to tie knots',
    );

    await panel.getByRole('button', { name: 'Remove Descriptions 3' }).click();
    await expect(macro.locator('li')).toHaveCount(3);
    await expect(
      macro.locator('li', { hasText: 'Learned to tie knots' }),
    ).toHaveCount(0);
  });

  test('clearing the required company field flags it inline without wiping the block', async ({
    page,
  }) => {
    const macro = experienceMacro(page);
    await macro.click();

    const panel = page.locator('#canvas-edit-panel');
    const company = panel.locator('input[name="company"]');
    await company.fill('');

    await expect(panel.getByRole('alert')).toContainText(
      /company is required/i,
    );
    // The block still renders its last valid content.
    await expect(macro).toContainText('Red Hair Pirates');
  });

  test('has no automatically detectable accessibility violations with the experience form open', async ({
    page,
  }) => {
    const macro = experienceMacro(page);
    await macro.click();
    await expect(
      page.locator('#canvas-edit-panel input[name="title"]'),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

// Phase 5: AnyList -- the `record-of-lists` field kind, the one kind
// that edits the whole content object (its keys are user data).
test.describe('any-list form (specs/editor-redesign.md, Phase 5)', () => {
  // The first prepopulated any-list block (any-list-1.json):
  // Gears (5 entries) + Acquaintances (3 entries).
  function anyListMacro(page: import('@playwright/test').Page) {
    return page
      .locator('.layout-single [role="group"]')
      .filter({ hasText: 'Gears' })
      .first();
  }

  test('renaming a group updates the rendered block live, keeping its entries', async ({
    page,
  }) => {
    const macro = anyListMacro(page);
    await macro.click();

    const panel = page.locator('#canvas-edit-panel');
    const name = panel.getByRole('textbox', { name: 'Group 1 name' });
    await expect(name).toHaveValue('Gears');
    await expect(panel.locator('textarea')).toHaveCount(0);

    // 'Techniques', not e.g. 'Powers': hasText matching is substring-based
    // and case-insensitive, and the example paragraph block happens to
    // contain "powers of the Gum-Gum Fruit".
    await name.fill('Techniques');

    await expect(
      page
        .locator('.layout-single [role="group"]')
        .filter({ hasText: 'Techniques' })
        .first(),
    ).toContainText('Techniques: Gear First');
  });

  test('adding an entry to a group appends it to that group on the canvas', async ({
    page,
  }) => {
    const macro = anyListMacro(page);
    await macro.click();

    const panel = page.locator('#canvas-edit-panel');
    await panel.getByRole('button', { name: 'Add entry to group 2' }).click();
    await panel
      .getByRole('textbox', { name: 'Group 2 entry 4' })
      .fill('Nico Robin');

    await expect(macro).toContainText('Boa Hancock, Nico Robin');
  });

  test('adding and removing a whole group is reflected on the canvas', async ({
    page,
  }) => {
    const macro = anyListMacro(page);
    await macro.click();

    const panel = page.locator('#canvas-edit-panel');
    await panel.getByRole('button', { name: 'Add group' }).click();
    await expect(macro).toContainText('New group:');

    await panel.getByRole('button', { name: 'Remove group 3' }).click();
    await expect(macro).not.toContainText('New group:');
    // The original groups are untouched.
    await expect(macro).toContainText('Gears:');
  });

  test('a rename colliding with another group name is blocked with an inline error, not a silent merge', async ({
    page,
  }) => {
    const macro = anyListMacro(page);
    await macro.click();

    const panel = page.locator('#canvas-edit-panel');
    const name = panel.getByRole('textbox', { name: 'Group 1 name' });
    await name.fill('Acquaintances');

    await expect(panel.getByRole('alert')).toContainText(
      /already a group name/i,
    );
    // Both groups still exist with their entries -- nothing merged.
    await expect(macro).toContainText('Gear First');
    await expect(macro).toContainText('Red Haired Shanks');
  });

  test('has no automatically detectable accessibility violations with the any-list form open', async ({
    page,
  }) => {
    const macro = anyListMacro(page);
    await macro.click();
    await expect(
      page
        .locator('#canvas-edit-panel')
        .getByRole('textbox', { name: 'Group 1 name' }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
