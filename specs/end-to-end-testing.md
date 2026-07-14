---
status: implemented
---

# End-to-end testing (Playwright)

## Problem

Everything today is verified either by hand (ad-hoc Playwright scripts run
once during the res-gen-2 port, then thrown away) or by component tests
running in jsdom. jsdom can't render a real iframe, compute real layout/CSS
paint, or run a real HTML5 drag-and-drop gesture — the res-gen-2 port audit
(`specs/port-res-gen-2.md`) hit exactly this gap: a live-browser `axe-core`
scan caught real contrast, focus, and landmark bugs that 100%-covered jsdom
component tests missed entirely. `specs/accessibility.md` explicitly left
"page-level scans (Playwright + `@axe-core/playwright`)" as an open
question, deferred until there was more than one route worth scanning.

There's now a real app worth scanning (drag-and-drop editor, JSON forms,
PDF preview, modals, localStorage persistence) and no repeatable way to
catch a real-browser regression before it ships — every verification pass
so far has been a one-off script, not a suite that runs again next time
something changes.

## Non-goals

- Cross-browser/device matrix. Chromium only for now (matches what's
  already installed and was used for the port's live verification).
  Firefox/WebKit/mobile viewports are a follow-up, not blocking.
- Visual regression (screenshot diffing). Out of scope — this spec is about
  functional and accessibility behavior, not pixel-level UI diffs.
- Load/performance testing.
- `_backend` coverage. It has no HTTP surface the frontend consumes today
  (the res-gen-2 port is entirely client-side); nothing to end-to-end test
  yet. Revisit once `_backend` has a real consumer.
- Replacing any existing test layer. Component tests (Vitest/jsdom,
  100%-gated) and lint (`jsx-a11y`) stay exactly as they are — this adds a
  third layer for what only a real browser can catch, it doesn't
  duplicate what the other two already do well (e.g. this won't re-assert
  every button's `aria-label`, just that real flows work end-to-end).

## Design

### New package: `end-to-end/`

A new pnpm workspace package, sibling to `_frontend`/`_backend` at the repo
root. Named `end-to-end` (no underscore prefix, unlike `_frontend`/
`_backend`) since it isn't a deployable app — it's a test harness that
drives one.

```
end-to-end/
  package.json          # @res-gen-3/end-to-end
  playwright.config.ts
  tests/
    page-load.spec.ts       # loads past the styleSheets-polling gate, no console errors
    drag-and-drop.spec.ts   # HTML5 drag from an editor card onto a layout
    layout-picker.spec.ts   # the non-drag "Add to layout" alternative (SC 2.5.7)
    json-editors.spec.ts    # edit JSON, see it reflected in the layout/PDF preview
    pdf-preview.spec.ts     # open the modal, iframe renders, PDF has real content
    control-panel.spec.ts   # File/Edit/View menus, add/remove layout, JSON import/export
    persistence.spec.ts     # reload the page, localStorage state survives
    accessibility.spec.ts   # @axe-core/playwright scan of each state above, 0 violations
    keyboard.spec.ts        # tab order reaches every control, no traps
  README.md
```

- `pnpm-workspace.yaml` gets `end-to-end` added to `packages:`.
- Runner: `@playwright/test` (the actual test framework, not just the
  driver library used for the port's one-off scripts). A11y scans use
  `@axe-core/playwright` (the officially maintained Playwright wrapper
  around the `axe-core` already used in component tests — same rule set,
  real-browser execution instead of jsdom).
- `playwright.config.ts` uses Playwright's built-in `webServer` option to
  boot the frontend itself rather than requiring a server to already be
  running: `next dev -p 3330` in both CI and locally (`pnpm front`'s own
  command). **Correction from the draft**: `next start` — the obvious
  choice for testing the actual production bundle — doesn't work here;
  confirmed by actually running it: `next start` refuses outright with
  `Error: "next start" does not work with "output: export" configuration`
  (`_frontend/next.config.ts` sets `output: "export"` for GitHub Pages).
  The suggested `serve out` alternative serves the static export at the
  filesystem root, not at the `/res-gen-3` `basePath` the app's own asset
  references expect, so it 404s on every `_next/*` asset without a
  path-prefixing proxy in front of it — extra infrastructure not worth
  building just to shave the gap between dev and prod server behavior.
  `next dev` is already what every manual verification pass during the
  res-gen-2 port used, and `pnpm build` already runs (and is coverage/lint
  gated) in `ci.yml`/`deploy-pages.yml`, so production-bundle correctness
  is verified elsewhere — this suite's job is real-browser *behavior*,
  which `next dev` exercises faithfully (same React tree, same DOM).
  `baseURL` is `http://localhost:3330/res-gen-3/` (the app's `basePath`).
- Chromium only, installed via `playwright install --with-deps chromium`.
- **Trace and video: on locally, off in CI** (`process.env.CI` gates it).
  Locally this gives a developer the full interactive trace viewer and a
  video of every run without having to reproduce a failure first — worth
  the disk/time cost on a single local run. In CI, `push`-to-`main` runs
  are frequent and unattended; tracing every run would be wasted cost for
  runs nobody looks at unless something fails. The HTML report (always
  generated, uploaded as an artifact either way) is enough to see what
  broke on `main`; a contributor can reproduce locally with full tracing
  if deeper debugging is needed.

### Scripts

- `end-to-end/package.json`: `"test:e2e": "playwright test"`.
- Root `package.json`: `"test:e2e": "pnpm --filter @res-gen-3/end-to-end test:e2e"`.
- `turbo.json`: new `test:e2e` task, `dependsOn: ["^build"]` (needs
  `_frontend` built first when run in CI mode).

### CI

Separate workflow, `.github/workflows/e2e.yml` — different trigger from
`ci.yml`, so a separate file rather than folding in:

- **Trigger: `pull_request` targeting `main`, and `push` to `main`.**
  Originally `push`-to-`main` only (so a workflow that only ever ran
  post-merge couldn't gate any PR's merge button "by construction");
  changed to also run on PRs so results are visible during review. Still
  not blocking, but now because `main` has no branch protection rules at
  all (confirmed via `gh api repos/.../branches/main/protection` — 404,
  "Branch not protected"), not because of when the workflow fires.
- Not added to branch protection / required checks.
- Steps: install deps, install Playwright + Chromium
  (`playwright install --with-deps chromium`), build `_frontend`, run
  `pnpm test:e2e`. Uploads the HTML report as a build artifact
  (`actions/upload-artifact`) so a failure on `main` is debuggable from
  the Actions run, even with tracing off (see below).

### Coverage scope ("full" Playwright tests)

Every flow that was manually verified ad-hoc during the res-gen-2 port,
turned into a permanent spec file:

- App loads past the `"Loading..."` gate with no console errors.
- Drag an editor card onto a layout (real `DragEvent`s, matching how the
  port's manual verification confirmed react-dnd's HTML5 backend works —
  Playwright's synthetic drag helpers don't trigger it, so this needs the
  same manual `DragEvent` dispatch used during the port).
- The non-drag "Add to layout" picker places content in the chosen zone
  (the SC 2.5.7 alternative added in the a11y audit).
- Editing a JSON editor's textarea updates the rendered macro and PDF
  preview.
- Opening the PDF preview modal renders real PDF content in the iframe,
  and the app root goes `aria-hidden` while it's open.
- Control panel menus (File/Edit/View) are keyboard-operable; add/remove
  layout actually changes what renders.
- JSON export downloads a file; JSON import round-trips it back in.
- Reloading the page preserves state via localStorage.
- `@axe-core/playwright` scan returns 0 violations in every state above
  (closes the "page-level scans" gap `specs/accessibility.md` left open).
- Keyboard-only pass: Tab reaches every interactive control in a logical
  order, no traps (same check the port did manually, now automated).

## Findings from writing this suite

Real, previously-unknown bugs a real browser + real user flows surfaced
that neither jsdom component tests nor manual spot-checks had caught:

- **ContactEditor's zod schema rejected legitimate partial edits.**
  Optional fields were typed `union([string(), undefined()])`; zod v4
  only treats a key as omittable when the schema itself marks it
  `.optional()` — a union that merely includes `undefined()` still
  requires the key to be present. Editing a contact down to just
  name/email (a completely ordinary edit) failed validation on every
  such payload. Also added a missing `website` field to the schema
  (present in every example payload and the type, but never validated).
  Fixed in `contact-editor.tsx`, with new regression tests in both this
  suite and `_frontend`'s own component tests.
- **Three real WCAG 2.2 AA violations**, caught by a real-browser
  `@axe-core/playwright` scan that the jsdom-based component test suite
  (built during `specs/port-res-gen-2.md`'s audit) missed entirely,
  since jsdom can't compute actual rendered contrast:
  - The error-state `opacity-50` treatment on the editor top bar dropped
    an already-borderline white-on-`bg-gray-600` combination to ~2.3:1
    contrast (needs 4.5:1). Removed — the error text itself (bright red,
    `role="alert"`) was already the primary signal.
  - The validation error message's `bg-red-400` background was ~2.9:1
    against white text. Changed to `bg-red-600` (~4.8:1).
  - `BaseMenu` clones `role="menuitem"` onto every dropdown child
    uniformly; `UploadJsonButton`'s `<label>` element can't natively
    hold that role (`aria-allowed-role`, minor severity). Deferred —
    fixing it means reworking that component's label/input association,
    not a class-name change; documented and excluded from the relevant
    assertion rather than silently ignored (see `accessibility.spec.ts`).
- **`page.addInitScript(() => localStorage.clear())` re-fires on every
  navigation**, including a same-test `page.reload()` — silently broke
  every persistence test until caught (state "reset" was actually just
  being re-cleared, not failing to persist). Fixed with a `window.name`
  marker, which survives reload/navigation within the same tab.
- **`locator.dragTo()` does not reliably auto-scroll an off-screen drop
  target into view.** An identical drag succeeded against an in-viewport
  target and silently no-op'd against the same target below the fold.
  Fixed with a tall default viewport rather than relying on scroll
  behavior mid-gesture — also caught a `devices['Desktop Chrome']`
  preset silently overriding an earlier, narrower viewport override
  (spread order in `playwright.config.ts`).

## Acceptance criteria

- [x] `end-to-end/` package exists, registered in `pnpm-workspace.yaml`
- [x] `@playwright/test` + `@axe-core/playwright` installed, Chromium
      browser installed
- [x] `playwright.config.ts` boots the frontend itself via `webServer`
      (`next dev -p 3330`, same in CI and locally), targets
      `http://localhost:3330/res-gen-3/`
- [x] Spec files cover every flow listed under "Coverage scope" above
      (33 tests across 9 spec files)
- [x] `pnpm test:e2e` works from the repo root
- [x] `.github/workflows/e2e.yml` runs the suite on `pull_request` targeting
      `main` and on `push` to `main` (not a required check, and `main` has
      no branch protection rules) and uploads the HTML report as a build
      artifact
- [x] Trace and video capture are on locally, off in CI
- [x] `end-to-end/README.md` documents how to run it locally and add a
      new spec

## Open questions

None outstanding — CI trigger/blocking behavior and trace/video retention
were resolved above before implementation started.
