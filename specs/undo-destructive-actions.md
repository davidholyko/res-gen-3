---
status: implemented
---

# Undo destructive actions

> **Follow-up:** layout removal later re-gained a confirm step -- but an
> inline, non-blocking one with a delete-preview highlight, not the old
> `window.confirm()` -- because one click could wipe the whole resume on
> the common single-layout case. Undo still fires on the confirmed
> delete; the two are complementary. See
> `specs/confirm-remove-layout.md`.

## Problem

Deleting a block, removing a layout, and starting a "New" resume are all
gated behind a `window.confirm()` dialog (added in
`specs/app-ux-improvements.md`, Finding 4/6). That stops a stray click
from being destructive, but it's still a dead end once someone actually
confirms: there's no way back if they change their mind a second later,
misjudge which layout/block they were looking at, or just click through
the dialog on reflex. `window.confirm()` is also a synchronous, blocking
native dialog — heavy-handed friction for something that's actually
recoverable if the app kept the deleted state around briefly.

`app-ux-improvements.md`'s own Decisions section flagged this directly:

> Undo/toast stays a future option if confirm dialogs prove annoying in
> practice.

This spec is that follow-up.

## Non-goals

- **Full undo/redo history** covering every state change (text edits,
  moves, drags, reordering). That's a command-pattern/history-stack
  architecture change, not what's being asked for — scope is destructive
  actions specifically ("like if delete a layout").
- **Redo** (undoing an undo). Can follow later if the scoped approach
  below proves solid; not required for the core ask.
- **Cross-session undo.** The undo buffer only needs to survive within
  the current tab/session — closing the tab or reloading is a reasonable
  point to let it go, matching patterns like Gmail's "Undo send".
- **Undoing a JSON import** (`Upload JSON` / drag-drop a file). That's a
  deliberate "load a different resume" action, not an accidental click —
  out of scope unless review disagrees.

## Design

### Scope: which actions get undo

All three actions currently behind `window.confirm()`:

1. Delete a block (`macro-top-bar.tsx`'s `onDestroy` → `onDelete`)
2. Remove a layout — both the per-layout "Remove layout" link
   (`layout-header.tsx`) and the Edit menu's "Remove Last Layout"
   (`remove-bottom-layout-button.tsx`), both of which call into
   `removeLayout`/`popLayout` in `app-context.tsx`
3. "New" (`new-resume-button.tsx`, clears to an empty resume via
   `onImportFile({ items: [], layouts: [] })`)

### Mechanism: toast + "Undo" button, replacing `window.confirm()`

- `AppProvider` (`app-context.tsx`) keeps a single-slot undo buffer: a
  snapshot of `{ items, layouts }` taken immediately before a destructive
  action runs, plus a short description for the toast text (e.g.
  `"Layout 2 removed"`, `"Block deleted"`, `"Resume cleared"`). Only the
  most recent destructive action is undoable — performing a second
  destructive action, or explicitly dismissing the toast, discards the
  previous snapshot instead of stacking a history.
- A new `UndoToast` component renders in a fixed corner (bottom-right —
  see Decisions below for why not bottom-left), shown whenever the undo
  buffer is non-empty. Contains the description text + an "Undo" button
  that restores the snapshot and clears the buffer.
- **Replaces `window.confirm()` on the two finer-grained actions** (delete
  a block, remove a layout) — the toast *is* the safety net now; keeping
  both would mean confirming a click and then also being offered undo for
  the thing you just confirmed you wanted, which is redundant friction in
  the other direction.
- **"New" keeps `window.confirm()`** and *also* gets the undo toast
  afterward — resolved in Decisions below. It clears the entire resume,
  not one block/layout, so the extra guard stays as defense-in-depth.

### Accessibility

- The toast needs `role="status"`/`aria-live="polite"` so screen readers
  announce it without stealing focus, matching the pattern already used
  by `SavedIndicator`.
- The "Undo" button must be reachable and activatable by keyboard, and
  should plausibly receive focus (or at least not require hunting for it)
  right after the destructive action, since keyboard users can't
  "notice" a corner toast the way a sighted mouse user can.
- If the toast auto-dismisses and that discards genuinely-unrecoverable
  state, a fixed short timeout is a WCAG 2.2 SC 2.2.1 (Timing Adjustable)
  concern — needs either a generous timeout, a way to extend/pause it
  (e.g. on hover/focus), or not being time-limited at all (open question
  below).

## Acceptance criteria

- [x] Deleting a block and removing a layout (either affordance) no
      longer show a `window.confirm()` dialog; "New" still does, per the
      Decisions section
- [x] All three actions show a toast with an "Undo" button that fully
      restores the pre-action state when clicked (calling `performUndo`
      with no snapshot, or after it's already been consumed, is a safe
      no-op rather than throwing)
- [x] Performing a second destructive action while a toast is showing
      replaces it (and its undo target) rather than stacking
- [x] The toast is accessible: announced via `aria-live`, "Undo" is
      keyboard-reachable, and the auto-dismiss timing doesn't violate
      WCAG 2.2 SC 2.2.1 (paused on hover/focus)
- [x] `_frontend` stays at 100% coverage; `end-to-end` gets happy-path
      coverage for every undo flow (remove a layout, delete a block,
      "New" — each undone and confirmed restored, plus toast-replacement
      and auto-dismiss)

## Decisions (resolved before implementation)

- **Auto-dismiss timing**: 8 seconds, paused while the toast (or its
  Undo button) has mouse hover or keyboard focus, resuming on
  mouseleave/blur. This is the standard snackbar pattern (Material
  Design does the same) and is a reasonable practical answer to WCAG 2.2
  SC 2.2.1 — a user who needs more time to notice/react to the toast can
  keep it alive indefinitely just by hovering or tabbing to it.
- **Keyboard shortcut**: not in scope for v1. A global `Ctrl+Z`/`Cmd+Z`
  listener risks colliding with the browser's own native undo inside the
  JSON editor `<textarea>`s (which already has real, expected undo
  semantics of its own) — the toast's own keyboard-reachable button is
  enough for now. Can revisit as a follow-up if it's requested.
- **Toast placement/style**: bottom-right (`fixed`) — bottom-left was the
  original plan, but a live-browser check during implementation caught
  `next dev`'s own devtools indicator (bottom-left by default)
  overlapping and partially covering a bottom-left toast; since
  `end-to-end/` runs against `next dev`, not a production build, that
  collision would have been real, not just a dev-mode cosmetic issue.
  Bottom-right avoids both that indicator and the existing top-right
  `SavedIndicator`. Dark `bg-gray-800`/`text-white` body (a standard
  snackbar look, darker than the existing `bg-gray-600` toolbars so it
  visibly floats above the page), with the "Undo" action styled
  `text-cyan-300` for contrast against the dark background — no new
  colors outside the existing cyan/gray palette.
- **"New" keeps `window.confirm()` *and* gets undo**: it clears the
  entire resume (every layout and block at once), which is a large
  enough blast radius to keep both the confirm guard *and* the safety
  net, unlike the two finer-grained actions (delete a block, remove a
  layout) where undo alone replaces confirm entirely.
