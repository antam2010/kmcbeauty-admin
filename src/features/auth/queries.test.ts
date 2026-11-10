// 인증·내 정보 훅(plan.md §B.1 "훅"). 흐름 전체(저장소·새로고침·로그아웃)는 src/api/session.test.ts가 판정한다.
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { createApiClient } from "@/api/client";
import { createQueryClient } from "@/api/query-client";
import { qk } from "@/api/query-keys";
import { __resetSessionForTest, getAccessToken, setAccessToken } from "@/api/session";
import { loginBody, loginHandler, logoutHandler } from "@/test/msw/handlers/auth";
import { createRequestLog } from "@/test/msw/request-log";
import { server } from "@/test/msw/server";
import { useHasSession, useLogin, useLogout, useMe } from "./queries";

const BASE = "http://api.test";
let log: ReturnType<typeof createRequestLog>;

function setup() {
  const queryClient = createQueryClient();
  const client = createApiClient({
    baseUrl: BASE,
    fetch: log.fetch,
    onSessionExpired: () => undefined,
    onShopNotSelected: () => undefined,
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, client, wrapper };
}

beforeEach(() => {
  __resetSessionForTest();
  log = createRequestLog();
});

describe("useLogin·useHasSession", () => {
  it("로그인하면 세션 상태가 true로 바뀌고 변경 data는 undefined다", async () => {
    server.use(loginHandler(BASE, () => HttpResponse.json(loginBody("access-1", "refresh-1"))));
    const { client, wrapper } = setup();
    const { result } = renderHook(
      () => ({ login: useLogin(client), hasSession: useHasSession() }),
      {
        wrapper,
      },
    );
    expect(result.current.hasSession).toBe(false);
    await act(() => result.current.login.mutateAsync({ email: "owner@kmc.test", password: "pw" }));
    expect(result.current.hasSession).toBe(true);
    expect(result.current.login.data).toBeUndefined();
    expect(getAccessToken()).toBe("access-1");
  });
});

describe("useMe", () => {
  it('키 ["me"]로 GET /users/me를 가져온다', async () => {
    setAccessToken("access-1");
    server.use(
      http.get(`${BASE}/users/me`, () => HttpResponse.json({ id: 1, email: "owner@kmc.test" })),
    );
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useMe(client), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ id: 1 });
    expect(log.requests[0]).toMatchObject({ path: "/users/me", authorization: "Bearer access-1" });
  });
});

describe("useLogout", () => {
  it("부르면 바로 세션과 캐시를 비운다", async () => {
    let markReached: () => void = () => undefined;
    const reached = new Promise<void>((resolve) => {
      markReached = resolve;
    });
    server.use(
      logoutHandler(BASE, () => {
        markReached();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    setAccessToken("access-1");
    const { client, wrapper, queryClient } = setup();
    queryClient.setQueryData(qk.me(), { id: 1 });
    const { result } = renderHook(() => useLogout(client), { wrapper });
    act(() => result.current());
    expect(getAccessToken()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    await reached;
  });
});
