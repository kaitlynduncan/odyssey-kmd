import { defineConfig } from "orval";

export default defineConfig({
  odyssey: {
    input: {
      target: "../../services/backend/openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "./src/generated/endpoints",
      schemas: "./src/generated/models",
      client: "react-query",
      httpClient: "fetch",
      baseUrl: process.env.API_BASE_URL ?? "http://localhost:8787/api",
      override: {
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
});
