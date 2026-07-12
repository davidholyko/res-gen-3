# res-gen-3

Monorepo (pnpm workspaces + Turborepo): `_frontend` (Next.js) and `_backend` (NestJS). Node 24.18.0, see `.nvmrc`.

## Spec-driven workflow

This repo is built spec-first. See `specs/README.md` for the full convention. In short:

- Before implementing a non-trivial feature or change, check `specs/` for a matching spec.
- If none exists, write one from `specs/_template.md`, save it with `status: draft`, and stop — get it reviewed/approved before writing code. Don't start implementation against a draft.
- Trivial changes (typo fixes, dependency bumps, config tweaks, one-line bug fixes) don't need a spec.
- Once a spec is `approved`, implement against it. Flip its status to `in-progress` when you start and `implemented` when the work is verified working — don't leave it stuck on `approved`.
- If implementation reveals the spec was wrong or incomplete, update the spec to match reality rather than silently diverging from it.

## Commands (from repo root)

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm test` — run across both apps via Turborepo
- `pnpm --filter @res-gen-3/frontend <script>` / `pnpm --filter @res-gen-3/backend <script>` — target one app
