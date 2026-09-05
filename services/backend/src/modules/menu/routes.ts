import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Db } from "../../db/client";
import {
  createMenuItemInputSchema,
  updateMenuItemInputSchema,
  menuResponseSchema,
  menuItemSelectSchema,
  createMenuCategoryInputSchema,
  updateMenuCategoryInputSchema,
  menuCategorySelectSchema,
} from "./schemas";
import * as menuService from "./service";
import { MenuError } from "./service";

type Env = { Variables: { db: Db } };
export const menuRoutes = new OpenAPIHono<Env>();

const errorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

menuRoutes.openapi(
  createRoute({
    method: "get",
    path: "/menu",
    tags: ["menu"],
    responses: { 200: { description: "Menu", content: { "application/json": { schema: menuResponseSchema } } } },
  }),
  async (c) => c.json(await menuService.getMenu(c.get("db")), 200)
);

menuRoutes.openapi(
  createRoute({
    method: "post",
    path: "/menu/items",
    tags: ["menu"],
    request: { body: { content: { "application/json": { schema: createMenuItemInputSchema } } } },
    responses: { 201: { description: "Created", content: { "application/json": { schema: menuItemSelectSchema } } } },
  }),
  async (c) => c.json(await menuService.createMenuItem(c.get("db"), c.req.valid("json")), 201)
);

menuRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/menu/items/{id}",
    tags: ["menu"],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: updateMenuItemInputSchema } } },
    },
    responses: { 200: { description: "Updated", content: { "application/json": { schema: menuItemSelectSchema } } } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    return c.json(await menuService.updateMenuItem(c.get("db"), id, c.req.valid("json")), 200);
  }
);

menuRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/menu/items/{id}/availability",
    tags: ["menu"],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: z.object({ isAvailable: z.boolean() }) } } },
    },
    responses: { 200: { description: "Updated", content: { "application/json": { schema: menuItemSelectSchema } } } },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { isAvailable } = c.req.valid("json");
    return c.json(await menuService.setMenuItemAvailability(c.get("db"), id, isAvailable), 200);
  }
);

menuRoutes.openapi(
  createRoute({
    method: "post",
    path: "/menu/categories",
    tags: ["menu"],
    request: { body: { content: { "application/json": { schema: createMenuCategoryInputSchema } } } },
    responses: {
      201: { description: "Created", content: { "application/json": { schema: menuCategorySelectSchema } } },
      409: { description: "Duplicate category name", content: { "application/json": { schema: errorResponseSchema } } },
    },
  }),
  async (c) => {
    try {
      const category = await menuService.createMenuCategory(c.get("db"), c.req.valid("json"));
      return c.json(category, 201);
    } catch (err) {
      if (err instanceof MenuError) {
        return c.json({ error: { code: err.code, message: err.message } }, err.status as 409);
      }
      throw err;
    }
  }
);

menuRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/menu/categories/{id}",
    tags: ["menu"],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: updateMenuCategoryInputSchema } } },
    },
    responses: {
      200: { description: "Updated", content: { "application/json": { schema: menuCategorySelectSchema } } },
      409: { description: "Duplicate category name", content: { "application/json": { schema: errorResponseSchema } } },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    try {
      const category = await menuService.updateMenuCategory(c.get("db"), id, c.req.valid("json"));
      return c.json(category, 200);
    } catch (err) {
      if (err instanceof MenuError) {
        return c.json({ error: { code: err.code, message: err.message } }, err.status as 409);
      }
      throw err;
    }
  }
);
