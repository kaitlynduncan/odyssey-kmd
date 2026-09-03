// Everything under ./generated is produced by `pnpm gen:contract` (Orval,
// reading services/backend/openapi.json). Do not hand-edit files in
// ./generated — regenerate instead.
//
// Run `pnpm gen:contract` from the repo root once the backend is running
// (or after `tsx scripts/generate-openapi.ts`) to populate ./generated.
// Until then this package intentionally has no runtime exports.

export * from "./generated/models";
export * from "./generated/endpoints/orders/orders";
export * from "./generated/endpoints/menu/menu";
export * from "./generated/endpoints/customers/customers";
export * from "./generated/endpoints/settings/settings";
