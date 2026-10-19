import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/globalSetup.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          // Testerna delar en databas, så kör filerna en i taget
          fileParallelism: false,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
