---
status: implemented
---

# Ribbon-style layout: canvas as the center of the page

## Problem

The main page (`app/main.tsx`) puts `EditorManager` (the 5 template
JSON-editor cards) and `LayoutManager` (the interactive WYSIWYG canvas —
the thing that's actually being built) side by side in a row, each
getting a fixed share of the page. The canvas — the primary
thing a user looks at and acts on — isn't the visual focus; it shares
equal weight with a template panel that's mostly idle once someone
knows which content types they're using.

## Non-goals

- **Not changing how each editor's content is edited.** Still the
  existing raw-JSON `<textarea>` per content type — this is a layout/
  positioning change only, not `specs/editor-redesign.md`'s (draft,
  unapproved) forms redesign. Kept independent: this can land before,
  after, or without that spec.
- **Not changing drag-and-drop mechanics.** Same `DragHandleIcon`-based
  drag source, same drop targets.
- **Not mobile/responsive.** Desktop-only, consistent with prior UX work.
- **Not the PDF preview modal.** Unaffected by this change.

## Design

**Confirmed feasible from the existing code, not a redesign of the
editing mechanic**: `BaseEditor` already collapses/expands each editor
independently (`isOpen` state, defaults to `false` specifically in
`IN_EDITOR_MANAGER` mode, animated via `react-collapse`'s `<Collapse>`).
The ribbon is mostly a **layout/CSS restructuring** reusing that
existing mechanic, not new interaction code:

- **`main.tsx`**: change from a row (`EditorManager` beside
  `LayoutManager`) to a column — `EditorManager` becomes a full-width
  bar directly under the `ControlPanel` header, `LayoutManager` centers
  in the remaining space below it (reuses the existing centering from
  `app-ux-improvements.md`, Finding 11 — no longer competing with a
  side column for width).
- **`EditorManager`**: switch its container from an implicit vertical
  stack to a horizontal `flex flex-row` — the 5 editors (Contact,
  Header, Paragraph, Experience, AnyList) sit side by side, each
  collapsed by default (already true today), showing just their
  `EditorTopBar` (drag handle, label, "Add to layout" picker, collapse
  toggle) — no code change needed there, just the container's
  flex-direction.
- **Expanding one**: clicking a ribbon item's existing collapse toggle
  opens its textarea as a **floating panel, absolutely positioned below
  that specific item, overlaying the canvas** rather than pushing
  anything down. Only applied for `EDITOR_MODES.IN_EDITOR_MANAGER` — the
  same `BaseEditor`/`Collapse` is also used in `IN_LAYOUT_MANAGER` mode
  (a focused block's inline editor), which keeps its current in-flow
  placement, untouched by this change.
- **Multiple items open at once**: stays possible, matching today's
  behavior (each editor's `isOpen` is independent state, not lifted into
  shared/exclusive state). Floating panels don't visually require
  mutual exclusion the way inline-pushing would have — if several are
  open they just each float below their own tab. Exclusive single-tab
  behavior would mean lifting `isOpen` out of each `BaseEditor` into a
  shared parent, a real interaction/state change, not justified by the
  floating-vs-inline decision alone — deferred, not assumed.

## Acceptance criteria

- [x] The 5 template editors render in a horizontal bar directly under
      the control panel, not a left-hand column
- [x] The WYSIWYG canvas (`LayoutManager`) is horizontally centered in
      the remaining page width, no longer sharing a row with the ribbon
- [x] Each editor still independently expands/collapses via its
      existing toggle — no interaction regression
- [x] Drag-and-drop from a ribbon item onto the canvas still works
      (dragging the collapsed item's top bar, same as today)
- [x] Expanding one ribbon item doesn't visually distort/stretch its
      still-collapsed neighbors
- [x] All changes keep `_frontend` at 100% coverage and the `axe-core`
      component/E2E suites clean

## Open questions

- **Icon+label vs. icon-only ribbon buttons** — the current
  `EditorTopBar` already shows a label (macro name) plus a drag-handle
  icon; keeping both is likely fine at 5 items, but worth confirming
  once it's actually laid out horizontally and can be seen. Kept as-is
  (icon+label) for v1; revisit if it looks cramped once built.
- **Floating panel horizontal overflow**: panels anchor left-aligned to
  their own ribbon tab; a tab near the right edge of a narrower desktop
  window could overflow past the viewport edge. Verified live at 1920px
  (all 5 items on one row) — the rightmost item's panel stayed
  comfortably within the viewport, since the ribbon itself is left-packed
  rather than spread full-width. Not an issue in practice at realistic
  desktop widths; left as-is.

## Findings from implementation

Two real regressions a live-browser check caught, not just the layout
shape itself:

- **Drag gesture broke on compact ribbon items.** The old wide left-panel
  card had enough width that its whole-bar center point (where a
  simulated drag, and a real click-and-drag, naturally starts) safely
  landed on the drag-handle/label region. The ribbon's much narrower
  items moved that same center point onto the "Add to layout" `<select>`
  instead — clicking/dragging from there opens the dropdown, not a
  drag. Confirmed via `document.elementFromPoint()` at the drag
  origin before and after the fix. Fixed by scoping `draggable`/the
  react-dnd ref to just the drag-handle+label region
  (`editor-top-bar.tsx`) instead of the whole top bar, matching what's
  actually visually "grippy".
- **Control panel dropdowns (File/Edit/View) rendered behind the
  ribbon's floating panels.** `BaseMenu`'s dropdown is `position:
  absolute` with no explicit `z-index`; the ribbon's floating editor
  panels introduced a `z-20` sibling in the same stacking context, which
  — even collapsed/height-0 — was enough to push the ribbon's own
  stacking priority above the menu's. Confirmed live: opening the Edit
  menu showed its items rendered underneath the ribbon boxes, and
  clicking "Remove Last Layout" actually clicked through to a ribbon
  button instead. Fixed with an explicit `z-30` on the dropdown
  (`control-panel-base-menu.tsx`) — a transient overlay menu should
  always render above ordinary page content regardless of DOM position.
