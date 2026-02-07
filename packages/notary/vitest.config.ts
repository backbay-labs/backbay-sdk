import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts", "src/**/__tests__/**/*.test.ts"],
    // controller.test.ts and identity.test.ts depend on bun:sqlite (Bun runtime only)
    // canonical.test.ts v2 vector depends on missing test-vectors fixture
    exclude: ["test/controller.test.ts", "test/identity.test.ts"],
  },
});
