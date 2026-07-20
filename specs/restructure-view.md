---
status: implemented
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

- [x] The user can enter a restructure view showing the current resume
      (left, read-only) and a staging canvas (right).
- [x] The user can add one-column and two-column boxes to the staging
      canvas, and remove and reorder them.
- [x] Dragging a macro from the left into a staging box places a copy of
      it there; the left palette is unchanged (copy semantics).
- [x] Placed macros can be reordered and removed within the staging pane.
- [x] **Apply** replaces the resume's layouts+items with the staging
      arrangement, behind a single undo snapshot; **Cancel** discards
      staging and leaves the resume untouched.
- [x] Every drag interaction has a keyboard-accessible equivalent (the
      palette's "Send to…" menu); the view is axe-clean.
- [x] `_frontend` stays at 100% coverage; lint, build, and e2e pass.

## Resolved decisions

- **Pre-filled right pane, with Clear.** Staging opens as a deep *copy*
  of the current resume (`useStagingResume`), so deleting a box or
  reordering is a few edits; **Clear** empties it for a from-scratch
  rebuild. (Chosen over a blank start.)
- **Togglable Apply/Cancel session.** A control-bar **Restructure**
  button opens the two-pane view (replacing the canvas via `Main`); the
  view's Apply/Cancel returns to the normal editor. Apply is
  `pushUndoSnapshot('Resume restructured')` + `onImportFile(staging)`.
- **Native HTML5 DnD + a keyboard "Send to…" menu.** No new dependency:
  palette cards are `draggable` and carry the source `contentId` on
  `text/plain`; staging zones are `onDrop` targets. The palette's
  "Send to…" menu (reusing `useCanvasMenu`, like `move-to-control.tsx`)
  is the required non-drag equivalent, so the view is fully keyboard- and
  e2e-reachable.
- **Unplaced content on Apply is dropped, undo rescues it.** Apply swaps
  in exactly the staging arrangement; the single "Resume restructured"
  undo snapshot restores the prior resume if that wasn't intended. No
  "you have unplaced macros" guard.
- **Duplicates allowed.** Copy semantics let the same macro be placed
  more than once; the copies diverge as independent blocks. The palette
  does not grey already-placed macros.
- **Entry point: a control-bar button** (`RestructureButton`), hidden
  while the view is open.
- **Palette fidelity (simplification worth noting).** The left pane shows
  compact labelled cards (type + one-line summary via
  `deriveMacroLabel`), not the fully styled resume blocks. This kept the
  drag surface simple and the coverage bar reachable; rendering the real
  styled blocks in the palette is a possible follow-up.
- **Supersedes:** this restores the layout delete/reorder that
  `remove-layout-drag-reorder.md` / `inline-layout-toolbar.md` removed,
  now scoped to the staging pane. Those specs stay `superseded`; the old
  `confirm-remove-layout.md` confirm/highlight did **not** carry over
  (staging edits are discardable via Cancel, and Apply is undoable).
