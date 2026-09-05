import { describe, it, expect, beforeEach } from "vitest";
import * as settingsService from "../src/modules/settings/service";
import { createTestDb, resetTestDb } from "./helpers/testDb";

describe("settings service edge cases", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await resetTestDb(db);
  });

  it("updating one field leaves other previously-updated fields unchanged", async () => {
    await settingsService.getSettings(db);
    await settingsService.updateSettings(db, { prepTimeMinutes: 45 });
    const updated = await settingsService.updateSettings(db, { autoAccept: true });

    expect(updated.prepTimeMinutes).toBe(45);
    expect(updated.autoAccept).toBe(true);
  });
});
