# Odyssey Restaurant Ops — Architecture

## 1. Guiding principle

One rule drives every decision below: **the database schema is the only place a shape is defined by hand.** Everything else — Zod validators, the OpenAPI spec, frontend types, frontend fetch hooks — is derived. If you ever find yourself writing an `interface Order { ... }` on the frontend, that's the signal something's wired wrong.

```
Drizzle schema → drizzle-zod → Hono + OpenAPI → Orval → React Query hooks
```

This also gives a natural review checklist: "contract discipline" == can you trace any field on screen back to a single `column()` call in `services/backend/src/db/schema.ts`.

## 2. Repo layout

```
apps/dashboard/                 Expo + React Native + Web
  app/                          file-based routes (expo-router)
    (dashboard)/
      home.tsx
      orders/
        index.tsx               list + filters
        [id].tsx                detail
      menu.tsx
      crm/
        index.tsx
        [customerId].tsx
      settings.tsx
      ui-library.tsx            design system showcase route
  src/
    components/
      primitives/                Button, Input, Select, Toggle, Modal, Card, Badge, Toast, Skeleton, Table, Sidebar, StatePanel
      composed/                  OrderStatusBadge, KpiCard
    features/
      orders/hooks/              useOrderActions — wraps generated status-update mutation
      menu/hooks/                useMenuActions — wraps generated item/category mutations
    theme/                       token definitions
    lib/                         query client, price-input sanitizer
  tests/

services/backend/                Hono on Cloudflare Workers
  src/
    db/
      schema.ts                  Drizzle schema — the source of truth
      client.ts
      seed.ts
    modules/
      menu/ orders/ customers/ settings/    each: schemas.ts, routes.ts, service.ts
    app.ts                        composes modules into the Hono app
    index.ts                      Worker entry
  drizzle/                        migrations
  tests/                          integration tests against a real Postgres test DB

packages/
  shared/                         cross-cutting UI-agnostic utilities (money formatting, order-status transition map)
  types/                          hand-authored types ONLY for things with no DB shape
  api-client/                     Orval output lands here: generated fetch client + React Query hooks
```

## 3. Data model (Drizzle schema)

| Table | Key columns | Notes |
|---|---|---|
| `menu_categories` | id, name, sort_order | created via `POST /menu/categories`, in addition to being seeded |
| `menu_items` | id, category_id, name, description, price_cents, is_available, image_url | price stored as integer cents — never floats |
| `customers` | id, name, email, phone, created_at | |
| `orders` | id, customer_id (nullable — walk-in), status, subtotal_cents, tax_cents, total_cents, created_at, updated_at | totals are **computed server-side on creation**, never trusted from client |
| `order_items` | id, order_id, menu_item_id, name_snapshot, unit_price_cents_snapshot, quantity | snapshot fields so historical orders don't change if a menu item's price changes later |
| `order_status_events` | id, order_id, from_status, to_status, created_at | audit trail for every status change |
| `settings` | id (singleton row), prep_time_minutes, auto_accept, is_accepting_orders, opening_hours (jsonb, typed via `.$type<OpeningHours>()`) | |

**Gotcha worth knowing**: Drizzle's relational query API (`db.query.orders.findMany({ with: {...} })`) requires the relation to be declared on *both* sides via `relations()` — declaring `orders.statusEvents` without also declaring `orderStatusEvents.order` (the back-reference) produces a runtime "not enough information to infer relation" error, not a compile-time one. Every table with a foreign key needs its own `relations()` export.

**Another gotcha**: `jsonb` columns are typed as `unknown` by Drizzle unless you attach `.$type<T>()` to the column definition. Without it, the raw DB row won't structurally match a more specific Zod/OpenAPI response schema, and `tsc` will only catch this once something actually tries to return that row from a route handler.

### Order status state machine

```
pending → accepted → preparing → ready → completed
   ↓          ↓
cancelled  cancelled
```

Enforced in `orders/service.ts` via a transition map (`Record<Status, Status[]>`), imported from `packages/shared` so the frontend reads the *same* authority to decide which status actions to show — it doesn't reimplement the rule, and the backend re-validates on every request regardless of what the UI offers. Every write also inserts an `order_status_events` row.

## 4. Backend (Hono on Cloudflare Workers)

- **Module-per-resource** structure (menu / orders / customers / settings).
- **Postgres driver**: `node-postgres` (`pg`), not a Workers-native HTTP driver. This needs `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml` (and a recent `compatibility_date`) to resolve Node built-ins (`net`, `tls`, `dns`, `crypto`, etc.) inside the Workers runtime. A from-scratch Cloudflare deploy would need a [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) binding in front of Postgres (works with `pg` unchanged), or swapping to a Workers-native HTTP driver against a hosted Postgres.
- **Validation**: every route uses the drizzle-zod-derived schema as its `zValidator` input.
- **Business rules enforced server-side, always**: unavailable menu items rejected at order-creation time; totals computed server-side from current menu prices; status transitions go through the state machine.
- **OpenAPI generation**: `@hono/zod-openapi` produces the spec directly from the same Zod schemas used for validation.

## 5. Frontend (Expo + React Native + Web)

