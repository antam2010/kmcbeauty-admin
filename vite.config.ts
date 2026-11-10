import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    // 밖의 TZ와 상관없이 한국 시간대로 돈다(acceptance.md §0, timezone.test.ts가 증명)
    env: { TZ: "Asia/Seoul" },
    coverage: {
      provider: "v8",
      include: ["src/ui-core/**/*.{ts,tsx}"],
      exclude: ["src/ui-core/index.ts", "src/ui-core/**/*.test.{ts,tsx}"],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 80,
      },
    },
  },
});
