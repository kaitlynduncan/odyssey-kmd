import { eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import { settings } from "../../db/schema";

// Settings is a singleton row: exactly one record. getOrCreate() means the
// caller never has to think about seeding it.
export async function getSettings(db: Db) {
  const existing = await db.query.settings.findFirst();
  if (existing) return existing;
  const [created] = await db.insert(settings).values({}).returning();
  return created;
}

export async function updateSettings(db: Db, input: Partial<typeof settings.$inferInsert>) {
  const current = await getSettings(db);
  const [updated] = await db
    .update(settings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(settings.id, current.id))
    .returning();
  return updated;
}
