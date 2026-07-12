---
status: draft
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

Given the size (zero-to-100%-coverage on ~3,400 lines, a real a11y audit,
and a breaking dependency upgrade — see risks below), this ships as
**three sequential PRs**, not one, each gated by the existing pipeline:

1. **Raw port + build green.** Get the app running correctly in
   `_frontend` under res-gen-3's stack, with tests deferred to a
   `// TODO(port): needs coverage` marker or equivalent, and a11y deferred.
   Manually verified working (drag-and-drop, PDF export, JSON
   import/export, localStorage persistence) via the `run`/`verify` skills
   before moving on.
2. **Coverage.** Write unit tests for everything ported, to the existing
   100% statement/function/line bar (branches too, unlike `_backend` —
   there's no SWC-decorator-metadata equivalent issue on the frontend).
3. **Accessibility.** Audit against `specs/accessibility.md`'s WCAG 2.2 AA
   target and fix findings, same process as that spec used (audit table,
   then fixes). This app has real a11y surface area the scaffold never
   did: drag-and-drop (SC 2.5.7 needs a non-drag alternative), modals
   (`react-modal` — focus trap/restore, `Esc` to close, labelled),
   collapsible sections (`react-collapse` — `aria-expanded`), custom
   menus/control panel (keyboard operability, roles), forms/editors
   (labels, error identification).

Each PR must independently pass `pnpm build`/`lint`/`test:cov` — PR 1
won't be at 100% coverage yet, so **the coverage threshold in
`_frontend/vitest.config.ts` needs a temporary carve-out for the ported
paths during PR 1** (e.g. scoped `coverage.exclude` for the new
directories, removed again once PR 2 lands), rather than dropping the
gate repo-wide. Called out explicitly so it isn't a silent, permanent
weakening.

### Known technical risks (resolve during PR 1)

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

## Acceptance criteria

- [ ] PR 1: app builds, runs, and is manually verified working
      (drag-and-drop, PDF export, JSON import/export, localStorage) under
      res-gen-3's stack (React 19, Next 16, static export)
- [ ] PR 1: `@react-pdf/renderer` on a React-19-compatible version, PDF
      output manually confirmed to still render correctly
- [ ] PR 1: fonts load correctly under Turbopack (no dependency on the
      old Webpack config)
- [ ] PR 2: 100% statement/branch/function/line coverage on all ported
      code, coverage carve-out from PR 1 fully removed
- [ ] PR 3: full WCAG 2.2 AA audit of the ported app (audit table, same
      format as `specs/accessibility.md`), findings fixed or explicitly
      deferred with reasoning
- [ ] `pnpm build`/`lint`/`test:cov` green at the end of each PR

## Open questions

- **PDF accessibility (PDF/UA)**: is a tagged, screen-reader-readable PDF
  output in scope, or is WCAG-for-the-web-app (this spec's actual scope)
  sufficient? `@react-pdf/renderer`'s tagged-PDF support needs research
  if the answer is yes — not assumed here.
- **Branding**: res-gen-2's page title/description is "ResGenie 2.0" /
  "Make a Resume". Keep as-is, or rename to match res-gen-3?
- **Routing**: does the resume builder become the entire site (replacing
  `/` outright, as this spec assumes), or should it live at its own route
  (e.g. `/builder`) alongside something else at `/`?
- **Example JSON / prepopulated content** (`__example-json/`,
  `prepopulate-util.ts`): carry over as-is, or is this a chance to
  update/replace the sample resume content?
- Is the 3-PR phasing granularity right, or would you rather see it
  broken down further (e.g. coverage split per subsystem) or collapsed?
