import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { buildDevProxy, envCheckPlugin } from "./vite-plugins.ts";

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
        // scripts/*.mjs는 자식 프로세스로 실행되어 측정되지 않으므로 넣지 않는다(동작은 시험이 판정한다)
        include: ["src/**/*.{ts,tsx}", "vite-plugins.ts"],
        exclude: [
          "src/api/schema.d.ts",
          "**/*.d.ts",
          "src/main.tsx",
          "src/preview/**",
          "src/test/**",
          "src/ui-core/index.ts",
          "**/*.test.{ts,tsx}",
        ],
        reporter: ["text", "json", "json-summary"],
        // @MX:NOTE: [AUTO] 단계별 기준값 — M1~M7 커밋은 80/80/80/80, M8 마지막 커밋에서 85/85/85/80으로 올린다
        // (spec.md C2). 값을 바꿀 때는 src/test/coverage-config.test.ts의 단언을 함께 바꾼다.
        thresholds: {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 80,
        },
      },
    },
  };
});
