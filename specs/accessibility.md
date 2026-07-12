---
status: in-progress
---

# Accessibility (WCAG 2.2 AA)

## Problem

The app has no accessibility requirements, tooling, or process today — it's
the unmodified `create-next-app` scaffold with no `jsx-a11y` linting, no
automated a11y testing, and no documented target. As real UI gets built,
issues will accumulate silently unless a bar is set and enforced from the
start (same reasoning as the 100% coverage gate: cheap to hold from day
one, expensive to retrofit).

The user wants the app to be accessible to the latest WCAG standard and to
meet accessibility compliance requirements.

## Non-goals

- This spec does not implement fixes or install tooling. It defines the
  target, audits current state, and defines how compliance will be tested.
  A follow-up spec/PR implements the automated tooling (`eslint-plugin-jsx-a11y`,
  `vitest-axe`) once this is approved.
- Legal certification. WCAG 2.2 AA is the technical baseline that ADA
  Title II/III, Section 508 (2018 refresh), EN 301 549 / the EU
  Accessibility Act, and Canada's AODA all point to — meeting it is the
  right engineering target, but whether a given deployment is *legally*
  compliant depends on jurisdiction, sector, and legal review this spec
  can't substitute for.
- Browser/AT version matrix. Testing targets current stable Chrome/Safari
  + VoiceOver (built into macOS, what's available in this environment) and
  axe-core's ruleset. NVDA/JAWS/mobile AT testing is called out as a gap,
  not covered by CI.
- WCAG AAA as a blanket requirement. AAA is cherry-picked per W3C's own
  guidance (full-site AAA conformance isn't recommended as a general
  policy) — specific AAA criteria are adopted below where they're cheap
  and worth it (e.g. link-purpose clarity), not as a blanket bar.

## Design

### Target

**WCAG 2.2 Level AA**, the latest published W3C recommendation (Oct 2023;
2.3/3.0 are not yet stable). WCAG 2.2 is backward-compatible with 2.1/2.0 —
meeting 2.2 AA meets those too. Canonical reference:
https://www.w3.org/TR/WCAG22/ and the quick-reference checklist at
https://www.w3.org/WAI/WCAG22/quickref/.

New success criteria in 2.2 that didn't exist in 2.1 (worth calling out
since they're easy to miss if working from older training/habits):

- **2.4.11 Focus Not Obscured (Minimum)** — focused element can't be
  entirely hidden by sticky headers/footers/cookie banners.
- **2.5.7 Dragging Movements** — anything operable by drag must have a
  single-pointer (non-drag) alternative.
- **2.5.8 Target Size (Minimum)** — interactive targets ≥24×24px, or
  adequate spacing if smaller.
- **3.2.6 Consistent Help** — help mechanisms (contact, chat, FAQ) appear
  in the same relative order across pages.
- **3.3.7 Redundant Entry** — don't make users re-enter info already
  supplied in the same process, unless required (e.g. re-entering a
  password).
- **3.3.8 Accessible Authentication (Minimum)** — no cognitive-function
  test (e.g. puzzle CAPTCHA, memorized password with no paste/autofill
  support) as the *only* way to authenticate.

### _frontend

This is where WCAG applies directly — all rendered HTML/CSS/JS.

- **Semantic structure**: use real landmarks (`<main>`, `<nav>`, `<header>`,
  `<footer>`) and heading levels that don't skip (h1 → h2 → h3), not
  `<div>` soup with ARIA bolted on. Prefer native elements
  (`<button>`, `<a href>`) over `<div onClick>`.
- **Forms** (none exist yet, but will): every input has a programmatically
  associated `<label>`, errors are identified in text (not color alone)
  and associated via `aria-describedby`, and `autocomplete` attributes are
  set per WCAG 1.3.5.
- **Images**: meaningful images get descriptive `alt`; decorative images
  get `alt=""`.
- **Color**: never the sole means of conveying information (SC 1.4.1);
  text contrast ≥4.5:1 normal / ≥3:1 large text (SC 1.4.3); non-text UI
  contrast (icons, focus rings, input borders) ≥3:1 (SC 1.4.11).
- **Keyboard**: everything operable without a mouse, visible focus
  indicator on every interactive element (don't ship `outline: none`
  without a replacement), logical focus order, no keyboard traps.
- **Motion**: respect `prefers-reduced-motion` for any non-essential
  animation once added.
- **Dynamic content**: async updates (form submit results, toasts, loading
  states) announced via `aria-live` regions (SC 4.1.3).

### _backend

WCAG governs rendered content, so the NestJS API has no direct WCAG
surface — no HTML is served today. Its indirect responsibility: return
error payloads with clear, human-readable `message` fields (already
Nest's default `HttpException` shape) so the frontend can render them
accessibly, rather than opaque codes the frontend has to reverse-engineer
into user-facing text.

## Audit: current state

Audited `_frontend/src/app/{layout,page}.tsx` and `globals.css` (the only
UI in the repo — unmodified `create-next-app` scaffold) against WCAG 2.2 AA.

| # | Finding | WCAG SC | Severity |
|---|---|---|---|
| 1 | `<title>` is the placeholder "Create Next App"; `description` meta is the placeholder "Generated by create next app" — neither describes this app | 2.4.2 Page Titled (A) | Violation |
| 2 | `target="_blank"` links ("Deploy Now", "Documentation") don't warn users a new tab will open (visually or via accessible name) | 3.2.5 Change on Request (AAA, adopted here as good practice) | Minor / best-practice |
| 3 | No focus-visible styling is defined anywhere — relies entirely on browser default outline. Works today, but there's no regression guard once custom components start overriding it | 2.4.7 Focus Visible (AA) | At-risk, not yet violated |
| 4 | No skip-link / bypass mechanism | 2.4.1 Bypass Blocks (A) | Not yet applicable — single-landmark page has nothing to skip; required once nav/header exists |

Checked and passing:

- `<html lang="en">` present (SC 3.1.1).
- Single `<h1>`, no skipped heading levels.
- Both `<Image>` uses have descriptive `alt` text ("Next.js logo",
  "Vercel logomark") — no missing/empty alt on meaningful images.
- `<main>` landmark present.
- Text contrast computed by hand against WCAG's relative-luminance
  formula for every color pair in use: `zinc-600` body text on white
  ≈7.7:1, `zinc-400` body text on black (dark mode) ≈8.2:1, and both
  button variants pair near-black/near-white text and background — all
  comfortably clear the 4.5:1 AA floor (most clear 7:1 AAA too). No
  contrast violations in current content. Re-verify with automated
  tooling (below) once custom colors outside the Tailwind default
  palette are introduced — hand computation doesn't scale.
- No CSS disables focus outlines (no `outline: none` in `globals.css`).
- No motion/animation exists yet, so no `prefers-reduced-motion` gap in
  practice (flagged above as forward-looking, not a current violation).

## Test plan

### Automated (to be wired into the existing pipeline — future PR)

- **Lint**: add `eslint-plugin-jsx-a11y` (`recommended` config) to
  `_frontend/eslint.config.mjs`. Runs via the existing `pnpm lint`, already
  gated by `ci.yml` and the Claude Code pre-commit hook — no new CI
  plumbing needed, just a new rule set.
- **Component tests**: add `vitest-axe` (axe-core bindings for Vitest) and
  assert zero violations per rendered component in the existing
  `*.test.tsx` suite, alongside the existing Testing Library assertions.
  Runs as part of `pnpm test:cov`, already gated.
- **Page-level scans**: out of scope until a browser-automation tool
  (Playwright) is set up — tracked as an open question below, not
  implemented by this spec.

### Manual (checklist, run against any PR that changes user-facing UI)

- [ ] Keyboard-only pass: Tab/Shift+Tab reaches every interactive element
      in a logical order, Enter/Space activate them, no traps, focus is
      always visibly indicated.
- [ ] VoiceOver pass (macOS, built-in — Cmd+F5): landmarks and headings
      are announced sensibly, every link/button has a clear accessible
      name (not "click here"), form fields announce their label.
- [ ] Zoom to 400% / narrow to 320px width: no content or functionality
      lost, no unintended horizontal scroll of the page.
- [ ] Any new interactive control ≥24×24px touch target (SC 2.5.8).
- [ ] Any new color usage isn't the sole signal (e.g. error states also
      use text/icon, not just red).

### Gating

Once the automated tooling above lands: `jsx-a11y` lint violations and
`vitest-axe` failures block commits and PRs the same way lint/test
failures do today (same hook and CI paths, no new gate to design). The
manual checklist is a PR-review step, not CI-enforced.

## Acceptance criteria

- [ ] This spec is reviewed and flipped to `approved`
- [ ] Follow-up spec/PR adds `eslint-plugin-jsx-a11y` and `vitest-axe`,
      wired into the existing lint/test:cov pipeline (no new CI jobs)
- [ ] Findings #1 and #2 from the audit above are fixed
- [ ] `docs/AGENTS.md`-style guidance (or this spec) is the reference
      future UI work is written against — new components include the
      semantic/keyboard/contrast requirements above by default, not
      retrofitted later

## Open questions

- Do we want page-level/E2E scans (Playwright + `@axe-core/playwright`)
  now, or defer until there's more than one route worth scanning? No
  browser-automation tool exists in the repo yet, so adding one is its
  own scoped decision, not a rider on this spec.
- Screen-reader coverage today is VoiceOver-only (what's available in
  this dev environment). Is NVDA/JAWS testing needed before shipping to
  real users, and if so, on what cadence/who owns it?
- Is a Lighthouse CI accessibility-score gate wanted in `ci.yml`, or is
  jsx-a11y + axe assertions sufficient signal?
