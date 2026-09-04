import { describe, it, expect } from "vitest";
import { sanitizePriceInput } from "../src/lib/priceInput";

describe("sanitizePriceInput", () => {
  it("allows a plain integer", () => {
    expect(sanitizePriceInput("6")).toBe("6");
  });

  it("allows a trailing decimal point while typing", () => {
    expect(sanitizePriceInput("6.")).toBe("6.");
  });

  it("allows one decimal digit while typing", () => {
    expect(sanitizePriceInput("6.2")).toBe("6.2");
  });

  it("caps at two decimal places", () => {
    expect(sanitizePriceInput("6.256")).toBe("6.25");
  });

  it("strips non-numeric characters", () => {
    expect(sanitizePriceInput("$6.25abc")).toBe("6.25");
  });

  it("collapses multiple decimal points into one", () => {
    expect(sanitizePriceInput("6.2.5")).toBe("6.25");
  });

  it("preserves a trailing zero after the decimal", () => {
    expect(sanitizePriceInput("6.20")).toBe("6.20");
  });
});
