// 경로 표·보호·next(AC-UI-002-09), 미리보기 개발 전용 경로(AC-UI-002-13 (가)(나)), 갱신 401 뒤 화면(AC-UI-002-06 (나) 화면 부분),
// S0 결정(첫 방문에는 만료 문구 없음), 경로 오류 화면(EC-06). 기대값은 acceptance.md §3.3·§3.2 표를 그대로 옮겼다.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse, http } from "msw";
import { createBrowserRouter, type LoaderFunctionArgs } from "react-router";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { __resetSessionForTest, setAccessToken } from "@/api/session";
import { shopFixture, TEST_API_ORIGIN, userFixture } from "@/test/msw/fixtures";
import { loginBody, loginHandler, refreshHandler, refreshWith } from "@/test/msw/handlers/auth";
import { selectedShopHandler, shopsListHandler } from "@/test/msw/handlers/shops";
import { meHandler } from "@/test/msw/handlers/users";
import { server } from "@/test/msw/server";
import { expectLocation, locationOf, renderRoute, type SessionState } from "@/test/render-route";
import { App, createApp } from "./create-app";
import { devRoutes } from "./dev-routes";
import { createLoaders } from "./loaders";

const EXPIRED_MESSAGE = "로그인이 만료됐어요. 다시 로그인해 주세요.";

const heading = (name: string) => screen.findByRole("heading", { level: 1, name });

/**
 * 브라우저 라우터에 넘길 창. 문서 이동(location.assign·replace)만 가짜로 바꿔 다른 출처로 가려는 시도를 센다.
 * 나머지(주소·history·이벤트)는 jsdom 창을 그대로 쓴다. 시험이 끝나면 주소를 /로 되돌린다.
 */
function fakeBrowserWindow(path: string) {
  window.history.replaceState(null, "", path);
  onTestFinished(() => window.history.replaceState(null, "", "/"));
  const assign = vi.fn();
  const replace = vi.fn();
  const location = {
    get href() {
      return window.location.href;
    },
    get origin() {
      return window.location.origin;
    },
    get protocol() {
      return window.location.protocol;
    },
    get host() {
      return window.location.host;
    },
    get pathname() {
      return window.location.pathname;
    },
    get search() {
      return window.location.search;
    },
    get hash() {
      return window.location.hash;
    },
    assign,
    replace,
    reload: vi.fn(),
    toString: () => window.location.href,
  };
  const win = {
    location,
    history: window.history,
    document: window.document,
    sessionStorage: window.sessionStorage,
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    scrollTo: vi.fn(),
  } as unknown as Window;
  return { win, assign, replace };
}

// [상태, 연 경로, 결과 경로, 보이는 h1] — acceptance.md §3.3 경로 표
const ROUTE_TABLE: [SessionState, string, string, string][] = [
  ["S0", "/customers", "/login?next=%2Fcustomers", "로그인"],
  ["S0", "/shops", "/login?next=%2Fshops", "로그인"],
  ["S0", "/", "/login?next=%2F", "로그인"],
  ["S0", "/terms-of-service", "/terms-of-service", "이용약관"],
  ["S0", "/privacy-policy", "/privacy-policy", "개인정보처리방침"],
  ["S1", "/reservations", "/shops?next=%2Freservations", "매장 선택"],
  ["S1", "/shops", "/shops", "매장 선택"],
  ["S2", "/", "/reservations", "예약 캘린더"],
  ["S2", "/login", "/reservations", "예약 캘린더"],
  ["S2", "/customers", "/customers", "고객"],
  ["S2", "/treatment-menus", "/treatment-menus", "시술 메뉴"],
  ["S2", "/treatments", "/treatments", "시술 이력"],
  ["S0", "/no-such-page", "/no-such-page", "찾을 수 없는 페이지예요."],
  ["S2", "/no-such-page", "/no-such-page", "찾을 수 없는 페이지예요."],
  ["S0", "/manager/treatments", "/manager/treatments", "찾을 수 없는 페이지예요."],
  ["S2", "/manager/treatments", "/manager/treatments", "찾을 수 없는 페이지예요."],
];

// 보호 경로가 다른 화면으로 갈 때 한 번도 그려지면 안 되는 h1
const PROTECTED_HEADINGS: Record<string, string> = {
  "/customers": "고객",
  "/shops": "매장 선택",
  "/": "예약 캘린더",
  "/reservations": "예약 캘린더",
};

describe("AC-UI-002-09 (가) 경로 표(§3.3)", () => {
  it.each(ROUTE_TABLE)("%s에서 %s → %s, h1 %s", async (session, path, destination, title) => {
    const { router, headings } = renderRoute(path, { session });
    await heading(title);
    expectLocation(router, destination);
    if (/^\/(login|shops)/.test(destination) && destination !== path && PROTECTED_HEADINGS[path]) {
      expect(headings).not.toContain(PROTECTED_HEADINGS[path]);
    }
  });
});

