---
status: implemented
---

# Multi-page indicator

## Problem

The live editor canvas (`.editor-page-container` in `layout-manager.tsx`)
is a single, unboundedly-tall scrolling area — nothing in the UI hints at
where a PDF page actually ends. A resume that has grown past one page
(generally undesirable — most resume advice targets one page, two at
most) is invisible until the user opens "Open PDF View" or downloads the
PDF and scrolls through it. There's no ambient signal in the editor
itself.

## Non-goals

- **Editing/trimming assistance** (e.g. suggesting what to cut). This
  spec is about *visibility* of the page count, not helping fix it.
- **Enforcing a page limit** (blocking export, warning dialogs on
  download). Purely informational.
- **Per-column page counts.** A DOUBLE layout's two columns can end up
  different heights; this spec treats "the resume" as a whole (matching
  how the PDF itself paginates the full flowed content, not per-column).

## Design

### What's actually available to compute this from

Investigated before writing this (see file/line detail in the PR, not
repeated here): `@react-pdf/renderer` v4.5.1's public API — `usePDF()`,
`pdf()` — exposes `{ url, blob, error, loading }` and nothing resembling
a page count. Getting a *real* page count means either:

- (a) reaching into `<Document onRender>`'s undocumented
  `_INTERNAL__LAYOUT__DATA_` payload (the actual paginated layout tree
  the existing render pass already produces internally) — free
  page-count-wise (`pdf-preview.tsx` already runs this render for the
  preview modal), but it's an explicitly-private, unversioned field that
  could change or vanish on any dependency bump, and would need to run
  continuously (not just when the modal is open) to be "live" in the
  main editor — meaning duplicating that render pass outside the modal,
  or lifting `usePDF()` to a shared context so both consume one instance
  (see Open questions), or
- (b) adding a real PDF-parsing dependency (e.g. `pdf-lib`) to count
  pages from the generated blob's bytes — accurate and only touches
  stable public APIs, but still requires generating the PDF first (same
  render cost as (a)) plus a new dependency, or
