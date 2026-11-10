// 세션 저장소와 갱신(AC-UI-002-05, AC-UI-002-06의 갱신 결과 종류, EC-01·EC-03·EC-31·EC-32).
// 토큰은 모듈 변수에만 있다. 갱신은 미들웨어를 거치지 않는 맨 요청이고 single-flight다.
import { HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshHandler, refreshWith, slowRefresh } from "@/test/msw/handlers/auth";
import { createRequestLog } from "@/test/msw/request-log";
import { server } from "@/test/msw/server";
import { ApiError } from "./errors";
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
