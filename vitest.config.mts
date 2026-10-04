import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Pure logic runs in node; component tests opt into jsdom with a
    // `// @vitest-environment jsdom` pragma at the top of the file.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    restoreMocks: true,
  },
});
