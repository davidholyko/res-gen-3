---
status: implemented
---

# Canvas edit panel: the form docks beside the HTML preview

## Problem

Clicking a block on the canvas reveals its form **inline, underneath the
block** — the form injects itself into the middle of the page being
previewed. Every open pushes the rest of the resume content down (and
every close snaps it back), so the thing you're trying to look at jumps
around exactly while you're working on it, and the canvas stops looking
like the document while a form is sitting inside it.

Direction set during spec discussion (and clarified after
`specs/edit-with-live-pdf-preview.md` landed the same interaction for
the PDF modal): on the **HTML preview too**, the form should appear
**beside** the preview, not inside it — click a block, its form opens in
a panel docked next to the canvas, and the canvas keeps updating live as
you type, without a single layout shift inside it.

## Non-goals

- **The PDF-modal editing view stays** (decided in review): it serves a
  different moment — polishing against the true render, page breaks and
  all. This spec is about the everyday editing surface.
- **Not a new form system.** The same `EditorItem`/`ContentForm`/
  validation/live-save path renders in the panel; only where it renders
  changes.
- **No session-undo semantics on the canvas panel.** The modal's
  "Block edited" session snapshot exists because the modal hides the
  toast; the canvas panel hides nothing, so the existing undo model
  (destructive actions and moves) is unchanged.
- **No mobile/responsive work**, as ever.

## Design

- A `CanvasEditPanel` docks to the **right of the canvas** (same side as
  the modal's panel — content first, controls follow), sticky against
  the viewport with its own scroll. It renders the focused block's form
  (the same `EditorItem` the inline editor used) plus a "Done" button
  that closes it. It mounts only while a block is focused; the canvas
  itself never reflows when it opens.
- **Focus becomes app state, not per-block component state.** Which
  block is being edited moves from `BaseMacro`'s local `isFocused` into
  app context (`canvasEditingContentId`, with `focusCanvasBlock`/
  `blurCanvasBlock`). `BaseMacro` derives its highlight and toolbar from
  it — one source of truth, so the panel's Done button, a click on
  another block, and a click on empty canvas all agree.
- **Clicks and focus inside the panel count as "inside the block"**:
  `BaseMacro`'s outside-click/blur logic treats the panel as an
  extension of the focused block, otherwise the first click into a form
  field would unfocus the block and close the panel under the cursor.
- The inline under-block editor is **removed** (decided in review: the
  panel replaces it, not joins it). `MacroTopBar` (move/delete/"Edit
  with preview") still appears on the focused block itself.
- Opening the panel focuses its first field, same as the modal panel.
  A freshly added block (`lastCreatedContentId`) opens the panel the
  same way — blocks still scroll into view and are immediately typable.

## Acceptance criteria

- [x] Clicking a block opens its form in the docked panel; nothing
      renders inside or below the block, and the canvas content does not
      shift when the panel opens or closes
- [x] Typing in the panel updates the canvas live, exactly as the inline
      editor did (same validation, same live-save, same per-field
      errors)
- [x] Clicking into the panel never unfocuses the block; clicking
      another block switches the panel to it; clicking empty canvas or
      Done closes it
- [x] Adding a block via "+ Add block" opens the panel on the new block
      with focus in its first field
- [x] Backspace/Delete inside panel fields edits text; on the block
      itself it still deletes the block (with its undo toast)
- [x] `_frontend` stays at 100% coverage; axe suites stay clean; the
      panel gets e2e happy-path coverage

## Decisions (from spec review)

- **The panel replaces the inline editor** rather than coexisting with
  it — one everyday editing surface on the canvas.
- **The PDF-modal editing view is kept** as the render-faithful
  companion; its plumbing (live debounce, double-buffered preview,
  session undo) is untouched.

## Findings from implementation

- **A fixed-position panel was tried and rejected.** Fixing the panel to
  the viewport's right edge satisfies "the canvas never shifts"
  trivially -- but at ordinary window widths (1280px) it overlapped the
  canvas's right edge and swallowed clicks on the focused block's own
  toolbar (Playwright: "subtree intercepts pointer events" on the
  Delete button). The shipped layout reserves the panel's gutter
  permanently instead: the canvas centers in the remaining space, so
  its position is identical whether the panel is open or closed, and
  nothing ever overlaps.
- **The panel's autofocus changes what Backspace means right after a
  click.** Clicking a block now lands typing focus in the panel's first
  field, so Backspace edits text there; the keyboard delete-block
  shortcut applies once focus is on the block itself (e.g. Tab/click
  back to it). Arguably safer than before -- a stray Backspace
  immediately after clicking a block used to delete the whole block.
  Covered explicitly in undo.spec.ts.
- **Focus centralization paid for itself immediately**: with
  `canvasEditingContentId` in app context, the panel's Done button, a
  click on another block, a click on empty canvas, and keyboard blur
  all converge on the same two helpers (`focusCanvasBlock` /
  `blurCanvasBlock`, the latter id-guarded so a stale blur can't stomp
  a fresh focus).
