---
status: implemented
---

# Port res-gen-2 into res-gen-3

## Problem

`res-gen-2` (`/Users/davidko/Work/res-gen-2`) is a working resume-builder
app — drag-and-drop layout editing, a JSON-driven content model, live PDF
preview/export via `@react-pdf/renderer`, localStorage persistence. It's
entirely client-side: no backend, no runtime env vars (the one `.env` var,
`GITHUB_TOKEN`, is only used by its own `semantic-release` CI, not the app).
~100 files, ~3,400 lines across `src/`.

It needs to become `_frontend`'s real application, replacing the current
placeholder scaffold homepage. Two hard requirements on top of a straight
port: the result must hold this repo's existing 100% coverage gate, and it
must meet the WCAG 2.2 AA bar `specs/accessibility.md` already set —
**res-gen-2 has zero tests today and was never audited for accessibility**,
so both are net-new work, not a carry-over.

## Non-goals

- Porting res-gen-2's own DevOps tooling (`.husky`, `.releaserc.js`,
  `.commitlintrc.js`, `.github/workflows/release.yml`, `lint-staged`).
  res-gen-3 already has all of this, better integrated (coverage-gated
  pre-commit hook, semantic-release, commitlint) — res-gen-2's copies are
  fully superseded, not merged in.
- A backend. res-gen-2 has none; nothing in this port touches `_backend`.
- PDF/UA (tagged-PDF accessibility) certification for the *generated
  resume PDF itself*. WCAG 2.2 governs the web app; the downloadable PDF
  artifact is a separate, harder standard with unclear `@react-pdf/renderer`
  support. Flagged as an open question below, not committed to.
- Redesigning the app. This is a port, not a rewrite — behavior and visual
  design carry over as-is except where a11y fixes require changing markup
  (e.g. adding keyboard alternatives to drag-and-drop).

## Design

Originally scoped as three sequential PRs (raw port, then coverage, then
a11y), each independently gated. **PR 1 (raw port) shipped as
[#8](https://github.com/davidholyko/res-gen-3/pull/8).** Per explicit
direction, coverage and accessibility are being collapsed into that same
PR/branch rather than split further — the three-part breakdown below is
now the WORK, not separate PRs:

1. ~~Raw port + build green.~~ Done in #8: app running correctly in
   `_frontend` under res-gen-3's stack, manually verified working
   (drag-and-drop, PDF export, JSON import/export, localStorage
   persistence) via Playwright against a real running instance.
2. ~~Coverage.~~ Done: unit tests for everything ported, 100%
   statement/branch/function/line coverage (branches too, unlike
   `_backend` — there's no SWC-decorator-metadata equivalent issue on the
   frontend). The temporary coverage carve-out added in #8 is fully
   removed from `vitest.config.ts`.
3. ~~Accessibility.~~ Done: audited against `specs/accessibility.md`'s
   WCAG 2.2 AA target (see "Audit: ported app" below) and fixed every
   finding — drag-and-drop now has a non-drag alternative (SC 2.5.7), the
   PDF preview modal (`react-modal`) hides the app behind it and is
   labelled, collapsible editor sections (`react-collapse`) expose
   `aria-expanded`, the control panel's custom menus are keyboard-operable
   with correct roles, and editor forms have labelled, error-identified
   inputs.

The final PR passes `pnpm build`/`lint`/`test:cov` with the coverage
carve-out fully removed.

### Known technical risks (resolved during PR 1)

What actually happened, for anyone starting PR 2/3:

- `@react-pdf/renderer` v4's TS types dropped the ambient `ReactPDF`
  namespace on default import (`import ReactPDF from ...` → needed
  `import * as ReactPDF`) and removed `Font.register`'s top-level `format`
  option (now inferred from the file extension). Both were type/API-only
  changes; no PDF output behavior changed.
- `zod` v4 requires an explicit key schema for `record()` (v3 defaulted to
  `string()` keys implicitly) — one call site (`any-list-editor.tsx`)
  needed updating.
- `react-dnd`'s `ConnectDragSource`/`ConnectDropTarget` ref-callback types
  predate React 19's stricter ref-callback typing (must return `void`, not
  `ReactElement`) — wrapped in a plain callback at the two call sites that
  needed it, no behavior change.
- The font/basePath/static-export risks below all played out as expected
  and were fixed as anticipated.
