// Intentionally minimal. Anything that describes a backend resource (Order,
// MenuItem, Customer, Settings...) is NOT declared here — those types come
// from packages/api-client's generated output. This package only holds
// types with no database shape, e.g. local UI/filter state.

export type OrderFilterTab = "all" | "active" | "completed" | "cancelled";
