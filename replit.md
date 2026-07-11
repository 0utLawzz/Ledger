# LexLedger

Full-stack law firm case management ledger with Neo-Brutalism UI, PKR currency, per-client stage rates, and print reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/law-ledger run dev` — run the frontend (port 24412)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + TailwindCSS v4, wouter routing, TanStack Query

## Where things live

- `lib/db/src/schema/` — DB schema (clients, cases, clientStageRates)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — generated React Query hooks (from Orval)
- `lib/api-zod/src/generated/` — generated Zod schemas (from Orval)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/law-ledger/src/pages/` — React pages
- `artifacts/law-ledger/src/index.css` — Neo-Brutalism theme variables and component classes

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas. Always update the spec before implementing routes.
- Stage rates are per-client (not global): stored in `client_stage_rates` table, editable from ClientDetail page via the RATES button.
- PKR currency throughout: `formatCurrency()` in `lib/format.ts` uses `en-PK` locale with `PKR ` prefix.
- NB theme uses CSS classes (`nb-card`, `nb-table`, `nb-btn-primary`, `nb-badge`) defined in `index.css`; no Tailwind utility sprawl for core NB styles.
- Routes share a common prefix via the monorepo proxy (`/api`). Services handle their full base path.

## Product

- **Dashboard**: firm-wide stats (clients, cases, PKR totals, cases by stage, recent cases)
- **Clients**: searchable client directory with add/delete
- **Client Detail**: branded ledger header (dark banner with client name + balance), contact info editor, stage rates editor (per-stage PKR fees), full case table with totals
- **Case Ledger**: full case table with inline editing, stage/client filters
- **Reports**: firm summary + per-client printable case report

## User preferences

- Neo-Brutalism theme: `#F0E8D0` cream bg, `#0C0C0C` black, `#C94A00` burnt orange accent, hard box shadows, Space Grotesk / Bebas Neue / DM Mono fonts
- PKR currency (Pakistani Rupee), no decimal places for round amounts
- Responsive layout with hamburger menu on mobile

## Gotchas

- After editing OpenAPI spec: always run `pnpm --filter @workspace/api-spec run codegen` before implementing routes.
- After schema changes: run `pnpm --filter @workspace/db run push` (dev only).
- `STAGE_COLORS` in `format.ts` returns a plain string of Tailwind classes; use directly in `className`.
- Do NOT run `pnpm dev` at workspace root — restart individual workflows instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