- Not anticipated: several `eslint-plugin-jsx-a11y`/`react-hooks` rules
  (bundled with the `eslint-config-next` version already in this repo,
  not something this port introduced) flagged real gaps in res-gen-2's
  code that had to be fixed to get `pnpm lint` green at all — custom
  interactive `<div>`s missing keyboard handlers/ARIA roles, a
  `set-state-in-effect` pattern, an unused `forwardRef` param whose
  removal broke React's runtime contract (caught by manual verification,
  not lint/build — see the PR description). These weren't deferrable to
  PR 3 since they're lint *errors*, not warnings.

- **`@react-pdf/renderer` 3.1.12 → 4.x is a required, breaking upgrade.**
  The pinned v3 only supports React up to 18 (`peerDependencies: react
  "^16.8.6 || ^17.0.0 || ^18.0.0"`); res-gen-3 is on React 19. v4 declares
  React 19 support but is a major version with a documented API surface
  change (checked via `npm view`, not yet diffed against actual usage in
  `src/pdf/`). This is the single biggest risk in the whole port — PDF
  rendering is core functionality, not incidental.
- **Custom Webpack font loader won't run under Turbopack.**
  res-gen-2's `next.config.js` pushes a custom Webpack rule (`file-loader`
  for `.ttf`) to serve the Roboto font files bundled in `src/fonts/`.
  res-gen-3's frontend builds with Turbopack (Next 16 default, confirmed
  by build output), which doesn't apply arbitrary `webpack: config => {}`
  customizations. Needs a Turbopack-compatible approach — likely moving
  the font files into `public/fonts/` (already has a `.keep` placeholder
  in res-gen-2) and loading by URL instead of via a Webpack loader.
  `pdf-font-loader-util.ts` is the file to start from.
- **Static export compatibility.** `_frontend` now builds as a static
  export (`output: 'export'`, see `specs/` deploy work) for GitHub Pages.
  res-gen-2 is already fully client-side (`'use client'` at the page
  root, no server actions, no dynamic route segments), so this should be
  compatible in principle, but hasn't been verified — confirm during PR 1
  that `next build` still produces a working static `out/` for the ported
  app, same way it was verified for the scaffold page.
- **Other major-version dependency jumps**: `uuid` 9→14 and `zod` 3→4 are
  both pinned well behind current. `uuid`'s API is stable across majors
  (low risk); `zod` 4 has real breaking changes from `zod` 3 (schema API
  changes) and needs an actual check against `src/types/` usage, not an
  assumption. `react-dnd`, `react-modal`, `react-collapse` all declare
  permissive peer ranges that already cover React 19 — expected to be
  low-risk version bumps.
- **basePath.** Like the scaffold page, any asset referenced by a literal
  path (not `_next/*`) needs the `basePath` prefix (`_frontend/src/base-path.ts`)
  or it 404s on GitHub Pages. res-gen-2 references SVG icons from
  `public/` (`github.svg`, `gmail.svg`, etc. — used in `pdf/icons/`) and
  fonts the same way. Audit every literal `/foo` asset reference during
  the port, not just the two that existed in the scaffold.

### _frontend

- `src/app/page.tsx` (current scaffold) gets replaced by the ported app's
  entry point. `src/app/layout.tsx` merges res-gen-2's root layout
  (the `pdf-tailwind-bootstrapper` div, its own `<head>` metadata) with
  res-gen-3's existing one (current metadata fix from `specs/accessibility.md`,
  font loading) rather than one clobbering the other.
- res-gen-2's `src/` tree (`components/`, `context/`, `managers/`, `pdf/`,
  `types/`, `utils/`, `css/`, `constants.ts`, `fonts/`, `__example-json/`)
  moves into `_frontend/src/`. Existing res-gen-3 conventions apply going
  forward: Prettier (already configured), the jsx-a11y lint rules already
  active, `.test.tsx` files colocated per the existing pattern (not a
  separate `__tests__` tree).
- `public/` assets (`*.svg` icons, `docs/images/res-gen-2-preview.png` if
  kept) move into `_frontend/public/`.

### _backend

Not touched.

## Audit: ported app

