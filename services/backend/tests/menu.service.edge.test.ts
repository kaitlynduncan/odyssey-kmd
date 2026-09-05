import { describe, it, expect, beforeEach } from "vitest";
import * as menuService from "../src/modules/menu/service";
import { createTestDb, resetTestDb } from "./helpers/testDb";

describe("menu service edge cases", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await resetTestDb(db);
  });

  it("rejects creating an item under a category that doesn't exist", async () => {
    await expect(
      menuService.createMenuItem(db, {
        categoryId: "00000000-0000-0000-0000-000000000000",
        name: "Orphan Item",
        priceCents: 500,
      } as any)
    ).rejects.toThrow();
  });

  it("updateMenuItem only changes the provided fields", async () => {
    const category = await menuService.createMenuCategory(db, { name: "Mains" });
    const item = await menuService.createMenuItem(db, {
      categoryId: category.id,
      name: "Original Name",
      priceCents: 1000,
    } as any);

    const updated = await menuService.updateMenuItem(db, item.id, { priceCents: 1200 });
    expect(updated.name).toBe("Original Name");
    expect(updated.priceCents).toBe(1200);
  });

  it("getMenu orders categories by sortOrder", async () => {
    await menuService.createMenuCategory(db, { name: "Second", sortOrder: 2 });
    await menuService.createMenuCategory(db, { name: "First", sortOrder: 1 });

    const menu = await menuService.getMenu(db);
    const names = menu.categories.map((c) => c.name);
    expect(names.indexOf("First")).toBeLessThan(names.indexOf("Second"));
  });
});
