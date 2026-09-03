import { eq, and, desc, count } from "drizzle-orm";
import type { Db } from "../../db/client";
import { orders, orderItems, orderStatusEvents, menuItems } from "../../db/schema";
import type { CreateOrderInput, OrderStatus } from "./schemas";
import { ORDER_STATUS_TRANSITIONS } from "shared/src/orderStatus";

// Re-exported so existing imports/tests (`import { ORDER_STATUS_TRANSITIONS }
// from "./service"`) keep working — the map itself lives in packages/shared
// so the frontend can read the exact same authority without duplicating it.
export { ORDER_STATUS_TRANSITIONS };

export class OrderError extends Error {
  constructor(
    message: string,
    public code:
      | "MENU_ITEM_UNAVAILABLE"
      | "MENU_ITEM_NOT_FOUND"
      | "INVALID_STATUS_TRANSITION"
      | "ORDER_NOT_FOUND",
    public status: number
  ) {
    super(message);
  }
}

const TAX_RATE = 0.0825; // move to settings table if it needs to be configurable per-tenant

export async function createOrder(db: Db, input: CreateOrderInput) {
  // Look up current menu item state — price and availability always come
  // from the database, never from the client payload.
  const menuItemIds = input.items.map((i) => i.menuItemId);
  const foundItems = await db.query.menuItems.findMany({
    where: (mi, { inArray }) => inArray(mi.id, menuItemIds),
  });

  const itemsById = new Map(foundItems.map((mi) => [mi.id, mi]));

  for (const line of input.items) {
    const menuItem = itemsById.get(line.menuItemId);
    if (!menuItem) {
      throw new OrderError(`Menu item ${line.menuItemId} not found`, "MENU_ITEM_NOT_FOUND", 400);
    }
    if (!menuItem.isAvailable) {
      throw new OrderError(
        `"${menuItem.name}" is currently unavailable and cannot be ordered`,
        "MENU_ITEM_UNAVAILABLE",
        422
      );
    }
  }

  const subtotalCents = input.items.reduce((sum, line) => {
    const menuItem = itemsById.get(line.menuItemId)!;
    return sum + menuItem.priceCents * line.quantity;
  }, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents;

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerId: input.customerId ?? null,
        notes: input.notes,
        status: "pending",
        subtotalCents,
        taxCents,
        totalCents,
      })
      .returning();

    await tx.insert(orderItems).values(
      input.items.map((line) => {
        const menuItem = itemsById.get(line.menuItemId)!;
        return {
          orderId: order.id,
          menuItemId: menuItem.id,
          nameSnapshot: menuItem.name,
          unitPriceCentsSnapshot: menuItem.priceCents,
          quantity: line.quantity,
        };
      })
    );

    await tx.insert(orderStatusEvents).values({
      orderId: order.id,
      fromStatus: null,
      toStatus: "pending",
    });

    return order;
  });
}

export async function transitionStatus(db: Db, orderId: string, targetStatus: OrderStatus) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) {
    throw new OrderError("Order not found", "ORDER_NOT_FOUND", 404);
  }

  const allowedNext = ORDER_STATUS_TRANSITIONS[order.status];
  if (!allowedNext.includes(targetStatus)) {
    throw new OrderError(
      `Cannot transition order from "${order.status}" to "${targetStatus}"`,
      "INVALID_STATUS_TRANSITION",
      409
    );
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(orders)
      .set({ status: targetStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderStatusEvents).values({
      orderId,
      fromStatus: order.status,
      toStatus: targetStatus,
    });

    return updated;
  });
}

export async function listOrders(
  db: Db,
  filters: { status?: OrderStatus; customerId?: string; page: number; pageSize: number }
) {
  const conditions = [
    filters.status ? eq(orders.status, filters.status) : undefined,
    filters.customerId ? eq(orders.customerId, filters.customerId) : undefined,
  ].filter(Boolean);
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.orders.findMany({
      where,
      with: { items: true },
      orderBy: desc(orders.createdAt),
      limit: filters.pageSize,
      offset: (filters.page - 1) * filters.pageSize,
    }),
    db.select({ total: count() }).from(orders).where(where),
  ]);

  return { data: rows, page: filters.page, pageSize: filters.pageSize, total };
}

export async function getOrderById(db: Db, orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
      statusEvents: { orderBy: (e, { asc }) => [asc(e.createdAt)] },
    },
  });
  if (!order) {
    throw new OrderError("Order not found", "ORDER_NOT_FOUND", 404);
  }
  return order;
}

export async function getOrdersSummary(db: Db) {
  const allOrders = await db.query.orders.findMany();
  const totalOrders = allOrders.length;
  const revenueCents = allOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.totalCents, 0);
  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  return { totalOrders, revenueCents, pendingOrders };
}
