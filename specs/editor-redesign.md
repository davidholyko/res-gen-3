---
status: implemented
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
- Dragging a ribbon item onto a layout has no auto-scroll: the native
  HTML5 drag gesture (`react-dnd`'s HTML5 backend) doesn't scroll the
  page as the pointer nears the top/bottom of the viewport the way
  dragging a file onto a folder tree, or a card in Trello, does. Once the
  target layout is below the fold, there's no way to reach it without
  first releasing the drag, scrolling manually, and starting over —
  reported directly by the user while trying to drag a new Paragraph
  block onto the last (off-screen) layout.

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

## The user's journey (target experience)

Everything in Design below exists to serve one narrative. This is what a
person sees and does, start to finish, once this spec is fully
implemented — written from the user's chair, not the component tree.
(Which steps already work today is tracked in Sequencing, not here.)

**1. First open.** A cyan control bar across the top — "Res Gen 3",
File / Edit / View menus, a page counter, a Saved indicator — and below
it, a complete example resume laid out on a white page-shaped canvas.
The first impression is "this is the kind of document this tool makes,"
not an empty form. (First-run prepopulation stays — it's the app's own
demo, and clearing it is one click.)

**2. Making it mine.** Nobody edits a stranger's resume line by line,
so the realistic first action is File → New: a confirm, an undo toast
as a safety net, and then an empty canvas with a single clear call to
action — "Your resume is empty. Add a layout to start placing content
in it." From this point on, the person never has to leave the canvas to
build their resume.

**3. Sketching the skeleton.** People think in sections: name and
contact info up top, a summary, experience, maybe skills split into two
columns. Each section container ("layout") is added right where
they're looking: hovering the gap between two sections (or above the
first / below the last) reveals a "+" — one column by default, two
columns via a secondary pick. Every section shows a small label and a
Remove link, and dragging a section moves it whole; the page scrolls
itself when the drag nears the viewport edge.

**4. Filling in content.** Every section (each column of a two-column
section) carries a quiet "+ Add block" control. Clicking it lists the
five block types in plain words — nobody looking for a skills list
will pick something called "AnyList". Choosing one drops a *blank*
block into that exact spot with its form already open and focus in the
first field. No dragging from a separate panel, no picking a
destination from a dropdown, no deleting someone else's example text
first.

**5. Editing.** Hovering a placed block hints that it's clickable;
clicking it frames it in blue and reveals two things: a small toolbar
(move up / move down / delete) and the block's form — real labeled
fields shaped like the content itself. Single-line inputs for names
and emails, a paragraph box for prose, chips for tags, add/remove rows
for bullet lists, named groups for grouped lists. Typing updates the
block live on the page; Backspace edits text and never deletes the
block; a bad value flags just the offending field, right under it.
Clicking anywhere else closes the editor.

**6. Rearranging.** Move up / move down shifts a block within its own
column — it never silently jumps relative to another section's
content. Whole sections reorder by drag (step 3).

**7. Checking and shipping.** The page counter answers "does it still
fit on one page?" continuously while editing. View → PDF opens the
real rendered PDF; File → Download PDF produces the file they actually
send out; Download/Upload JSON round-trips the resume as data. There
is no save button to remember — the Saved indicator confirms autosave
as they type, and closing the tab loses nothing.

### Journey-driven additions

Walking the app as a person (rather than as its component tree)
surfaced three gaps the design below didn't yet cover explicitly.
Folded in as follows:

- **Plain-language block names in the "+ Add block" menu.** Internal
  type names leak into the UI today ("AnyList" in the ribbon, "Macro"
  in aria-labels). The add menu labels the five types in human terms —
  along the lines of Contact details / Section heading / Paragraph /
  Experience / Custom list (final wording at implementation time).
  Internal identifiers (`ANY_LIST` etc.) are unchanged in code, storage,
  and JSON import/export.
- **The Template ribbon retires when per-zone "+ Add block" lands.**
  Design → Content editing already says the panel's role "goes away";
  making the consequence explicit: Phase 6 removes the ribbon itself,
  and with it the per-card "Add to layout" `<select>` + green "+"
  button, drag-from-ribbon, and View → toggle-panel. Accessibility
  doesn't regress: the zone `<select>` existed as the single-pointer
  alternative to drag (WCAG 2.5.7), and a click on "+ Add block" is
  itself single-pointer. The drag auto-scroll (Phase 2) stays — from
  that point it serves layout drag-to-reorder.
- **Hover affordance on editable blocks.** Nothing today signals a
  block is clickable until it's already been clicked. Add a subtle
  hover cue (pointer cursor plus a faint outline or tint) as part of
  Phase 6.

