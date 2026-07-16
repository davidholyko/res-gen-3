---
status: implemented
---

# Move a block to another layout

## Problem

A block can't be moved from one layout to another -- including into
either half of a two-column (DOUBLE) layout. Every affordance a block
has is zone-locked:

- **Move up / Move down** (`macro-top-bar.tsx` → `onMove`) only swaps
  with neighbours in the *same* zone: `isSameZone` requires matching
  `layoutId` / `layoutType` / `layoutParentId`, and at a zone edge it's
  a deliberate no-op (specs/editor-redesign.md, Phase 7).
- **"+ Add block"** only *creates new* content in the zone you click it
  in.
- Blocks have no drag-and-drop (retired with the Template ribbon), and
  the PDF modal's "Blocks" list only picks a block to *edit*.

So the only way to get an existing block into a DOUBLE layout's Left or
Right half today is to recreate it there and delete the original.
Reported directly: "the UX doesn't make sense -- how do I move a macro
to one of the double layouts?"

## Non-goals

- **No drag-and-drop for blocks.** Deliberately chosen against the
  drag approach (fiddly with the hover-only canvas chrome, hard to keep
  keyboard/e2e-safe); this is a discrete menu action.
- **No change to Move up/down.** Within-zone reordering stays exactly
  as-is; this adds a separate cross-zone move.
- **No new drop-position control.** The moved block lands at the end of
  the destination zone (predictable); fine-tuning its position there is
  the existing Move up/down job once it's arrived.
- **No new layout kinds.**

## Design

### _frontend

**A "Move to…" menu on the block toolbar.** `MacroTopBar` gains a
control beside Move up/down -- a compact **icon + caret trigger**
(a move/swap glyph with a caret, tooltip/`aria-label` "Move to another
layout"), matching the icon-only Move up/down rather than the text
"Edit with preview". It opens a **flat** menu listing every zone
*except the block's current one*, using the same plain-language labels
the app already uses:

- a SINGLE layout → `Layout N`
- a DOUBLE layout → `Layout N (Left)` and `Layout N (Right)`

Picking a zone reassigns the block there and closes the menu. Menu
mechanics (open/close, outside-click / Escape dismissal, arrow-key
movement, `aria-haspopup` / `aria-expanded` / `aria-controls`) reuse
the existing `useCanvasMenu` hook, exactly as "+ Add block" /
"+ Add layout" do.

**Shared zone derivation.** `edit-panel.tsx` already turns `layouts`
into labelled zones, but only tracks `{ key, label, layoutId }`. Extract
and widen this into a shared helper (e.g. `deriveZones(layouts)`)
returning `{ key, label, layoutId, layoutType, layoutParentId }` for
each zone, and have both `edit-panel.tsx` and the new menu consume it --
one source of truth for "what zones exist and what they're called."
Zone → block fields, mirroring how `AddBlockControl` /
`layout-double.tsx` tag new blocks:

| zone            | layoutType     | layoutId          | layoutParentId    |
| --------------- | -------------- | ----------------- | ----------------- |
| SINGLE          | `SINGLE`       | `layoutId`        | `undefined`       |
| DOUBLE — Left   | `DOUBLE_LEFT`  | `layoutLeftId`    | double `layoutId` |
| DOUBLE — Right  | `DOUBLE_RIGHT` | `layoutRightId`   | double `layoutId` |

**When to show the control.** Only when at least one *other* zone
exists -- with a single lone zone there's nowhere to move to, so the
control is hidden rather than shown disabled.

**New context action.** `moveContentToZone(contentId, zone)` on
`AppContext`:

- pushes an undo snapshot first (`setUndoSnapshot({ items, layouts,
  description: 'Block moved' })`), consistent with Move up/down and
  specs/undo-destructive-actions.md;
- rewrites that item's `layoutId` / `layoutType` / `layoutParentId` to
  the destination zone and repositions it at the **end** of that zone
  in the flat `items` array, leaving every other zone's order
  untouched (same "positional, not splice" care as `onMove`).

**Reveal.** The control lives in the block toolbar, which is already
revealed on block hover/focus; the open menu holds focus so it stays
revealed (same `focus-within` reasoning as the canvas add controls,
specs/continuous-page-canvas.md).

## Acceptance criteria

- [x] A block toolbar shows a "Move to…" control whenever another zone
      exists; picking `Layout N` / `Layout N (Left)` / `Layout N
      (Right)` moves the block into that zone (correct `layoutType` /
      `layoutId` / `layoutParentId`), appended at the end, and it
      disappears from its old zone.
- [x] The move pushes an undo snapshot; the toast's Undo restores the
      block to its original zone and position.
- [x] The current zone is not offered; the control is hidden when no
      other zone exists.
- [x] Move up/down and "+ Add block" behave exactly as before.
- [x] Menu is keyboard-operable and dismisses on Escape / outside click
      (via `useCanvasMenu`); `_frontend` stays at 100% coverage; axe
      suites stay clean; an e2e covers moving a block from a SINGLE
      layout into a DOUBLE layout's half.

## Resolved decisions

- **Menu layout:** a flat list of every other zone, each fully labeled
  (`Layout N` / `Layout N (Left)` / `Layout N (Right)`) -- no grouping.
- **Trigger:** an icon + caret button (tooltip/`aria-label` "Move to
  another layout"), consistent with the icon-only Move up/down.
