---
status: implemented
---

# App UX improvements (desktop)

## Problem

The app is functionally complete — drag-and-drop resume building, JSON
content editing, live PDF preview/export — but a hands-on review (driving
the running app with Playwright, screenshotting every major state:
initial load, each menu, a focused block, an empty canvas, a two-column
layout, the PDF modal) surfaced real friction that makes it harder to use
than it needs to be, especially for a first-time user. Much of the
interaction model exposes internal mechanics (raw JSON, layout/zone IDs)
rather than resume-building concepts a user would recognize (sections,
columns, blocks).

This spec is scoped to **desktop only**, per explicit direction — nothing
here is about responsive/mobile layout.

## Current user flow (as-is)

Documented here because it isn't self-evident from the UI itself — that
gap is itself one of the findings below.

1. **Load the app.** A prepopulated example resume renders immediately
   (no onboarding, no tour, no empty-state instructions if it's ever
   cleared — see Finding 1).
2. **Add a column ("layout").** Control panel → Edit menu → "Add Single
   Column Layout" or "Add Double Column Layout". Always appends a new
   column to the end; no way to insert one at a specific position, and
   double columns render as two independent drop zones ("Layout N
   (Left)" / "Layout N (Right)").
3. **Add a block to a column.** Two ways, both starting from a content-type
   card in the left panel (Contact, Header, Paragraph, Experience,
   AnyList):
   - **Drag** the card's top bar onto a column's dashed drop zone in the
     canvas, or
   - **Pick a target column** from the card's own "Layout N" dropdown and
     click the green **+** button (the non-drag alternative, added for
     WCAG SC 2.5.7).
4. **Edit a block's content.** Click the placed block in the resume
   preview (right side) to focus it — this reveals its own inline raw-JSON
   textarea, plus a small toolbar (move up/down, delete). Edit the JSON
   directly; it saves on blur if valid. If invalid, an error shows *while
   still focused*, but clicking away discards the edit and hides the
   error simultaneously, with no lasting feedback that anything was lost.
5. **Reorder blocks within a column.** ↑/↓ buttons in the block's toolbar
   (visible only while focused). This only reorders within the flat item
   list — it cannot move a block to a *different* column.
6. **Delete a block.** ✕ button in the same toolbar. Instant, no
   confirmation, no undo.
7. **Remove a column.** Edit menu → "Remove Last Layout" — always removes
   whichever column was added most recently, regardless of its content.
   There's no way to remove a *specific* column, and no confirmation.
8. **Preview / export.** View menu → "Open PDF View" (modal PDF preview).
   File menu → "Download JSON" (saves the current state to a file) /
   "Upload JSON" (loads one back in) — this is the *only* save/load
   mechanism today. "New" and "Download PDF" are both present in the File
   menu but literally do nothing when clicked (see Finding 6).
9. **Persistence.** Every change silently autosaves to `localStorage`.
   There's no save button, no confirmation it happened, and no version
   history — closing the tab is the only way to know you're "done," and
   there's no signal that it's safe to do so.

## Findings

Ordered roughly by how much they block or confuse a real user, not by
implementation effort.

1. **No empty-state guidance.** Removing the last layout leaves a
   completely blank canvas — no placeholder text, no call-to-action, not
   even a border. A confused or first-time user (anyone who clears the
   example content) has zero indication of what to do next.
2. **Raw JSON is the only way to edit content.** Every field — name,
   email, a bullet point — requires hand-editing a quoted JSON blob with
   correct syntax. This is the single biggest barrier to the app being
   usable by anyone not comfortable reading/writing JSON, and it's the
   core interaction of the entire app, not an edge case.
3. **Icon-only controls have no labels or tooltips.** Every editor card's
   drag handle (☰), collapse toggle (⟫), and layout-target dropdown have
   no visible text or hover tooltip — only inferable by trial or by
   reading ARIA labels (screen-reader only, invisible to a sighted mouse
   user).
4. **Destructive actions have no confirmation or undo.** Deleting a block
   or removing a layout is instant and irreversible. A stray click loses
   content permanently.
5. **Layouts aren't identified on the canvas.** "Layout 1"/"Layout 2"
   only exist as `<select>` option text on each editor card — the layout
   boxes themselves carry no visible number or label, so with 3+ columns
   there's no way to tell which is which just by looking at the page.
6. **Dead menu items are focusable and announced as real controls.**
   "New (Coming Soon)" and "Download PDF (Coming Soon)" render as
   interactive `role="menuitem"` elements (`BaseMenu` clones that role
   onto every child uniformly) — a keyboard or screen-reader user
   tabs to them and activates them like any other menu item, and nothing
   happens.
7. **Two visually-identical editing surfaces, one meaning "template" and
   one meaning "your resume."** The left panel's cards (always showing
   example content, `IN_EDITOR_MANAGER` mode) and a focused block's own
   inline editor (`IN_LAYOUT_MANAGER` mode, the actual resume content) use
   the same raw-JSON-textarea UI, distinguished only by a small
   "(Edit Mode)" text suffix. Easy to not realize the left panel is a
   *template picker*, not a live view of "your resume's Contact section."