- **Data layer**: only Orval-generated hooks touch the network, wrapped by feature-level hooks (`useOrderActions`, `useMenuActions`) that add cache invalidation and toast feedback.
- **Orval response shape gotcha**: the generated fetch client wraps every response as `{ data, status, headers }` — the actual API body is one level deeper than it looks (`response.data`, not `response`). For endpoints with multiple possible response shapes (e.g. `GetApiOrdersId200 | GetApiOrdersId404`), narrow on `response.status === 200` before accessing fields — `tsc` will catch it if you don't, but only once you actually run `pnpm typecheck`.
- **Component layering**: `components/primitives` (pure, no data/business logic) → `components/composed` (primitives assembled into domain-shaped pieces) → `features/*` (pages + their hooks). Pages stay thin.
- **Custom primitives over native ones, deliberately, twice**:
  - `Toggle` replaces React Native's `<Switch>` — on web, `<Switch>` renders as a browser-styled checkbox that can ignore the `trackColor` prop and fall back to the OS/browser's default accent color (often green), which is a real theming leak. A fully custom-styled toggle keeps every color under our own tokens.
  - `Select`'s dropdown renders through a `Modal` portal rather than CSS `position: absolute` + `z-index`. The original CSS approach fought a losing battle against Card's `elevation` styling, which React Native Web silently translates into its own `z-index`, creating a competing stacking context. Portaling through `Modal` (the same mechanism the Drawer/Modal primitive already uses) sidesteps the whole class of stacking-context bugs rather than trying to out-rank them.
- **Design tokens**: adapted from Odyssey's own product (`pro.ody.app`) — violet primary accent, pill-shaped interactive elements, bold headline type, light-lavender surfaces — rather than generic defaults, live-rendered at `/ui-library`.

## 6. Build tooling notes

- **pnpm linking mode**: the repo uses `node-linker=hoisted` in `.npmrc`, not pnpm's default symlinked `.pnpm` store. Expo Router's `"main": "expo-router/entry"` package.json convention computes an incorrect relative path in a symlinked pnpm monorepo (it assumes `expo-router` sits directly under the app's own `node_modules`). Hoisted linking avoids that entirely. The app also uses an explicit `index.js` (`import "expo-router/entry"`) instead of relying on the magic `"main"` string directly, for the same reason.
- **Metro config** (`apps/dashboard/metro.config.js`) explicitly adds the workspace root's `node_modules` to `nodeModulesPaths` so Metro can resolve workspace packages (`shared`, `api-client`) alongside the app's own dependencies.

## 7. Testing

Landed as **real integration tests against a live Postgres test database**, not mocked unit tests — this ended up being more valuable than originally scoped, since it exercises actual Drizzle queries, foreign keys, and relations rather than assumptions about them.

- **Backend** (`services/backend/tests/`): 19 tests across orders (state machine transitions, availability enforcement, server-side total calculation), menu (category/item creation, availability toggling), customers (aggregate stats, zero-order edge case), and settings (singleton-row behavior).
- **Test isolation gotcha**: all backend test files share one physical test database, and each file's `beforeEach` does a `TRUNCATE ... CASCADE`. Vitest's default file-level parallelism caused cross-file race conditions (one file's reset wiping rows another file was mid-assertion on) — fixed via `fileParallelism: false` in `services/backend/vitest.config.ts`. A per-test-transaction-with-rollback strategy would allow safe parallelism if suite runtime becomes a bottleneck.
- **Frontend** (`apps/dashboard/tests/`): unit tests on extracted pure logic — the price-input sanitizer (handles partial decimal input like `"6."` without the field fighting the user mid-keystroke) and the shared order-status transition map.
- **Typecheck/lint**: `services/backend`, `packages/shared`, `packages/types`, and `packages/api-client` each needed their own `tsconfig.json` (only `apps/dashboard` had one initially) — without it, `tsc --noEmit` silently found nothing to check rather than erroring. ESLint needed an actual install + root flat config (`eslint.config.mjs`); neither existed until added.

## 8. Scripts

```jsonc
"scripts": {
  "dev:dashboard": "turbo run dev --filter=dashboard",
  "dev:backend": "turbo run dev --filter=backend",
  "gen:contract": "turbo run gen:contract --filter=backend && turbo run gen:client --filter=api-client",
  "lint": "turbo run lint",
  "typecheck": "turbo run typecheck",
  "test": "turbo run test",
  "seed": "turbo run seed --filter=backend"
}
```

## 9. Known tradeoffs / incomplete areas

- **Auth**: not in scope — skipped as an explicit tradeoff rather than an oversight.
- **Tax rate**: hardcoded in `orders/service.ts` rather than pulled from `settings` — fine for a demo, would move to the settings table for anything real.
- **Order pagination**: the backend supports `page`/`pageSize` query params; the Orders page doesn't yet expose pagination controls in the UI.
- **Generated client**: `packages/api-client/src/generated` is gitignored rather than committed — a fresh clone needs the full local Postgres + backend + `gen:contract` flow before the real hooks exist. Committing it would speed up first-run review at the cost of drift risk if someone forgets to regenerate after a schema change.
- **Native readiness**: primitives are plain React Native components so native rendering is plausible, but only web has actually been exercised end to end.