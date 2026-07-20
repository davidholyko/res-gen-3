---
status: superseded
---

> **Superseded:** the per-layout hover toolbar this spec designed (the
> "Layout N" label + "Remove layout", and later the drag handle) was
> removed entirely — including layout drag-to-reorder (see
> `specs/remove-layout-drag-reorder.md`) and then the whole toolbar. The
> canvas currently shows no per-layout chrome; a replacement
> layout-management affordance is planned separately. Kept as a record.

# Layout toolbar reflows inline above the layout

## Problem

`continuous-page-canvas.md` moved each layout's editing chrome (the
drag handle, "Layout N" label, and "Remove layout") into a
hover/focus-revealed toolbar that floats in the **left gutter** --
absolutely positioned (`right-full`) outside the 725px page column so
revealing it causes no content reflow. That spec left one open
question unresolved:

> **Narrow-width gutter fallback:** the left-gutter toolbar and the
> hover-only add controls both rely on margin/hover that thin out on
> small screens. If the gutter collapses, does the toolbar reflow
> inline or overlay on the page edge?

That fallback never got built, and `canvas-edit-panel.md` made it bite:
when the edit panel opens on the right, **the canvas slides left**, which
squeezes the left gutter to nothing. The gutter toolbar then renders
past the viewport's left edge and gets clipped -- the user sees a
dangling `…YOUT 1  Remove layout` fragment hanging off the left of the
screen while editing a block. It reads as a stray floating button, not
as that layout's controls.

## Non-goals

- **The two-step confirm-remove is unchanged** (`specs/confirm-remove-layout.md`),
  and the "Layout N" label stays. This spec changes *where* the toolbar
  sits and how it's revealed.
- **The gap inserters, "+ Add block", and "+ Add layout" controls keep
  their add behavior.** They already reveal on hover/focus and don't
  clip. (The gap inserter's *reorder drop-target* role is removed as part
  of dropping layout drag -- see below -- but its add-layout affordance
  is untouched.)

## Update: drag-to-reorder removed, toolbar repositioned above the layout

A later revision (this branch) made two changes on top of the overlay
design below:

- **Layout drag-to-reorder is removed entirely.** The `LayoutHeader`
  drag handle, the `LayoutGapInserter` drop target, the `moveLayout`
  context action, the `LAYOUT_DRAG_TYPE` constant, and the whole
  `react-dnd` dependency (its `DndProvider` and the now-dead
  `DragAutoScroll` helper, which only existed to speed up drag
  auto-scroll) are all gone -- layouts were the last drag/drop consumer.
  Layouts are now managed entirely through the gap inserters' add
  controls and each layout's "Remove layout". The toolbar is just the
  "Layout N" label + "Remove layout" (no drag handle glyph).
- **The overlay is pinned *above* the layout, not over it.** `top-0` →
  `bottom-full`, so on reveal the row floats in the gap above the layout
  instead of covering its first line (e.g. the resume name stays
  visible). Still absolute (no reflow), still inside the page column (no
  clip), still `opacity` + `pointer-events` gated by
  `group-hover` / `group-focus-within`.

The rest of this spec (the overlay reveal mechanism, the reflow
correction, keyboard reachability, confirm-stays-open) still holds.
- **The continuous-page look is preserved** for the *idle* page: no
  always-visible header rows, only resume content when nothing is
  hovered or focused (`specs/continuous-page-canvas.md`).
- **No mobile/responsive work** beyond no longer depending on gutter
  width.

## Design

### _frontend

Amends the "Hover toolbar placement: left gutter (overlay, no content
reflow)" resolved decision in `continuous-page-canvas.md`. The toolbar
stays an **overlay with no content reflow**, but moves **from the left
gutter to the top of the layout, inside the page column** --
hover/focus-revealed. Keeping it inside the page column (not the gutter)
means it can never sit outside the page and can never clip; keeping it an
overlay (not in the page flow) means revealing it never pushes content.

> **Correction (implementation feedback):** an earlier revision of this
> spec put the toolbar *in the page flow* as a collapsing
> `grid-rows-[0fr]`→`[1fr]` row and accepted a small reflow-on-reveal as
> the tradeoff. In use that reflow was the problem, not an acceptable
> cost: hovering any block visibly jumped the whole layout's content down
> by the row's height. The overlay below replaces it -- no reflow at all.

