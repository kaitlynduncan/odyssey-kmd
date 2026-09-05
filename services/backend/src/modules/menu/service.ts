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

export async function updateMenuItem(db: Db, id: string, input: UpdateMenuItemInput) {
  const [item] = await db
    .update(menuItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning();
  return item;
}

export async function setMenuItemAvailability(db: Db, id: string, isAvailable: boolean) {
  const [item] = await db
    .update(menuItems)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning();
  return item;
}

export class MenuError extends Error {
  constructor(message: string, public code: "CATEGORY_NAME_TAKEN", public status: number) {
    super(message);
  }
}

// Case-insensitive, trim-insensitive duplicate check — "Mains", "mains",
// and " Mains " all count as the same category.
export async function createMenuCategory(db: Db, input: { name: string; sortOrder?: number }) {
  const existing = await db.query.menuCategories.findMany();
  const normalized = input.name.trim().toLowerCase();
  if (existing.some((c) => c.name.trim().toLowerCase() === normalized)) {
    throw new MenuError(`A category named "${input.name.trim()}" already exists`, "CATEGORY_NAME_TAKEN", 409);
  }
  const [category] = await db.insert(menuCategories).values({ ...input, name: input.name.trim() }).returning();
  return category;
}

export async function updateMenuCategory(db: Db, id: string, input: { name?: string; sortOrder?: number }) {
  if (input.name) {
    const existing = await db.query.menuCategories.findMany();
    const normalized = input.name.trim().toLowerCase();
    if (existing.some((c) => c.id !== id && c.name.trim().toLowerCase() === normalized)) {
      throw new MenuError(`A category named "${input.name.trim()}" already exists`, "CATEGORY_NAME_TAKEN", 409);
    }
  }
  const [category] = await db.update(menuCategories).set(input).where(eq(menuCategories.id, id)).returning();
  return category;
}
