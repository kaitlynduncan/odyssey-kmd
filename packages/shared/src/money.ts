// Money is always stored and transmitted as integer cents. This is the one
// place formatting for display happens, so every page renders currency
// identically.
export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
