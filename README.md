# Odyssey Restaurant Ops

A restaurant operations dashboard: menu management, order taking/tracking, a lightweight CRM, and business settings — built on the stack outlined in the assignment.

## Stack

pnpm workspace + Turborepo · Expo (React Native + Web) · Hono on Cloudflare Workers · PostgreSQL + Drizzle ORM · drizzle-zod · OpenAPI (`@hono/zod-openapi`) · Orval-generated client/hooks · React Query.

## Status of this scaffold

This is a working starting point, not a finished submission — treat it as the skeleton to build on top of, review, and extend.

**Fully built and real:**
- Full Drizzle schema (menu, customers, orders, order items, `order_status_events` audit trail, settings)
- The orders module end to end: drizzle-zod schemas, Hono OpenAPI routes, service layer with the status state machine, server-side total calculation, availability enforcement, and integration tests
- Menu, customers, and settings modules (schemas + service + routes)
- The full design system (tokens + 10 primitives) and all 5 dashboard pages + the UI library route, built as real interactive React Native/Expo components

**Intentionally stubbed — this is the next thing to do:**
- The dashboard pages currently import from `src/lib/mockData.ts` instead of the generated Orval hooks, because generating the client requires a running Postgres instance and a live backend, which this environment doesn't have. Every mock function mirrors the exact shape the real generated hook will return. Once you run the steps below, swapping a page over is: change the import, delete the mock's fake-delay wrapper, done — the component bodies don't need to change.
- No auth. Not in the assignment's requirements; noted here as a deliberate scope cut rather than an oversight.
- No CI wiring for regenerating the contract on schema change — see the tradeoff note in the architecture doc.

## Local setup

### 1. Install

```bash
pnpm install
```

### 2. Database

Spin up local Postgres (docker is the easiest path):

```bash
docker run --name odyssey-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=odyssey -p 5432:5432 -d postgres:16
```

Copy `.env.example` to `services/backend/.dev.vars` (wrangler's local env file) and fill in `DATABASE_URL`.

### 3. Run migrations and seed data

```bash
cd services/backend
pnpm db:generate   # generates SQL migration files from schema.ts
pnpm db:migrate     # applies them
pnpm seed           # inserts menu items, customers, and a few orders in different statuses
```

### 4. Generate the contract (schema → OpenAPI → typed client)

```bash
pnpm dev:backend        # in one terminal — starts the Worker locally
pnpm gen:contract       # in another — dumps openapi.json, then runs Orval
```

This populates `packages/api-client/src/generated`. Until this step has run, the dashboard runs against `src/lib/mockData.ts` instead.

### 5. Run the dashboard

```bash
pnpm dev:dashboard
```

Opens on web via `expo start --web`.

### 6. Tests / lint / typecheck

```bash
pnpm test
pnpm lint
pnpm typecheck
```

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design rationale — repo layout, data model, the order state machine, frontend layering, and scope-cutting decisions.

## Known tradeoffs / incomplete areas

- **Generated client committed vs. not**: currently gitignored (`packages/api-client/src/generated`), so a fresh clone needs the full local Postgres + backend + `gen:contract` flow before the real hooks exist. Committing it would make first-run faster at the cost of drift risk — worth reconsidering depending on how the repo will be reviewed.
- **Tax rate** is hardcoded in `orders/service.ts` rather than pulled from `settings` — fine for a demo, would move to the settings table for anything real.
- **Order search/pagination on the frontend** isn't wired to the query params the backend already supports (`page`, `pageSize`) — the list page currently renders everything returned.
- **Native readiness**: the primitives are plain React Native components so native rendering is plausible, but only web has actually been exercised.
