// Sanitizes free-typed currency input so it never exceeds 2 decimal places
// and never contains more than one decimal point, while still allowing the
// user to type through intermediate states like "6." or "6.2" without the
// field fighting back mid-keystroke.
export function sanitizePriceInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const sanitized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
  const [whole, decimal] = sanitized.split(".");
  return decimal !== undefined ? `${whole}.${decimal.slice(0, 2)}` : sanitized;
}
