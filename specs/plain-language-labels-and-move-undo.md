---
status: implemented
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
- **No undo history stack.** Same single-snapshot model as
  `specs/undo-destructive-actions.md` — only the most recent undoable
  action is restorable.
- **No changes to internal identifiers** (`CONTENT_TYPES`, component/
  file names like `MacroTopBar`, CSS classes like `.contact-editor`,
  stored JSON). The one exception, decided in review, is the `macro`
  prop, renamed to `label` (see Decisions).

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
  `Section heading`, `Paragraph`, `Experience`, `Custom list`. The
  `macro` prop is renamed to `label` in the same pass (see Decisions),
  and its values come from the one labels table — a second
  hand-maintained copy of these strings is the thing to avoid.
- Test fallout is mechanical: `layout-manipulation.spec.ts` and the
  `macro-top-bar`/editor unit tests select by the old labels.

### Undo for the missing cases

Every mutation that isn't typing becomes undoable — uniform model, per
review (see Decisions):

- **Keyboard delete** (`base-macro.tsx`): push
  `pushUndoSnapshot('Block deleted')` before the `onDelete` call in the
  Backspace/Delete keydown handler — the identical snapshot the toolbar
  delete already pushes, so both delete paths behave the same.
- **Layout drag-reorder and block Move Up/Down**: both have a no-op
  case (a drop into the dragged layout's own adjacent gaps; a press at
  a zone boundary), and a snapshot must not be pushed for a no-op — the
  toast would offer to "undo" nothing, and would clobber a real,
  still-pending snapshot. Rather than exposing the no-op checks to call
  sites, the implementation pushes the snapshots *inside* `moveLayout`
  ("Layout moved") and `onMove` ("Block moved") in `app-context.tsx`,
  after their existing no-op guards — the one place that already knows
  whether the gesture is a real move. (This is the "keep the guard in
  exactly one place" resolution the draft left to the implementation;
  it required `moveLayout` to read `layouts` from its closure rather
  than a functional state update, since a snapshot is a side effect
  that can't live inside a React state updater.) Note the
  single-snapshot model's consequence: rapid repeated presses overwrite
  the snapshot each time, so Undo steps back exactly one press, not to
  where the block started — consistent with how every other undoable
  action behaves.

## Acceptance criteria

- [x] No user-facing string or accessible name anywhere in `_frontend`
      contains "Macro" or an internal type identifier ("AnyList") —
      checkable by grepping rendered strings/aria-labels, and asserted
      for the toolbar by the e2e suite
- [x] A focused block's editor header shows the same plain-language name
      as the "+ Add block" menu entry that creates it, sourced from the
      same constant
- [x] Deleting a focused block with Backspace/Delete shows the same
      undo toast as the toolbar delete, and Undo restores the block
- [x] Dropping a layout into a new gap shows an undo toast, and Undo
      restores the previous layout order (content intact)
- [x] Dropping a layout into one of its own adjacent gaps (the no-op
      case) pushes no snapshot and leaves any pending undo toast alone
- [x] Moving a block up/down shows an undo toast, and Undo restores the
      previous order; pressing move at a zone boundary (the no-op case)
      pushes no snapshot
- [x] The `macro` prop is renamed to `label` across BaseEditor,
      EditorTopBar, and the five editors — no "macro" left in these
      components' props or user-facing strings (internal names like
      `MacroTopBar`/`.macro-manager`/`CONTENT_TYPES` stay)
- [x] `_frontend` stays at 100% coverage; the axe component/E2E suites
      stay clean; the new undo paths get e2e happy-path coverage

## Decisions (from spec review)

All three open questions were put to review and resolved before
implementation:

- **Block Move Up/Down gets undo too.** Uniformity of the undo model
  won over toast-noise concerns: every mutation that isn't typing is
  undoable. The per-press toast is accepted; the single-snapshot model
  means Undo steps back one press.
- **Toast wording stays terse and position-free**: "Layout moved" /
  "Block moved", matching "Block deleted". Position-derived names were
  rejected because the move itself changes the numbering the message
  would reference.
- **The `macro` prop is renamed to `label`** in the same pass — nearly
  free while every call site is already in the diff, and it removes the
  last "macro" from these components' public surface. CSS classes,
  component file names, `CONTENT_TYPES`, and stored JSON stay
  untouched.
