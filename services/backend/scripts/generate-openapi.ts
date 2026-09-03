import { writeFileSync } from "node:fs";
import { createApp } from "../src/app";

// Imports the Hono app directly (no running server needed) and dumps its
// generated OpenAPI document to disk. Orval then reads this file to produce
// the typed client + React Query hooks in packages/api-client.
const app = createApp();
const doc = app.getOpenAPIDocument({
  openapi: "3.1.0",
  info: { title: "Odyssey Restaurant Ops API", version: "0.1.0" },
});

writeFileSync("./openapi.json", JSON.stringify(doc, null, 2));
console.log("Wrote openapi.json");
