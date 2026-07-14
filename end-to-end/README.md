# @res-gen-3/end-to-end

Real-browser Playwright tests for `_frontend`. See
`specs/end-to-end-testing.md` for the full design and reasoning.

These complement, not replace, `_frontend`'s own component tests
(Vitest/jsdom, 100%-coverage gated) and `jsx-a11y` lint. jsdom can't
compute real rendered contrast, render an actual `<iframe>`, or run a
real HTML5 drag-and-drop gesture — this suite exists for the things only
an actual browser can catch.

## Running locally

From the repo root or this directory:

```sh
pnpm test:e2e                              # whole workspace, via turbo
pnpm --filter @res-gen-3/end-to-end test:e2e   # this package only
pnpm --filter @res-gen-3/end-to-end test:e2e:ui   # Playwright's interactive UI mode
```

The suite boots `_frontend`'s own dev server itself (`next dev -p 3330`)
via Playwright's `webServer` config — nothing else needs to be running
first. First run needs Chromium installed once:

```sh
pnpm --filter @res-gen-3/end-to-end exec playwright install --with-deps chromium
```

Trace and video recording are **on** for local runs (off in CI — see
`specs/end-to-end-testing.md`). After a failure:

```sh
pnpm --filter @res-gen-3/end-to-end test:e2e:report   # opens the HTML report
npx playwright show-trace <path-to-trace.zip>          # from the report's own link
```

## Adding a spec

- One file per user-facing flow (`tests/<flow>.spec.ts`), not per
  component — this suite tests behavior end-to-end, component-level
  coverage is Vitest's job.
- Import `test`/`expect` from `./fixtures`, not `@playwright/test`
  directly — the fixture clears `localStorage` before the first
  navigation (so every test starts from the same prepopulated example
  resume) without re-clearing it on a same-test `page.reload()` (see the
  comment in `fixtures.ts` for why that distinction needs a real fix, not
  just `page.addInitScript`).
- Use `page.goto('')`, never `page.goto('/')` — a leading slash resolves
  against the origin root and silently drops `_frontend`'s `/res-gen-3`
  `basePath` entirely. The fixture's own initial navigation already
  handles this; only relevant if a spec needs an explicit extra `goto`.
- If a spec drags anything (`locator.dragTo(...)`), keep the drop target
  inside the configured viewport. `dragTo` is the only thing that can
  drive react-dnd's native HTML5 drag-and-drop backend, and it does not
  reliably auto-scroll an off-screen target into view mid-gesture — the
  large default viewport in `playwright.config.ts` exists specifically
  to avoid this, don't shrink it without re-testing drag specs.
- For an accessibility check, use `@axe-core/playwright`'s `AxeBuilder`,
  not the plain `axe-core` package the component tests use directly (the
  Playwright wrapper runs against the real page rather than needing a
  jsdom `container`).

## Known, deferred accessibility finding

`accessibility.spec.ts`'s "with each control panel menu open" test
disables axe's `aria-allowed-role` rule for one specific, already-
understood issue: `BaseMenu` clones `role="menuitem"` onto every menu
child uniformly, including `UploadJsonButton`'s `<label>` element, which
can't natively hold that role (minor severity). Fixing it means
reworking that component's label/input association, not a class-name
change — tracked, not silently ignored. See the comment at that
`disableRules` call for detail.