Audited the ported `_frontend` app (drag-and-drop editor, JSON editors,
layout manager, control panel, PDF preview modal) against WCAG 2.2 AA,
same process as `specs/accessibility.md`'s original audit: automated
`jsx-a11y`/`axe-core` (in component tests, jsdom) first, then a live
`axe-core` scan of the app running in a real Chromium browser via
Playwright (`pnpm front`, http://localhost:3330/res-gen-3/) to catch
what jsdom can't compute (real rendered contrast, iframe rendering,
actual tab order) — this is the "page-level scans" gap
`specs/accessibility.md` left as an open question; doing it here for
this PR closes that gap for the pages that exist today.

| # | Finding | WCAG SC | Severity | Status |
|---|---|---|---|---|
| 1 | BaseMacro's delete/reorder/inline-edit controls only revealed on mouse click (a `document` click listener), never on keyboard focus — a keyboard-only user could not reach them at all once a macro was placed | 2.1.1 Keyboard (A) | Violation | Fixed — added `onFocus`/`onBlur` reveal alongside the existing click listener |
| 2 | BaseMacro's wrapping `<div>` carried `role="button"` with no activation behavior (no click/Enter/Space action of its own) | 4.1.2 Name, Role, Value (A) | Violation | Fixed — `role="group"` instead |
| 3 | MacroTopBar's up/down icon buttons had no accessible name (icon-only, no `aria-label`) | 4.1.2 (A), 1.1.1 Non-text Content (A) | Violation | Fixed — `aria-label` added |
| 4 | ResumeModal used `ariaHideApp={false}`, so background content was never `aria-hidden` while the PDF preview modal was open | Modal dialog best practice / 4.1.2 (A) | Moderate | Fixed — `Modal.setAppElement('#res-gen')` wired up |
| 5 | EditorTopBar's collapsible trigger had no `aria-expanded`/`aria-controls` despite controlling a collapsible region | 4.1.2 (A) | Violation | Fixed |
| 6 | BaseEditor's textarea `aria-describedby` pointed at a literal `"error-message"` id that didn't exist anywhere in the DOM (and wasn't unique across the 5 simultaneously-rendered editors); no `aria-invalid`; error text wasn't a live region | 4.1.2 (A), 3.3.1 Error Identification (A), 4.1.3 Status Messages (AA) | Violation | Fixed — unique per-instance id, `aria-invalid`, `role="alert"` |
| 7 | EditorTopBar (a `<select>` + 2 `<button>`s) and BaseMenu (`role="menu"` + `role="menuitem"` items) both nested real interactive controls inside their own `role="button"` trigger | 4.1.2 (A) | Violation | Fixed — trigger and controls split into siblings |
| 8 | The only way to place new content into a specific layout was the "Add Macro Button", hardcoded to the *last* layout — no way to target an earlier layout or either side of a DOUBLE layout without dragging (and dragging onto a DOUBLE layout's parent id silently orphaned the item, since no layout zone actually renders `layoutType: 'DOUBLE'`) | 2.5.7 Dragging Movements (AA, new in 2.2) | Violation | Fixed — "Add to layout" picker targets any zone (also fixes the orphaning bug) |
| 9 | ContactMacro's optional title jumped from h1 to h4; HeaderMacro's section heading was h3 — both skip levels relative to ContactMacro's name, the page's only h1 | 1.3.1 Info and Relationships (A) | Violation | Fixed — both now h2 |
| 10 | Collapsed editor textareas stayed in the tab order (hardcoded `tabIndex={0}`) despite sitting inside react-collapse's `aria-hidden="true"` wrapper when closed — only caught by the live-browser scan, not jsdom | 4.1.2 (A) | Violation | Fixed — `tabIndex={isOpen ? 0 : -1}` |
| 11 | The new "Add to layout" `<select>` rendered transparent over the dark toolbar background, leaving `text-black` at ~2.8:1 contrast against it (needs 4.5:1) — only caught by the live-browser scan, since jsdom can't compute rendered contrast | 1.4.3 Contrast (Minimum) (AA) | Violation | Fixed — explicit `bg-white` |
| 12 | `PDFViewer`'s `<iframe>` had no accessible title — only caught by the live-browser scan, since jsdom doesn't render a real iframe | 4.1.2 (A) / iframe titling | Violation | Fixed — reused the same computed PDF filename already shown to sighted users |
| 13 | ControlPanel's title/version text sat outside any landmark region — only caught by the live-browser scan | 1.3.1 (A) / landmarks best practice | Moderate | Fixed — `<header>` instead of `<div>` |

Checked and passing:

- Every JSON editor's textarea has a properly associated `<label htmlFor>`
  (the macro name, e.g. "Contact").
- `<main>` landmark present (`src/app/main.tsx`).
- A live `axe-core` scan (real Chromium, not jsdom) returns **0
  violations** across every state exercised: initial load, after adding
  content via the new keyboard/non-drag layout picker, with a macro
  focused (its controls revealed), and with the PDF preview modal open.
- Keyboard-only pass (Tab through a real running instance): reaches
  every interactive control in a logical order — control panel menus,
  each editor's collapse trigger, layout picker, add button,
  visibility-toggle button, and textarea — with no traps observed.
- HTML5 drag-and-drop (dragging an editor card onto a layout) still
  places content correctly after the EditorTopBar/BaseMenu DOM
  restructuring (verified live, not just via mocked unit tests).

Known gaps, deferred:

- **Moving an *existing* macro to a different layout has no path at
  all, keyboard or mouse.** Neither this port nor the original res-gen-2
  ever wired `useDrag` onto placed macros (`BaseMacro`/`MacroItem`) —
  only the left-panel editor cards are draggable. MacroTopBar's
  up/down buttons only reorder within the flat items array, they don't
  change which layout an item belongs to. This is a pre-existing
  limitation equally inaccessible to mouse and keyboard users, not a
  regression from this port, and fixing it means designing a new
  "move to a different layout" interaction (not a markup/ARIA fix) —
  out of scope for this audit; tracked as a follow-up rather than
  blocking it.
- **Screen-reader-specific testing** (VoiceOver/NVDA/JAWS): not
  performed here, matching `specs/accessibility.md`'s stated scope
  (automated tooling plus a live-browser `axe-core` scan, not a full AT
  matrix). Recommended as a manual PR-review step per that spec's
  existing checklist.
- **Target size (SC 2.5.8, 24×24px minimum)**: spot-checked, not
  measured pixel-by-pixel across every control via
  `getBoundingClientRect()`. Icon buttons use `p-1`/`p-2` padding
  around ~20px icons, which should clear 24×24 in practice, but this
  wasn't exhaustively verified.
- **`prefers-reduced-motion`**: the only motion in the app is
  react-collapse's CSS height transition; not verified against the
  reduced-motion media query.

## Acceptance criteria

- [x] PR 1: app builds, runs, and is manually verified working
      (drag-and-drop, PDF export, JSON import/export, localStorage) under
      res-gen-3's stack (React 19, Next 16, static export) — verified with
      Playwright against a real running instance, not just build/lint;
      caught and fixed one real regression (a lint-driven fix that broke
      `forwardRef`'s runtime contract) that build/lint didn't catch
- [x] PR 1: `@react-pdf/renderer` on 4.5.1 (React 19 support), PDF output
      confirmed valid (`%PDF-1.3` header) with the embedded Roboto font
      actually used (not a Helvetica fallback) by inspecting the raw
      generated PDF bytes
- [x] PR 1: fonts load correctly under Turbopack — moved to `public/fonts/`,
      loaded by `basePath`-prefixed URL instead of a Webpack loader
- [x] 100% statement/branch/function/line coverage on all ported code,
      coverage carve-out from #8 fully removed
- [x] Full WCAG 2.2 AA audit of the ported app (audit table, same format
      as `specs/accessibility.md`), findings fixed or explicitly deferred
      with reasoning
- [x] `pnpm build`/`lint`/`test:cov` green

## Open questions

Resolved during PR 1 (defaulted to the spec's stated assumptions, per
"implement the draft"):

- **Branding**: kept as-is — "ResGenie 2.0" / "Make a Resume". (Later
  updated to "Res Gen 3" in a separate follow-up change, once the app was
  actually living in the res-gen-3 monorepo — not part of this PR.)
- **Routing**: resume builder replaced `/` entirely, as assumed.
- **Example JSON / prepopulated content**: carried over as-is.
- 3-PR phasing held up fine for PR 1 itself, but per explicit direction
  the remaining coverage + a11y work is being collapsed into #8's branch
  rather than split into further PRs — see Design above.

Still open:

- **PDF accessibility (PDF/UA)**: is a tagged, screen-reader-readable PDF
  output in scope, or is WCAG-for-the-web-app (this spec's actual scope)
  sufficient? `@react-pdf/renderer`'s tagged-PDF support needs research
  if the answer is yes — not assumed here.
