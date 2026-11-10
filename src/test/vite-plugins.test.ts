// @vitest-environment node
// 운영 빌드 env 검사와 개발 프록시 설정 값(AC-UI-002-03, EC-35).
// 플러그인 훅과 순수 함수를 명시한 env 객체로 직접 부른다. 실제 빌드는 §4.1 AC-03 블록이 따로 판정한다.
import { describe, expect, it, vi } from "vitest";
import { buildDevProxy, envCheckPlugin } from "../../vite-plugins";

interface EnvCheckInput {
  command: "build" | "serve";
  mode: string;
  env: Record<string, string | undefined>;
}

/** envCheckPlugin의 configResolved 훅을 가짜 설정 객체로 실행하는 함수를 돌려준다. */
function runEnvCheck(input: EnvCheckInput): () => void {
  const hook = envCheckPlugin().configResolved;
  if (typeof hook !== "function") throw new Error("configResolved 훅이 함수가 아니다");
  return () => {
    hook.call({} as never, input as never);
  };
}

describe("운영 빌드 env 검사(AC-UI-002-03)", () => {
  const production = (value: string | undefined): EnvCheckInput => ({
    command: "build",
    mode: "production",
    env: value === undefined ? {} : { VITE_API_BASE_URL: value },
  });

  it.each([
    ["값 없음", undefined],
    ["http 주소", "http://api.example.test"],
    ["호스트 없는 https://", "https://"],
    ["공백이 든 https://a b", "https://a b"],
  ])("운영 모드에서 %s이면 변수 이름을 담은 오류로 실패한다", (_label, value) => {
    expect(runEnvCheck(production(value))).toThrowError(/VITE_API_BASE_URL/);
  });

  it("운영 모드에서 https 주소이면 통과한다", () => {
    expect(runEnvCheck(production("https://api-beauty.dongri.kr"))).not.toThrow();
  });

  it("development 모드 빌드는 값이 없어도 통과한다", () => {
    expect(runEnvCheck({ command: "build", mode: "development", env: {} })).not.toThrow();
  });

  it("개발 서버(serve)는 값이 없어도 통과한다", () => {
    expect(runEnvCheck({ command: "serve", mode: "production", env: {} })).not.toThrow();
  });
});

describe("개발 프록시 설정 값(AC-UI-002-03 (가))", () => {
  it("대상이 없으면 /api 키 하나가 http://localhost:8000을 가리키고 /api 접두사를 지운다", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const proxy = buildDevProxy({});
    expect(Object.keys(proxy)).toEqual(["/api"]);
    const api = proxy["/api"];
    expect(api.target).toBe("http://localhost:8000");
    expect(api.changeOrigin).toBe(true);
    expect(api.rewrite?.("/api/auth/login")).toBe("/auth/login");
    expect(warn).not.toHaveBeenCalled();
  });

  it("DEV_API_PROXY_TARGET으로 대상을 덮어쓰고, 127.0.0.1이면 경고하지 않는다", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const proxy = buildDevProxy({ DEV_API_PROXY_TARGET: "http://127.0.0.1:9000" });
    expect(proxy["/api"].target).toBe("http://127.0.0.1:9000");
    expect(warn).not.toHaveBeenCalled();
  });

  it("대상 호스트가 로컬이 아니면 경고를 한 줄 출력한다", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const proxy = buildDevProxy({ DEV_API_PROXY_TARGET: "https://api-beauty.dongri.kr" });
    expect(proxy["/api"].target).toBe("https://api-beauty.dongri.kr");
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain("https://api-beauty.dongri.kr");
    expect(message).not.toContain("\n");
  });
});
