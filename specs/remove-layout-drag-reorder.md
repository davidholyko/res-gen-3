---
status: draft
---

# Remove layout drag-to-reorder; float its toolbar above the layout

## Problem

Two related things, both about the per-layout editing toolbar
(`LayoutHeader`) and the layout drag-to-reorder it hosts.

**1. Layout drag-to-reorder is the app's last drag/drop surface, and it
carries disproportionate weight.** `editor-redesign.md` (Phase 6) added
drag-to-reorder for whole layouts, built on `react-dnd`'s HTML5 backend.
It is now the *only* remaining `react-dnd` consumer — dragging content
from the old template ribbon retired with the ribbon. Keeping it alive
costs:

- the `react-dnd` + `react-dnd-html5-backend` dependencies and a
  `DndProvider` wrapping the whole app,
- a page-wide `DragAutoScroll` helper that exists solely because the
  native HTML5 drag gesture doesn't auto-scroll toward off-screen drop
  targets (`editor-redesign.md`, Problem, bullet 5),
- e2e gymnastics: the HTML5 backend hangs under Playwright's `dragTo()`,
  so its tests drive a hand-rolled multi-step `mouse.move` gesture and
  must avoid reflowing anything mid-drag.

**2. The drag handle forces the hover toolbar to sit over the content.**
`inline-layout-toolbar.md` moved the toolbar into an absolute overlay at
the top of each layout so revealing it doesn't reflow the page. But with
the drag handle present it overlays the *top strip of the layout's
content* — e.g. it covers the resume name while you hover. Reported
directly: "when I hover over the elements they seem to move / the
toolbar covers the name."

Removing drag-to-reorder resolves both: it deletes the whole `react-dnd`
surface (and the autoscroll helper that only existed to serve it), and it
frees the toolbar — now just a label + Remove control — to move out of
the content's way.

## Non-goals

- **Block/content reordering is untouched.** Move Up / Move Down on
  blocks (`onMove`, zone-aware) stays exactly as-is; this is only about
  *layout* reordering.
- **The gap inserters keep their add behavior.** "+ One column" / "+ Two
  columns" between layouts are unchanged; only their secondary role as a
  reorder *drop target* goes away.
- **Two-step confirm-remove is unchanged** (`specs/confirm-remove-layout.md`):
  same first-click-asks / Delete-removes flow, same preview-region
  highlight, same undo snapshot.
- **No new layout-reorder replacement UI in this spec.** See Open
  questions — whether reordering needs a keyboard/button replacement is
  called out, not assumed.

## Design

### _frontend

**Remove the layout drag/drop machinery entirely:**

- `LayoutHeader` — drop the `useDrag` source and the drag-handle span
  (the `⠿` glyph + `draggable`/`cursor-grab` label). The label becomes a
  plain "Layout N" text; the toolbar is just that label + "Remove
  layout".
- `LayoutGapInserter` — drop the `useDrop` drop target, the
  `isLayoutDragInProgress`/`isOver` collected state, and the
  drag-only border styling. It keeps only the add-layout buttons,
  revealed on hover/focus.
- `app-context` — remove the `moveLayout` action (and its "Layout moved"
  undo snapshot; that undo case can no longer occur).
- `constants` — remove `LAYOUT_DRAG_TYPE`.
- `page.tsx` / `test-providers.tsx` — remove the `DndProvider` wrapper
  (no consumers remain).
- Delete `DragAutoScroll` (component + its wiring in `app.tsx`): with no
  drag anywhere, it's dead.
- Remove the `react-dnd` and `react-dnd-html5-backend` dependencies.

**Reposition the toolbar above the layout:**

- `LayoutHeader` stays an absolute overlay revealed on hover/focus
  (`opacity` + `pointer-events`, gated by `group-hover` /
  `group-focus-within`, `isConfirming` pins it open), but pinned
  **above** the layout (`bottom-full` instead of `top-0`). It floats in
  the gap above the layout so it no longer covers the content's first
  line. Still out of flow (no reflow) and inside the page column (no
  clip) — this refines `inline-layout-toolbar.md`.

**Tests:** drop the drag-source/drop-target/`moveLayout` unit tests and
the drag-based e2e specs (`drag-autoscroll.spec.ts`, the layout-reorder
cases in `layout-manipulation.spec.ts` and `undo.spec.ts`); keep the
add/remove and zone-aware content-move coverage. `_frontend` stays at
100% coverage.

### _backend

None — fully client-side.

## Acceptance criteria

- [ ] There is no way to drag a layout to reorder it: no drag handle, no
      `LAYOUT_DRAG_TYPE` source or drop target, and `react-dnd` /
      `react-dnd-html5-backend` are no longer dependencies of `_frontend`.
- [ ] Layouts can still be added at any gap ("+ One/Two column") and
      removed via each layout's two-step "Remove layout" (unchanged,
      including undo).
- [ ] Block Move Up / Move Down is unchanged.
- [ ] Hovering or focusing a layout reveals its toolbar in the gap
      **above** the layout; the layout's first line (e.g. the resume
      name) stays fully visible, and nothing reflows on reveal.
- [ ] The toolbar is keyboard-reachable while idle (tab order / a11y
      tree) and reveals on focus; `layout-header` axe suite stays clean.
- [ ] `_frontend` stays at 100% coverage; lint and build pass.

## Open questions

- **Does layout reorder need a replacement?** This removes the only way
  to reorder layouts, with no substitute. Options: (a) accept it —
  reorder via remove + re-add for now; (b) add Move Up / Move Down
  buttons to the layout toolbar (mirrors block reordering, keyboard- and
  a11y-friendly, no `react-dnd`). Leaning (a) for now given how rarely
  whole sections get reordered, but this is the main call to make before
  approving.
- **Should `inline-layout-toolbar.md` be superseded or amended?** This
  spec refines its overlay placement (top → above) and removes the drag
  handle it described. Plan: amend `inline-layout-toolbar.md` and add a
  superseding note to `editor-redesign.md`'s Phase 6 layout-reorder
  decision, rather than a full rewrite of either.
