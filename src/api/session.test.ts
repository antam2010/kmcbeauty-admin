// 세션 저장소와 갱신(AC-UI-002-05, AC-UI-002-06의 갱신 결과 종류, EC-01·EC-03·EC-31·EC-32).
// 토큰은 모듈 변수에만 있다. 갱신은 미들웨어를 거치지 않는 맨 요청이고 single-flight다.
import { MutationObserver } from "@tanstack/react-query";
import { delay, HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginMutationOptions, logout, meQueryOptions } from "@/features/auth/queries";
import {
  loginBody,
  loginHandler,
  logoutHandler,
  refreshHandler,
  refreshWith,
  slowRefresh,
} from "@/test/msw/handlers/auth";
import { createRequestLog } from "@/test/msw/request-log";
import { server } from "@/test/msw/server";
import { createApiClient } from "./client";
import { ApiError, unwrap } from "./errors";
import { createQueryClient } from "./query-client";
import * as sessionModule from "./session";
import {
  __resetSessionForTest,
  clearSession,
  configureSession,
  ensureSession,
  getAccessToken,
  refreshSession,
  sessionStore,
  setAccessToken,
} from "./session";

const BASE = "http://api.test";
let log: ReturnType<typeof createRequestLog>;

beforeEach(() => {
  __resetSessionForTest();
  log = createRequestLog();
  configureSession({ baseUrl: BASE, fetch: log.fetch });
});

afterEach(() => {
  vi.useRealTimers();
});

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("오류가 나야 한다");
}

