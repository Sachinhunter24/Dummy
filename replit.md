# Nexa ERP

Nexa ERP is a local-first business workspace for Indian small-business owners to manage sales, stock, expenses, customer credit, staff, and reports from one place.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/nexa-erp run dev` — run the Nexa ERP web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nexa-erp/src/App.tsx` — app shell, local session, navigation, and ERP modules
- `artifacts/nexa-erp/src/index.css` — Nexa ERP visual tokens and responsive styles
- `artifacts/nexa-erp/src/legacy/` — reference data and domain types extracted from the uploaded project
- `attached_assets/Dummy-main_1786554111150.zip` — original uploaded source archive

## Architecture decisions

- The first version is client-only and local-first so the uploaded demo runs without missing Supabase or Retool runtime dependencies.
- Session, theme, catalogue, customer, staff, pipeline, expense, and credit changes persist in browser local storage.
- The original Retool-specific entrypoint was replaced with a self-contained Vite entrypoint; the ERP workflows remain available in the browser.

## Product

- Demo sign-in with the visible `owner` / `owner123` account
- Overview dashboard with revenue, inventory, credit, alerts, and cash-flow signals
- POS billing with cart, payment mode, checkout, and stock decrement
- Inventory, expenses, customers, Udhaar, sales pipeline, staff, reports, and industry views
- Responsive navigation and light/dark theme toggle

## User preferences

- The user asked to read, fix, and run the uploaded project.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
