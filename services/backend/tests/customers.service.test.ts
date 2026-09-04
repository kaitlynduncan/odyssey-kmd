import { describe, it, expect, beforeEach } from "vitest";
import * as customersService from "../src/modules/customers/service";
import { createOrder } from "../src/modules/orders/service";
import { createTestDb, resetTestDb, seedMinimalMenu } from "./helpers/testDb";
import { customers } from "../src/db/schema";

describe("customers service", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await resetTestDb(db);
  });

  it("computes order count and total spend correctly", async () => {
    const { menuItem } = await seedMinimalMenu(db, { priceCents: 1000 });
    const [customer] = await db.insert(customers).values({ name: "Test Customer" }).returning();

    await createOrder(db, { customerId: customer.id, items: [{ menuItemId: menuItem.id, quantity: 1 }] });
    await createOrder(db, { customerId: customer.id, items: [{ menuItemId: menuItem.id, quantity: 2 }] });

    const stats = await customersService.listCustomersWithStats(db);
    const found = stats.find((c) => c.id === customer.id);

    expect(found?.orderCount).toBe(2);
    expect(found?.totalSpentCents).toBeGreaterThan(0);
  });

  it("returns zero stats for a customer with no orders", async () => {
    const [customer] = await db.insert(customers).values({ name: "No Orders" }).returning();
    const stats = await customersService.listCustomersWithStats(db);
    const found = stats.find((c) => c.id === customer.id);

    expect(found?.orderCount).toBe(0);
    expect(found?.totalSpentCents).toBe(0);
  });

  it("getCustomerDetail includes recent orders", async () => {
    const { menuItem } = await seedMinimalMenu(db, { priceCents: 500 });
    const [customer] = await db.insert(customers).values({ name: "Detail Customer" }).returning();
    await createOrder(db, { customerId: customer.id, items: [{ menuItemId: menuItem.id, quantity: 1 }] });

    const detail = await customersService.getCustomerDetail(db, customer.id);
    expect(detail?.recentOrders).toHaveLength(1);
  });
});