Deliberately *not* changed by this walkthrough: the first-run example
resume stays (journey step 1) — a blank first run would show nothing of
what the tool produces, and File → New is one click away.

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

### Auto-scroll during drag

While a ribbon item is being dragged (`react-dnd`'s HTML5 backend), watch
the pointer's Y position via the drag source's `hover`/native `dragover`
event: within a threshold band near the top or bottom of the viewport,
scroll the window (or the nearest scrollable ancestor, if the layout
canvas ever grows its own scroll container) at a speed that increases the
closer the pointer gets to the edge, and stop as soon as the pointer
moves back out of the band or the drag ends. This is the same interaction
users already expect from drag-and-drop in file managers, Trello, etc. —
today's gap isn't a missing feature so much as `react-dnd`'s HTML5
backend not doing this automatically the way some libraries' custom
(non-native) drag backends do.

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
- **Reorder layouts**: ~~drag-to-reorder the layout boxes themselves,
  using the `react-dnd` setup already in the app~~. **Superseded
  (`specs/inline-layout-toolbar.md`): layout drag-to-reorder was removed
  — along with `react-dnd` entirely, since layouts were its last
  consumer. Layouts are managed via the gap inserters (add) and each
  layout's "Remove layout".**
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
   proven against the two simplest types (Header, Paragraph). **Done** —
   `text`/`textarea` only so far; `tags`/`list`/`record-of-lists` land
   with the phases that actually need them.
2. **Drag auto-scroll** — scroll the page while a ribbon item is being
   dragged near the top/bottom viewport edge (Design → Auto-scroll during
   drag). Small and independent of the forms work; pulled forward ahead
   of Contact/Experience/AnyList because it's a live usability bug on
   *today's* drag mechanic, not something waiting on a later phase to
   exist. **Done.**
3. **Contact form** — flat fields only, no repeating structures; next
   simplest. **Done** — and, per the Phase 1 scope note, this is where
   per-field inline errors landed: Contact's schema gained real
   constraints (non-empty `name`, well-formed `email`), and
   `BaseEditor` now maps zod issues to the offending field
   (`fieldErrors`) instead of one whole-block message.
4. **Experience form** — introduces `tags` and `list`. **Done** —
   `title`/`company` gained non-empty constraints for the same reason
   as Contact's.
5. **AnyList form** — introduces `record-of-lists`, the hardest shape.
   **Done** — and with it the last raw-JSON surface: the spec's
   "raw-JSON fallback: removed, not kept" decision was executed in the
   same PR (BaseEditor's textarea path, EditorTopBar's error banner,
   and the `json-editors.spec.ts` E2E suite all retired; `fields` is a
   required BaseEditor prop now).
6. **Layout direct manipulation** — insert-at-position, drag-to-reorder
   layouts, per-zone "+ Add block" (with plain-language type names), the
   hover affordance on placed blocks, and retiring the Template ribbon
   (see The user's journey → Journey-driven additions). **Done**, as
   three commits: the per-zone add control, then gap inserters +
   drag-to-reorder, then the ribbon retirement (which also removed the
   `EDITOR_MODES` machinery, content drag-and-drop, the zone `<select>`,
   the View → Toggle Editor action, and the Edit menu's "Remove Last
   Layout"; older saves' `isEditorVisible` key is read-tolerated and
   simply ignored).
7. **Zone-aware reordering fix** for `onMove`. **Done** — swaps with the
   nearest same-zone neighbor via a positional swap, and moving the
   first/last item of a zone is an explicit no-op instead of a silent
   cross-zone reorder.

Each phase is independently shippable and testable; a phase landing
doesn't require the others to be done first (e.g. Experience can still
use the JSON textarea while Header/Paragraph/Contact already have forms).

## Acceptance criteria

- [x] Every content type is editable via real form fields — no content
      type still requires hand-editing JSON in the default flow
- [x] Adding a new block of any content type happens from a control on
      the layout/zone itself, not a separate template panel — and once
      that control ships, the Template ribbon (zone dropdown, green "+",
      drag-from-ribbon) is removed rather than left as a second path
- [x] The "+ Add block" menu names the five content types in plain
      language — no internal identifiers like "AnyList" in user-facing
      UI
- [x] New blocks start blank (or with clearly-labeled placeholders), not
      copied from pre-filled example content
- [x] Placed blocks show a hover affordance signaling they can be
      clicked to edit
- [x] A layout can be inserted at a specific position (not just
      appended), and layouts can be reordered via drag
- [x] Dragging near the top/bottom edge of the viewport auto-scrolls the
      page, so an off-screen target is reachable without releasing and
      restarting the drag (originally exercised by ribbon-item drags;
      layout-reorder drags are the surviving drag surface it now serves)
- [x] Reordering content only ever moves an item within its own zone —
      moving the first/last item in a zone cannot silently reorder
      relative to a different layout's content
- [x] Existing resumes saved under the current `localStorage` schema
      still load correctly after this ships
- [x] All changes keep `_frontend` at 100% coverage and the `axe-core`
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

## Decisions (resolved before implementation)

Terse go-ahead ("implement it") without addressing the open questions
individually, so these are judgment calls made before starting, following
this repo's established pattern of documenting such calls rather than
leaving them implicit:

- **Raw-JSON fallback: removed, not kept.** Once a content type has a
  field spec, its form is the only editing UI for that type. A parallel
  "Edit as JSON" escape hatch would mean maintaining two editing surfaces
  indefinitely for marginal power-user value; the zod schema is still
  there if it's ever wanted later.
- **Data model: flat array + zone-aware `onMove` fix is sufficient.**
  Not doing the deeper nesting-under-layout restructuring — it would
  touch `app-context.tsx`'s whole shape and need a `localStorage`
  migration path for a problem the zone-aware fix already solves.
- **Drag-to-reorder within a zone: out of scope for this pass.**
  Button-only Move Up/Down stays once it's zone-aware (Phase 6).
- **SINGLE → DOUBLE conversion: out of scope**, as already stated in
  Design → Layout management. Confirmed here rather than left as an
  open question.
- **Phasing: one continuous implementation effort**, matching how this
  session has executed every other spec (ribbon-layout, multi-page-
  indicator, etc.) — each phase still lands as its own reviewable commit/
  PR, just without a separate spec file per phase.

**Phase 1 scope note**: Header's and Paragraph's schemas are both a
single unconstrained `z.string()` field — any string, including empty,
satisfies them. That means per-field inline validation errors (Design →
"Validation UX") aren't actually reachable through Phase 1's two target
types (there's no way to enter an invalid value in a plain text/textarea
field bound to `z.string()`). Building the full zod-issue-to-field-error
mapping now would add untestable code paths. Deferred to whichever later
phase first introduces a real per-field constraint (Contact's `email`
looks like the first candidate) — Phase 1 keeps the existing single
`errorMessage` string/banner, just validating a structured object
directly instead of parsing JSON text first.

## Findings from implementation (Phase 1)

One real regression a live-browser check caught, not just unit tests:

- **A React `onKeyDown` prop's `stopPropagation()` did not stop
  `BaseMacro` from deleting a focused block while typing Backspace into
  its new form field.** `BaseMacro` guards against exactly this hazard,
  but via a *native* `document.addEventListener('keydown', ...)`
  (`base-macro.tsx`) — a peer of wherever React's own synthetic dispatch
  is attached, not a descendant of it. `stopPropagation()` only stops an
  event from reaching *further* nodes along the bubble chain; it does
  nothing to other listeners already registered on the same node
  (`document`), which is exactly where `BaseMacro`'s listener lives.
  `content-form.tsx`'s initial implementation used a synthetic
  `onKeyDown={(e) => e.stopPropagation()}` per field and looked correct
  in component tests (which dispatch directly on the field, never
  reaching `document` at all) — but a real Playwright E2E test (typing
  Backspace into a placed Header block's field) caught the block getting
  deleted instead of just the last character. Fixed by matching what the
  old raw-JSON textarea already did in `base-editor.tsx`: a real
  `element.addEventListener('keydown', ...)` attached directly to the
  field itself (via a React 19 ref-callback-with-cleanup), which fires —
  and can stop propagation — before the event ever reaches `document`,
  regardless of how many peer listeners are sitting there. Confirmed
  fixed via a live debug script (`document.addEventListener` order
  traced directly) and covered by
  `end-to-end/tests/editor-forms.spec.ts`'s "backspace inside a form
  field edits the text, not the macro" test, which a component-level
  test alone could not have caught.

## Findings from implementation (Phases 6–7)

- **Anything that resizes or unmounts at dragstart hangs Chromium's
  intercepted-drag loop mid-gesture.** The gap inserters' first
  implementation grew each gap (h-7 → h-9 + margins) and unmounted its
  buttons the moment a layout drag began; every Playwright drag gesture
  (both `dragTo()` and the low-level mouse API) then hung on the first
  post-mousedown move, while the identical gesture against a
  geometry-stable target worked fine. The fix is a rule worth keeping:
  a drop target's drag-in-progress state must be **style-only** — same
  geometry, same children, colors/pointer-events only
  (`layout-gap-inserter.tsx`).
- **Blank blocks surfaced a real axe violation: empty heading
  elements.** A freshly added Section heading (or Contact) block
  rendered `<h2></h2>`/`<h1></h1>` until typed into — flagged as
  `empty-heading` by a real-browser scan. Header/Contact macros now
  render an italic gray placeholder paragraph instead of an empty
  heading while blank; canvas-only, since the PDF renders from content
  through its own component tree.
- **The keyboard Tab order got *shorter and more useful* as a side
  effect of the retirement.** With the ribbon gone, Tab goes File/Edit/
  View straight into the canvas: the first gap's insert buttons (which
  reveal on focus, keeping the no-hover path), then each layout's
  header controls, then its blocks. keyboard.spec.ts asserts the new
  sequence.
- **`localStorage` back-compat cost nothing.** Old saves carry an
  `isEditorVisible` key for the retired ribbon toggle; `JSON.parse`
  simply ignores it — no migration, no version gate.

## Findings from implementation (Phases 3–5)

- **A native stopPropagation keydown listener on a field silently
  disables React's own `onKeyDown` on that same field.** The Phase 1
  fix (a real `addEventListener('keydown')` on the field, stopping
  propagation before BaseMacro's document-level delete listener sees
  it) also stops the event from ever reaching React's root-delegated
  dispatch — so TagsField's first implementation, which paired that
  listener with a React `onKeyDown` for Enter/comma chip commits, never
  received a single commit keystroke. The two behaviors have to live in
  the *same* native listener; TagsField routes it through a ref
  (`keydownRef`) so the mounted-once listener always reads the current
  pending text instead of its mount-time closure.
- **`record-of-lists` renames can silently destroy a group.** The
  record is a plain object, so rebuilding it with `Object.fromEntries`
  after renaming a group to a name another group already has would
  merge the two and drop one group's entries without a trace. Rather
  than allowing that, a colliding rename is *blocked* with an inline
  "already a group name" error under the group's name input, and
  nothing is committed until the name is unique. (Covered by a
  dedicated E2E test asserting both groups' entries survive the
  attempt.)
- **The keyboard-trap E2E heuristic false-positived on the Contact
  form.** `keyboard.spec.ts` detected a "trap" whenever two consecutive
  Tab stops looked identical by tag/text/aria-label — and a focused
  contact block is 8 consecutive `<input>`s with no text content and no
  aria-label (each is labelled by a separate `<label>` element). The
  focus fingerprint now includes the element's `id`, which distinguishes
  real stuck-focus from adjacent same-looking fields.
- **Playwright's `hasText` filters are substring- and case-insensitive.**
  An E2E locator targeting a block renamed to "Powers" matched the
  example *paragraph* block instead ("...powers of the Gum-Gum
  Fruit..."). Worth remembering when filtering macros by visible text:
  pick words that don't appear in the example content.

## Findings from implementation (Phase 2)

- **Chromium already has some native auto-scroll during an HTML5 drag.**
  Confirmed live by temporarily removing `DragAutoScroll` entirely and
  dragging near the bottom edge anyway: the page still scrolled, driven
  entirely by the browser, with no JS involved. It ramps up slowly from
  a near-standstill, though — consistent with the "kind of difficult"
  complaint that prompted this phase, since a real user wouldn't reliably
  hold a drag steady long enough for a slow ramp to become useful.
  `drag-auto-scroll.tsx` supplements this with a faster, tunable ramp
  rather than replacing it; the two run side by side without conflict
  (confirmed live: scrolling reached exactly `scrollHeight - innerHeight`
  in both directions and stayed there, no jitter or overshoot).
- **Playwright's simulated mouse-driven drag doesn't reliably deliver
  `dragover` events with an updated `clientY` to a `document`-level
  listener, even though Chromium's own native auto-scroll clearly sees
  the real cursor position.** A debug script logging every `dragover`
  this component received showed `clientY` frozen at the drag's starting
  position for the entire gesture, while the page kept scrolling anyway
  (via the native behavior above) — a CDP/automation quirk in how
  simulated input translates to JS-visible drag events during an active
  native drag session, not a bug in this component (real user-driven
  drags do not have this problem; a real mouse move always produces a
  fresh `dragover`). This made one E2E assertion flaky: an initial
  "stops instantly on release" test sometimes saw scrollY keep climbing
  briefly after `mouse.up()`, which is the *native* scroll's own momentum
  settling, not this component's loop still running (its `dragend`/`drop`
  listeners fire and `cancelAnimationFrame` correctly, confirmed via
  direct instrumentation). Rewrote that assertion to wait for scrollY to
  stabilize rather than expecting an instantaneous freeze
  (`end-to-end/tests/drag-autoscroll.spec.ts`).
