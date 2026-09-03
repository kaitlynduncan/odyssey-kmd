# Odyssey Restaurant Ops — Architecture

## 1. Guiding principle

One rule drives every decision below: **the database schema is the only place a shape is defined by hand.** Everything else — Zod validators, the OpenAPI spec, frontend types, frontend fetch hooks — is derived. If you ever find yourself writing an `interface Order { ... }` on the frontend, that's the signal something's wired wrong.

```
Drizzle schema → drizzle-zod → Hono + OpenAPI → Orval → React Query hooks
```

This also gives a natural review checklist for the assignment's grading criteria: "contract discipline" == can you trace any field on screen back to a single `column()` call in `services/backend/src/db/schema.ts`.

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
      primitives/                Button, Input, Select, Modal, Card, Table, Badge, Toast, Skeleton, Nav...
      composed/                  OrderStatusBadge, MenuItemCard, CustomerRow, KpiCard...
    features/
      orders/
        hooks/                   thin wrappers around generated Orval hooks + local UI state
        components/              order-specific composed UI (StatusActionMenu, OrderDrawer)
      menu/
      crm/
      settings/
      home/
    theme/                       token definitions, ThemeProvider
    lib/                         query client setup, toast bus, navigation helpers
  tests/

services/backend/                Hono on Cloudflare Workers
  src/
    db/
      schema.ts                  Drizzle schema — the source of truth
      client.ts
      seed.ts
    modules/
      menu/
        schemas.ts                drizzle-zod derived + request/response refinements
        routes.ts                 Hono OpenAPI route defs
        service.ts                business logic (availability checks, price calc)
      orders/
        schemas.ts
        routes.ts
        service.ts                state machine, total calc, validation
      customers/
      settings/
    openapi/
      registry.ts                 builds the OpenAPI document from route defs
    app.ts                        composes modules into the Hono app
    index.ts                      Worker entry
  drizzle/                        migrations
  tests/

packages/
  shared/                         cross-cutting UI-agnostic utilities (money formatting, date helpers)
  types/                          hand-authored types ONLY for things with no DB shape (e.g. UI enums for filter state) — never for API payloads
  api-client/                     Orval output lands here: generated fetch client + React Query hooks (git-ignored or committed, see §7)

turbo.json
pnpm-workspace.yaml
```

`packages/types` is intentionally small and its README should say explicitly: *"if it describes a backend resource, it does not belong here — it belongs in the generated client."*

## 3. Data model (Drizzle schema)

Minimum tables to support the required flows:

| Table | Key columns | Notes |
|---|---|---|
| `menu_categories` | id, name, sort_order | |
| `menu_items` | id, category_id, name, description, price_cents, is_available, image_url | price stored as integer cents — never floats |
| `customers` | id, name, email, phone, created_at | |
| `orders` | id, customer_id (nullable — walk-in), status, subtotal_cents, tax_cents, total_cents, created_at, updated_at | totals are **computed server-side on creation**, never trusted from client |
| `order_items` | id, order_id, menu_item_id, name_snapshot, unit_price_cents_snapshot, quantity | snapshot fields so historical orders don't change if a menu item's price changes later |
| `order_status_events` | id, order_id, from_status, to_status, created_at | audit trail — this is what makes status changes "deliberate backend behavior" rather than a loose field write |
| `settings` | id (singleton row or key/value), prep_time_minutes, auto_accept, is_accepting_orders, opening_hours(jsonb) | |

`order_status_events` is the detail most likely to separate a strong submission from an average one — it's cheap to build and directly answers the "do not make status updates a loose client-controlled field change" requirement.

### Order status state machine

```
pending → accepted → preparing → ready → completed
   ↓          ↓
