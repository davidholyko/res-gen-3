---
status: implemented
---

# Restructure palette mirrors staging (move semantics)

## Problem

The restructure view's two panes disagree with each other. The left pane
is the staging arrangement being built; the right pane is a snapshot of
the resume *as it was when the view opened*. Editing the left — placing a
macro, removing one, adding a blank block, reordering, Clear — changes
nothing on the right, so the panes drift apart the moment you start
working. Worse, the one sync that does exist runs the other way
(reordering palette cards updates the left preview), which teaches the
user the panes are linked and then breaks that expectation for every
other edit. Reported directly: "the right pane doesn't accurately
reflect the left, I want them to mirror each other when I update one of
them."

The root cause is the palette's original role: a read-only *source* list
with copy semantics (`specs/restructure-view.md`, Resolved decisions).
That model made sense for "rebuild from scratch," but in practice the
panes read as two views of the same thing — so they should be.

Chosen direction (user decision, 2026-07-22): **full mirror with move
semantics**. The right pane becomes a compact outline of the staging
arrangement itself — same boxes, same zones, same order — updating live
with every edit on either side.

## Non-goals

- **No visual redesign of the cards.** The compact type + summary card
  (`deriveMacroLabel`) stays; only what the list *shows* changes.
- **No change to Apply/Cancel/undo.** Apply still commits staging behind
  one "Resume restructured" snapshot; Cancel still discards.
- **No block-content editing in this view**, as ever.
- **No mobile/responsive work.**

## Design

### _frontend

- **The palette renders staging, not the live resume.** Its groups derive
  from `staging.layouts` (`deriveZones`), its cards from `staging.items`,
  in staging's own order. Every staging mutation — place, remove, reorder,
  add block, add/move/remove layout, Clear — re-renders the palette. The
  local `paletteOrder` scanning-aid state and the live-resume grouping in
  `RestructureView` are deleted; the palette needs no state of its own.
- **Drag becomes move.** Dragging a card into a staging zone (left pane)
  or into a palette gap (right pane) *moves* the block within staging —
  it no longer copies from a frozen source. Dropping into another zone's
  area moves it to that zone (append for zone drops, exact position for
  gap drops); same-zone gap drops reorder. The "Send to…" menu becomes
  "Move to…", matching the canvas's existing move vocabulary.
- **Duplicates via drag are gone** — a move can't duplicate. (Duplicates
  as a feature die with copy semantics; see Superseded decisions.)
- **Clear empties both panes.** With no separate source list, Clear
  leaves nothing to drag; the empty-staging hint gains a line pointing at
  Cancel as the way back. This is accepted: Cancel already restores
  everything, and Apply-then-undo covers the other path.
- **Blank blocks appear in the palette** the moment "+ Add block" creates
  them (they render as "(empty)" cards, as the card component already
  does for empty content).
- **Zone labels in the palette match the staging box labels** ("Layout 1",
  "Layout 2 (Left)"…), so the outline reads as a table of contents for
  the left pane.

### Superseded decisions

- `specs/restructure-view.md`: "Duplicates allowed" and "copy semantics —
  the left palette is unchanged" are superseded by this spec.
- `specs/wysiwyg-staging.md`: the palette-reorder-as-scanning-aid model
  (local order, resets on close, mirrors one-way onto staging) is
  superseded — palette order *is* staging order now.
- Both specs get a pointer note; their statuses stay `implemented` as
  records of intent.

## Acceptance criteria

- [x] Any staging edit (place, remove item, reorder item, add block,
      add/move/remove layout, Clear) is reflected in the palette
      immediately, and vice-versa — the two panes never disagree.
- [x] Dragging a card (from either pane) into a staging zone or palette
      gap moves the block; the block count never changes from a drag.
- [x] "Move to…" (renamed from "Send to…") moves the block to the chosen
      zone from the keyboard, no drag required.
- [x] Clear empties both panes; Cancel restores the resume untouched.
- [x] `_frontend` stays at 100% coverage; existing e2e suite updated and
      green; the view stays axe-clean.

## Open questions

- ~~Should a cross-zone palette-gap drop land at the gap's exact position
  (proposed) or append to the zone like zone drops do?~~ **Resolved at
  implementation: exact position.** One `moveItemTo(contentId, zone,
  beforeId)` covers every path — gap drops pass the card below the gap as
  `beforeId` (exact position, cross-zone retag included), zone drops and
  "Move to…" pass `null` (append) — so exact position cost nothing extra.
