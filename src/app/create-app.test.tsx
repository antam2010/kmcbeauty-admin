// 앱 조립(createApp): 클라이언트를 한 번만 만드는가(감사 결함 F8), 세션 만료·매장 미선택 처리기(design.md §4.2·§4.4).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { qk } from "@/api/query-keys";
import { clearSession } from "@/api/session";
import { expectLocation, renderRoute } from "@/test/render-route";

// 시험은 저장소 루트에서 돈다(jsdom 환경의 import.meta.url은 file: 주소가 아니다)
const ROOT = process.cwd();
const EXPIRED_MESSAGE = "로그인이 만료됐어요. 다시 로그인해 주세요.";

function appSources(dir: string): string[] {
  return readdirSync(path.join(ROOT, dir), { recursive: true, encoding: "utf8" })
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .map((file) => path.posix.join(dir, file.split(path.sep).join("/")));
}

describe("API 클라이언트는 한 번만 만든다(감사 결함 F8)", () => {
  it("앱 코드에서 createApiClient를 부르는 곳은 create-app.ts 하나이고, createApp은 main.tsx의 모듈 범위에서 한 번 부른다", () => {
    const callers = ["src/app", "src/features", "src/lib"]
      .flatMap(appSources)
      .filter((file) => /createApiClient\(/.test(readFileSync(path.join(ROOT, file), "utf8")));
    expect(callers).toEqual(["src/app/create-app.tsx"]);

    const main = readFileSync(path.join(ROOT, "src/main.tsx"), "utf8");
    const calls = main.split("\n").filter((line) => /createApp\(/.test(line));
    // 들여쓰기 없는 줄 = 모듈 범위(컴포넌트 안이 아님). StrictMode가 렌더링을 두 번 해도 다시 부르지 않는다
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatch(/^const app = createApp\(/);
  });

  it("StrictMode로 그려도 첫 방문의 부팅 갱신은 1회다(앱을 두 번 만들지 않는다)", async () => {
    const { log } = renderRoute("/customers", { session: "S0", strict: true });
    await screen.findByRole("heading", { level: 1, name: "로그인" });
    // /customers loader 1회 + /login loader 1회. 두 loader 모두 같은 앱의 세션 모듈을 쓴다
    expect(log.count("POST", "/auth/refresh")).toBe(2);
  });
});

describe("세션 만료 처리기", () => {
  it("같은 만료로 두 번 불려도 이동은 한 번, 문구도 한 번이다", async () => {
    const { app, router } = renderRoute("/customers", { session: "S2" });
    await screen.findByRole("heading", { level: 1, name: "고객" });
    const visited: string[] = [];
    const unsubscribe = router.subscribe((state) => {
      if (state.navigation.state === "idle") visited.push(state.location.pathname);
    });

    act(() => {
      // 클라이언트가 처리기를 부르기 전과 같은 상태: 갱신 401이 세션을 지웠다(세대가 하나 오름)
      clearSession();
      app.handlers.onSessionExpired();
      app.handlers.onSessionExpired();
    });

    await screen.findByRole("heading", { level: 1, name: "로그인" });
    unsubscribe();
    expectLocation(router, "/login?next=%2Fcustomers");
    expect(visited.filter((p) => p === "/login")).toHaveLength(1);
    expect(screen.getAllByText(EXPIRED_MESSAGE)).toHaveLength(1);
  });
});

describe("매장 미선택 처리기(onShopNotSelected)", () => {
  it("업무 화면에서는 매장 범위 캐시를 버리고 /shops?next=<현재 경로>로 보낸다(문서 새로고침 없음)", async () => {
    const { app, router } = renderRoute("/customers", { session: "S2" });
    await screen.findByRole("heading", { level: 1, name: "고객" });
    const { queryClient } = app.services;
    queryClient.setQueryData(qk.customers.groups(7), []);
    const href = window.location.href;

    act(() => app.handlers.onShopNotSelected());

    await screen.findByRole("heading", { level: 1, name: "매장 선택" });
    expectLocation(router, "/shops?next=%2Fcustomers");
    expect(queryClient.getQueryCache().findAll({ queryKey: qk.shopScope() })).toHaveLength(0);
    expect(window.location.href).toBe(href);
  });

  it("매장 선택 화면과 로그인 화면에서는 이동하지 않는다(그 화면이 다음 경로를 정한다)", async () => {
    const { app, router } = renderRoute("/shops?next=%2Fcustomers", { session: "S1" });
    await screen.findByRole("heading", { level: 1, name: "매장 선택" });
    act(() => app.handlers.onShopNotSelected());
    expectLocation(router, "/shops?next=%2Fcustomers");
  });
});
