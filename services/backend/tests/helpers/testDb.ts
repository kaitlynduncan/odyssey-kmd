import { createDb, type Db } from "../../src/db/client";
import { menuCategories, menuItems } from "../../src/db/schema";

// Points at a local/test Postgres instance (docker-compose or Neon branch).
// Set TEST_DATABASE_URL in .env.test — see README for local setup.
export function createTestDb(): Db {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/odyssey_test";
  return createDb(url);
}

// Truncates all tables between tests. Swap for a transaction-rollback
// strategy if test speed becomes a bottleneck.
export async function resetTestDb(db: Db) {
  await db.execute(
    `truncate table order_status_events, order_items, orders, customers, menu_items, menu_categories, settings restart identity cascade`
  );
}

export async function seedMinimalMenu(
  db: Db,
  overrides: { isAvailable?: boolean; priceCents?: number } = {}
) {
  const [category] = await db.insert(menuCategories).values({ name: "Mains" }).returning();
  const [menuItem] = await db
    .insert(menuItems)
    .values({
      categoryId: category.id,
      name: "Test Burger",
      priceCents: overrides.priceCents ?? 1000,
      isAvailable: overrides.isAvailable ?? true,
    })
    .returning();
  return { category, menuItem };
}
