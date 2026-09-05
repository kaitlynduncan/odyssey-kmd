import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { menuCategories, menuItems } from "../../db/schema";

export const menuCategorySelectSchema = createSelectSchema(menuCategories);
export const menuItemSelectSchema = createSelectSchema(menuItems);

export const createMenuItemInputSchema = createInsertSchema(menuItems, {
  priceCents: z.number().int().positive(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateMenuItemInputSchema = createMenuItemInputSchema.partial();

export const createMenuCategoryInputSchema = createInsertSchema(menuCategories).omit({
  id: true,
  createdAt: true,
});
export const updateMenuCategoryInputSchema = createMenuCategoryInputSchema.partial();

export const menuItemWithCategorySchema = menuItemSelectSchema.extend({
  category: menuCategorySelectSchema,
});

export const menuResponseSchema = z.object({
  categories: z.array(menuCategorySelectSchema),
  items: z.array(menuItemSelectSchema),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemInputSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemInputSchema>;
