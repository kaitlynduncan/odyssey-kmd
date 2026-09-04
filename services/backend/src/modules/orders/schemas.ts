import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { orders, orderItems, orderStatusEvents, customers } from "../../db/schema";

// Base shapes are derived from the Drizzle table definitions. Do not
// hand-write parallel interfaces for these — extend what drizzle-zod gives you.
export const orderSelectSchema = createSelectSchema(orders);
export const orderItemSelectSchema = createSelectSchema(orderItems);
export const orderStatusEventSelectSchema = createSelectSchema(orderStatusEvents);

export const orderStatusSchema = orderSelectSchema.shape.status;

// Minimal customer summary embedded in order responses so the frontend can
// render a name without a second request. Null for walk-in/guest orders.
export const orderCustomerSummarySchema = createSelectSchema(customers)
  .pick({ id: true, name: true })
  .nullable();

// ---- Request schemas -------------------------------------------------------

// Creating an order: client sends menu item ids + quantities. It does NOT
// send prices or totals — those are always computed server-side from the
// current menu (see service.ts). This is enforced by simply not accepting
// those fields in the schema, not by a runtime check.
export const createOrderItemInputSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderInputSchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(createOrderItemInputSchema).min(1, "Order must contain at least one item"),
});

export const updateOrderStatusInputSchema = z.object({
  status: orderStatusSchema,
});

export const listOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  customerId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// ---- Response schemas -------------------------------------------------------

export const orderWithItemsSchema = orderSelectSchema.extend({
  items: z.array(orderItemSelectSchema),
  customer: orderCustomerSummarySchema,
});

export const orderListResponseSchema = z.object({
  data: z.array(orderWithItemsSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const orderDetailResponseSchema = orderWithItemsSchema.extend({
  statusEvents: z.array(orderStatusEventSelectSchema),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
