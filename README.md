# ResGen 3.0

Agentic rebuild of [ResGen 2.0](https://res-gen-2.netlify.app/#/) as a pnpm/Turborepo monorepo with a real backend service.

## Layout

- `_frontend` — Next.js (App Router, TypeScript, Tailwind CSS)
- `_backend` — NestJS (TypeScript)

## Requirements

- Node `24.18.0` (see `.nvmrc`)
- pnpm, activated via Corepack (see `packageManager` in `package.json`)

## Local Development

```
nvm use
corepack enable
pnpm install
pnpm dev
```

Individual apps can also be run directly, e.g. `pnpm --filter @res-gen-3/frontend dev`.

## Scripts (run from repo root via Turborepo)

- `pnpm dev` — run both apps in dev mode
- `pnpm build` — build both apps
- `pnpm lint` — lint both apps
- `pnpm test` — test both apps
