import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { createDb, type Db } from "./db/client";
import { ordersRoutes } from "./modules/orders/routes";
import { menuRoutes } from "./modules/menu/routes";
import { customersRoutes } from "./modules/customers/routes";
import { settingsRoutes } from "./modules/settings/routes";

export type Env = {
  Bindings: { DATABASE_URL: string };
  Variables: { db: Db };
};

export function createApp() {
  const app = new OpenAPIHono<Env>();

  app.use("*", cors());

  // Attach a request-scoped db client. On Workers, DATABASE_URL comes from
  // the binding; locally it comes from process.env via wrangler's .dev.vars.
  app.use("*", async (c, next) => {
    c.set("db", createDb(c.env.DATABASE_URL));
    await next();
  });

  app.route("/api", ordersRoutes);
  app.route("/api", menuRoutes);
  app.route("/api", customersRoutes);
  app.route("/api", settingsRoutes);

  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "Odyssey Restaurant Ops API", version: "0.1.0" },
  });
  app.get("/docs", swaggerUI({ url: "/openapi.json" }));

  return app;
}