8. **No autosave feedback.** Every change silently persists to
   `localStorage`. Nothing confirms it happened, shows a timestamp, or
   gives a user confidence it's safe to close the tab.
9. **Columns can only be added at the end, and only removed from the
   end.** No inserting a column at a specific position, no duplicating
   one, no reordering the columns themselves (only content *within* one).
10. **No loading state in the PDF preview.** Opening "Open PDF View" shows
    an empty modal while the PDF renders asynchronously (`usePDF` is
    async) — on a longer resume this could plausibly read as broken
    rather than "still working."
11. **The canvas doesn't use the available desktop width.** On a wide
    desktop viewport, the resume preview is a narrow fixed-width column
    pinned near the top-left; the rest of the window is unused space.
    Not a responsiveness ask — a "make better use of the screen you
    already target" one, per "it's a desktop app for now."

## Non-goals

- Mobile/responsive layout. Explicitly desktop-only per direction.
- Visual/brand redesign (color palette, typography system). This is about
  the usability of the existing interaction model, not a re-skin.
- Accounts, multi-resume management, or any backend involvement — still
  fully client-side/`localStorage`, unchanged.
- Rewriting the underlying architecture (the JSON content model,
  `react-dnd`, the layout/zone system). Proposed fixes work within the
  current architecture rather than replacing it.
- Replacing raw-JSON editing with real form fields (Finding 2's actual
  fix). That's almost certainly the highest-impact change in this whole
  list, but it's also a form-per-content-type redesign, not a "little
  more usable" pass — proposed as its own follow-up spec rather than
  bundled here (see Open questions).

## Design

Proposed fixes, scoped to match "a little more usable" rather than a
redesign — each is small enough to land independently:

- **Finding 1 (empty state):** when `layouts.length === 0`, render a
  placeholder in the canvas area — short text plus a direct link/button
  to the Edit menu's "Add Single Column Layout" action, instead of the
  Edit menu being the only path.
- **Finding 2 (raw JSON):** out of scope for this pass — see Non-goals
  and Open questions.
- **Finding 3 (unlabeled icons):** add native `title` attributes (cheap,
  no new component) to the drag handle, collapse toggle, and layout
  dropdown at minimum; consider a small shared tooltip component if
  `title`'s default browser styling reads as too subtle.
- **Finding 4 (no confirm/undo):** add a confirmation step before
  destructive actions (delete block, remove layout) — a plain
  `window.confirm` is the cheapest correct fix; a toast-based "Layout
  removed — Undo" pattern is nicer but bigger (see Open questions for
  which to build).
- **Finding 5 (unlabeled layouts):** render each layout's number (and
  Left/Right for double columns) as a small visible label on its own
  canvas box, reusing the same numbering `layout-drop-zone-util.ts`
  already computes for the picker dropdown.
- **Finding 6 (dead menu items):** either implement "Download PDF" (see
  below — likely the cheapest real fix available) or remove/properly
  disable "New" and "Download PDF" (`aria-disabled`, non-focusable, not
  just visually muted) rather than leaving them as inert but interactive.
- **Finding 7 (dual editing surfaces):** stronger visual differentiation
  between the left panel's template cards and a focused block's inline
  editor — e.g., a persistent "Template" vs. "Editing: <Macro>" heading
  rather than the current small "(Edit Mode)" suffix.
- **Finding 8 (no save feedback):** a small transient "Saved" indicator
  (e.g., fades in for ~2s after a change commits to `localStorage`) —
  cheap, self-contained, no new state beyond the existing autosave path.
- **Finding 9 (append/remove-last only):** add a per-layout delete
  affordance (not just "Remove Last Layout" in the Edit menu) so any
  column can be removed directly, regardless of position.
- **Finding 10 (PDF loading state):** show a spinner/message in the modal
  while `usePDF`'s `loading` flag is true, before the iframe has a `src`.
