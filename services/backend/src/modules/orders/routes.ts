import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Db } from "../../db/client";
import {
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  listOrdersQuerySchema,
  orderListResponseSchema,
  orderDetailResponseSchema,
} from "./schemas";
import * as ordersService from "./service";
import { OrderError } from "./service";

type Env = { Variables: { db: Db } };

export const ordersRoutes = new OpenAPIHono<Env>();

const errorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

// ---- GET /orders -------------------------------------------------------

const listRoute = createRoute({
  method: "get",
  path: "/orders",
  tags: ["orders"],
  request: { query: listOrdersQuerySchema },
  responses: {
    200: { description: "List orders", content: { "application/json": { schema: orderListResponseSchema } } },
  },
});

ordersRoutes.openapi(listRoute, async (c) => {
  const query = c.req.valid("query");
  const result = await ordersService.listOrders(c.get("db"), query);
  return c.json(result, 200);
});

// ---- GET /orders/:id -----------------------------------------------------

const getRoute = createRoute({
  method: "get",
  path: "/orders/{id}",
  tags: ["orders"],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: "Order detail", content: { "application/json": { schema: orderDetailResponseSchema } } },
    404: { description: "Not found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

ordersRoutes.openapi(getRoute, async (c) => {
  const { id } = c.req.valid("param");
  try {
    const order = await ordersService.getOrderById(c.get("db"), id);
    return c.json(order, 200);
  } catch (err) {
    if (err instanceof OrderError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 404);
    }
    throw err;
  }
});

// ---- POST /orders --------------------------------------------------------

const createRouteDef = createRoute({
  method: "post",
  path: "/orders",
  tags: ["orders"],
  request: {
    body: { content: { "application/json": { schema: createOrderInputSchema } } },
  },
  responses: {
    201: { description: "Order created", content: { "application/json": { schema: orderDetailResponseSchema } } },
    422: { description: "Unprocessable order", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

ordersRoutes.openapi(createRouteDef, async (c) => {
  const input = c.req.valid("json");
  try {
    const order = await ordersService.createOrder(c.get("db"), input);
    const full = await ordersService.getOrderById(c.get("db"), order.id);
    return c.json(full, 201);
  } catch (err) {
    if (err instanceof OrderError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 422);
    }
    throw err;
  }
});

// ---- PATCH /orders/:id/status ---------------------------------------------

const updateStatusRoute = createRoute({
  method: "patch",
  path: "/orders/{id}/status",
  tags: ["orders"],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: updateOrderStatusInputSchema } } },
  },
  responses: {
    200: { description: "Status updated", content: { "application/json": { schema: orderDetailResponseSchema } } },
    409: { description: "Invalid transition", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

ordersRoutes.openapi(updateStatusRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { status } = c.req.valid("json");
  try {
    await ordersService.transitionStatus(c.get("db"), id, status);
    const full = await ordersService.getOrderById(c.get("db"), id);
    return c.json(full, 200);
  } catch (err) {
    if (err instanceof OrderError) {
      return c.json({ error: { code: err.code, message: err.message } }, err.status as 409);
    }
    throw err;
  }
});
