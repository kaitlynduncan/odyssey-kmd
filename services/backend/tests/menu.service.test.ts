import { describe, it, expect, beforeEach } from "vitest";
import * as menuService from "../src/modules/menu/service";
import { createTestDb, resetTestDb } from "./helpers/testDb";

describe("menu service", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await resetTestDb(db);
  });

  it("creates a category and an item under it", async () => {
    const category = await menuService.createMenuCategory(db, { name: "Mains" });
    const item = await menuService.createMenuItem(db, {
      categoryId: category.id,
      name: "Burger",
      priceCents: 1200,
    } as any);

    expect(item.categoryId).toBe(category.id);
    expect(item.isAvailable).toBe(true); // default
  });

  it("toggles availability independently of other fields", async () => {
    const category = await menuService.createMenuCategory(db, { name: "Mains" });
    const item = await menuService.createMenuItem(db, {
      categoryId: category.id,
      name: "Burger",
      priceCents: 1200,
    } as any);

    const updated = await menuService.setMenuItemAvailability(db, item.id, false);
    expect(updated.isAvailable).toBe(false);
    expect(updated.name).toBe("Burger");
  });

  it("getMenu returns categories and items together", async () => {
    const category = await menuService.createMenuCategory(db, { name: "Drinks" });
    await menuService.createMenuItem(db, { categoryId: category.id, name: "Soda", priceCents: 300 } as any);

    const menu = await menuService.getMenu(db);
    expect(menu.categories.some((c) => c.id === category.id)).toBe(true);
    expect(menu.items.some((i) => i.name === "Soda")).toBe(true);
  });
});
