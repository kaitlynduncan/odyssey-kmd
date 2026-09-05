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
- **Orders**: list with server-side status filtering, detail view, status transitions enforced by a backend state machine (with a full audit trail via `order_status_events`), server-computed totals, availability enforcement at order-creation time, and a **"New order" drawer** — pick a customer (or leave as walk-in), add menu items with quantities, submit to the real backend.
- **Menu**: categories and items, create/edit via a drawer, inline "create new category" flow, availability toggle.
- **CRM**: customer list with server-computed order count/spend aggregates, customer detail with order history, clickable through to order detail.
- **Settings**: prep time, auto-accept, and accepting-orders toggles, backed by a singleton settings row. (Opening hours is modeled and persistable on the backend but has no UI control yet — see `ARCHITECTURE.md` §9.)
- **Home**: live KPIs (total orders, revenue, pending orders, most popular item) computed from real order data, clickable recent-orders list.

Design system: a full token set (color, spacing, radius, elevation, typography) plus 11 reusable primitives (Button, Input, Select, Toggle, Modal/Drawer, Card, Badge, Skeleton, Toast, Table, Sidebar, StatePanel), all showcased live at the `/ui-library` route. Visual identity is intentionally adapted from Odyssey's own product (violet primary accent, pill-shaped interactive elements, bold headline type) rather than generic defaults.

Testing & DX: 30+ backend tests (fast Zod schema-validation tests plus real integration tests against a live Postgres test database — state machine transitions, availability enforcement, server-side total calculation, price/name snapshotting, customer aggregates, settings singleton behavior) and frontend unit tests on extracted pure logic (price-input sanitizing, order-status transitions, order-cart operations). `pnpm test`, `pnpm lint`, and `pnpm typecheck` all pass clean across every workspace package.

## Local setup

### 1. Install

```bash
pnpm install
```

The repo uses `node-linker=hoisted` in `.npmrc` (not pnpm's default symlinked store) — this is required for Expo/Metro to resolve workspace packages correctly in this monorepo layout. It's already configured, so a plain `pnpm install` picks it up.

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

If the Docker container isn't running, the backend will fail with `proxy request failed, cannot connect to the specified address` — check with `docker ps` and `docker start odyssey-db` if it's stopped.

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

### Creating extra test data via the API

Beyond the seed script and the dashboard's own "New order" flow, you can hit the running backend directly to build out scenarios (e.g. a customer with a long order history, for testing CRM aggregates):

```bash
# List menu items to get real IDs
curl -s http://localhost:8787/api/menu | python3 -m json.tool

# Create a customer
curl -s -X POST http://localhost:8787/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Jordan Reyes", "email": "jordan@example.com"}' \
  | python3 -m json.tool

# Create an order for them (repeat with different item IDs/quantities)
curl -s -X POST http://localhost:8787/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId": "PASTE_CUSTOMER_ID", "items": [{"menuItemId": "PASTE_ITEM_ID", "quantity": 1}]}' \
  | python3 -m json.tool
```

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design rationale — repo layout, data model, the order state machine, frontend layering, build-tooling gotchas, and testing approach, including the real issues hit and fixed while building this out.

## Known tradeoffs & things worth knowing

- **Opening hours has no frontend control yet** — modeled and persistable on the backend, not yet editable from the Settings page. The most concrete remaining gap against the assignment spec.
- **Postgres driver**: `services/backend/src/db/client.ts` uses `node-postgres` (`pg`), which needs a real TCP connection. That's fine for local dev via `wrangler dev`'s Node-compatibility mode (enabled via `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml`), but a from-scratch Cloudflare Worker deploy would need either a [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) binding in front of Postgres (works with `pg` unchanged) or swapping to a Workers-native HTTP driver against a hosted Postgres like Neon.
- **pnpm linking mode**: `node-linker=hoisted` is required because Expo Router's entry-point resolution doesn't correctly resolve through pnpm's default nested `.pnpm` symlink structure in this monorepo layout. See `ARCHITECTURE.md` §6 for the full detail.
- **Integration test isolation**: backend tests share one physical Postgres test database with `TRUNCATE`-based resets between tests, so test files must run sequentially (`fileParallelism: false` in `vitest.config.ts`) rather than in parallel. See `ARCHITECTURE.md` §7.
- **Tax rate** is hardcoded in `orders/service.ts` rather than pulled from `settings` — fine for a demo, would move to the settings table for anything real.
- **Order list pagination**: the backend supports `page`/`pageSize` query params, but the Orders page currently renders whatever the default page returns rather than exposing pagination controls in the UI.
- **No auth** — not in the assignment's requirements; a deliberate scope cut rather than an oversight.
- **Native readiness**: the primitives are plain React Native components so native rendering is plausible, but only web has actually been exercised.