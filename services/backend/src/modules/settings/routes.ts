import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Db } from "../../db/client";
import { settingsSelectSchema, updateSettingsInputSchema } from "./schemas";
import * as settingsService from "./service";

type Env = { Variables: { db: Db } };
export const settingsRoutes = new OpenAPIHono<Env>();

settingsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/settings",
    tags: ["settings"],
    responses: { 200: { description: "Settings", content: { "application/json": { schema: settingsSelectSchema } } } },
  }),
  async (c) => c.json(await settingsService.getSettings(c.get("db")), 200)
);

settingsRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/settings",
    tags: ["settings"],
    request: { body: { content: { "application/json": { schema: updateSettingsInputSchema } } } },
    responses: { 200: { description: "Updated", content: { "application/json": { schema: settingsSelectSchema } } } },
  }),
  async (c) => c.json(await settingsService.updateSettings(c.get("db"), c.req.valid("json")), 200)
);
