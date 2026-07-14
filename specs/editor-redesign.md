---
status: draft
---

# Editor redesign: intuitive content and layout editing

## Problem

The current editor has two structural barriers to being intuitive, both
confirmed by reading the actual implementation (not just impression):

**1. Every piece of content is edited as raw JSON.** All 5 content types
(Contact, Header, Paragraph, Experience, AnyList) share one generic
`BaseEditor` — a plain `<textarea>` holding a stringified JSON blob,
validated against a zod schema on every keystroke, with parse/validation
errors surfaced as a single opaque error-message string. There are no
real form fields anywhere. This was already flagged as the single
biggest usability barrier in `specs/app-ux-improvements.md` (Finding 2)
and explicitly deferred there as "a real-form-fields redesign, not a
'little more usable' fix" — this spec is that redesign.

**2. Layout and content placement is indirect, menu- and dropdown-driven,
not direct manipulation.** Concretely, today:
- Adding a layout means opening the Edit menu and clicking "Add Single/
  Double Column Layout" — always appends to the end; there's no way to
  insert a layout at a specific position.
- Removing a layout is either the Edit menu's "Remove Last Layout"
  (always the last one) or a small text link in each layout's header
  (added in `specs/app-ux-improvements.md`, Finding 9) — better, but
  still not something you'd discover by looking at the canvas itself.
- Adding content to a layout means either (a) dragging a card from a
  separate "left panel" of 5 static template editors, each pre-filled
  with example content you have to overwrite, or (b) picking a target
  zone from a `<select>` on that same card and clicking a green "+"
  button elsewhere on the page. Neither happens *at* the layout you're
  adding to.
- Reordering content is Move Up / Move Down buttons only — no drag —
  and the underlying move (`onMove` in `app-context.tsx`) splices a single
  flat `items` array by index, with no awareness of which layout/zone an
  item belongs to. It happens to render correctly today because each
  zone re-filters by `layoutId` at render time, but the semantics are
  fragile: "move up" on the first item in a zone swaps flat-array
  position with whatever item precedes it in the *entire resume*,
  regardless of which layout that item is in.

Net effect: nothing about "how do I add a bullet point" or "how do I put
a second column next to this one" is discoverable from looking at the
app. Every action routes through a menu, a dropdown, or a JSON blob.

## Non-goals

- **Not a visual/brand redesign.** Same cyan/gray palette, same overall
  page structure (control panel bar + canvas), matching the standing
  convention from `app-ux-improvements.md`.
- **Not a backend/accounts feature.** Still fully client-side/
  `localStorage`, unchanged.
- **Not a new content-type system.** Still the same 5 types (Contact,
  Header, Paragraph, Experience, AnyList) with the same underlying zod
  schemas/field shapes — this redesigns *how you edit* those shapes, not
  what they contain. Adding new content types is out of scope.
- **Not necessarily a data-model rewrite.** The flat `items: ContentAll[]`
  + separate `layouts: LayoutItem[]` structure stays as the default plan
  (see Design → Reordering); a deeper restructuring (e.g. nesting items
  inside their layout) is flagged as an open question, not assumed.
- **Not mobile/responsive.** Desktop-only, same as prior UX work.
- **Not removing `localStorage` compatibility.** Whatever ships must
  still read resumes saved under the current schema — no "your old
  resume is gone" regression.

## Design

### Content editing: real forms, driven by a declarative field spec

Rather than hand-writing 5 bespoke forms, each content type gets a
declarative field spec (an array of `{ name, label, kind }` descriptors)
that a single generic `<ContentForm>` renders. `kind` covers what the 5
types actually need (per the schemas in `types/content-*.d.ts` and their
zod counterparts):