describe("refreshSession 결과", () => {
  it("200 → 새 액세스 토큰 저장, true. 맨 POST(본문 없음, credentials include, X-Refresh-Token 없음)", async () => {
    server.use(refreshWith(BASE, 200));
    await expect(refreshSession()).resolves.toBe(true);
    expect(getAccessToken()).toBe("access-2");
    expect(log.requests).toEqual([
      {
        method: "POST",
        path: "/auth/refresh",
        search: "",
        credentials: "include",
        authorization: null,
        refreshTokenHeader: null,
        contentType: null,
        body: "",
      },
    ]);
  });

  it("401 → 세션 삭제, false", async () => {
    setAccessToken("expired-1");
    server.use(refreshWith(BASE, 401));
    await expect(refreshSession()).resolves.toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it("200인데 access_token이 없으면 세션을 만들지 않고 false", async () => {
    setAccessToken("expired-1");
    server.use(refreshHandler(BASE, () => HttpResponse.json({ refresh_token: "refresh-2" })));
    await expect(refreshSession()).resolves.toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it.each([
    [403, "이 작업을 할 권한이 없어요."],
    [429, "요청이 많아요. 잠시 뒤 다시 시도해 주세요."],
    [503, "서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요."],
  ])("%i → 그 status의 ApiError, 세션 유지(EC-31·EC-32)", async (status, message) => {
    setAccessToken("expired-1");
    server.use(refreshWith(BASE, status));
    const error = await rejection(refreshSession());
    expect(error.status).toBe(status);
    expect(error.kind).toBe("http");
    expect(error.message).toBe(message);
    expect(getAccessToken()).toBe("expired-1");
  });

  it("네트워크 오류 → kind network ApiError, 세션 유지", async () => {
    setAccessToken("expired-1");
    server.use(refreshWith(BASE, "network"));
    const error = await rejection(refreshSession());
    expect(error.kind).toBe("network");
    expect(getAccessToken()).toBe("expired-1");
  });
});

describe("single-flight", () => {
  it("진행 중이면 같은 Promise를 돌려주고 갱신 요청은 1회다(EC-01)", async () => {
    vi.useFakeTimers();
    server.use(slowRefresh(BASE, 300));
    const first = refreshSession();
    await vi.advanceTimersByTimeAsync(100);
    const second = refreshSession();
    await vi.advanceTimersByTimeAsync(100);
    const third = refreshSession();
    expect(second).toBe(first);
    expect(third).toBe(first);
    await vi.advanceTimersByTimeAsync(300);
    await expect(Promise.all([first, second, third])).resolves.toEqual([true, true, true]);
    expect(log.count("POST", "/auth/refresh")).toBe(1);
  });

  it("끝난 뒤(성공·실패 모두) 다음 호출은 새 갱신을 보낸다", async () => {
    server.use(refreshWith(BASE, 503));
    await rejection(refreshSession());
    server.use(refreshWith(BASE, 200));
    await expect(refreshSession()).resolves.toBe(true);
    await expect(refreshSession()).resolves.toBe(true);
    expect(log.count("POST", "/auth/refresh")).toBe(3);
  });

  it("navigator.locks가 있으면 kmc-admin-refresh 잠금 안에서 갱신한다", async () => {
    const request = vi.fn((_name: string, callback: () => Promise<boolean>) => callback());
    Object.defineProperty(navigator, "locks", { value: { request }, configurable: true });
    try {
      server.use(refreshWith(BASE, 200));
      await expect(refreshSession()).resolves.toBe(true);
      expect(request).toHaveBeenCalledTimes(1);
      expect(request.mock.calls[0][0]).toBe("kmc-admin-refresh");
    } finally {
      Reflect.deleteProperty(navigator, "locks");
    }
  });

  it("navigator.locks가 없어도 예외 없이 같은 동작이다(EC-03)", async () => {
    expect("locks" in navigator).toBe(false);
    server.use(refreshWith(BASE, 200));
    const [a, b] = [refreshSession(), refreshSession()];
    expect(b).toBe(a);
    await expect(a).resolves.toBe(true);
    expect(log.count("POST", "/auth/refresh")).toBe(1);
  });
});

describe("ensureSession", () => {
  it("메모리 토큰이 있으면 갱신 없이 true", async () => {
    setAccessToken("access-1");
    await expect(ensureSession()).resolves.toBe(true);
    expect(log.requests).toHaveLength(0);
  });

  it("토큰이 없으면 쿠키 갱신을 한 번 시도한다", async () => {
    server.use(refreshWith(BASE, 200));
    await expect(ensureSession()).resolves.toBe(true);
    expect(getAccessToken()).toBe("access-2");
    expect(log.count("POST", "/auth/refresh")).toBe(1);
  });

  it("토큰이 없고 갱신이 401이면 false(첫 방문 — 예외 없음)", async () => {
    server.use(refreshWith(BASE, 401));
    await expect(ensureSession()).resolves.toBe(false);
    expect(getAccessToken()).toBeNull();
  });
});

describe("구독 저장소", () => {
  it("세션 유무를 비추고 바뀔 때 알린다", () => {
    const listener = vi.fn();
    const unsubscribe = sessionStore.subscribe(listener);
    expect(sessionStore.getSnapshot()).toBe(false);
    setAccessToken("access-1");
    expect(sessionStore.getSnapshot()).toBe(true);
    clearSession();
    expect(sessionStore.getSnapshot()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("__resetSessionForTest는 토큰과 진행 중 갱신을 지운다", () => {
    setAccessToken("access-1");
    __resetSessionForTest();
    expect(getAccessToken()).toBeNull();
  });
});

// ── AC-UI-002-05: 로그인 → 보호 요청 → 새로고침 흉내 → 로그아웃 ───────────────────────────
// 로그인·로그아웃 함수는 features/auth/queries.ts에 있다(앱 계층이 쓰는 그대로 시험한다).

const TOKENS = ["access-1", "access-2", "refresh-1", "refresh-2"];

function makeClient() {
  return createApiClient({
    baseUrl: BASE,
    fetch: log.fetch,
    onSessionExpired: () => undefined,
    onShopNotSelected: () => undefined,
  });
}

/** /users/me: 보낸 Authorization을 그대로 돌려준다. */
function meEcho() {
  return http.get(`${BASE}/users/me`, ({ request }) =>
    request.headers.get("authorization")
      ? HttpResponse.json({
          id: 1,
          email: "owner@kmc.test",
          auth: request.headers.get("authorization"),
        })
      : new HttpResponse(null, { status: 401 }),
  );
}

function storageEntries(storage: Storage): string[] {
  return Array.from({ length: storage.length }, (_, i) => {
    const key = storage.key(i) ?? "";
    return `${key}=${storage.getItem(key)}`;
  });
}

const containsToken = (value: unknown) =>
  TOKENS.some((token) => JSON.stringify(value ?? null).includes(token));

describe("AC-UI-002-05 메모리 토큰과 새로고침 복원", () => {
  it("(가)(나) 토큰은 어떤 저장소에도 쓰이지 않고, 새로고침 뒤 갱신 1회로 Bearer access-2를 쓴다", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const cookieSet = vi.spyOn(Document.prototype, "cookie", "set");
    const indexedDbOpen = vi.mocked(globalThis.indexedDB.open);
    server.use(
      loginHandler(BASE, () => HttpResponse.json(loginBody("access-1", "refresh-1"))),
      refreshWith(BASE, 200),
      meEcho(),
    );
    const queryClient = createQueryClient();
    const client = makeClient();

    // (가) 로그인 → 보호 요청
    const login = new MutationObserver(queryClient, loginMutationOptions(client));
    await expect(
      login.mutate({ email: "owner@kmc.test", password: "pw" }),
    ).resolves.toBeUndefined();
    const me = await queryClient.fetchQuery(meQueryOptions(client));
    expect(me).toMatchObject({ auth: "Bearer access-1" });

    // (나) 새로고침 흉내: 세션 모듈을 초기 상태로 → ensureSession → 보호 요청
    __resetSessionForTest();
    await expect(ensureSession()).resolves.toBe(true);
    await expect(unwrap(client.GET("/users/me"))).resolves.toMatchObject({
      auth: "Bearer access-2",
    });

    const refreshes = log.requests.filter((r) => r.path === "/auth/refresh");
    expect(refreshes).toHaveLength(1);
    expect(refreshes[0]).toMatchObject({ method: "POST", body: "", credentials: "include" });
    const login1 = log.requests.find((r) => r.path === "/auth/login");
    expect(login1).toMatchObject({
      credentials: "include",
      contentType: "application/x-www-form-urlencoded",
    });
    expect(new URLSearchParams(login1?.body)).toEqual(
      new URLSearchParams({
        username: "owner@kmc.test",
        password: "pw",
        grant_type: "password",
        scope: "",
      }),
    );

    // (가) 감시한 쓰기의 인자, 흐름 뒤의 저장소·쿠키, indexedDB.open 호출
    expect(setItem.mock.calls.filter((args) => containsToken(args))).toEqual([]);
    expect(cookieSet.mock.calls.filter((args) => containsToken(args))).toEqual([]);
    expect(storageEntries(localStorage).filter(containsToken)).toEqual([]);
    expect(storageEntries(sessionStorage).filter(containsToken)).toEqual([]);
    expect(containsToken(document.cookie)).toBe(false);
    expect(indexedDbOpen).not.toHaveBeenCalled();

    // (나) 쿼리 캐시·변경 캐시·세션 모듈이 내보내는 값에 refresh- 가 없다
    const queryStates = JSON.stringify(
      queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.state),
    );
    const mutationStates = JSON.stringify(
      queryClient
        .getMutationCache()
        .getAll()
        .map((m) => m.state),
    );
    const exported = JSON.stringify(
      Object.entries(sessionModule).map(([name, value]) => [
        name,
        typeof value === "function" ? null : value,
      ]),
    );
    expect(queryClient.getMutationCache().getAll()).toHaveLength(1);
    expect(queryStates).not.toContain("refresh-");
    expect(mutationStates).not.toContain("refresh-");
    expect(exported).not.toContain("refresh-");
    expect(getAccessToken()).toBe("access-2");
  });

  it("로그인 응답에 access_token이 없으면 실패로 처리하고 세션을 만들지 않는다(EC-04)", async () => {
    server.use(loginHandler(BASE, () => HttpResponse.json({ refresh_token: "refresh-1" })));
    const login = new MutationObserver(createQueryClient(), loginMutationOptions(makeClient()));
    await expect(login.mutate({ email: "owner@kmc.test", password: "pw" })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(getAccessToken()).toBeNull();
  });
});

describe("AC-UI-002-05 (다) 응답을 기다리지 않는 로그아웃", () => {
  it.each([
    ["500", () => new HttpResponse(null, { status: 500 })],
    ["네트워크 오류", () => HttpResponse.error()],
    [
      "응답하지 않음",
      async () => {
        await delay("infinite");
        return new HttpResponse(null, { status: 204 });
      },
    ],
  ])(
    "%s: 돌아온 즉시 토큰 null·쿼리 캐시 0개, POST /auth/logout이 include로 1회",
    async (_name, respond) => {
      vi.useFakeTimers();
      let markReached: () => void = () => undefined;
      const reached = new Promise<void>((resolve) => {
        markReached = resolve;
      });
      server.use(
        logoutHandler(BASE, () => {
          markReached();
          return respond();
        }),
      );
      const queryClient = createQueryClient();
      queryClient.setQueryData(["me"], { id: 1 });
      queryClient.setQueryData(["shop", 7, "customers", "groups"], []);
      const client = makeClient();
      setAccessToken("access-1");

      logout(client, queryClient);

      // 타이머를 전혀 흘리지 않은 채 판정한다
      expect(getAccessToken()).toBeNull();
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
      // 판정은 위에서 끝났다. 요청은 그래도 서버에 닿는다 — 처리기까지 간 것을 확인한다.
      // 남은 응답 처리는 진짜 타이머로 마치게 한다(가짜 타이머로 두면 500 응답 뒤 정리가 약 4초 멈춘다 — 실측).
      vi.useRealTimers();
      await reached;
      const sent = log.requests.filter((r) => r.path === "/auth/logout");
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({ method: "POST", credentials: "include" });
    },
  );
});
