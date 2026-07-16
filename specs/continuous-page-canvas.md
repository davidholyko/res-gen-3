---
status: implemented
---

# Layouts flow as one continuous page

## Problem

The editor canvas is meant to be the resume's HTML preview -- a
WYSIWYG of the PDF, which is a single continuous document. The
`.editor-page-container` is even capped at 725px "so PDF view looks
like a 1:1 comparison" (src/css/editor.css).

But it doesn't read as one page. Each layout renders as its **own
dashed-bordered rounded box** (`border-2 border-stone-700
border-dashed`, layout-single.tsx) sitting on the gray page
background, topped by an always-visible **"⠿ LAYOUT N ... Remove
layout" header row** (layout-header.tsx) with vertical margins between
them. Stacking layouts therefore looks like a column of separate boxed
cards -- reported directly: the layout "doesn't make sense, it's
supposed to extend the HTML preview, not add an entire new thing that
looks like its own page." A user adding a second layout expects the
resume to grow down one page, not sprout a second bordered panel.

## Non-goals

- **No new layout kinds.** Same SINGLE / DOUBLE, same `addLayoutAt`
  path, same "+ Add block" / "+ Add layout" controls
  (specs/add-layout-beside-add-block.md).
- **Editing capability is preserved, not removed.** Reorder, remove,
  add-block, add-layout, and the per-layout label all still exist and
  stay keyboard-reachable -- this is a *visual* change to when/how that
  chrome shows, not a feature cut.
- **The empty state stays** as-is (its own dashed CTA card is the
  zero-layout affordance; specs/app-ux-improvements.md).
- **Gap inserters stay** as the insert-at-position / drag-drop slots;
  they're already hover-revealed and don't break the idle page.
- **The PDF pipeline is untouched** -- this only restyles the HTML
  canvas.

## Design

### _frontend

**The page becomes one surface.** Today there is no white "page" --
each layout is a dashed box on the gray app background, and the 17px
page padding lives on each SINGLE layout via the
`.editor-page-container > .layout-single` direct-child rule. Instead:

- `.editor-page-container` becomes the paper: white background, the
  17px padding applied once to the container, a subtle shadow/border so
  it reads as a page against the gray app background. The per-layout
  `> .layout-single { padding: 17px }` rule is removed (its reason for
  existing -- giving a standalone SINGLE its page padding -- moves to
  the container).
- Because padding moves to the container, the layout-manager comment
  block explaining the direct-child selector is updated; the Fragment
  structure can stay, but the padding constraint it was protecting is
  gone.

**Layouts lose their idle chrome.**

- `LayoutSingle` drops the dashed border / rounded box classes. It
  still renders its blocks (`MacroManager`) and its footer controls;
  it just no longer draws a box around itself. The `min-h-[50px]` empty
  target stays so an empty layout is still a clickable drop zone.
- On `LayoutDouble`, the two halves flow side by side with no boxes.
  A single **hairline vertical divider** marks the column boundary
  (a faint 1px rule between the halves) so the right column's edit
  target is unambiguous -- not two bordered panels.
- `LayoutHeader`'s always-visible "LAYOUT N" + "Remove layout" row is
  replaced by **hover/focus-revealed** chrome that floats in the
  **left gutter** (the margin beside the page), absolutely positioned
  so revealing it causes **no content reflow**. When a layout is
  hovered or contains focus (`group` + `group-hover` / `focus-within`),
  the low-profile gutter toolbar appears -- the drag handle (⠿, still
  the reorder drag source), the "Layout N" label, and "Remove layout".
  When idle it's visually hidden but stays in the accessibility tree
  and tab order so keyboard users can reach reorder/remove without a
  hover. The gutter lives outside the 725px page column (in the mirror
  spacer region from app/main.tsx), so it must degrade gracefully at
  narrow widths where that margin is squeezed.

**Reorder drag handle.** Today the drag source *is* the LayoutHeader
row. That row now only shows on hover/focus, so the handle lives in the
revealed toolbar. Gap inserters remain the drop targets unchanged.
DragAutoScroll and the gap-inserter drop logic don't change.

**Add controls go hover-only.** "+ Add block" and "+ Add layout" keep
their `useCanvasMenu` mechanics but are **revealed on hover/focus**
along with the gutter toolbar (same `group-hover` / `focus-within`
gate), so the idle page shows only resume content. They stay in the
tab order for keyboard users. An open menu must not collapse when the
pointer leaves (the menu's own outside-click/Escape dismissal governs
that), so the reveal is gated on `focus-within` too -- an open menu
holds focus and thus stays revealed.

**Accessibility.** Hover-only affordances must have a focus-visible
equivalent (`focus-within` reveal) so keyboard-only users get the same
reorder/remove/label; contrast still checked against the *white* page
now (the -600 grays were chosen against gray-100 -- on white they only
get better, but the axe suite re-verifies). The reveal must not rely on
hover alone (WCAG).

## Acceptance criteria

- [x] Stacking 2+ layouts renders as one continuous white page: no
      dashed per-layout boxes, no always-visible "LAYOUT N" header rows,
      no inter-layout gaps that read as separate pages.
- [x] The canvas visually approximates the generated PDF's single-page
      flow (the 725px / 17px-padding 1:1 intent is preserved on the
      container).
- [x] Each layout's label, remove, and reorder-drag handle live in a
      left-gutter toolbar reachable on hover **and** via keyboard focus,
      with no content reflow when it appears; reorder and remove still
      work and still push an undo snapshot.
- [x] "+ Add block" / "+ Add layout" are hover/focus-revealed (hidden
      on the idle page) but behave exactly as before once shown (same
      menus, same insert positions); an open menu stays revealed while
      the pointer is away. Gap inserters and layout drag-reorder behave
      exactly as before.
- [x] A DOUBLE layout shows a single hairline divider between its two
      columns and no per-half boxes.
- [x] Empty state is unchanged.
- [x] `_frontend` stays at 100% coverage; axe suites stay clean
      (re-checked against the new white page surface); e2e happy paths
      (add/remove/reorder layout, add block) stay green.

## Resolved decisions

- **DOUBLE column separator:** a single hairline vertical divider
  between the two columns.
- **Hover toolbar placement:** absolutely positioned in the left
  gutter (overlay, no content reflow).
- **Add controls:** hover/focus-revealed, not always-visible -- the
  idle page shows only resume content.

## Open questions

- **Narrow-width gutter fallback:** the left-gutter toolbar and the
  hover-only add controls both rely on margin/hover that thin out on
  small screens. If the gutter collapses, does the toolbar reflow
  inline or overlay on the page edge? Settle during implementation
  against the existing responsive behavior of app/main.tsx.
