---
status: draft
---

# Plain-language block labels and undo for moves

## Problem

Two loose ends left behind by `specs/editor-redesign.md`, found while
closing it out. Both are small; they share a spec because they're the
same kind of debt — polish the redesign promised ("no internal jargon in
user-facing UI", "destructive actions are undoable") but didn't fully
deliver to every surface.

**1. Internal jargon still reaches users on two surfaces.**

- The block toolbar's accessible names are `Move Macro Up Button`,
  `Move Macro Down Button`, and `Delete Macro Button`
  (`macro-top-bar.tsx`). "Macro" is this codebase's internal word for a
  placed content block — it appears nowhere in the visible UI anymore,
  but a screen-reader user hears it on every focused block. The
  plain-language pass (editor-redesign Phase 6) covered everything
  *visible* and missed these AT-only strings.
- The focused block's editor header displays the internal type name
  visibly: each editor passes `macro="AnyList"` / `"Header"` /
  `"Contact"` etc. into `EditorTopBar`, so focusing a custom-list block
  shows a bar reading "**AnyList** — Editing". The "+ Add block" menu
  that *creates* these blocks says "Custom list" / "Section heading" /
  "Contact details" (`CONTENT_TYPE_LABELS`, `constants.ts`) — the same
  block is named one way when you add it and another way when you edit
  it.

**2. Undo coverage is inconsistent around moves and keyboard deletes.**

- Deleting a block via its toolbar button and removing a layout both
  push an undo snapshot first (`specs/undo-destructive-actions.md`).
  But deleting a focused block with the **Backspace/Delete key**
  (`base-macro.tsx`'s document-level keydown listener) calls
  `onDelete` directly — same destructive outcome, no undo toast. This
  looks like a plain oversight: the two delete paths diverge for no
  stated reason.
- Reordering a whole layout by drag (`moveLayout`, editor-redesign
  Phase 6) is not undoable. Unlike a block's Move Up/Down buttons — a
  misfire there is reversed by pressing the opposite button once — a
  drag misfire (dropped into the wrong gap, or dropped accidentally
  while trying to scroll) has no single opposite gesture: the user has
  to reconstruct where the layout used to be and drag it back. That's
  exactly the "reconstruct what just happened" burden undo exists to
  remove.

## Non-goals

- **No behavior changes to the moves themselves** — same gestures, same
  zone-aware semantics, same drop targets. This spec only adds naming
  and undo around them.
- **No repo-wide aria-label convention cleanup.** Several other labels
  use the `<Action> Button` suffix pattern (`Remove Layout 1 Button`,
  `Exit PDF View Button`); the suffix is redundant for AT (the role is
  announced anyway) but harmless. Only the three labels that carry
  actual jargon change here.
- **No undo for block Move Up/Down.** Pressing the opposite arrow once
  is a complete, obvious undo already; snapshotting every press would
  also make the undo toast flicker through rapid repositioning. Called
  out as an open question below in case that judgment is wrong.
- **No undo history stack.** Same single-snapshot model as
  `specs/undo-destructive-actions.md` — only the most recent undoable
  action is restorable.
- **No changes to internal identifiers** (`CONTENT_TYPES`, `macro` prop
  name, CSS classes like `.contact-editor`, stored JSON). User-facing
  strings only.

## Design

### Plain-language labels

- `macro-top-bar.tsx`: `Move Macro Up Button` → **`Move block up`**,
  `Move Macro Down Button` → **`Move block down`**, `Delete Macro
  Button` → **`Delete block`**. "Block" is the word the UI already
  uses everywhere a user can see ("+ Add block"). The redundant
  `Button` suffix goes at the same time since these exact strings are
  being touched anyway (see Non-goals for why the suffix stays
  elsewhere).
- Editor header names: each editor currently passes a hardcoded
  `macro` string. Source them from `CONTENT_TYPE_LABELS` instead, so
  the block is named identically in the "+ Add block" menu that creates
  it and the "Editing" header that edits it: `Contact details`,
  `Section heading`, `Paragraph`, `Experience`, `Custom list`. (The
  `macro` prop itself can stay — or be renamed in passing — but its
  *values* come from the one labels table; a second hand-maintained
  copy of these strings is the thing to avoid.)
- Test fallout is mechanical: `layout-manipulation.spec.ts` and the
  `macro-top-bar`/editor unit tests select by the old labels.

### Undo for the missing cases

- **Keyboard delete** (`base-macro.tsx`): push
  `pushUndoSnapshot('Block deleted')` before the `onDelete` call in the
  Backspace/Delete keydown handler — the identical snapshot the toolbar
  delete already pushes, so both delete paths behave the same.
- **Layout drag-reorder** (`layout-gap-inserter.tsx`): in the drop
  handler, push `pushUndoSnapshot('Layout moved')` before calling
  `moveLayout`. One wrinkle the one-liner framing hides: `moveLayout`
  treats a drop into the dragged layout's own adjacent gaps as a no-op,
  and a snapshot must not be pushed for a no-op (the toast would offer
  to "undo" nothing, and would clobber a real, still-pending snapshot).
  The adjacent-gap check therefore needs to be consultable at the call
  site — either exposed as a small helper alongside `moveLayout`, or by
  having the drop handler perform the same
  `toGapIndex === fromIndex || toGapIndex === fromIndex + 1` test
  before snapshotting. Keeping the no-op guard in exactly one place is
  the implementation's call to make.

## Acceptance criteria

- [ ] No user-facing string or accessible name anywhere in `_frontend`
      contains "Macro" or an internal type identifier ("AnyList") —
      checkable by grepping rendered strings/aria-labels, and asserted
      for the toolbar by the e2e suite
- [ ] A focused block's editor header shows the same plain-language name
      as the "+ Add block" menu entry that creates it, sourced from the
      same constant
- [ ] Deleting a focused block with Backspace/Delete shows the same
      undo toast as the toolbar delete, and Undo restores the block
- [ ] Dropping a layout into a new gap shows an undo toast, and Undo
      restores the previous layout order (content intact)
- [ ] Dropping a layout into one of its own adjacent gaps (the no-op
      case) pushes no snapshot and leaves any pending undo toast alone
- [ ] `_frontend` stays at 100% coverage; the axe component/E2E suites
      stay clean; the new undo paths get e2e happy-path coverage

## Open questions

- **Should block Move Up/Down get undo too?** Excluded above (the
  opposite button is a one-press undo, and per-press toasts are noisy),
  but if consistency-of-model is judged to matter more than toast
  noise, the same `pushUndoSnapshot` wiring applies.
- **Toast wording**: "Layout moved" matches the existing terse
  descriptions ("Block deleted", "Layout 2 removed"). Worth including
  the position ("Layout 2 moved")? The label is position-derived and
  changes with the move itself, which may make the message more
  confusing than helpful.
- **`macro` prop rename**: while touching every `macro=` call site,
  renaming the prop itself (e.g. to `label`) is nearly free and removes
  the last "macro" from these components' public surface — worth doing
  in the same pass, or is prop-name churn not worth the diff noise?