- **`LayoutHeader` is an absolute overlay pinned to the top of the
  layout.** Drop the gutter positioning (`absolute top-0 right-full z-20
  mr-2`) but stay `absolute` -- now `inset-x-0 top-0` within each
  layout's existing `group relative` wrapper (`layout-manager.tsx`), so
  it floats over the top strip of the layout's content instead of sitting
  in the left margin. A solid background (`bg-white`, `bg-red-50` while
  confirming) keeps the floating row legible over the content beneath;
  same low visual weight (xs text, gray/red) and hairline bottom rule as
  before so it reads as chrome distinct from the resume content.

- **Reveal without reserving idle space and without reflow.** The idle
  page still shows only content: the overlay is out of the page flow
  (absolute), so it reserves no space and its reveal shifts nothing. It
  stays in the DOM, tab order, and accessibility tree (keyboard users
  reach reorder/remove without a hover -- WCAG, unchanged requirement).
  Reveal is `opacity-0`→`opacity-100` gated by `group-hover` /
  `group-focus-within`; `pointer-events-none` while idle stops the
  invisible overlay from swallowing clicks meant for the content beneath
  it, and hover/focus restore `pointer-events`. Tabbing into the control
  triggers `group-focus-within` and reveals it.

- **Confirming stays pinned open.** While a remove is being confirmed
  (`isConfirming`), the row stays visible regardless of hover -- same
  guarantee as today, so the Cancel/Delete choice can't slip away when
  the pointer leaves. The confirm still lives in `LayoutManager` (one
  layout confirming at a time; it also drives the red preview-region
  highlight, `specs/confirm-remove-layout.md`).

- **No reflow on reveal.** Because the toolbar is an overlay, revealing
  it never moves the layout's content. (Per the update above it floats in
  the gap *above* the layout, so it doesn't cover the content either.)

## Acceptance criteria

- [x] With the edit panel open (canvas slid left), hovering/focusing a
      layout shows its toolbar **fully within the viewport** -- no part
      clips off the left edge at any canvas position. (Overlay inside the
      page column; it can no longer render outside it.)
- [x] The idle page (nothing hovered/focused) shows only resume content:
      the toolbar is invisible, reserves no space, and is click-through.
- [x] Revealing the toolbar (hover or focus) does not reflow the layout's
      content -- nothing shifts down; the overlay floats over the content.
- [x] Hovering a layout, or moving keyboard focus into it, reveals the
      toolbar row in the gap above that layout's content (not over it).
- [x] There is no layout drag-to-reorder: no drag handle, no
      `LAYOUT_DRAG_TYPE` source/drop-target, no `react-dnd` in the app.
      Layouts are added/removed via the gap inserters and "Remove layout".
- [x] The toolbar is keyboard-reachable while idle (in tab order /
      accessibility tree without a hover); tabbing to it reveals it.
- [x] Two-step remove is unchanged: first "Remove layout" click only
      requests confirm; while confirming the row stays visible
      regardless of hover and shows Cancel/Delete wired to the parent;
      confirm pushes an undo snapshot and removes the layout.
- [x] `_frontend` stays at 100% coverage; `layout-header` axe suite
      stays clean (idle and confirming); the layout add/remove/reorder
      e2e happy paths stay green.

## Resolved decisions

- **Overlay, not an in-flow collapsing row.** Superseding an earlier
  revision that used a `grid-rows-[0fr]`->`[1fr]` collapse in the page
  flow: that reflowed the layout's content down on every reveal, which
  read as the content jumping whenever a block was hovered. The toolbar
  is instead an absolute overlay (`absolute inset-x-0 top-0 z-20`) inside
  the layout's `group relative` wrapper, revealed via
  `opacity-0`->`opacity-100` + `pointer-events-none`->`auto`, gated by
  `group-hover` / `group-focus-within`. Out of flow => zero reserved
  space and no reflow; inside the page column => never clips like the old
  gutter placement. The cost is that the revealed row floats over the top
  strip of the layout's content; a solid background keeps it legible and
  the short row keeps the coverage small.
