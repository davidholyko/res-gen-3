---
status: implemented
---

# Restructure staging renders the real styled resume (WYSIWYG)

## Problem

The restructure view (`specs/restructure-view.md`) reshapes the resume by
dragging **labelled cards** ("Section heading — Summary"). The cards say
*what* each block is, but not what it *looks like*, so you can't tell how
the resume reads as you rearrange it. Reported directly: "I want to see
what it looks like when I move stuff around in the side-by-side view."

Chosen direction (confirmed): the staging pane should render the
**real styled resume** and be edited in place -- WYSIWYG -- rather than
showing cards or a separate preview column. The styled preview sits in the
**left** pane (the wider one) with the source palette on the **right**, so
the eye lands on the resume being built first.

## Non-goals

- **The palette (right pane) stays labelled cards.** It's the read-only
  *source* list you drag from; styling it too would just duplicate the
  staging render and crowd the view.
- **No block-content editing in this view.** You still fill in a block's
  fields on the canvas after Apply (`specs/restructure-view.md`); this
  view arranges *structure*, now shown styled.
- **No change to the canvas or the normal editor.** The canvas must
  render byte-for-byte identically after the shared-rendering refactor
  below.
- **Not a PDF/print preview.** This is the same HTML rendering the canvas
  uses, driven by staging state -- not the `@react-pdf` pipeline.

## Design

### _frontend

**1. Extract read-only content renderers (one source of truth for how a
block looks).** Today each of the five macros is
`<BaseMacro {...item}>{styledContentJSX}</BaseMacro>` -- the styled JSX
(e.g. ContactMacro's centered `<h1>` + contact row) lives *inside* the
interactive `BaseMacro`. Extract that JSX into a per-type content
component (`ContactContent`, `HeaderContent`, `ParagraphContent`,
`ExperienceContent`, `AnyListContent`) plus a `MacroContent` switch that
maps an item to its content component (mirrors `MacroManager`, minus
`BaseMacro`). Then:

- The canvas macros become `<BaseMacro {...item}><XContent .../></BaseMacro>`
  -- **no visual change**, they render the exact same JSX.
- The preview renders `<MacroContent item={…} />` directly, with none of
  BaseMacro's focus/click/edit chrome.

This keeps the canvas and the WYSIWYG staging pixel-identical by
construction (same JSX, one definition).

**2. WYSIWYG staging renderer.** Replace the staging pane's cards
(`RestructureStagingBox`'s labelled rows) with a styled render of
`staging.layouts` / `staging.items`:

- Each staging layout renders as the real layout container -- a single
  column, or a two-column row with the `divide-x` hairline -- reusing the
  exact classes from `LayoutSingle` / `LayoutDouble`.
- Each zone renders its staging items through `MacroContent`, so the pane
  reads like the actual resume page.

**3. In-place manipulation, as hover overlays on the styled content.**
Same operations `useStagingResume` already exposes -- only their
presentation changes:

- **Per block:** a hover/focus-revealed mini toolbar (move up / move down
  / remove) floating over the block (absolute overlay so it never
  reflows, the pattern from the retired layout toolbar), keyboard-reachable.
- **Per zone:** a drop target that accepts palette drags (copy) and a
  "+ Add block" affordance; an empty zone shows a dashed "drop here"
  placeholder so it's still targetable.
- **Per layout box:** remove / reorder controls and the "+ One column" /
  "+ Two columns" add-box controls.

**4. Palette + Apply/Cancel/Clear unchanged.** The left palette stays
draggable cards with "Send to…"; Apply still commits staging as the
resume behind one undo snapshot.

## Acceptance criteria

- [ ] The staging pane renders the **real styled resume** of the staging
      arrangement and updates live as blocks/boxes are added, removed,
      reordered, or placed.
- [ ] The canvas renders identically to before (shared content
      components; verified by the existing canvas/editor tests staying
      green with no snapshot/DOM changes).
- [ ] Reorder, remove, add-block, add-layout, and place-by-drag all work
      on the styled content, each with a keyboard-accessible equivalent.
- [ ] `_frontend` stays at 100% coverage; lint, build, and e2e pass; the
      restructure view stays axe-clean in a real-browser scan.

## Resolved decisions

- **Block controls: a side action gutter.** Each styled block gets a thin
  vertical controls strip (move up / move down / remove) in a gutter to
  its left, rather than an overlay chip/bar. It never covers the block's
  content. Keyboard-reachable. The gutter is hidden until the block is
  hovered or keyboard-focused (`opacity-0` -> `opacity-100` via
  `group-hover` / `group-focus-within`, not `display`, so the controls
  stay focusable and the content never shifts), and the whole row
  highlights with it (a light cyan `hover:bg-cyan-50` /
  `focus-within:bg-cyan-50`) -- so it's clear which block the controls act
  on, without a permanent strip of controls beside every block.
- **Drops land at the end of the zone.** Dropping a palette macro (or
  "Send to…") appends it to the bottom of the target zone -- today's
  behavior; reorder afterward with the gutter's up/down. No
  between-blocks drop indicator in this pass.
- **Palette stays labelled cards, and reordering them drives the preview.**
  The source pane keeps its compact type + summary cards (not styled) --
  easy to scan/drag, no duplicate styled render. Its order can be resorted
  by dragging a card into a gap between cards (`palette-gap`): the gap is a
  hairline at rest, but as soon as a card is picked up every gap opens into
  a roomy dashed drop slot -- making obvious room between the cards to aim
  for, since a 2px target is too fiddly -- and the gap under the pointer
  fills in solid to show where the drop lands. Reordering is confined to
  within one zone group (a cross-zone drop is a no-op). The drop mirrors
  onto the staging copy (palette and staging share contentIds on open), so
  the **styled preview on the left updates live** with the same drag, and
  the new order is part of what Apply commits. It degrades gracefully when
  the ids have diverged -- a placed copy or a block already removed from
  staging -- leaving the preview untouched. The palette order resets when
  the view closes.
- **Zone droppability signal.** Since the drop target is now styled
  content (not a dashed box), a zone shows a subtle highlight/outline
  while a drag is over it; an *empty* zone still shows a dashed "drop
  here" placeholder so it stays targetable.

## Implementation note

- **Refactor blast radius.** Extracting the content components touches all
  five macros + their tests; the acceptance bar is a pixel-identical
  canvas, so the change is verified by the existing canvas/editor tests
  staying green with no DOM changes, plus a before/after screenshot check.
