// 경로 표·보호·next(AC-UI-002-09), 미리보기 개발 전용 경로(AC-UI-002-13 (가)(나)), 갱신 401 뒤 화면(AC-UI-002-06 (나) 화면 부분),
// S0 결정(첫 방문에는 만료 문구 없음), 경로 오류 화면(EC-06). 기대값은 acceptance.md §3.3·§3.2 표를 그대로 옮겼다.
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { shopFixture, TEST_API_ORIGIN } from "@/test/msw/fixtures";
import { loginBody, loginHandler, refreshWith } from "@/test/msw/handlers/auth";
import { selectedShopHandler } from "@/test/msw/handlers/shops";
import { server } from "@/test/msw/server";
import { expectLocation, renderRoute, type SessionState } from "@/test/render-route";
import { devRoutes } from "./dev-routes";

const EXPIRED_MESSAGE = "로그인이 만료됐어요. 다시 로그인해 주세요.";

const heading = (name: string) => screen.findByRole("heading", { level: 1, name });

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
    await user.type(screen.getByLabelText(/^이메일/), "owner@kmc.test");
    await user.type(screen.getByLabelText(/^비밀번호/), "pw");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    await heading(titleOf(destination));
    expectLocation(router, destination);
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
