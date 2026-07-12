# Specs

This repo is built spec-first: non-trivial work gets a written spec here *before* implementation. The spec is the source of truth for intent — code is judged against it, not the other way around.

## Lifecycle

Each spec has a `status` in its frontmatter:

- `draft` — written, not yet reviewed. Do not implement against a draft spec.
- `approved` — reviewed and signed off. Safe to implement.
- `in-progress` — implementation underway.
- `implemented` — done. Code matches the spec; keep it around as a record of intent.

## Naming

`specs/<kebab-case-feature-name>.md`, one feature per file. Cross-cutting specs that touch both `_frontend` and `_backend` still live in one file — split into per-app sections rather than per-app files.

## Writing a spec

Copy `_template.md` to a new file and fill it in. Keep it concrete: acceptance criteria should be things you can actually check, not vibes.
