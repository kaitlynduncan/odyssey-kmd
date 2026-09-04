# Odyssey Restaurant Ops

A restaurant operations dashboard: menu management, order taking/tracking, a lightweight CRM, and business settings.

## Stack

pnpm workspace + Turborepo · Expo (React Native + Web) · Hono on Cloudflare Workers · PostgreSQL + Drizzle ORM · drizzle-zod · OpenAPI (`@hono/zod-openapi`) · Orval-generated client/hooks · React Query.

## Status

All 5 dashboard pages (Home, Orders, Menu, CRM, Settings) are fully wired to the real backend — no mock data. The full contract pipeline is live end to end:

```
Drizzle schema → drizzle-zod → Hono/OpenAPI → Orval → React Query hooks → UI
```

Implemented flows:
- **Orders**: list with server-side status filtering, detail view, status transitions enforced by a backend state machine (with a full audit trail via `order_status_events`), server-computed totals, availability enforcement at order-creation time.
- **Menu**: categories and items, create/edit via a drawer, inline "create new category" flow, availability toggle.
- **CRM**: customer list with server-computed order count/spend aggregates, customer detail with order history, clickable through to order detail.
- **Settings**: prep time, auto-accept, and accepting-orders toggles, backed by a singleton settings row.
- **Home**: live KPIs (total orders, revenue, pending orders, most popular item) computed from real order data, clickable recent-orders list.

Design system: a full token set (color, spacing, radius, elevation, typography) plus 11 reusable primitives (Button, Input, Select, Toggle, Modal/Drawer, Card, Badge, Skeleton, Toast, Table, Sidebar, StatePanel), all showcased live at the `/ui-library` route. Visual identity is intentionally adapted from Odyssey's own product (violet primary accent, pill-shaped interactive elements, bold headline type) rather than generic defaults.

Testing: 19 backend integration tests (state machine transitions, availability enforcement, server-side total calculation, customer aggregates, settings singleton behavior) run against a real Postgres test database, plus frontend unit tests for shared logic. All passing — see [Testing](#testing) below to run them.

## Local setup

### 1. Install

```bash
pnpm install
```

If you're on pnpm's default (symlinked) linker and hit Metro/Expo module-resolution errors on web, switch to hoisted linking — add to `.npmrc` at the repo root:
```
node-linker=hoisted
```
then `rm -rf node_modules apps/dashboard/node_modules services/backend/node_modules packages/*/node_modules pnpm-lock.yaml && pnpm install`. See [Tradeoffs](#known-tradeoffs--things-worth-knowing) below for why.

### 2. Database

Local Postgres via Docker is the easiest path:

```bash
docker run --name odyssey-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=odyssey -p 5432:5432 -d postgres:16
```

Create `services/backend/.env` and `services/backend/.dev.vars` (both are gitignored), each containing:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/odyssey
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/odyssey_test
```
(`.env` is read by Node-run scripts like `db:migrate`/`seed`/tests; `.dev.vars` is read by `wrangler dev`. They need the same values.)

### 3. Run migrations and seed data

```bash
cd services/backend
pnpm db:generate   # generates SQL migration files from schema.ts
pnpm db:migrate     # applies them
pnpm seed           # inserts menu items, customers, and a few orders in different statuses
```

### 4. Generate the contract (schema → OpenAPI → typed client)

```bash
pnpm dev:backend        # from repo root, in one terminal — starts the Worker locally on :8787
pnpm gen:contract       # from repo root, in another terminal — dumps openapi.json, then runs Orval
```

Re-run `pnpm gen:contract` any time the backend's routes or schemas change — the generated client in `packages/api-client/src/generated` is gitignored and derived, not hand-maintained.

### 5. Run the dashboard

```bash
pnpm dev:dashboard
```

Opens on web via `expo start --web`, default `http://localhost:8081`.

### 6. Tests / lint / typecheck

Backend tests need their own test database:
```bash
docker exec -it odyssey-db psql -U postgres -c "CREATE DATABASE odyssey_test;"
DATABASE_URL=postgres://postgres:postgres@localhost:5432/odyssey_test pnpm --filter backend db:migrate
```

Then, from the repo root:
```bash
pnpm test
pnpm lint
pnpm typecheck
```

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design rationale — repo layout, data model, the order state machine, frontend layering, and scope-cutting decisions made up front.

## Known tradeoffs & things worth knowing

A few decisions and rough edges worth being upfront about, since they came up while actually getting this running rather than being purely theoretical:

- **Postgres driver**: `services/backend/src/db/client.ts` uses `node-postgres` (`pg`), which needs a real TCP connection. That's fine for local dev via `wrangler dev`'s Node-compatibility mode (enabled via `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml`), but a from-scratch Cloudflare Worker deploy would need either a [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) binding in front of Postgres (works with `pg` unchanged) or swapping to a Workers-native HTTP driver against a hosted Postgres like Neon.
- **pnpm linking mode**: the repo uses `node-linker=hoisted` rather than pnpm's default symlinked store. Expo Router's entry-point resolution (`"main": "expo-router/entry"` in `package.json`) doesn't correctly resolve through pnpm's nested `.pnpm` symlink structure in this monorepo layout — it computes an incorrect relative path assuming the package sits directly under the app's own `node_modules`. Hoisted linking sidesteps this. The app also uses an explicit `index.js` entry file (`import "expo-router/entry"`) instead of relying on the `"main": "expo-router/entry"` magic string directly, for the same reason.
- **Integration test isolation**: backend tests share one physical Postgres test database and each file's `beforeEach` does a `TRUNCATE ... CASCADE`. Vitest's default file-level parallelism caused cross-file race conditions (one file's reset wiping rows another file was mid-assertion on), so `fileParallelism: false` is set in `services/backend/vitest.config.ts`. A per-test-transaction-with-rollback strategy would allow safe parallelism if test suite runtime becomes a bottleneck.
- **Tax rate** is hardcoded in `orders/service.ts` rather than pulled from `settings` — fine for a demo, would move to the settings table for anything real.
- **Order list pagination**: the backend supports `page`/`pageSize` query params, but the Orders page currently renders whatever the default page returns rather than exposing pagination controls in the UI.
- **No auth** — not in the assignment's requirements; a deliberate scope cut rather than an oversight.
- **Native readiness**: primitives are plain React Native components so native rendering is plausible, but only web has actually been exercised end to end.