describe("AC-UI-002-13 (가)(나) 미리보기 개발 전용 경로", () => {
  it("dev-routes.ts의 목록은 시험 환경(DEV)에서 /dev/preview 하나다", () => {
    expect(devRoutes.map((route) => route.path)).toEqual(["/dev/preview"]);
  });

  it("(가) 개발 경로 목록으로 만든 라우터에서 /dev/preview는 컴포넌트 미리보기다", async () => {
    const { router } = renderRoute("/dev/preview", { devRoutes });
    // 미리보기 모듈은 lazy로 늦게 가져오므로(운영 빌드에서 빠지는 청크) 첫 그림을 넉넉히 기다린다
    await screen.findByRole("heading", { level: 1, name: "컴포넌트 미리보기" }, { timeout: 5000 });
    expectLocation(router, "/dev/preview");
  });

  it("(나) 빈 목록(운영)으로 만든 라우터에서 /dev/preview는 찾을 수 없는 페이지다", async () => {
    const { router } = renderRoute("/dev/preview", { devRoutes: [] });
    await heading("찾을 수 없는 페이지예요.");
    expectLocation(router, "/dev/preview");
  });
});

// [?next= 뒤의 쿼리 원문, 이동] — acceptance.md §3.3 next 표본 표(매개변수 없음은 null)
const NEXT_SAMPLES: [string | null, string][] = [
  [null, "/reservations"],
  ["", "/reservations"],
  ["%2Fcustomers", "/customers"],
  ["%2Fcustomers%3Fq%3D%EA%B9%80", "/customers?q=김"],
  ["customers", "/reservations"],
  ["%2F%2Fevil.example", "/reservations"],
  ["https%3A%2F%2Fevil.example", "/reservations"],
  ["javascript%3Aalert(1)", "/reservations"],
  ["/\\evil.example", "/reservations"],
  ["/%5Cevil.example", "/reservations"],
  ["/%09/evil.example", "/reservations"],
  ["/%0A/evil.example", "/reservations"],
  ["/%20/evil.example", "/reservations"],
  // M4 감사 F-1 표본 — 정본 §3.3 표 반영은 sync 단계(직렬화하면 //로 시작하는 값)
  ["%2F.%2F%2Fevil.example", "/reservations"],
  ["%2Fa%2F..%2F%2Fevil.example", "/reservations"],
  ["%2F%252e%2F%2Fevil.example", "/reservations"],
];

// M4 감사 F-1 표본 — 정본 §3.3 표 반영은 sync 단계
const DOT_SEGMENT_SAMPLES = [
  "%2F.%2F%2Fevil.example",
  "%2Fa%2F..%2F%2Fevil.example",
  "%2F%252e%2F%2Fevil.example",
];

const loginPath = (raw: string | null) => (raw === null ? "/login" : `/login?next=${raw}`);
const titleOf = (destination: string) =>
  destination.startsWith("/customers") ? "고객" : "예약 캘린더";

describe("AC-UI-002-09 (나) S2에서 /login?next= — 로그인 화면 loader 사용처", () => {
  it.each(NEXT_SAMPLES)("next=%s → %s", async (raw, destination) => {
    const { router } = renderRoute(loginPath(raw), { session: "S2" });
    await heading(titleOf(destination));
    expectLocation(router, destination);
  });

  it.each(DOT_SEGMENT_SAMPLES)(
    "loader가 던지는 redirect의 Location은 /reservations다(next=%s)",
    async (raw) => {
      const { app } = renderRoute("/terms-of-service", { session: "S2" });
      await heading("이용약관");
      const args = {
        request: new Request(`${window.location.origin}${loginPath(raw)}`),
        params: {},
        context: undefined,
      } as unknown as LoaderFunctionArgs;
      const thrown = await createLoaders(app.services)
        .redirectIfSession(args)
        .catch((error: unknown) => error);
      expect(thrown).toBeInstanceOf(Response);
      expect((thrown as Response).headers.get("Location")).toBe("/reservations");
    },
  );

  it.each(DOT_SEGMENT_SAMPLES)(
    "브라우저 라우터로 연 앱도 다른 출처로 문서 이동하지 않고 /reservations에 닿는다(next=%s)",
    async (raw) => {
      const { win, assign, replace } = fakeBrowserWindow(loginPath(raw));
      __resetSessionForTest();
      setAccessToken("access-1");
      server.use(
        refreshWith(TEST_API_ORIGIN, 401),
        meHandler(TEST_API_ORIGIN, userFixture),
        selectedShopHandler(TEST_API_ORIGIN, shopFixture),
        shopsListHandler(TEST_API_ORIGIN, [shopFixture]),
      );
      const app = createApp({
        baseUrl: TEST_API_ORIGIN,
        devRoutes: [],
        createRouter: (routes) => createBrowserRouter(routes, { window: win }),
      });
      onTestFinished(() => app.router.dispose());
      render(<App app={app} />);
      // 문서 이동을 시도하면 이 대기가 끝나지 않고, 실패 메시지에 assign 인자(이동하려던 주소)가 남는다
      await waitFor(() => {
        expect(assign).not.toHaveBeenCalled();
        expect(app.router.state.initialized).toBe(true);
      });
      await heading("예약 캘린더");
      expect(locationOf(app.router)).toBe("/reservations");
      expect(assign).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    },
  );
});