cancelled  cancelled
```

Enforced in `orders/service.ts` via a transition map (`Record<Status, Status[]>`), not in the route handler and not on the client. The route calls `service.transitionStatus(orderId, targetStatus)`; the service is the only thing allowed to write `orders.status`, and every write also inserts an `order_status_events` row. Invalid transitions return `409` with a typed error body, not a silent no-op.

## 4. Backend (Hono on Cloudflare Workers)

- **Module-per-resource** structure (menu / orders / customers / settings), each with `schemas.ts` (drizzle-zod derived, extended for request-only fields like pagination), `routes.ts` (Hono OpenAPI handlers, thin), `service.ts` (business logic, testable in isolation from HTTP).
- **Validation**: every route uses the drizzle-zod-derived schema as its `zValidator` input — reject invalid payloads at the edge before touching the service layer.
- **Business rules enforced server-side, always**:
  - reject orders containing unavailable menu items (check `is_available` at order-creation time, not just on menu display)
  - compute `subtotal/tax/total` server-side from current menu prices; if a client sends a total, ignore it (or validate it matches and reject with a clear error if not — pick one and document the choice)
  - order status transitions go through the state machine above
- **OpenAPI generation**: use `@hono/zod-openapi` so route definitions produce the spec directly from the same Zod schemas used for validation — one definition, not two.
- `pnpm gen:contract` runs the Worker locally (or a script that imports the Hono app directly), dumps `openapi.json`, then runs Orval against it into `packages/api-client`.

## 5. Frontend (Expo + React Native + Web)

- **Data layer**: only Orval-generated hooks touch the network. Feature-level hooks (`features/orders/hooks/useOrderActions.ts`) wrap generated hooks to add UI-specific behavior (optimistic updates, toast on success/error) — they don't reimplement fetching.
- **Component layering**:
  - `components/primitives` — pure, prop-driven, no data fetching, no business logic. This is what the UI library route showcases.
  - `components/composed` — primitives assembled into domain-shaped pieces (e.g. `OrderStatusBadge` maps a status enum from the generated types to color + label).
  - `features/*` — pages and the hooks/logic that feed them. Pages stay thin: layout + composed components + a feature hook. If a page file is doing `fetch` or branching business logic, that's a smell.
- **Design system / tokens**: one `theme/tokens.ts` exporting color, spacing (4/8pt scale), radius, shadow/elevation, and typography scales as plain objects; a `ThemeProvider` exposes them via context/hook so both web and native consume the same source. The UI library route imports directly from `theme/tokens.ts` — it's a live rendering of the tokens, not a hardcoded mockup.
- **Status/enum sharing**: order status, availability flags, etc. are typed from the generated `packages/api-client` types — never redeclared as a frontend union.

## 6. Suggested page → data mapping

| Page | Primary generated hooks | Notes |
|---|---|---|
| Home | `useGetOrdersSummary` (or computed from `useGetOrders` + query params) | KPI cards use `composed/KpiCard`, skeleton state while loading |
| Orders | `useGetOrders` (filters as query params), `useGetOrderById`, `usePatchOrderStatus` | list + drawer/detail, status actions call the mutation hook, not a raw field edit |
| CRM | `useGetCustomers`, `useGetCustomerById` (order history + spend) | spend/order-count likely a backend-computed aggregate, not client-side reduction over all orders |
| Menu | `useGetMenuItems`, `usePostMenuItem`, `usePatchMenuItem` | availability toggle is its own mutation, not bundled into a generic "edit" |
| Settings | `useGetSettings`, `usePatchSettings` | single form, optimistic update + toast |

## 7. Should generated code be committed?

Worth deciding explicitly and stating in your README's tradeoffs section: committing `packages/api-client` makes the repo runnable without running the backend first (good for review speed, which the assignment scores you on) but risks drift if someone forgets to regen after a schema change. A pragmatic middle ground: commit it, but add a CI/`pnpm lint` step (or just a documented habit) that regenerates and diffs before merge.

## 8. Testing

- **Backend**: unit tests on `orders/service.ts` — valid/invalid state transitions, total calculation, unavailable-item rejection. These are cheap, high-signal, and directly demonstrate the "deliberate backend behavior" requirement.
- **Frontend**: a handful of tests on real logic — the status transition UI only shows valid next actions; a form control's validation states; one primitive's states (e.g. Button disabled/loading). Skip exhaustive snapshot coverage — the assignment explicitly says it's evaluating judgment, not volume.

## 9. Scripts (turbo pipeline)

```jsonc
// package.json (root)
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

## 10. Scope-cutting guidance for the 1–2 day timebox

Given the grading rubric, priority order if time runs short:

1. Get the full pipeline (schema → zod → OpenAPI → Orval → hooks) working end-to-end for **one** resource (orders) before building breadth. A working pipeline on one resource proves the architecture; a wide app with hand-typed DTOs disproves it.
2. Order state machine + server-side total calculation — this is the most-referenced backend requirement in the rubric.
3. UI library route + primitives — cheap to build, and it's the single artifact that most directly demonstrates "design system," which is graded separately from "visual polish."
4. Home KPIs can be the simplest page — a couple of aggregate queries, not a dashboard-of-dashboards.
5. Native readiness is explicitly a bonus — don't spend timebox hours on it if web isn't solid yet.

## Open decisions to make before writing code

- Auth: the assignment doesn't mention it — probably fine to skip entirely and note it as an explicit tradeoff, rather than half-building it.
- Singleton settings row vs. key-value settings table — singleton row is simpler and matches "ordering-related business settings" being a small, fixed set of fields.
- Whether "reject unavailable items" happens at cart-build time (frontend UX) in addition to order-creation time (backend enforcement) — do both, but only the backend check is load-bearing.
