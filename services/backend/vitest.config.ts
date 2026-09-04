import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // These are integration tests sharing one physical Postgres test
    // database, and each file's beforeEach does a TRUNCATE ... CASCADE.
    // Running test files concurrently means one file's reset can wipe rows
    // another file is mid-assertion on (foreign key violations, mismatched
    // IDs, "items" that vanish between insert and read). Files must run
    // sequentially since they share global state.
    fileParallelism: false,
  },
});
