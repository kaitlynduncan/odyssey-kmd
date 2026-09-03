import { describe, it, expect, beforeEach } from "vitest";
import { ORDER_STATUS_TRANSITIONS, transitionStatus, createOrder, OrderError } from "../src/modules/orders/service";
import { createTestDb, resetTestDb, seedMinimalMenu } from "./helpers/testDb";

// These tests run against a real (test) Postgres instance via the same
// Drizzle client the app uses — see tests/helpers/testDb.ts for setup.
// Swap in your preferred local Postgres/test-container strategy.

describe("order status state machine", () => {
  it("allows pending -> accepted", () => {
    expect(ORDER_STATUS_TRANSITIONS.pending).toContain("accepted");
  });

  it("does not allow completed -> anything", () => {
    expect(ORDER_STATUS_TRANSITIONS.completed).toHaveLength(0);
  });

  it("does not allow skipping preparing -> completed", () => {
    expect(ORDER_STATUS_TRANSITIONS.preparing).not.toContain("completed");
  });

  it("allows cancellation from pending, accepted, and preparing", () => {
    expect(ORDER_STATUS_TRANSITIONS.pending).toContain("cancelled");
    expect(ORDER_STATUS_TRANSITIONS.accepted).toContain("cancelled");
    expect(ORDER_STATUS_TRANSITIONS.preparing).toContain("cancelled");
  });

  it("does not allow cancellation once ready", () => {
    expect(ORDER_STATUS_TRANSITIONS.ready).not.toContain("cancelled");
  });
});

describe("transitionStatus (integration)", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await resetTestDb(db);
  });

  it("rejects an invalid transition with a typed error", async () => {
    const { menuItem } = await seedMinimalMenu(db);
    const order = await createOrder(db, { items: [{ menuItemId: menuItem.id, quantity: 1 }] });

    await expect(transitionStatus(db, order.id, "completed")).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
    } satisfies Partial<OrderError>);
  });

  it("records an order_status_events row on every transition", async () => {
    const { menuItem } = await seedMinimalMenu(db);
    const order = await createOrder(db, { items: [{ menuItemId: menuItem.id, quantity: 1 }] });

    await transitionStatus(db, order.id, "accepted");
    const events = await db.query.orderStatusEvents.findMany({
      where: (e, { eq }) => eq(e.orderId, order.id),
    });

    expect(events).toHaveLength(2); // initial "pending" + "accepted"
    expect(events.at(-1)).toMatchObject({ fromStatus: "pending", toStatus: "accepted" });
  });
});

describe("createOrder", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await resetTestDb(db);
  });

  it("rejects unavailable menu items", async () => {
    const { menuItem } = await seedMinimalMenu(db, { isAvailable: false });

    await expect(
      createOrder(db, { items: [{ menuItemId: menuItem.id, quantity: 1 }] })
    ).rejects.toMatchObject({ code: "MENU_ITEM_UNAVAILABLE" } satisfies Partial<OrderError>);
  });

  it("computes totals server-side from current menu prices, ignoring any client total", async () => {
    const { menuItem } = await seedMinimalMenu(db, { priceCents: 1200 });

    const order = await createOrder(db, {
      items: [{ menuItemId: menuItem.id, quantity: 2 }],
    });

    expect(order.subtotalCents).toBe(2400);
    expect(order.totalCents).toBeGreaterThan(order.subtotalCents); // tax applied
  });

  it("rejects an order with zero items", async () => {
    await expect(createOrder(db, { items: [] } as any)).rejects.toThrow();
  });
});
