---
status: implemented
---

# Reset to the example resume

## Problem

The prepopulated example resume is the app's own demo — it's what a
first visit shows, and the fastest way to see what the tool produces
(specs/editor-redesign.md, The user's journey). But it's a one-shot:
the only way back to it is clearing `localStorage` by hand. File → New
empties the resume entirely; nothing restores the example. Anyone who
has mangled their working copy while experimenting, or wants the demo
back as a starting template, is stuck.

## Non-goals

- **Not a template system.** One built-in example, restored wholesale —
  no gallery, no user-saved templates.
- **No change to first-run behavior**: the empty-`localStorage`
  prepopulation path is untouched; this adds an explicit way back to
  the same content.
- **No undo-model changes**: same single-snapshot toast as every other
  destructive action.

## Design

- A **"Reset to Example"** entry in the File menu, next to "New" — the
  two are siblings in meaning (both replace the whole resume; one with
  nothing, one with the demo).
- Same guards as "New", for the same reason
  (specs/undo-destructive-actions.md: whole-resume blast radius keeps
  both): a `window.confirm`, then a `pushUndoSnapshot('Resume reset')`
  before importing `prepopulateUtil`'s items/layouts through the
  existing `onImportFile` path.
- Stale-focus safety comes free: if the canvas edit panel (or the PDF
  editing view) is open on a block that the reset removes, both already
  render nothing when their `contentId` no longer resolves.

## Acceptance criteria

- [x] File → Reset to Example replaces the current resume with the
      prepopulated example, behind a confirm
- [x] The undo toast ("Resume reset") restores the pre-reset resume
- [x] Declining the confirm changes nothing and pushes no snapshot
- [x] `_frontend` stays at 100% coverage; axe suites stay clean; e2e
      happy-path coverage for reset + undo
