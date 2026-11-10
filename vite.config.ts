import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { buildDevProxy, envCheckPlugin } from "./vite-plugins";

export default defineConfig(({ command, mode }) => {
  // VITE_ 접두사가 없는 DEV_API_PROXY_TARGET도 읽는다(브라우저 번들에는 들어가지 않는다)
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), envCheckPlugin()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    // 개발 서버만 프록시를 쓴다(빌드에는 프록시 설정이 필요 없다)
    server: command === "serve" ? { proxy: buildDevProxy(env) } : undefined,
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
  };
});
