import { describe, it, expect } from "vitest";
import { createOrderInputSchema, updateOrderStatusInputSchema, listOrdersQuerySchema } from "../src/modules/orders/schemas";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("createOrderInputSchema", () => {
  it("accepts a valid payload", () => {
    expect(createOrderInputSchema.safeParse({ items: [{ menuItemId: VALID_UUID, quantity: 2 }] }).success).toBe(true);
  });

  it("rejects an empty items array", () => {
    expect(createOrderInputSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("rejects a non-UUID menuItemId", () => {
    expect(createOrderInputSchema.safeParse({ items: [{ menuItemId: "not-a-uuid", quantity: 1 }] }).success).toBe(false);
  });

  it("rejects a zero quantity", () => {
    expect(createOrderInputSchema.safeParse({ items: [{ menuItemId: VALID_UUID, quantity: 0 }] }).success).toBe(false);
  });

  it("rejects a negative quantity", () => {
    expect(createOrderInputSchema.safeParse({ items: [{ menuItemId: VALID_UUID, quantity: -1 }] }).success).toBe(false);
  });

  it("rejects a non-integer quantity", () => {
    expect(createOrderInputSchema.safeParse({ items: [{ menuItemId: VALID_UUID, quantity: 1.5 }] }).success).toBe(false);
  });

  it("allows an omitted customerId (walk-in)", () => {
    expect(createOrderInputSchema.safeParse({ items: [{ menuItemId: VALID_UUID, quantity: 1 }] }).success).toBe(true);
  });

  it("allows an explicit null customerId", () => {
    expect(
      createOrderInputSchema.safeParse({ customerId: null, items: [{ menuItemId: VALID_UUID, quantity: 1 }] }).success
    ).toBe(true);
  });

  it("rejects notes longer than 500 characters", () => {
    expect(
      createOrderInputSchema.safeParse({
        items: [{ menuItemId: VALID_UUID, quantity: 1 }],
        notes: "a".repeat(501),
      }).success
    ).toBe(false);
  });
});

describe("updateOrderStatusInputSchema", () => {
  it("accepts each valid status value", () => {
    for (const status of ["pending", "accepted", "preparing", "ready", "completed", "cancelled"]) {
      expect(updateOrderStatusInputSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejects an unknown status value", () => {
    expect(updateOrderStatusInputSchema.safeParse({ status: "delivered" }).success).toBe(false);
  });

  it("rejects a missing status field", () => {
    expect(updateOrderStatusInputSchema.safeParse({}).success).toBe(false);
  });
});

describe("listOrdersQuerySchema", () => {
  it("defaults page and pageSize when omitted", () => {
    const result = listOrdersQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it("coerces string query params to numbers", () => {
    const result = listOrdersQuerySchema.parse({ page: "3", pageSize: "10" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
  });

  it("rejects a pageSize above the max", () => {
    expect(listOrdersQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
  });
});