- **Finding 11 (wasted canvas width):** revisit the canvas's fixed-width
  container so it scales with the available desktop viewport instead of
  pinning to a narrow column — needs a concrete target width/approach,
  flagged as an open question rather than assumed here.

## Acceptance criteria

- [x] Empty-state placeholder + CTA shown when there are no layouts
- [x] Tooltips (or equivalent) on the drag handle, collapse toggle, and
      layout-target dropdown on every editor card
- [x] Confirmation before deleting a block or removing a layout
- [x] Each layout's number/side is visibly labelled on its own canvas box
- [x] "New" and "Download PDF" are both implemented (see Decisions)
- [x] The left panel and a focused block's inline editor are visually
      distinguishable at a glance, not just by a text suffix
- [x] A transient "Saved" (or equivalent) indicator appears after changes
      persist
- [x] Any layout (not just the last) can be removed directly
- [x] The PDF preview modal shows a loading state before content renders
- [x] Canvas width makes better use of a desktop viewport
- [x] All changes keep `_frontend` at 100% coverage and the `axe-core`
      component/E2E suites clean; new interactive elements get
      `end-to-end` coverage for their happy path

## Decisions (resolved before implementation)

- **Undo vs. confirm dialogs** (Finding 4): confirm dialogs
  (`window.confirm`) — cheaper, standard, and enough to stop an
  accidental click from being destructive. Undo/toast stays a future
  option if confirm dialogs prove annoying in practice.
- **Raw-JSON editing** (Finding 2): stays deferred, out of scope for this
  pass, per the Non-goals section — it's a real-form-fields redesign, not
  a "little more usable" fix. Tracked as a candidate follow-up spec, not
  started here.
- **"Download PDF"**: implementing now — the underlying `pdf()`
  generation already exists (same mechanism the preview modal uses), so
  wiring a File-menu download button to it is small and self-contained.
- **"New"**: also implementing now, alongside "Download PDF" — clearing
  to the same blank state Finding 1's empty-state placeholder handles,
  behind a confirm dialog. Removes both of the File menu's two dead
  entries in one pass instead of one.
- **Canvas width** (Finding 11): re-examined during implementation —
  `.editor-page-container`'s `max-width: 725px` turns out to be
  deliberate (a code comment ties it to matching the actual PDF page's
  proportions 1:1, not an oversight), so it stays as-is rather than being
  widened, which would break that WYSIWYG accuracy. The actual fix:
  center the whole app horizontally with a light neutral page background
  instead of pinning everything to the top-left, so the unused width
  reads as intentional margin rather than a cut-off layout.
- **Visual style**: matches the existing cyan/gray palette already in
  use (`bg-cyan-100`, `bg-gray-600`, etc.) — no new colors introduced.
- **Sequencing**: all findings (except Finding 2) implemented together in
  one pass, given each is individually small.

## Findings from implementation

Real bugs an E2E pass (real browser + real `AppProvider`, not jsdom/mocks)
caught that unit tests alone missed:

- **Confirm dialogs are auto-dismissed by Playwright unless handled.**
  Every existing E2E test that clicked "Remove Last Layout" would have
  silently no-op'd once Finding 4 landed (native dialogs default to
  Cancel with no listener registered) — fixed with a single
  `page.on('dialog', accept)` in `fixtures.ts`'s shared `page` fixture,
  covering both existing and new tests.
- **`SavedIndicator` flashed on every page load.** Two independent causes,
  both invisible to a mocked-context unit test:
  1. `AppProvider`'s items/layouts reconciliation effect always called
     `setItems` with a freshly-`.filter()`'d array, even when nothing was
     orphaned — churning `items`'s reference identity on every mount.
     Fixed by bailing out with the same reference when the filtered
     result's length is unchanged.
  2. A boolean "is this the first render" ref doesn't survive React
     StrictMode's dev-only double-invoke of the mount effect (setup ->
     cleanup -> setup again, same ref). Replaced with a snapshot-and-compare
     approach that's correct under double-invoke by construction.
- **`bg-gray-100` (Finding 11's page background) dropped three existing
  text/background pairings below 4.5:1**, caught by the real-browser axe
  scan: `EditorManager`'s "Template" label and `LayoutHeader`'s "Layout N"
  label (both `text-gray-500` on the new background, now `text-gray-600`),
  `LayoutHeader`'s "Remove layout" link (`text-red-600`, now `text-red-700`),
  and `SavedIndicator`'s own text against the header's `bg-cyan-100`
  (`text-cyan-700` at 4.4:1, now `text-cyan-800`).
