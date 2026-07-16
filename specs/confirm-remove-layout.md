---
status: implemented
---

# Confirm remove layout, with a live delete-preview highlight

## Problem

"Remove layout" (the per-layout gutter control from
`specs/continuous-page-canvas.md`) deleted the layout **and every block
in it** on a single click. That's fine when content is spread across
several layouts, but the default resume keeps *everything* in one SINGLE
layout -- so on the common case, one click on "Remove layout" silently
wiped the entire resume, dropping to the empty state. Reported directly:
"why does remove layout delete all the layouts." It reads as deleting
everything because, with one layout, it does.

`specs/undo-destructive-actions.md` deliberately removed the old
`window.confirm()` gate on this action (a blocking native dialog that was
a dead-end), leaving only the post-hoc undo toast. That spec itself
flagged the real risk it didn't solve: a user can "misjudge which
layout/block they were looking at." A single unguarded click that can
nuke the whole resume, recoverable only if you notice the toast in time,
is too sharp an edge.

## Non-goals

- **Not reinstating `window.confirm()`.** The undo spec's objections to
  the blocking native dialog stand. This is an inline, non-blocking
  confirm.
- **Not removing undo.** The undo snapshot still fires on a confirmed
  delete -- confirm guards the click, undo still rescues a confirmed
  mistake. The two are complementary.
- **No change to block deletion or "New".** Those keep their existing
  guards (undo toast; "New" also still `window.confirm()`s). Scope is
  layout removal specifically.
- **No change to `removeLayout` / the reconcile logic** in app-context.
  This is a UI gate in front of the same removal.

## Design

### _frontend

Two-step, in-canvas confirm with a preview highlight of exactly what will
be deleted.

- **State lives in `LayoutManager`**, not per-`LayoutHeader`: a single
  `confirmingLayoutId` so only one layout can be mid-confirm at a time,
  and so the same id can drive the preview highlight on that layout's
  wrapper. `LayoutManager` owns the actual removal (`pushUndoSnapshot` +
  `removeLayout`) on confirm; `LayoutHeader` becomes presentational.
- **First click asks.** "Remove layout" no longer deletes -- it sets
  `confirmingLayoutId` to this layout. `LayoutHeader`'s toolbar swaps
  from the drag-handle + "Remove layout" row to an inline
  **"Delete Layout N?  Cancel  Delete"** confirm, and stays visible
  (`opacity-100`) regardless of hover so the choice can't slip away when
  the pointer leaves.
- **The preview highlights what's on the chopping block.** While
  confirming, the layout's `group relative` wrapper -- which wraps
  exactly the deletable content (`LayoutSingle` / `LayoutDouble`) -- gets
  a red ring + light red tint (`ring-2 ring-inset ring-red-400
  bg-red-50`). The highlight *is* the delete preview: the user sees the
  precise region (all of Layout N's blocks, both columns of a DOUBLE)
  before committing.
- **Delete** calls the confirmed removal (undo snapshot + `removeLayout`,
  clears the confirm). **Cancel** just clears `confirmingLayoutId` --
  nothing is removed and the highlight disappears.
- **Accessibility.** Cancel/Delete are real buttons with
  `aria-label`s (`Cancel removing Layout N`, `Confirm removing Layout N
  Button`); axe stays clean idle and while confirming. The confirm is
  keyboard-reachable via the same focus-revealed toolbar.

## Acceptance criteria

- [x] Clicking "Remove layout" once removes nothing; it opens an inline
      Cancel/Delete confirm and highlights that layout's region in the
      preview (red ring + tint), covering exactly the content that will
      be deleted.
- [x] The highlight/confirm targets only the chosen layout; other layouts
      are untouched and still show their normal "Remove layout".
- [x] "Delete" removes the layout and its blocks and pushes an undo
      snapshot (undo still restores it); "Cancel" removes nothing and
      clears the highlight.
- [x] The confirm stays visible when the pointer leaves the gutter.
- [x] No native `window.confirm()` dialog is used for layout removal.
- [x] `_frontend` stays at 100% coverage; axe suites stay clean; e2e
      removal happy-paths (updated to click through the confirm) stay
      green.