describe("AC-UI-002-09 (다) S0에서 /login?next= 뒤 로그인 — 로그인 제출 사용처", () => {
  it.each(NEXT_SAMPLES)("next=%s → 로그인 성공(선택 매장 있음) → %s", async (raw, destination) => {
    const user = userEvent.setup();
    const { router } = renderRoute(loginPath(raw), {
      session: "S0",
      handlers: [
        loginHandler(TEST_API_ORIGIN, () => HttpResponse.json(loginBody("access-1", "refresh-1"))),
        selectedShopHandler(TEST_API_ORIGIN, shopFixture),
      ],
    });
    await heading("로그인");
    const navigate = vi.spyOn(router, "navigate");
    await user.type(screen.getByLabelText(/^이메일/), "owner@kmc.test");
    await user.type(screen.getByLabelText(/^비밀번호/), "pw");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    await heading(titleOf(destination));
    expectLocation(router, destination);
    // 외부 주소로 가려다 거부된 이동(External navigation is not allowed)이 없다
    expect(
      navigate.mock.calls.map(([to]) => String(to)).filter((to) => to.startsWith("//")),
    ).toEqual([]);
    await waitFor(() =>
      expect(navigate.mock.settledResults.map((result) => result.type)).toEqual(
        navigate.mock.calls.map(() => "fulfilled"),
      ),
    );
  });
});

