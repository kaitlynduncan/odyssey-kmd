import { describe, it, expect, beforeEach } from "vitest";
import * as settingsService from "../src/modules/settings/service";
import { createTestDb, resetTestDb } from "./helpers/testDb";

describe("settings service", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await resetTestDb(db);
  });

  it("creates a default settings row on first access", async () => {
    const settings = await settingsService.getSettings(db);
    expect(settings.prepTimeMinutes).toBe(20);
    expect(settings.isAcceptingOrders).toBe(true);
  });

  it("returns the same row on subsequent reads instead of creating duplicates", async () => {
    const first = await settingsService.getSettings(db);
    const second = await settingsService.getSettings(db);
    expect(second.id).toBe(first.id);
  });

  it("persists updates", async () => {
    await settingsService.getSettings(db);
    const updated = await settingsService.updateSettings(db, { prepTimeMinutes: 35, autoAccept: true });
    expect(updated.prepTimeMinutes).toBe(35);
    expect(updated.autoAccept).toBe(true);
  });
});
