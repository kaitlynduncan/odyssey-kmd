import { eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import { menuCategories, menuItems } from "../../db/schema";
import type { CreateMenuItemInput, UpdateMenuItemInput } from "./schemas";

export async function getMenu(db: Db) {
  const [categories, items] = await Promise.all([
    db.select().from(menuCategories).orderBy(menuCategories.sortOrder),
    db.select().from(menuItems),
  ]);
  return { categories, items };
}

export async function createMenuItem(db: Db, input: CreateMenuItemInput) {
  const [item] = await db.insert(menuItems).values(input).returning();
  return item;
}

export async function createMenuCategory(db: Db, input: { name: string; sortOrder?: number }) {
  const [category] = await db.insert(menuCategories).values(input).returning();
  return category;
}

export async function updateMenuItem(db: Db, id: string, input: UpdateMenuItemInput) {
  const [item] = await db
    .update(menuItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning();
  return item;
}

// Availability is its own explicit action rather than folded into a generic
// PATCH, so the dashboard's availability toggle maps to one clear intent.
export async function setMenuItemAvailability(db: Db, id: string, isAvailable: boolean) {
  const [item] = await db
    .update(menuItems)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning();
  return item;
}
