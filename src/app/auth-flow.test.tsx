// 화면으로 하는 인증 흐름(AC-UI-002-05 (라)): 로그인 → 새로고침 흉내(같은 경로 다시 그리기) → 사용자 메뉴의 로그아웃.
// 토큰은 메모리에만 있고(어떤 저장소에도 쓰지 않음), 로그아웃은 응답을 기다리지 않고 바로 세션과 캐시를 비운다.
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { getAccessToken } from "@/api/session";
import { shopFixture, TEST_API_ORIGIN } from "@/test/msw/fixtures";
import { loginBody, loginHandler, logoutHandler, refreshWith } from "@/test/msw/handlers/auth";
import { selectedShopHandler } from "@/test/msw/handlers/shops";
import { server } from "@/test/msw/server";
import { expectLocation, renderRoute } from "@/test/render-route";

const TOKENS = ["access-1", "access-2", "refresh-1", "refresh-2"];

function storageEntries(storage: Storage): string[] {
  return Array.from({ length: storage.length }, (_, i) => {
    const key = storage.key(i) ?? "";
    return `${key}=${storage.getItem(key)}`;
  });
}

function expectNoTokenStored() {
  const stored = [
    ...storageEntries(window.localStorage),
    ...storageEntries(window.sessionStorage),
    document.cookie,
  ].join("\n");
  for (const token of TOKENS) expect(stored).not.toContain(token);
  expect(vi.mocked(globalThis.indexedDB.open)).not.toHaveBeenCalled();
}

describe("AC-UI-002-05 (라) 로그인 → 새로고침 흉내 → 로그아웃(화면)", () => {
  it("토큰은 어디에도 저장되지 않고, 새로고침 뒤 보호 화면이 그려지며, 로그아웃하면 즉시 비우고 /login이다", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();
    const first = renderRoute("/login?next=%2Fcustomers", {
      session: "S0",
      handlers: [
        loginHandler(TEST_API_ORIGIN, () => HttpResponse.json(loginBody("access-1", "refresh-1"))),
        selectedShopHandler(TEST_API_ORIGIN, shopFixture),
      ],
    });
    await screen.findByRole("heading", { level: 1, name: "로그인" });
    await user.type(screen.getByLabelText(/^이메일/), "owner@kmc.test");
    await user.type(screen.getByLabelText(/^비밀번호/), "pw-secret-7");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    await screen.findByRole("heading", { level: 1, name: "고객" });
    expect(getAccessToken()).toBe("access-1");
    first.unmount();

    // 새로고침 흉내: 메모리 세션을 비운 채 같은 경로를 새 앱으로 그린다. 쿠키 갱신이 200이면 보호 화면이 그대로다
    const reloaded = renderRoute("/customers", {
      session: "S0",
      handlers: [
        refreshWith(TEST_API_ORIGIN, 200, "access-2"),
        selectedShopHandler(TEST_API_ORIGIN, shopFixture),
        logoutHandler(TEST_API_ORIGIN, async () => {
          await delay("infinite");
          return new HttpResponse(null, { status: 204 });
        }),
      ],
    });
    await screen.findByRole("heading", { level: 1, name: "고객" });
    expectLocation(reloaded.router, "/customers");
    expect(reloaded.headings).not.toContain("로그인");
    expect(reloaded.log.count("POST", "/auth/refresh")).toBe(1);
    expect(getAccessToken()).toBe("access-2");

    // 로그아웃 뒤에는 서버가 쿠키를 지웠다 — 로그인 화면 loader의 갱신은 401이다
    server.use(refreshWith(TEST_API_ORIGIN, 401));
    await user.click(screen.getByRole("button", { name: "사용자 메뉴" }));
    const menu = await screen.findByRole("dialog", { name: "사용자 메뉴" });
    await user.click(within(menu).getByRole("button", { name: "로그아웃" }));

    // 응답하지 않는 로그아웃이어도 돌아온 즉시 비운다
    expect(getAccessToken()).toBeNull();
    expect(reloaded.app.services.queryClient.getQueryCache().getAll()).toHaveLength(0);
    await screen.findByRole("heading", { level: 1, name: "로그인" });
    expectLocation(reloaded.router, "/login");
    expect(screen.queryByText("로그인이 만료됐어요. 다시 로그인해 주세요.")).toBeNull();
    await waitFor(() => expect(reloaded.log.count("POST", "/auth/logout")).toBe(1));
    expect(reloaded.log.requests.find((r) => r.path === "/auth/logout")?.credentials).toBe(
      "include",
    );

    for (const call of setItem.mock.calls) {
      for (const token of TOKENS) expect(JSON.stringify(call)).not.toContain(token);
    }
    expectNoTokenStored();
  });
});
