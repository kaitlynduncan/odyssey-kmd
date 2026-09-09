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

export class MenuError extends Error {
  constructor(message: string, public code: "CATEGORY_NAME_TAKEN" | "ITEM_NAME_TAKEN", public status: number) {
    super(message);
  }
}

// Duplicate names are scoped per category — "Lemonade" in Drinks and
// "Lemonade" in Desserts aren't the same item, but two "Lemonade"s in
// Drinks are.
export async function createMenuItem(db: Db, input: CreateMenuItemInput) {
  const siblings = await db.query.menuItems.findMany({ where: (mi, { eq }) => eq(mi.categoryId, input.categoryId) });
  const normalized = input.name.trim().toLowerCase();
  if (siblings.some((i) => i.name.trim().toLowerCase() === normalized)) {
    throw new MenuError(`An item named "${input.name.trim()}" already exists in this category`, "ITEM_NAME_TAKEN", 409);
  }
  const [item] = await db.insert(menuItems).values({ ...input, name: input.name.trim() }).returning();
  return item;
}

export async function updateMenuItem(db: Db, id: string, input: UpdateMenuItemInput) {
  if (input.name !== undefined || input.categoryId !== undefined) {
    const current = await db.query.menuItems.findFirst({ where: eq(menuItems.id, id) });
    if (current) {
      const targetCategoryId = input.categoryId ?? current.categoryId;
      const targetName = (input.name ?? current.name).trim().toLowerCase();
      const siblings = await db.query.menuItems.findMany({
        where: (mi, { eq }) => eq(mi.categoryId, targetCategoryId),
      });
      if (siblings.some((i) => i.id !== id && i.name.trim().toLowerCase() === targetName)) {
        throw new MenuError(
          `An item named "${(input.name ?? current.name).trim()}" already exists in this category`,
          "ITEM_NAME_TAKEN",
          409
        );
      }
    }
  }
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
