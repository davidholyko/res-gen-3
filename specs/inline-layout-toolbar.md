---
status: implemented
---

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

- **No change to what the toolbar does.** Same drag-to-reorder handle
  (still the `LAYOUT_DRAG_TYPE` drag source carrying `index`), same
  two-step confirm-remove (`specs/confirm-remove-layout.md`), same
  "Layout N" label. This only changes *where* the toolbar sits and how
  it's revealed.
- **The gap inserters, "+ Add block", and "+ Add layout" controls are
  untouched.** They already reveal on hover/focus and don't clip; this
  spec is only about the per-layout `LayoutHeader` toolbar.
- **The continuous-page look is preserved** for the *idle* page: no
  always-visible header rows, only resume content when nothing is
  hovered or focused (`specs/continuous-page-canvas.md`).
- **No mobile/responsive work** beyond no longer depending on gutter
  width.

## Design

### _frontend

Amends the "Hover toolbar placement: left gutter (overlay, no content
reflow)" resolved decision in `continuous-page-canvas.md`. The toolbar
moves **from the left gutter into the page flow, as a compact row at the
top of the layout**, still hover/focus-revealed. Because it's in flow,
it can never sit outside the page and can never clip -- the tradeoff
`continuous-page-canvas.md` was avoiding (a small reflow when it
reveals) is accepted here in exchange for a control that's always
on-screen and legible.

- **`LayoutHeader` becomes an in-flow row.** Drop the gutter positioning
  (`absolute top-0 right-full z-20 mr-2`). It renders as the first child
  inside each layout's `group relative` wrapper (its position in
  `layout-manager.tsx` is already first, so no structural reorder), as a
  compact left-aligned toolbar row above the layout's content, with a
  hairline bottom rule so it reads as chrome distinct from the resume
  content below it. Same low visual weight (xs text, gray/red) as today.

- **Reveal without reserving idle space.** The idle page must still show
  only content, so the row must occupy **zero height when idle** yet
  stay in the DOM, tab order, and accessibility tree (keyboard users
  reach reorder/remove without a hover -- WCAG, unchanged requirement).
  Achieved with a collapse-on-idle wrapper (e.g. a
  `grid-rows-[0fr]`→`grid-rows-[1fr]` or `max-h-0`→`max-h-*` +
  `overflow-hidden`, `opacity-0`→`opacity-100`) gated by
  `group-hover` / `group-focus-within`, so tabbing into the clipped
  control (or hovering the layout) expands it. Exact classes settled in
  implementation; the acceptance criteria pin the behavior.

- **Confirming stays pinned open.** While a remove is being confirmed
  (`isConfirming`), the row stays expanded and visible regardless of
  hover -- same guarantee as today, so the Cancel/Delete choice can't
  slip away when the pointer leaves. The confirm still lives in
  `LayoutManager` (one layout confirming at a time; it also drives the
  red preview-region highlight, `specs/confirm-remove-layout.md`).

- **Reflow cost is the accepted tradeoff.** Revealing the row pushes the
  layout's content down by the row's height. This is a small, local
  shift (not the whole-page reflow the old inline editor caused), and it
  only happens on hover/focus of that one layout. Keep the row short to
  minimize it.

## Acceptance criteria

- [x] With the edit panel open (canvas slid left), hovering/focusing a
      layout shows its toolbar **fully within the viewport** -- no part
      clips off the left edge at any canvas position. (In-flow row; it
      can no longer render outside the page column.)
- [x] The idle page (nothing hovered/focused) shows only resume content:
      the toolbar occupies zero visible height and draws no row.
- [x] Hovering a layout, or moving keyboard focus into it, reveals the
      toolbar row above that layout's content; the drag handle still
      registers as a `LAYOUT_DRAG_TYPE` source carrying `index`, and
      reorder still works.
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

- **Collapse mechanism:** a `grid-rows-[0fr]`->`[1fr]` wrapper with an
  `overflow-hidden min-h-0` inner row (the standard grid-collapse
  pattern), gated by `group-hover` / `group-focus-within`. Chosen over
  `max-height` because `0fr`->`1fr` collapses to the row's exact content
  height with no magic-number cap. Tailwind v4 compiles all four
  utilities (`grid-rows-[0fr]`, `grid-rows-[1fr]`, and the two variant
  forms) and scopes the variants to `.group` descendants, which the
  in-flow `LayoutHeader` is; tabbing into the clipped control triggers
  `group-focus-within` and expands it.
