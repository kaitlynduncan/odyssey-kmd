import { eq, desc, count, sum } from "drizzle-orm";
import type { Db } from "../../db/client";
import { customers, orders } from "../../db/schema";

export async function listCustomersWithStats(db: Db) {
  // Aggregate is computed in the DB, not by summing all orders client-side.
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      orderCount: count(orders.id),
      totalSpentCents: sum(orders.totalCents).mapWith(Number),
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .groupBy(customers.id);

  return rows.map((r) => ({ ...r, totalSpentCents: r.totalSpentCents ?? 0 }));
}

export async function getCustomerDetail(db: Db, id: string) {
  const customer = await db.query.customers.findFirst({ where: eq(customers.id, id) });
  if (!customer) return null;

  const customerOrders = await db.query.orders.findMany({
    where: eq(orders.customerId, id),
    orderBy: desc(orders.createdAt),
    limit: 10,
  });

  const orderCount = customerOrders.length;
  const totalSpentCents = customerOrders.reduce((sum, o) => sum + o.totalCents, 0);

  return {
    ...customer,
    orderCount,
    totalSpentCents,
    recentOrders: customerOrders.map((o) => ({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}

export async function createCustomer(db: Db, input: { name: string; email?: string | null; phone?: string | null }) {
  const [customer] = await db.insert(customers).values(input).returning();
  return customer;
}
