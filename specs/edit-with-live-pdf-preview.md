---
status: draft
---

# Edit beside a live PDF preview

## Problem

The feedback loop between editing and the actual document is broken in
both directions:

- **You edit against an approximation.** The canvas is an HTML rendering
  that resembles the PDF but isn't it — fonts, line wrapping, spacing,
  and above all page breaks differ. The only live signal from the real
  render is the page-count badge.
- **You check against the real thing blind.** View → Open PDF View shows
  the true render, but the modal covers the entire app and is view-only.
  Fixing anything you spot means: close the modal, find the block on the
  canvas, click it, edit in the inline form, reopen the modal, re-check
  — and repeat for every adjustment. Polishing a resume against its
  actual output (the thing this app exists for) is a loop of blind
  round-trips.

Direction set during spec discussion: when you edit a block, its form
opens in a panel **docked to the side of the live PDF preview — left or
right, never covering it** — and the preview re-renders as you type.
Edit and result, visible at the same time.

## Non-goals

- **Not replacing the canvas.** The canvas remains the arrangement
  surface — add/move/delete blocks, insert/reorder layouts, the hover
  and focus affordances all stay. This spec adds a *focused editing
  view*; it doesn't make the PDF the primary editing surface. (A fuller
  "PDF-first" editor is flagged in Open questions as a possible future,
  not assumed.)
- **Not a new form system.** The same generated `ContentForm` (field
  specs, per-field validation, live-save via `onUpdate`) renders in the
  panel — this spec relocates it, not redesigns it.
- **No mobile/responsive work**, same as all prior UX specs.
  Desktop-only; narrow-window behavior is an open question, not a
  requirement.
- **No change to export.** Download PDF / Download JSON stay as they
  are.
- **No react-pdf renderer changes.** The shared `PdfInstanceProvider`
  render pipeline (one instance, debounced, feeding the page counter,
  the modal, and the download button) stays the single source of
  renders; this spec adds a consumer, not a pipeline.

## Design

### The editing view

- The existing PDF modal grows an **editing mode**: the live preview
  keeps the main area, and a form panel docks beside it (default:
  right; see Open questions). The panel and preview share the modal's
  width — the panel never overlaps or covers the preview.
- **Entry points**:
  - From the canvas: an "Edit with preview" affordance on a focused
    block (exact placement at implementation time — the block's
    toolbar is the natural home) opens the modal with that block's
    form already in the panel.
  - From the open preview: a panel listing the resume's blocks (same
    plain-language names as "+ Add block", grouped by layout) lets you
    pick which block to edit without leaving the modal.
- The panel header reuses `EditorTopBar` (block name + "Editing"
  badge); the form is the same `ContentForm` the canvas shows inline
  today, saving live via the existing `onUpdate` path. Per-field
  validation renders identically; invalid values are never saved, so
  the preview only ever reflects valid states.
- The canvas's inline editor **stays** — the panel is an additional
  place the same form appears, not a replacement (revisit once real
  usage shows which one people reach for; see Open questions).

### Making "live" actually feel live

Two facts about today's pipeline shape this design:

- **The render debounce is 1750ms** (`pdf-instance-context.tsx`,
  `RENDER_DEBOUNCE_MS`) — tuned for a background page counter, not for
  watching your own keystrokes land. While the editing view is open,
  the debounce should drop to something conversational (~400–500ms);
  the constant becomes a parameter the editing view can lower. When
  the view closes, the background cadence returns.
- **Every re-render mints a new blob URL**, and the preview is an
  `<iframe src={instance.url}>` — a naive URL swap reloads the frame
  on every render: a white flash, and the browser PDF viewer's scroll
  position resets to page 1. That's unusable as a typing companion.
  Default plan: **double-buffer the iframe** — keep the current frame
  visible until the incoming one has loaded, then swap. Scroll
  preservation across swaps is genuinely hard with the native viewer
  (its scroll state lives inside the PDF plugin, unreachable from JS);
  the `#page=N` URL fragment is the coarse-grained tool available —
  reopen the incoming frame at the page the user was viewing (tracked
  as best we can) or, failing that, at the page containing the block
  being edited. Flagged in Open questions as the riskiest part of the
  whole feature.

### Focus and dismissal

- The modal keeps its existing react-modal semantics (focus trapped,
  background `aria-hidden`, Escape closes, close button top-right).
  Opening via "Edit with preview" focuses the form's first field.
- Closing returns focus to the block on the canvas (the
  `lastCreatedContentId`-style scroll/focus plumbing already knows how
  to do this for creation; the same treatment applies here).
- No commit/cancel semantics: edits save live exactly as they do in
  the canvas's inline editor today. Undo remains the safety net; see
  Open questions for whether opening the editing view should push a
  snapshot so one Undo reverts the whole session.

## Acceptance criteria

- [ ] A focused block offers an explicit way into the editing view, and
      the view opens with that block's form in a panel beside the
      preview — the panel never overlaps the PDF
- [ ] Typing a change into the panel's form updates the visible PDF
      preview without any further user action, within ~1s of the user
      pausing
- [ ] A preview refresh while the editing view is open never flashes
      blank and never yanks the viewer back to page 1 while the user is
      looking at a later page
- [ ] The block being edited can be switched from within the view,
      using the same plain-language block names as "+ Add block"
- [ ] Per-field validation behaves identically in the panel and the
      canvas's inline form; invalid values are flagged inline and never
      reach the preview
- [ ] Keyboard path: the view is reachable, operable, and dismissible
      without a mouse; Escape closes it and focus returns to the block
      on the canvas
- [ ] The page counter, download button, and view-only preview
      continue to work unchanged when the editing view is not in use
- [ ] `_frontend` stays at 100% coverage; axe component/E2E suites stay
      clean; the editing view gets e2e happy-path coverage (open →
      type → preview updates → close)

## Open questions

- **Panel side**: dock the form left or right of the preview? Right
  matches "content, then controls" reading order; left matches where
  the canvas's inline editor sits today. (Direction said "left or
  right" — pick one at implementation, or make it a toggle?)
- **Scroll preservation fidelity**: is `#page=N` re-anchoring good
  enough, or does losing within-page scroll position on every refresh
  sink the experience? If it does, the fallback is rendering pages to
  canvases ourselves (pdf.js directly) — a much bigger dependency and
  scope step that should be its own decision, not an implementation
  detail.
- **Debounce while typing**: is ~450ms right, or does a full-document
  react-pdf render per pause make even that feel heavy on a large
  resume? May need measuring on a real multi-page document before
  committing to a number.
- **Undo granularity**: push a snapshot when the editing view opens
  ("Block edited"), so one Undo reverts the whole editing session? Or
  keep the current model where undo only covers destructive actions
  and moves?
- **Does the inline canvas editor eventually retire?** Two homes for
  the same form is a transitional state. If the docked-panel-plus-
  preview becomes the way people edit, the inline editor could go the
  way of the ribbon — but that's a later spec informed by usage, not
  this one.
- **Narrow windows**: below what width does side-by-side stop being
  viable, and what happens then (panel overlays after all? stacking?)
  — desktop-only scope makes this deferrable, but the breakpoint
  behavior should at least fail gracefully.