describe("AC-UI-002-06 (나) 화면 부분 — 이 탭에서 로그인돼 있던 세션의 갱신 401", () => {
  it("/customers에서 동시 401 세 개와 갱신 401 → /login?next=%2Fcustomers와 만료 문구 한 번, 쿼리 캐시 0개", async () => {
    const { router, app } = renderRoute("/customers", { session: "S2" });
    await heading("고객");
    server.use(
      http.get(`${TEST_API_ORIGIN}/phonebooks`, () => new HttpResponse(null, { status: 401 })),
      http.get(
        `${TEST_API_ORIGIN}/phonebooks/groups`,
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.get(`${TEST_API_ORIGIN}/users/me`, () => new HttpResponse(null, { status: 401 })),
      refreshWith(TEST_API_ORIGIN, 401),
    );
    const { client } = app.services;

    // 화면의 훅이 보내는 것과 같은 클라이언트로 동시에 보낸다(AC-UI-002-06 Given의 세 요청)
    await Promise.all([
      client.GET("/phonebooks", { params: { query: {} } }),
      client.GET("/phonebooks/groups"),
      client.GET("/users/me"),
    ]);

    await heading("로그인");
    expectLocation(router, "/login?next=%2Fcustomers");
    expect(screen.getAllByText(EXPIRED_MESSAGE)).toHaveLength(1);
    expect(app.services.queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  // M4 감사 F-2 — 매장 선택 화면도 업무 화면처럼 만료 때 로그인 화면으로 간다(REQ-UI-002-006)
  it("/shops에서 매장 선택 요청 401과 갱신 401 → /login?next=%2Fshops와 만료 문구 한 번, 쿼리 캐시 0개", async () => {
    const user = userEvent.setup();
    const { router, app } = renderRoute("/shops", {
      session: "S2",
      shops: [shopFixture, { ...shopFixture, id: 2, name: "홍대점" }],
      handlers: [
        http.post(
          `${TEST_API_ORIGIN}/shops/selected`,
          () => new HttpResponse(null, { status: 401 }),
        ),
        refreshWith(TEST_API_ORIGIN, 401),
      ],
    });
    await heading("매장 선택");
    await user.click(await screen.findByRole("button", { name: /홍대점/ }));

    await heading("로그인");
    expectLocation(router, "/login?next=%2Fshops");
    expect(screen.getAllByText(EXPIRED_MESSAGE)).toHaveLength(1);
    // 떠난 화면의 관찰자 제거 알림은 비동기로 온다
    await waitFor(() =>
      expect(
        app.services.queryClient
          .getQueryCache()
          .getAll()
          .map((q) => q.queryKey),
      ).toEqual([]),
    );
  });

  // M4 감사 F-2 — 갱신 응답이 늦으면 로그인 화면 loader가 도는 동안 매장 선택 화면이 남아 있다.
  // 그사이 다시 그려진 화면의 쿼리가 비운 캐시를 다시 채우면 안 된다(REQ-UI-002-006 "쿼리 캐시를 지우고")
  it("/shops에서 만료될 때 갱신 응답이 늦어도 로그인 화면에 닿은 뒤 쿼리 캐시는 0개다", async () => {
    const user = userEvent.setup();
    const { router, app } = renderRoute("/shops", {
      session: "S2",
      shops: [shopFixture, { ...shopFixture, id: 2, name: "홍대점" }],
      handlers: [
        http.post(
          `${TEST_API_ORIGIN}/shops/selected`,
          () => new HttpResponse(null, { status: 401 }),
        ),
        refreshHandler(TEST_API_ORIGIN, async () => {
          await delay(300);
          return new HttpResponse(null, { status: 401 });
        }),
      ],
    });
    await heading("매장 선택");
    await user.click(await screen.findByRole("button", { name: /홍대점/ }));

    await screen.findByRole("heading", { level: 1, name: "로그인" }, { timeout: 3000 });
    expectLocation(router, "/login?next=%2Fshops");
    expect(screen.getAllByText(EXPIRED_MESSAGE)).toHaveLength(1);
    await waitFor(() =>
      expect(
        app.services.queryClient
          .getQueryCache()
          .getAll()
          .map((q) => q.queryKey),
      ).toEqual([]),
    );
  });

  it("S0 결정: 첫 방문(새로고침)의 갱신 401은 문구 없이 로그인 화면이다", async () => {
    const { router } = renderRoute("/customers", { session: "S0" });
    await heading("로그인");
    expectLocation(router, "/login?next=%2Fcustomers");
    expect(screen.queryByText(EXPIRED_MESSAGE)).toBeNull();
  });

  it("S0 결정: /login을 바로 열어도 문구가 없다", async () => {
    renderRoute("/login", { session: "S0" });
    await heading("로그인");
    expect(screen.queryByText(EXPIRED_MESSAGE)).toBeNull();
  });
});

describe("경로 오류 화면(EC-06)", () => {
  it("S0에서 갱신이 네트워크 오류면 로그인 화면이 아니라 다시 시도 화면이고, 다시 시도하면 loader를 다시 돈다", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/customers", {
      session: "S0",
      handlers: [refreshWith(TEST_API_ORIGIN, "network")],
    });
    await heading("페이지를 불러오지 못했어요.");
    expect(
      screen.getByText("서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "로그인" })).toBeNull();
    expectLocation(router, "/customers");

    server.use(refreshWith(TEST_API_ORIGIN, 401));
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    await heading("로그인");
    expectLocation(router, "/login?next=%2Fcustomers");
  });

  it("오류 봉투의 hint(개발자용 글)는 그리지 않는다(사용자 결정 F3)", async () => {
    renderRoute("/customers", {
      session: "S2",
      handlers: [
        http.get(`${TEST_API_ORIGIN}/shops/selected`, () =>
          HttpResponse.json(
            {
              detail: {
                code: "SHOP_FORBIDDEN",
                detail: "이 매장에 접근할 수 없습니다.",
                hint: "놉",
              },
            },
            { status: 403 },
          ),
        ),
      ],
    });
    await heading("페이지를 불러오지 못했어요.");
    expect(screen.getByText("이 매장에 접근할 수 없습니다.")).toBeInTheDocument();
    await waitFor(() => expect(document.body.textContent).not.toContain("놉"));
  });
});

describe("loader 안에서 끝난 세션과 확인할 수 없는 갱신", () => {
  it("이동 중 매장 확인 요청이 401이고 갱신도 401이면(이 탭의 세션 만료) 목적지를 next로 실은 로그인 화면과 만료 문구다", async () => {
    const { router } = renderRoute("/customers", {
      session: "S2",
      handlers: [
        http.get(
          `${TEST_API_ORIGIN}/shops/selected`,
          () => new HttpResponse(null, { status: 401 }),
        ),
        refreshWith(TEST_API_ORIGIN, 401),
      ],
    });
    await heading("로그인");
    expectLocation(router, "/login?next=%2Fcustomers");
    expect(screen.getAllByText(EXPIRED_MESSAGE)).toHaveLength(1);
  });

  it("로그인 화면 loader의 갱신이 네트워크 오류여도 오류 화면이 아니라 로그인 화면을 보인다", async () => {
    const { router } = renderRoute("/login", {
      session: "S0",
      handlers: [refreshWith(TEST_API_ORIGIN, "network")],
    });
    await heading("로그인");
    expectLocation(router, "/login");
    expect(screen.queryByRole("heading", { name: "페이지를 불러오지 못했어요." })).toBeNull();
  });
});