- (c) a **height-based visual heuristic** in the live DOM: LETTER page
  height is 792pt (`@react-pdf/layout`'s `LETTER: [612, 792]`), which at
  this app's existing 1pt≈1px WYSIWYG convention (the same reasoning
  already used for `.editor-page-container`'s `max-width: 725px`,
  approximating LETTER's 612pt width minus padding) means a page break
  falls roughly every ~745px of canvas height (792pt page height minus
  the PDF page's own top/bottom padding, `24px` each per
  `pdf-preview-context.tsx`). No PDF rendering involved at all — purely
  CSS/`ResizeObserver`-driven, matching how the width WYSIWYG estimate
  already works.

### Revised recommendation: (a), a real page count — (c) was tried and rejected

(c) was the original recommendation, but a calibration pass during
implementation (bisecting content length against a real downloaded PDF's
actual page count, via `/Type /Page` object counting) found the
height-per-page ratio isn't remotely constant across content types: pure
paragraph text landed the 1→2 page boundary around ~1170px, while the
prepopulated example resume (mixed Contact/Header/Experience/AnyList
content) hit 2 real PDF pages at just 896px — a **2.6x discrepancy**.
Headers, bullet lists, and icon rows apparently consume proportionally
far more PDF space relative to their on-screen editor height than plain
paragraphs do. A single constant (or even the per-content-type weighting
considered as a fallback) would be unreliable enough to actively mislead
rather than inform, which is worse than not having the feature.

Given that, (a) is worth its cost after all: `usePDF()`'s public
`{url, blob, error, loading}` state doesn't expose a page count, but the
`<Document onRender={...}>` prop *does* receive the real internal layout
tree (`_INTERNAL__LAYOUT__DATA_`) as a side effect of the same render
`usePDF()` already runs — `_INTERNAL__LAYOUT__DATA_.children.length` is
one entry per real page. This is accurate (it's literally the pagination
that produces the PDF), at the cost of relying on an unversioned private
field (mitigated with a runtime shape check + silent no-indicator
fallback if it's ever missing/different) and needing to run the render
continuously rather than only when the modal is open.

### Implementation sketch

- A new `PdfInstanceProvider`/`usePdfInstance()` context lifts a single
  shared `usePDF()` instance above both the always-visible page-count
  indicator and the preview modal, so there's exactly one render
  pipeline in flight, not two — as a side benefit, the modal now opens
  against an already-rendered instance most of the time, instead of
  cold-starting its own render every time it opens.
- The document tree fed to `updateInstance()` is rebuilt from
  `items`/`layouts`/`styles`/`title`, but **debounced ~1.5-2s** after the
  last change rather than on every keystroke — this is the actual answer
  to "don't trigger expensive PDF renders continuously," not the
  no-longer-used height heuristic.
- `PdfDocument` gains an optional `onRender` prop threaded down to the
  underlying `<Document onRender={...}>`; `PdfInstanceProvider` passes a
  handler that defensively reads `_INTERNAL__LAYOUT__DATA_.children.length`
  and stores it as `pageCount` (staying `null`, and thus rendering
  nothing, if the shape isn't what's expected).
- A small badge renders near the canvas whenever `pageCount > 1` — no
  `~` prefix needed anymore, since this is a real count, not an estimate
  (the one caveat is it can lag ~1.5-2s behind the very latest edit,
  which is a materially smaller gap than the height heuristic's
  potential 2.6x error).
- Single-page resumes show nothing extra, same as before.

## Acceptance criteria

- [x] An indicator appears in the editor UI once the resume's real PDF
      page count exceeds 1, and disappears again if content shrinks back
      under that threshold
- [x] The shared PDF render is debounced (~1.5-2s after the last
      items/layouts/styles/title change) — not re-rendered on every
      keystroke
- [x] The preview modal (`PdfPreview`) consumes the same shared instance
      instead of running its own separate `usePDF()`
- [x] If the private `_INTERNAL__LAYOUT__DATA_` field is ever missing or
      a different shape than expected, the indicator silently doesn't
      render rather than throwing
- [x] Accessible: `aria-live` announces page-count changes without
      excessive noise (naturally covered by the render debounce itself,
      since the count can only change once per debounced render)
- [x] `_frontend` stays at 100% coverage and `axe-core` clean;
      `end-to-end` gets happy-path coverage (add enough content to cross
      the one-page threshold, confirm the indicator appears; remove
      content back under it, confirm it disappears)

## Decisions (resolved before implementation)

- **Placement and copy**: control panel bar, next to `SavedIndicator` —
  both are ambient, always-available status readouts about the current
  resume, so grouping them is the natural fit. Copy: `N pages` — no `~`
  prefix, since switching to a real count (see revised Design section)
  removed the need to hedge it as an estimate. Nothing renders at all
  for a single-page resume — only shows up once it's actually useful
  information, matching `SavedIndicator`'s "no badge for the boring
  case" precedent.
- **Visual style**: a small badge (not a plain text label), styled
  `bg-red-700 text-white` — reusing (not introducing) the red-700 already
  vetted for contrast elsewhere in this app (`layout-header.tsx`'s
  "Remove layout" link), since "more than one page" is worth flagging
  given most resume advice, not just neutral status text like
  `SavedIndicator`'s plain cyan text.
- **Debounce timing**: ~1.5-2s after the last content change, applied to
  the shared PDF render itself (not a separate visual/announcement
  split) — this is a render-cost debounce now, not a UI-noise debounce,
  since the previous height-heuristic approach (and its separate
  visual-vs-announcement debounce question) was replaced entirely; see
  revised Design section for why.
- **Height heuristic (original plan)**: tried and rejected during
  implementation — a calibration pass found a 2.6x discrepancy in
  height-per-page between pure-paragraph content and the mixed-content
  prepopulated example resume, unreliable enough to mislead rather than
  inform. Replaced with a real page count (see revised Design section).
- **Scope for v1**: a count/badge only, per the Design section's
  recommendation — no inline page-break line. Confirmed as out of scope
  for this pass, not just deferred by default.

## Findings from implementation

- **`DownloadPdfButton` had its own independent `pdf()` render call**,
  separate from the new shared `PdfInstanceProvider` instance. Once the
  shared instance started rendering continuously in the background
  (debounced, but real), a live E2E run surfaced an actual
  `TypeError: Cannot read properties of null (reading 'props')` thrown
  from inside that button's own `pdf()` call — react-pdf keeps a single
  module-level renderer instance across calls ("We must keep a single
  renderer instance, otherwise React will complain"), so two concurrent
  render passes can genuinely collide. Fixed by having `DownloadPdfButton`
  reuse `usePdfInstance()`'s already-rendered `instance.blob` instead of
  running its own second render pass — this also means Download PDF is
  now gated on the shared instance having rendered at least once (the
  button is disabled until `instance.blob` exists, even with content
  present), a minor, honestly-labeled latency trade-off that comes with
  the shared-instance architecture rather than a regression to route
  around.
