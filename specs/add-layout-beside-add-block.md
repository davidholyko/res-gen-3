---
status: implemented
---

# Add layout beside Add block

## Problem

Adding a *block* happens right where you're looking — every zone carries
its own "+ Add block" (specs/editor-redesign.md, Phase 6). Adding a
*layout* doesn't: it lives in the Edit menu up in the control bar (the
kind of menu-for-canvas-actions the redesign spent phases eliminating)
and in the hover-revealed gap inserters, which nothing advertises.
Reported directly: "in terms of UX it doesn't make too much sense where
it is right now."

## Non-goals

- **Gap inserters stay.** They're the insert-at-*position* affordance
  and the drop slots for layout drag-reorder; this adds the obvious
  append-after-this-layout path beside them.
- **The empty state's CTA stays** — with zero layouts there's no footer
  to host the control.
- **No new layout kinds.** Same SINGLE/DOUBLE choice, plain language
  ("One column" / "Two columns"), same `addLayoutAt` path.

## Design

- Every layout's footer pairs **"+ Add block"** with **"+ Add layout"**
  (decided in review: beside every add-block, not a single
  end-of-canvas control). Picking "One column" / "Two columns" from its
  menu inserts the new layout **directly below that layout**
  (`addLayoutAt(…, index + 1)`).
- On a DOUBLE layout the two halves each keep their own "+ Add block";
  the single "+ Add layout" sits in a footer row under both halves —
  it belongs to the layout, not a zone.
- Menu mechanics (outside-click/Escape dismissal, arrow-key movement,
  `aria-haspopup`/`aria-expanded`) are shared with "+ Add block" via an
  extracted `useCanvasMenu` hook rather than a second copy.
- **The Edit menu retires** — these two actions were its only remaining
  items, so the control bar drops to File / View.

## Acceptance criteria

- [x] Every layout (single, and double as a whole) shows "+ Add layout"
      beside/below its "+ Add block"; picking a column count inserts the
      new layout immediately after that layout
- [x] The Edit menu is gone; File and View are unchanged
- [x] Gap inserters and layout drag-reorder behave exactly as before
- [x] `_frontend` stays at 100% coverage; axe suites stay clean; e2e
      happy-path coverage for the new control

## Findings from implementation

- **The empty state is the one place `+ Add layout` can't live** -- the
  control hangs on a layout footer, and the empty state has no layouts.
  Its existing "+ Add Single Column Layout" CTA stays as the sole add
  affordance there (already a non-goal to change), and a shrink-to-zero
  e2e that used to route through the Edit menu now clicks that CTA.
- **`addSingleLayout` now scrolls the page.** The fixture clicks the
  last footer's "+ Add layout"; once layouts run past the fold
  Playwright auto-scrolls to reach it, so the drag-autoscroll suite
  (which asserts a starting `scrollY` of 0) had to reset scroll after
  its setup loop -- a test-only ripple of moving the control from a
  fixed menu onto the scrolling canvas.
