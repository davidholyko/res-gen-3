---
status: draft
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

### Recommendation: (c), a height-based indicator, not an exact count

(a) and (b) both mean running `@react-pdf`'s real layout/render pipeline
continuously as the user types to stay "live" — the app already has a
documented loading state for how non-instant that render is (Finding 10,
`app-ux-improvements.md`), so doing it on every keystroke (even
debounced) risks visible lag on longer resumes, for a feature that's
explicitly informational, not a value anyone needs to be *exact*. (c) is
cheap enough to genuinely run live with no debounce, adds no dependency,
and matches the app's existing "approximate WYSIWYG, not pixel-perfect"
convention. The cost is that it's an estimate — font-metric and
line-wrapping differences between browser rendering and `@react-pdf`'s
own text layout mean the true PDF page count could occasionally differ
by one from the heuristic, particularly right at a page boundary.

### Implementation sketch

- A `ResizeObserver` (or a `useLayoutEffect` re-measuring on
  items/layouts change) on `#layout-manager` reads its `scrollHeight`,
  divides by the ~745px-per-page constant above, and rounds up
  (`Math.ceil`) for an estimated page count.
- A small indicator renders near the canvas (exact placement/copy is an
  open question below) whenever the estimate is `> 1`, e.g. "~2 pages" —
  the `~` matters: it should read as an estimate, not a promised exact
  count, given (c)'s known imprecision.
- Single-page resumes show nothing extra (no need to announce "1 page"
  as some kind of achievement badge) — only surfaces once it's actually
  useful information.

## Acceptance criteria

- [ ] An indicator appears in the editor UI once the resume's estimated
      content height exceeds one PDF page, and disappears again if
      content shrinks back under that threshold
- [ ] The indicator updates live as content/layouts change, with no
      perceptible typing lag (no PDF render triggered by this feature)
- [ ] Copy clearly signals this is an estimate (e.g. a `~` prefix or
      equivalent), not a guaranteed exact page count
- [ ] Accessible: the count change is announced (`aria-live`) without
      being disruptive on every keystroke (see Open questions — this
      needs the same kind of debounce-for-announcements-only treatment,
      distinct from debouncing the visual update itself)
- [ ] `_frontend` stays at 100% coverage and `axe-core` clean;
      `end-to-end` gets happy-path coverage (add enough content to cross
      the one-page threshold, confirm the indicator appears; remove
      content back under it, confirm it disappears)

## Open questions

- **Placement and exact copy**: near the canvas heading? In the control
  panel bar (alongside `SavedIndicator`)? "~2 pages", "This resume is
  about 2 pages", something else?
- **Visual style**: a plain text label, or something louder (a colored
  badge) given most resume advice treats "more than one page" as worth
  flagging? Needs to stay within the existing cyan/gray palette
  convention if the latter.
- **`aria-live` cadence**: announcing on every single keystroke that
  nudges the estimate would be noisy for screen reader users — likely
  needs its own debounce (e.g. only announce after content settles for a
  moment), separate from whether the visual number updates instantly.
- **Precision constant**: the ~745px-per-page figure above is a first
  estimate reasoned from LETTER's point dimensions and existing padding
  values, not yet verified against a real generated PDF's actual page
  breaks on realistic content. Worth spot-checking against a real
  multi-page export before/during implementation and adjusting the
  constant if it's meaningfully off.
- **Is a plain boolean/count enough, or is an inline page-break line
  (drawn across the canvas at each ~745px mark) more useful?** A line
  shows *where* the break falls, not just *that* one exists, and is a
  natural extension of the same height-heuristic approach — but wasn't
  what was literally asked for, so flagged as a possible v2 rather than
  assumed here.
