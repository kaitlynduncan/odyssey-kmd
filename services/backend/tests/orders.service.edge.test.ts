import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createOrder } from "../src/modules/orders/service";
import { createTestDb, resetTestDb, seedMinimalMenu } from "./helpers/testDb";
import { menuItems } from "../src/db/schema";

describe("createOrder edge cases", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await resetTestDb(db);
  });

  it("rejects the whole order if any single item is unavailable, even if others are available", async () => {
    const { category, menuItem: available } = await seedMinimalMenu(db, { isAvailable: true, priceCents: 500 });
    const [unavailable] = await db
      .insert(menuItems)
      .values({ categoryId: category.id, name: "Sold Out Item", priceCents: 700, isAvailable: false })
      .returning();

    await expect(
      createOrder(db, {
        items: [
          { menuItemId: available.id, quantity: 1 },
          { menuItemId: unavailable.id, quantity: 1 },
        ],
      })
    ).rejects.toMatchObject({ code: "MENU_ITEM_UNAVAILABLE" });
  });

  it("sums totals correctly across multiple different items", async () => {
    const { category, menuItem: itemA } = await seedMinimalMenu(db, { priceCents: 500 });
    const [itemB] = await db
      .insert(menuItems)
      .values({ categoryId: category.id, name: "Second Item", priceCents: 300, isAvailable: true })
      .returning();

    const order = await createOrder(db, {
      items: [
        { menuItemId: itemA.id, quantity: 2 },
        { menuItemId: itemB.id, quantity: 3 },
      ],
    });

    expect(order.subtotalCents).toBe(2 * 500 + 3 * 300);
  });

  it("snapshots item name and price at order time, unaffected by later menu changes", async () => {
    const { menuItem } = await seedMinimalMenu(db, { priceCents: 1000 });
    const order = await createOrder(db, { items: [{ menuItemId: menuItem.id, quantity: 1 }] });

    await db.update(menuItems).set({ priceCents: 9999 }).where(eq(menuItems.id, menuItem.id));

    const items = await db.query.orderItems.findMany({ where: (oi, { eq }) => eq(oi.orderId, order.id) });
    expect(items[0].unitPriceCentsSnapshot).toBe(1000);
  });

  it("creates a walk-in order with no customerId", async () => {
    const { menuItem } = await seedMinimalMenu(db, { priceCents: 400 });
    const order = await createOrder(db, { items: [{ menuItemId: menuItem.id, quantity: 1 }] });
    expect(order.customerId).toBeNull();
  });

  it("rejects an order referencing a menu item that doesn't exist", async () => {
    await expect(
      createOrder(db, { items: [{ menuItemId: "00000000-0000-0000-0000-000000000000", quantity: 1 }] })
    ).rejects.toMatchObject({ code: "MENU_ITEM_NOT_FOUND" });
  });
});
