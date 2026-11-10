// @vitest-environment node
// 커버리지 설정 값(AC-UI-002-04 (가), QG-05). 기준값은 vite.config.ts 한 곳에서 오고, 단계별 값을 이 시험이 고정한다.
// M1~M7 커밋: 80/80/80/80, M8 마지막 커밋: 85/85/85/80(줄·문장·함수·분기 — spec.md C2).
import type { UserConfig } from "vite";
import { describe, expect, it } from "vitest";
import type { InlineConfig } from "vitest/node";
import viteConfig from "../../vite.config";

type ConfigFactory = (env: { command: "serve" | "build"; mode: string }) => UserConfig & {
  test?: InlineConfig;
};

function resolveCoverage() {
  const config = (viteConfig as unknown as ConfigFactory)({ command: "serve", mode: "test" });
  const coverage = config.test?.coverage;
  if (coverage?.provider !== "v8") throw new Error("v8 커버리지 설정이 없다");
  return coverage;
}

describe("커버리지 설정(AC-UI-002-04 (가))", () => {
  const coverage = resolveCoverage();

  it("포함 목록이 src/**/*.{ts,tsx}와 vite-plugins.ts다(scripts/*.mjs는 자식 프로세스라 넣지 않는다)", () => {
    expect(coverage.include).toEqual(["src/**/*.{ts,tsx}", "vite-plugins.ts"]);
  });

  it("제외 목록이 생성 타입·선언 파일·진입점·미리보기·시험 장치·ui-core 색인·시험 파일이다", () => {
    expect(coverage.exclude).toEqual([
      "src/api/schema.d.ts",
      "**/*.d.ts",
      "src/main.tsx",
      "src/preview/**",
      "src/test/**",
      "src/ui-core/index.ts",
      "**/*.test.{ts,tsx}",
    ]);
  });

  it("M1~M7 단계 기준값은 줄·문장·함수·분기 모두 80이다", () => {
    expect(coverage.thresholds).toEqual({ lines: 80, statements: 80, functions: 80, branches: 80 });
  });

  it("보고 형식은 text·json·json-summary다", () => {
    expect(coverage.reporter).toEqual(["text", "json", "json-summary"]);
  });
});