- `text` — single-line input (e.g. Contact's `name`, `email`, `phone`;
  Header's `header`)
- `textarea` — multi-line free text (Paragraph's `paragraph`)
- `tags` — chip/pill entry: type text, Enter or comma commits a chip,
  click a chip's × to remove it (Experience's `tags`, rendered today as
  black pill badges — the input should look like what it produces)
- `list` — repeating single-line rows with add/remove/reorder-by-button
  (Experience's `descriptions`, today's bulleted `<ul>`)
- `record-of-lists` — repeating **named groups**, each a label input plus
  its own `list` of entries, with add/remove at both the group level and
  the entry-within-group level (AnyList's arbitrary `Record<string,
  string[]>` — e.g. "Foods: [Meats, Sushi, Bento]" as one group)

This keeps validation logic (still zod) as the source of truth for
what's required/optional per type — the form is generated from field
metadata that sits next to (or is derived from) the existing schema, not
a hand-maintained parallel structure per type.

**Where the form lives**: keeps the existing "focused block reveals its
own editor" shape (`BaseMacro` already does this — click a placed block,
`MacroTopBar` + an inline `EditorItem` editor appear) rather than
introducing a new modal/side-panel pattern. The inline editor's contents
change from a JSON `<textarea>` to the generated form; everything else
(focus-to-reveal, `MacroTopBar`'s move/delete controls, undo-on-delete)
stays as-is.

**Where content gets created**: the left panel's current role — 5 static
cards pre-filled with *example* content you drag or add-via-dropdown —
goes away. In its place, each layout/zone gets its own **"+ Add block"**
control (see Layout design below) that, on click, offers the 5 content
types; picking one inserts a **blank** block (empty required fields,
sensible placeholders, no more copying-then-overwriting someone else's
example data) directly into that zone and opens its form immediately.
This removes the drag-and-drop-from-a-separate-panel model entirely for
the common case — you add content *at* the layout you want it in.

**Validation UX**: per-field inline errors (e.g. a red outline + message
under just the `email` field if it's empty) instead of one opaque
JSON-parse-error banner for the whole block. Zod's existing schemas
already produce field-level error paths (`error.issues[].path`) — this
is a matter of surfacing them per-field instead of collapsing them into
`error.message`.

### Layout management: direct manipulation on the canvas

- **Insert a layout at a specific position**, not just append: hovering
  the gap between two layouts (or above the first / below the last)
  reveals a "+" that inserts a new SINGLE layout there; a small
  secondary control lets you pick SINGLE vs. DOUBLE before inserting
  (mirrors the existing Edit-menu actions, just relocated to where
  you're actually looking).
- **Remove a layout**: keep and build on the existing per-layout
  "Remove layout" link (`layout-header.tsx`) — already direct
  manipulation, already has undo. The Edit menu's "Remove Last Layout"
  can retire once per-layout removal covers the same case from
  anywhere.
- **Reorder layouts**: drag-to-reorder the layout boxes themselves,
  using the `react-dnd` setup already in the app (currently only used
  for dragging content from the left panel — this extends it to
  reordering layout containers). Not currently possible at all today.
- **Add content in place**: each layout (and each half of a DOUBLE)
  gets a persistent, low-visual-weight **"+ Add block"** affordance
  (see Content editing above) — this is the direct replacement for
  today's separate template panel + zone-picker dropdown.
- **SINGLE ↔ DOUBLE**: out of scope for v1 (see Open questions) —
  converting an existing SINGLE layout into a DOUBLE (splitting it) is a
  natural extension but adds real complexity (what happens to existing
  content in it?) that doesn't block the core "intuitive add/edit/
  delete" goal.

### Reordering content

Keep the flat `items` array (see Non-goals), but make `onMove` **zone-
aware**: only ever swap with the nearest *other* item that shares the
same `layoutId`/`layoutType`/`layoutParentId`, not simply the adjacent
flat-array index. This fixes the fragile semantics described in the
Problem section without a data-model rewrite. Drag-to-reorder within a
zone (vs. today's button-only Move Up/Down) is a nice-to-have, not
required for v1 — flagged in Open questions.

### Sequencing (proposed phases)

Given the size of this change, implementing it as reviewable phases
rather than one cutover:

1. **Form primitives** — build the `text`/`textarea`/`tags`/`list`/
   `record-of-lists` field kinds and the generic `<ContentForm>` renderer,
   proven against the two simplest types (Header, Paragraph).
2. **Contact form** — flat fields only, no repeating structures; next
   simplest.
3. **Experience form** — introduces `tags` and `list`.
4. **AnyList form** — introduces `record-of-lists`, the hardest shape.
5. **Layout direct manipulation** — insert-at-position, drag-to-reorder
   layouts, per-zone "+ Add block".
6. **Zone-aware reordering fix** for `onMove`.

Each phase is independently shippable and testable; a phase landing
doesn't require the others to be done first (e.g. Experience can still
use the JSON textarea while Header/Paragraph/Contact already have forms).

## Acceptance criteria

- [ ] Every content type is editable via real form fields — no content
      type still requires hand-editing JSON in the default flow
- [ ] Adding a new block of any content type happens from a control on
      the layout/zone itself, not a separate template panel
- [ ] New blocks start blank (or with clearly-labeled placeholders), not
      copied from pre-filled example content
- [ ] A layout can be inserted at a specific position (not just
      appended), and layouts can be reordered via drag
- [ ] Reordering content only ever moves an item within its own zone —
      moving the first/last item in a zone cannot silently reorder
      relative to a different layout's content
- [ ] Existing resumes saved under the current `localStorage` schema
      still load correctly after this ships
- [ ] All changes keep `_frontend` at 100% coverage and the `axe-core`
      component/E2E suites clean; each phase gets `end-to-end` happy-path
      coverage for its new interactions

## Open questions

- **Keep raw-JSON editing as a power-user fallback, or remove it
  entirely?** A small "Edit as JSON" escape hatch per block would be
  cheap to keep (the zod schemas/validation already exist) and gives a
  safety net during rollout, but means maintaining two editing UIs
  indefinitely rather than one.
- **Data model**: is the "keep the flat array, make `onMove` zone-aware"
  plan (Design → Reordering) sufficient, or is a deeper restructuring
  (e.g. nesting items under their layout in state) wanted? The deeper
  version is a materially bigger, riskier change (touches
  `app-context.tsx`'s whole shape, the `localStorage` schema, and needs
  a migration path for existing saved resumes) — flagged rather than
  assumed.
- **Drag-to-reorder content within a zone**: nice-to-have extension of
  the reordering fix, or explicitly out of scope for now (button-only
  stays)?
- **SINGLE → DOUBLE conversion** (splitting an existing column in place):
  worth designing now, or a clearly-separate follow-up once the rest of
  this lands?
- **Phasing**: implement this spec's phases as one continuous effort
  across several "implement it" passes (as this session has been doing),
  or should each phase get its own spec file for a more granular
  approve/implement/review cycle?
