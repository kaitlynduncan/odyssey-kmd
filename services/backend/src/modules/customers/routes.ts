import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Db } from "../../db/client";
import { customerWithStatsSchema, customerDetailSchema, createCustomerInputSchema } from "./schemas";
import * as customersService from "./service";

type Env = { Variables: { db: Db } };
export const customersRoutes = new OpenAPIHono<Env>();

customersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/customers",
    tags: ["customers"],
    responses: {
      200: { description: "Customers with stats", content: { "application/json": { schema: z.array(customerWithStatsSchema) } } },
    },
  }),
  async (c) => c.json(await customersService.listCustomersWithStats(c.get("db")), 200)
);

customersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/customers/{id}",
    tags: ["customers"],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "Customer detail", content: { "application/json": { schema: customerDetailSchema } } },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const customer = await customersService.getCustomerDetail(c.get("db"), id);
    if (!customer) return c.json({ error: { code: "CUSTOMER_NOT_FOUND", message: "Customer not found" } }, 404);
    return c.json(customer, 200);
  }
);

customersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/customers",
    tags: ["customers"],
    request: { body: { content: { "application/json": { schema: createCustomerInputSchema } } } },
    responses: { 201: { description: "Created" } },
  }),
  async (c) => c.json(await customersService.createCustomer(c.get("db"), c.req.valid("json")), 201)
);
