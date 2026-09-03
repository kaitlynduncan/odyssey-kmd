import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { settings } from "../../db/schema";

// jsonb columns have no fixed shape as far as Postgres/Drizzle is concerned,
// so drizzle-zod falls back to a recursive (z.lazy) "any valid JSON" schema
// for them. That's correct for validation but @hono/zod-openapi can't turn
// an open-ended recursive schema into an OpenAPI document, so we give this
// column its actual expected shape explicitly instead of letting it fall
// back to the generic case.
const dayHoursSchema = z.object({ open: z.string(), close: z.string() });
const openingHoursSchema = z.record(
  z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  dayHoursSchema
);

export const settingsSelectSchema = createSelectSchema(settings, {
  openingHours: openingHoursSchema,
});
export const updateSettingsInputSchema = createInsertSchema(settings, {
  openingHours: openingHoursSchema,
})
  .omit({ id: true, updatedAt: true })
  .partial();
