---
status: draft
---

# Undo destructive actions

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
- A new `UndoToast` component renders in a fixed corner (bottom-left,
  clear of the existing top-right `SavedIndicator`), shown whenever the
  undo buffer is non-empty. Contains the description text + an "Undo"
  button that restores the snapshot via `onImportFile` and clears the
  buffer.
- **Replaces** `window.confirm()` on all three actions above — the toast
  *is* the safety net now; keeping both would mean confirming a click and
  then also being offered undo for the thing you just confirmed you
  wanted, which is redundant friction in the other direction.
- Auto-dismiss timing and exact copy are open questions below.

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

- [ ] Deleting a block, removing a layout (either affordance), and "New"
      no longer show a `window.confirm()` dialog
- [ ] Each of those three actions instead shows a toast with an "Undo"
      button that fully restores the pre-action state when clicked
      (using it for a *destructive* deletion is not enough test coverage
      by itself — clicking a second Undo, or without ever having deleted
      anything, must not throw a "must be used within a Provider" or
      similar undefined-state error)
- [ ] Performing a second destructive action while a toast is showing
      replaces it (and its undo target) rather than stacking
- [ ] The toast is accessible: announced via `aria-live`, "Undo" is
      keyboard-reachable, and the auto-dismiss timing doesn't violate
      WCAG 2.2 SC 2.2.1
- [ ] `_frontend` stays at 100% coverage; `end-to-end` gets happy-path
      coverage for at least one undo flow (e.g. remove a layout, undo,
      confirm it's back with its original content intact)

## Open questions

- **Auto-dismiss timing**: how long does the toast stay up before the
  undo option is gone for good? A few seconds (Gmail-style, ~5-8s) is
  the obvious default but needs to reconcile with the WCAG timing
  concern above — possibly by pausing the timer on hover/keyboard focus.
- **Keyboard shortcut**: is a `Ctrl+Z`/`Cmd+Z` binding in scope alongside
  the toast button, or is the toast's own button enough for v1?
- **Toast placement/style**: bottom-left was picked above mainly to
  avoid colliding with the existing top-right `SavedIndicator` — worth
  confirming against the rest of the cyan/gray palette
  (`app-ux-improvements.md`'s "no new colors" decision) once mocked up.
- **Does removing `window.confirm()` entirely feel too permissive** for
  "New" specifically, given it clears the *entire* resume (not just one
  layout/block)? An alternative is keeping `window.confirm()` for "New"
  only (highest blast radius) while using undo-only for the two
  finer-grained actions (block delete, layout remove).
