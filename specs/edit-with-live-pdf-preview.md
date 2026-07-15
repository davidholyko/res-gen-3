---
status: implemented
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
  "PDF-first" editor is a possible later spec informed by usage, not
  assumed here — see Decisions on the inline editor.)
- **Not a new form system.** The same generated `ContentForm` (field
  specs, per-field validation, live-save via `onUpdate`) renders in the
  panel — this spec relocates it, not redesigns it.
- **No mobile/responsive work**, same as all prior UX specs.
  Desktop-only; narrow windows just get a minimum width with horizontal
  scroll (see Decisions), not a responsive layout.
- **No change to export.** Download PDF / Download JSON stay as they
  are.
- **No react-pdf renderer changes.** The shared `PdfInstanceProvider`
  render pipeline (one instance, debounced, feeding the page counter,
  the modal, and the download button) stays the single source of
  renders; this spec adds a consumer, not a pipeline.

## Design

### The editing view

- The existing PDF modal grows an **editing mode**: the live preview
  keeps the main area, and a form panel docks to its **right** (decided
  in review: content first, controls follow). The panel and preview
  share the modal's width — the panel never overlaps or covers the
  preview. Below a sane minimum width the modal content scrolls
  horizontally rather than collapsing or overlapping (decided in
  review; desktop-only scope).
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
- The canvas's inline editor **stays** (decided in review) — the
  panel is an additional place the same form appears, for polish work
  against the real render; the inline form remains the quick-fix path.
  Whether it eventually retires is a later spec informed by usage.

### Making "live" actually feel live

Two facts about today's pipeline shape this design:

- **The render debounce is 1750ms** (`pdf-instance-context.tsx`,
  `RENDER_DEBOUNCE_MS`) — tuned for a background page counter, not for
  watching your own keystrokes land. While the editing view is open,
  the debounce drops to **~450ms** (decided in review); the constant
  becomes a parameter the editing view can lower, and the background
  cadence returns when the view closes. Implementation must re-measure
  on a large multi-page document and back off if renders visibly lag —
  the number is a starting point, not a contract.
- **Every re-render mints a new blob URL**, and the preview is an
  `<iframe src={instance.url}>` — a naive URL swap reloads the frame
  on every render: a white flash, and the browser PDF viewer's scroll
  position resets to page 1. That's unusable as a typing companion.
  Decided plan (review): **double-buffer the iframe** — keep the
  current frame visible until the incoming one has loaded, then swap —
  with **page-level re-anchoring** via the `#page=N` URL fragment:
  the incoming frame reopens at the page the user was viewing (tracked
  as best we can) or, failing that, at the page containing the block
  being edited. Within-page scroll snapping to the top of the current
  page on refresh is accepted; escalating to pdf.js (rendering pages
  to canvases ourselves for pixel-faithful refreshes) was explicitly
  deferred — it's a significant dependency that only gets revisited if
  page-level anchoring proves annoying in real use.

### Focus and dismissal

- The modal keeps its existing react-modal semantics (focus trapped,
  background `aria-hidden`, Escape closes, close button top-right).
  Opening via "Edit with preview" focuses the form's first field.
- Closing returns focus to the block on the canvas (the
  `lastCreatedContentId`-style scroll/focus plumbing already knows how
  to do this for creation; the same treatment applies here).
- No commit/cancel semantics: edits save live exactly as they do in
  the canvas's inline editor today. As the safety net, the session gets
  a **"Block edited" undo snapshot**: the pre-session state is captured
  when the view opens and pushed **when the modal closes, if anything
  was saved meanwhile** (items identity is the tell). Pushing on close
  rather than on open (the draft decision) is deliberate: the undo
  toast's visibility and auto-dismiss window only start once the user
  is back where the toast is actually visible and clickable, instead of
  burning behind the modal mid-session. Same single-snapshot model as
  everything else; no snapshot if the session ends with nothing saved
  (the no-snapshot-for-a-no-op rule).

## Acceptance criteria

- [x] A focused block offers an explicit way into the editing view, and
      the view opens with that block's form in a panel beside the
      preview — the panel never overlaps the PDF
- [x] Typing a change into the panel's form updates the visible PDF
      preview without any further user action, within ~1s of the user
      pausing
- [x] A preview refresh while the editing view is open never flashes
      blank and never yanks the viewer back to page 1 while the user is
      looking at a later page
- [x] The block being edited can be switched from within the view,
      using the same plain-language block names as "+ Add block"
- [x] Per-field validation behaves identically in the panel and the
      canvas's inline form; invalid values are flagged inline and never
      reach the preview
- [x] Keyboard path: the view is reachable, operable, and dismissible
      without a mouse; Escape closes it and focus returns to the block
      on the canvas
- [x] The page counter, download button, and view-only preview
      continue to work unchanged when the editing view is not in use
- [x] `_frontend` stays at 100% coverage; axe component/E2E suites stay
      clean; the editing view gets e2e happy-path coverage (open →
      type → preview updates → close)

## Decisions (from spec review)

All six open questions were put to review and resolved before
implementation; each decision is reflected in Design above.

- **Panel docks right** — content first, controls follow. No toggle.
- **Page-level scroll anchoring is enough**: double-buffered iframe +
  `#page=N`. Within-page scroll snapping to the page top on refresh is
  accepted; pdf.js is the named escalation only if that proves
  annoying in practice.
- **~450ms live debounce**, with an explicit instruction to re-measure
  on a large multi-page document during implementation and back off if
  renders visibly lag.
- **Opening the editing view pushes a "Block edited" undo snapshot**,
  so one Undo reverts the session. Same single-snapshot model; no
  snapshot if nothing was saved during the session.
- **The inline canvas editor stays** alongside the new view; its
  retirement is a possible later spec informed by usage.
- **Narrow windows: minimum width + horizontal scroll** — the layout
  never collapses or overlaps; the never-cover rule holds
  unconditionally.

## Findings from implementation

- **Headless Chromium never fires `load` for PDF iframes — at all.**
  Confirmed live with a bare native iframe pointed at the PDF blob URL:
  no load event within 5s headless, near-instant headed. The
  double-buffered swap therefore promotes the staged frame on `load`
  *or* after a 2.5s fallback timer (`STAGING_FALLBACK_MS`), long enough
  that a real browser's load always wins the race — without it the
  preview wedges on "loading" forever in load-less environments,
  including the e2e suite itself.
- **The undo snapshot moved from open-time to close-time** (see Focus
  and dismissal): a snapshot pushed at open/first-save starts the undo
  toast's 8s auto-dismiss clock while the toast is hidden behind the
  modal, so by the time the user could click Undo it would already be
  gone. Capturing at open and pushing at close-if-changed keeps the
  decided behavior ("one Undo reverts the session") while making the
  toast actually actionable.
- **The stepper needed its own contrast chip**: white text directly on
  the modal top bar's `bg-blue-500` is ~3.8:1 (needs 4.5:1), caught by
  the real-browser axe scan — the page stepper sits in a `bg-blue-700`
  chip instead.
- The `~450ms` live debounce felt responsive against the 2-page example
  resume in the e2e runs; no backoff was needed yet. Re-measure if
  real-world resumes grow much larger.
