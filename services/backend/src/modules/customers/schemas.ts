import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customers } from "../../db/schema";

export const customerSelectSchema = createSelectSchema(customers);
export const createCustomerInputSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

// Aggregate fields are computed server-side from orders, never reduced
// client-side over the full order list.
export const customerWithStatsSchema = customerSelectSchema.extend({
  orderCount: z.number(),
  totalSpentCents: z.number(),
});

export const customerDetailSchema = customerWithStatsSchema.extend({
  recentOrders: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.string(),
      totalCents: z.number(),
      createdAt: z.string(),
    })
  ),
});
