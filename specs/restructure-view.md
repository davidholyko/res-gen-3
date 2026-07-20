---
status: draft
---

# Restructure view: rebuild layouts and place macros side-by-side

## Problem

Two gaps, both about *structure* rather than content:

1. **There is no way to delete a layout or reorder layouts anymore.**
   `specs/inline-layout-toolbar.md` and `specs/remove-layout-drag-reorder.md`
   removed the per-layout hover toolbar (label + "Remove layout") and the
   old drag-to-reorder. The main canvas is now add-only: gap inserters
   add layouts, "+ Add block" adds content, block forms edit it -- but
   nothing removes a layout or changes layout order.

2. **Rearranging existing content across the structure is piecemeal.**
   Moving a block to another layout/zone is a one-at-a-time menu action
   that always drops the block at the *end* of the destination zone
   (`specs/move-block-between-layouts.md`, `moveContentToZone`). There's
   no holistic "lay out the whole resume" flow -- deciding what goes
   where, in what order, across multiple layouts, in one place.

We want one place to **reshape the resume**: add/remove/reorder layout
"boxes" and decide which macros live in each -- visually, by dragging
macros into boxes -- then commit the result.

## The experience (target)

A **side-by-side working view inside the editor** (not a separate
full-screen app):

- **Left pane -- the source palette.** The current resume, shown as a
  read-only list/preview of its macros. It stays intact the whole time
  (dragging from it *copies*, never removes).
- **Right pane -- the staging canvas.** Starts as a blank canvas. The
  user adds **boxes** (layouts: one-column or two-column), drags macros
  from the left palette into a box, and reorders/removes boxes and placed
  macros within the right.
- **Done / Apply** commits the right-pane arrangement: it *becomes* the
  resume, replacing the current structure. **Cancel** discards the
  staging work and leaves the resume untouched.

Net: deleting layouts, reordering layouts, and re-homing macros all
happen here, in the staging pane, by direct manipulation.

## Non-goals

- **Not a change to normal content editing.** Block forms, "+ Add
  block", the canvas edit panel, live PDF preview, undo toasts, etc. all
  stay as they are on the main canvas.
- **Not a new content-type system.** Same five block types; this moves
  and arranges existing macros, it doesn't invent new ones.
- **Not backend.** Still fully client-side / `localStorage`.
- **Not reviving the old `react-dnd` `LayoutHeader`.** Whatever drag
  mechanism this uses is a fresh, view-scoped decision (see Open
  questions) -- not a restore of the removed toolbar.
- **Not multi-page / responsive polish.** Desktop editor only, matching
  the rest of the app.

## Design

### _frontend

**Entry point.** A control to switch the editor into the restructure
view (candidate: a View-menu item or a canvas button -- Open question).
Entering shows the two-pane layout; Apply/Cancel returns to the normal
single-canvas editor.

**Staging state, isolated from the live resume.** The right pane owns
its own `stagingLayouts` / `stagingItems` (shape identical to the app's
`layouts: LayoutItem[]` / `items: ContentAll[]`). Nothing the user does
in the staging pane touches the real resume until **Apply**. This keeps
Cancel trivially safe and makes Apply a single atomic swap.

- **Left palette** renders the live `items` grouped by their current
  layout/zone, read-only, as drag sources. Reuse the existing macro
  render (base-macro / MacroManager) in a non-editable mode.
- **Add a box** on the right reuses the gap-inserter pattern ("+ One
  column" / "+ Two columns") to append/insert a `LayoutItem` into
  `stagingLayouts`.
- **Place a macro**: dropping a left macro into a right zone copies it
  -- a new `contentId`, the destination zone's `layoutId` / `layoutType`
  / `layoutParentId`, appended into `stagingItems` (mirrors
  `moveContentToZone`'s retag, but as an insert/copy, not a move). The
  left palette is unchanged (copy semantics).
- **Reorder / remove within staging**: each staging box can be removed
  and reordered; placed macros can be reordered within/across staging
  zones and removed. (This is where layout delete/reorder conceptually
  lives now, scoped to the staging pane.)
- **Apply**: `setItems(stagingItems)` + `setLayouts(stagingLayouts)`
  behind one `pushUndoSnapshot('Resume restructured')`
  (`specs/undo-destructive-actions.md`), so a mis-apply is one Undo away.
  **Cancel**: drop staging state, no snapshot.

**Drag-and-drop mechanism (decision required -- see Open questions).**
`react-dnd` was removed with the layout toolbar; `move-block-between-layouts.md`
also *deliberately avoided* block drag-and-drop (fiddly against
hover-only canvas chrome, hard to keep keyboard/e2e-safe). This view is a
friendlier home for DnD (a dedicated staging surface, not hover chrome),
but the same two constraints stand and the spec must resolve them:
whichever mechanism is chosen (native HTML5 DnD, re-adding a library, or
Pragmatic drag-and-drop), there must also be a **keyboard-accessible**
way to place/move a macro (e.g. a "send to box N" action mirroring the
existing zone picker) so the feature isn't drag-only -- the app holds a
100%-coverage, axe-clean bar.

### _backend

None.

## Acceptance criteria

- [ ] The user can enter a restructure view showing the current resume
      (left, read-only) and a staging canvas (right).
- [ ] The user can add one-column and two-column boxes to the staging
      canvas, and remove and reorder them.
- [ ] Dragging a macro from the left into a staging box places a copy of
      it there; the left palette is unchanged (copy semantics).
- [ ] Placed macros can be reordered and removed within the staging pane.
- [ ] **Apply** replaces the resume's layouts+items with the staging
      arrangement, behind a single undo snapshot; **Cancel** discards
      staging and leaves the resume untouched.
- [ ] Every drag interaction has a keyboard-accessible equivalent; the
      view is axe-clean.
- [ ] `_frontend` stays at 100% coverage; lint, build, and e2e pass.

## Open questions

- **Blank vs. pre-filled right pane.** Your description said the staging
  canvas starts *blank*. But for pure "delete a layout / reorder
  layouts" that means rebuilding the whole resume from scratch every
  time, which is heavy. Should the right pane instead **start as a copy
  of the current structure** (so reordering/deleting is a few edits),
  with blank being just the "start over" case? This is the biggest call.
- **"Side-by-side, always available" vs. an Apply/Cancel session.** You
  picked a persistent side-by-side panel over a full-screen mode, but
  "press Done / replaces the resume" implies a staging *session* with a
  start and a commit. Reconcile: is it a togglable pane you open, work
  in, and Apply/Cancel out of -- or always visible with the right pane
  as a permanent scratch area? (Leaning: togglable pane using the
  side-by-side layout.)
- **Unplaced content on Apply.** If Apply replaces the resume wholesale
  with the right pane, any macro you *didn't* drag over is dropped.
  Acceptable (undo rescues it), or should Apply warn / must every macro
  be placed first?
- **Duplicates.** Copy semantics let the same macro be placed twice. Fine
  (they diverge as independent copies), or should the palette mark/grey
  already-placed macros?
- **DnD mechanism + keyboard fallback** (see Design): native HTML5 vs.
  re-add a DnD library vs. Pragmatic DnD; and the exact keyboard action.
- **Entry point**: View menu item, a canvas button, or elsewhere?
- **Supersedes:** this restores layout delete/reorder that
  `remove-layout-drag-reorder.md` / `inline-layout-toolbar.md` removed --
  should those be linked as superseded-by, and does anything from the old
  `confirm-remove-layout.md` (delete confirm/undo) carry over here?
