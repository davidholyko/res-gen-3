---
status: draft
---

# Restructure staging renders the real styled resume (WYSIWYG)

## Problem

The restructure view (`specs/restructure-view.md`) reshapes the resume by
dragging **labelled cards** ("Section heading — Summary"). The cards say
*what* each block is, but not what it *looks like*, so you can't tell how
the resume reads as you rearrange it. Reported directly: "I want to see
what it looks like when I move stuff around in the side-by-side view."

Chosen direction (confirmed): the staging (right) pane should render the
**real styled resume** and be edited in place -- WYSIWYG -- rather than
showing cards or a separate preview column.

## Non-goals

- **The palette (left pane) stays labelled cards.** It's the read-only
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

## Open questions

- **Overlay legibility.** Hover toolbars floating over styled blocks:
  corner-anchored chip, a thin action gutter beside each block, or an
  overlay bar? Needs to be reachable without hiding the content it acts
  on.
- **Drop precision.** Keep "drop lands at the end of the zone" (today's
  behavior) or support dropping *between* blocks at the drop position?
  (Between-blocks reads better but is more work / more drag math.)
- **Palette drag onto styled content.** The drop target is now styled
  resume, not a dashed box -- how to signal "droppable here" on hover
  without disturbing the look.
- **Refactor blast radius.** Extracting content components touches all
  five macros + their tests; the acceptance bar is a pixel-identical
  canvas, so this needs careful before/after checking.
- **Palette fidelity.** Confirm the palette stays cards (recommended) vs.
  also rendering styled source blocks.
