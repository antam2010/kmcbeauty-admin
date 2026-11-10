// API 클라이언트 미들웨어(AC-UI-002-06 (가)~(사) API 부분, AC-UI-002-07 (가) 처리기 호출, EC-01·EC-02).
// 요청 기록은 fetch 층에서 한다(MSW 처리기에서는 credentials가 보이지 않는다 — M2 사전 점검).
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginBody, loginHandler, refreshWith, slowRefresh } from "@/test/msw/handlers/auth";
import { createRequestLog } from "@/test/msw/request-log";
import { server } from "@/test/msw/server";
import { createApiClient } from "./client";
import { ApiError, unwrap } from "./errors";
import { createQueryClient } from "./query-client";
import {
  __resetSessionForTest,
  clearSession,
  ensureSession,
  getAccessToken,
  sessionStore,
  setAccessToken,
} from "./session";

const BASE = "http://api.test";
const PROTECTED = ["/phonebooks", "/phonebooks/groups", "/users/me"] as const;
const AUTH_PATHS = new Set(["/auth/login", "/auth/refresh", "/auth/logout"]);

let log: ReturnType<typeof createRequestLog>;
let onSessionExpired: ReturnType<typeof vi.fn<() => void>>;
let onShopNotSelected: ReturnType<typeof vi.fn<() => void>>;

function makeClient() {
  return createApiClient({ baseUrl: BASE, fetch: log.fetch, onSessionExpired, onShopNotSelected });
}

/** expired-1이 붙은 요청에는 401, 그 밖의 토큰에는 200을 주는 보호 API 처리기. */
function protectedHandlers(alwaysUnauthorized = false) {
  return PROTECTED.map((path) =>
    http.get(`${BASE}${path}`, ({ request }) => {
      const auth = request.headers.get("authorization");
      if (alwaysUnauthorized || auth === null || auth === "Bearer expired-1") {
        return new HttpResponse(null, { status: 401 });
      }
      return HttpResponse.json({ path, auth });
    }),
  );
}

function sendAll(client: ReturnType<typeof makeClient>) {
  return Promise.allSettled([
    unwrap(client.GET("/phonebooks")),
    unwrap(client.GET("/phonebooks/groups")),
    unwrap(client.GET("/users/me")),
  ]);
}

function reasons(results: PromiseSettledResult<unknown>[]): ApiError[] {
  return results.map((result) => {
    expect(result.status).toBe("rejected");
    return (result as PromiseRejectedResult).reason as ApiError;
  });
}

/** 모든 요청 기록에서: credentials는 인증 3개 경로만 include, 나머지는 omit(사용자 결정 F5), X-Refresh-Token은 어디에도 없다. */
function expectCookieScope() {
  expect(log.requests.length).toBeGreaterThan(0);
  for (const request of log.requests) {
    expect({ path: request.path, credentials: request.credentials }).toEqual({
      path: request.path,
      credentials: AUTH_PATHS.has(request.path) ? "include" : "omit",
    });
    expect(request.refreshTokenHeader).toBeNull();
  }
}

