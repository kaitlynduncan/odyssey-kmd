import { sql } from "drizzle-orm";
import { createDb, type Db } from "../../src/db/client";
import { menuCategories, menuItems } from "../../src/db/schema";

export function createTestDb(): Db {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/odyssey_test";
  return createDb(url);
}

export async function resetTestDb(db: Db) {
  await db.execute(
    sql`truncate table order_status_events, order_items, orders, customers, menu_items, menu_categories, settings restart identity cascade`
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