beforeEach(() => {
  __resetSessionForTest();
  log = createRequestLog();
  onSessionExpired = vi.fn<() => void>();
  onShopNotSelected = vi.fn<() => void>();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("요청 미들웨어", () => {
  it("메모리 토큰이 있으면 Authorization: Bearer를 붙이고, 없으면 붙이지 않는다", async () => {
    server.use(http.get(`${BASE}/shops/selected`, () => HttpResponse.json({ id: 7 })));
    const client = makeClient();
    await unwrap(client.GET("/shops/selected"));
    setAccessToken("access-1");
    await unwrap(client.GET("/shops/selected"));
    expect(log.requests.map((r) => r.authorization)).toEqual([null, "Bearer access-1"]);
    expectCookieScope();
  });
});

describe("동시 401과 갱신(AC-UI-002-06)", () => {
  it("(가) 갱신 200 → 갱신 1회, 세 요청 각 2회, 재시도는 Bearer access-2", async () => {
    setAccessToken("expired-1");
    server.use(...protectedHandlers(), refreshWith(BASE, 200));
    const results = await sendAll(makeClient());

    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled", "fulfilled"]);
    expect(log.count("POST", "/auth/refresh")).toBe(1);
    for (const path of PROTECTED) {
      const sent = log.requests.filter((r) => r.path === path);
      expect(sent.map((r) => r.authorization)).toEqual(["Bearer expired-1", "Bearer access-2"]);
    }
    expect(onSessionExpired).not.toHaveBeenCalled();
    expectCookieScope();
  });

  it("(나) 갱신 401 → 만료 처리기 1회(쿼리 캐시는 처리기가 비움), 세션 삭제, 각 요청 401", async () => {
    setAccessToken("expired-1");
    const queryClient = createQueryClient();
    queryClient.setQueryData(["shop", 7, "customers", "groups"], []);
    onSessionExpired.mockImplementation(() => queryClient.clear());
    server.use(...protectedHandlers(), refreshWith(BASE, 401));
    const errors = reasons(await sendAll(makeClient()));

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(getAccessToken()).toBeNull();
    expect(log.count("POST", "/auth/refresh")).toBe(1);
    expect(errors.map((e) => e.status)).toEqual([401, 401, 401]);
    expectCookieScope();
  });

  it("(다) 재시도한 요청이 또 401이면 다시 갱신하지 않고 status 401로 끝난다", async () => {
    setAccessToken("expired-1");
    server.use(...protectedHandlers(true), refreshWith(BASE, 200));
    const client = makeClient();
    const error = await unwrap(client.GET("/phonebooks")).catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect(log.count("POST", "/auth/refresh")).toBe(1);
    expect(log.count("GET", "/phonebooks")).toBe(2);
    expect(onSessionExpired).not.toHaveBeenCalled();
    expectCookieScope();
  });

  it("(라) /auth/login 401은 갱신하지 않는다", async () => {
    server.use(loginHandler(BASE, () => new HttpResponse(null, { status: 401 })));
    const client = makeClient();
    const error = await unwrap(
      client.POST("/auth/login", {
        body: { username: "a@b.co", password: "x", grant_type: "password", scope: "" },
        bodySerializer: (body) => new URLSearchParams(body as Record<string, string>),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    ).catch((e: ApiError) => e);

    expect((error as ApiError).status).toBe(401);
    expect(log.count("POST", "/auth/refresh")).toBe(0);
    expect(onSessionExpired).not.toHaveBeenCalled();
    expectCookieScope();
  });

  it.each([
    ["(마) 네트워크 오류", "network" as const, { kind: "network", status: 0 }],
    ["(바) 429", 429, { kind: "http", status: 429 }],
    ["(사) 503", 503, { kind: "http", status: 503 }],
  ])("%s → 그 종류의 오류, 만료 처리기 0회, 세션 유지", async (_name, outcome, want) => {
    setAccessToken("expired-1");
    server.use(...protectedHandlers(), refreshWith(BASE, outcome));
    const errors = reasons(await sendAll(makeClient()));

    for (const error of errors) {
      expect({ kind: error.kind, status: error.status }).toEqual(want);
    }
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe("expired-1");
    expect(log.count("POST", "/auth/refresh")).toBe(1);
    expectCookieScope();
  });

  it("(바) 갱신 429면 원래 요청 문구가 429 문구다(EC-31)", async () => {
    setAccessToken("expired-1");
    server.use(...protectedHandlers(), refreshWith(BASE, 429));
    const error = await unwrap(makeClient().GET("/users/me")).catch((e: ApiError) => e);
    expect((error as ApiError).message).toBe("요청이 많아요. 잠시 뒤 다시 시도해 주세요.");
  });

  it("갱신이 진행 중일 때 온 네 번째 401도 같은 갱신을 기다린다(EC-01)", async () => {
    vi.useFakeTimers();
    setAccessToken("expired-1");
    server.use(...protectedHandlers(), slowRefresh(BASE, 300));
    const client = makeClient();
    const first = sendAll(client);
    await vi.advanceTimersByTimeAsync(100);
    expect(log.count("POST", "/auth/refresh")).toBe(1);
    const fourth = unwrap(client.GET("/users/me"));
    await vi.advanceTimersByTimeAsync(500);

    await expect(fourth).resolves.toEqual({ path: "/users/me", auth: "Bearer access-2" });
    expect((await first).map((r) => r.status)).toEqual(["fulfilled", "fulfilled", "fulfilled"]);
    expect(log.count("POST", "/auth/refresh")).toBe(1);
  });

  it("갱신이 이미 끝난 뒤 도착한 옛 토큰의 401은 다시 갱신하지 않고 새 토큰으로 한 번 보낸다", async () => {
    setAccessToken("expired-1");
    server.use(
      http.get(`${BASE}/users/me`, ({ request }) => {
        if (request.headers.get("authorization") === "Bearer access-2") {
          return HttpResponse.json({ ok: true });
        }
        // 응답이 오기 전에 다른 요청의 갱신이 끝나 토큰이 바뀐 상황
        setAccessToken("access-2");
        return new HttpResponse(null, { status: 401 });
      }),
    );
    await expect(unwrap(makeClient().GET("/users/me"))).resolves.toEqual({ ok: true });
    expect(log.count("POST", "/auth/refresh")).toBe(0);
    expect(log.count("GET", "/users/me")).toBe(2);
  });

  it("본문이 있는 POST가 401 뒤 재시도되면 본문이 같다(EC-02)", async () => {
    setAccessToken("expired-1");
    server.use(
      http.post(`${BASE}/phonebooks`, ({ request }) =>
        request.headers.get("authorization") === "Bearer access-2"
          ? HttpResponse.json({ id: 1 })
          : new HttpResponse(null, { status: 401 }),
      ),
      refreshWith(BASE, 200),
    );
    await unwrap(
      makeClient().POST("/phonebooks", { body: { name: "김민", phone_number: "010-1234-5678" } }),
    );
    const sent = log.requests.filter((r) => r.path === "/phonebooks");
    expect(sent).toHaveLength(2);
    expect(sent[1].body).toBe(sent[0].body);
    expect(JSON.parse(sent[1].body)).toEqual({ name: "김민", phone_number: "010-1234-5678" });
  });

  it("갱신 401 뒤 늦게 도착한, 그 갱신 전에 보낸 요청의 401은 다시 갱신하지 않고 만료 처리기도 다시 부르지 않는다(감사 결함 F2)", async () => {
    setAccessToken("expired-1");
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      refreshWith(BASE, 401),
      http.get(`${BASE}/users/me`, () => new HttpResponse(null, { status: 401 })),
      http.get(`${BASE}/phonebooks`, async () => {
        await gate; // 갱신 401이 끝난 뒤에 응답한다
        return new HttpResponse(null, { status: 401 });
      }),
    );
    const client = makeClient();
    const slow = unwrap(client.GET("/phonebooks")).catch((e: unknown) => e);
    await unwrap(client.GET("/users/me")).catch(() => undefined);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    release();
    const error = await slow;

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect(log.count("POST", "/auth/refresh")).toBe(1);
    expect(log.count("GET", "/phonebooks")).toBe(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("갱신이 성공했는데 다시 보낼 때 토큰이 없으면 빈 Bearer를 보내지 않고 원래 401로 끝난다(감사 결함 F6)", async () => {
    // 일부러 만든 재현: 세션 구독자가 새 토큰 알림 안에서 세션을 지운다
    setAccessToken("expired-1");
    const unsubscribe = sessionStore.subscribe(() => {
      if (getAccessToken() === "access-2") clearSession();
    });
    try {
      server.use(...protectedHandlers(), refreshWith(BASE, 200));
      const error = await unwrap(makeClient().GET("/users/me")).catch((e: unknown) => e);

      expect((error as ApiError).status).toBe(401);
      expect(log.count("GET", "/users/me")).toBe(1);
      // Headers가 끝 공백을 잘라 "Bearer"로 기록될 수 있어 둘 다 잡는다
      const emptyBearer = log.requests.filter(
        (r) => r.authorization !== null && /^Bearer\s*$/.test(r.authorization),
      );
      expect(emptyBearer).toEqual([]);
      expect(onSessionExpired).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
    }
  });
});

describe("첫 방문 S0(만료 문구 없음)", () => {
  it("메모리 토큰 없이 ensureSession()의 갱신이 401이면 false이고 만료 처리기를 부르지 않는다", async () => {
    makeClient();
    server.use(refreshWith(BASE, 401));
    await expect(ensureSession()).resolves.toBe(false);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("토큰 없이 보낸 요청이 401이고 갱신도 401이면 만료 처리기를 부르지 않는다", async () => {
    server.use(...protectedHandlers(), refreshWith(BASE, 401));
    const error = await unwrap(makeClient().GET("/users/me")).catch((e: ApiError) => e);
    expect((error as ApiError).status).toBe(401);
    expect(log.count("POST", "/auth/refresh")).toBe(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("토큰 없이 보낸 요청이 401이고 쿠키 갱신이 되면 새 토큰으로 한 번 다시 보낸다", async () => {
    server.use(...protectedHandlers(), refreshWith(BASE, 200));
    await expect(unwrap(makeClient().GET("/users/me"))).resolves.toEqual({
      path: "/users/me",
      auth: "Bearer access-2",
    });
  });
});

describe("매장 미선택(AC-UI-002-07 (가) M2 부분)", () => {
  const shopNotSelected = {
    detail: { code: "SHOP_NOT_SELECTED", detail: "상점을 먼저 선택해주세요.", hint: null },
  };

  it("404 SHOP_NOT_SELECTED → 처리기 1회, 오류는 앱 문구", async () => {
    setAccessToken("access-1");
    server.use(
      http.get(`${BASE}/phonebooks`, () => HttpResponse.json(shopNotSelected, { status: 404 })),
    );
    const error = await unwrap(makeClient().GET("/phonebooks")).catch((e: ApiError) => e);
    expect(onShopNotSelected).toHaveBeenCalledTimes(1);
    expect((error as ApiError).code).toBe("SHOP_NOT_SELECTED");
    expect((error as ApiError).message).toBe("매장을 먼저 골라 주세요.");
  });

  it("다른 404(봉투 없음·다른 코드)에는 처리기를 부르지 않는다", async () => {
    server.use(
      http.get(`${BASE}/phonebooks`, () => HttpResponse.json({ error: "x" }, { status: 404 })),
      http.get(`${BASE}/phonebooks/groups`, () =>
        HttpResponse.json({ detail: { code: "SHOP_NOT_FOUND", detail: "x" } }, { status: 404 }),
      ),
      http.get(`${BASE}/users/me`, () => new HttpResponse("<html></html>", { status: 404 })),
    );
    const client = makeClient();
    await Promise.allSettled([
      unwrap(client.GET("/phonebooks")),
      unwrap(client.GET("/phonebooks/groups")),
      unwrap(client.GET("/users/me")),
    ]);
    expect(onShopNotSelected).not.toHaveBeenCalled();
  });

  it("401 뒤 재시도한 응답이 SHOP_NOT_SELECTED여도 처리기를 1회 부른다", async () => {
    setAccessToken("expired-1");
    server.use(
      http.get(`${BASE}/phonebooks`, ({ request }) =>
        request.headers.get("authorization") === "Bearer access-2"
          ? HttpResponse.json(shopNotSelected, { status: 404 })
          : new HttpResponse(null, { status: 401 }),
      ),
      refreshWith(BASE, 200),
    );
    await unwrap(makeClient().GET("/phonebooks")).catch(() => undefined);
    expect(onShopNotSelected).toHaveBeenCalledTimes(1);
  });
});

describe("credentials 범위", () => {
  it("로그인·갱신·로그아웃만 include, 나머지는 omit(사용자 결정 F5)", async () => {
    server.use(
      loginHandler(BASE, () => HttpResponse.json(loginBody("access-1", "refresh-1"))),
      http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${BASE}/shops/selected`, () => HttpResponse.json({ id: 7 })),
      refreshWith(BASE, 200),
    );
    const client = makeClient();
    await unwrap(
      client.POST("/auth/login", {
        body: { username: "a@b.co", password: "x", grant_type: "password", scope: "" },
        bodySerializer: (body) => new URLSearchParams(body as Record<string, string>),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    );
    await unwrap(client.GET("/shops/selected"));
    await ensureSession();
    await unwrap(client.POST("/auth/logout"));
    expect(log.requests.map((r) => [r.path, r.credentials])).toEqual([
      ["/auth/login", "include"],
      ["/shops/selected", "omit"],
      ["/auth/refresh", "include"],
      ["/auth/logout", "include"],
    ]);
    expectCookieScope();
  });
});
