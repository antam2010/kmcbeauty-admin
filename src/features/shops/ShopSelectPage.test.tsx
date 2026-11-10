// 매장 선택(AC-UI-002-12): 선택·캐시 교체·next 셋째 사용처·실패·빈 상태·오류·스켈레톤 시점.
// 문구는 acceptance.md §3.2, next 표본은 §3.3을 그대로 옮겼다. 사용자 결정 F3(hint를 그리지 않음)도 본다.
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { qk } from "@/api/query-keys";
import type { components } from "@/api/schema";
import { shopFixture, TEST_API_ORIGIN } from "@/test/msw/fixtures";
import { selectShopHandler } from "@/test/msw/handlers/shops";
import { expectLocation, renderRoute } from "@/test/render-route";

type Shop = components["schemas"]["ShopResponse"];

const gangnam: Shop = {
  ...shopFixture,
  id: 1,
  name: "강남점",
  address: "서울 강남구 테헤란로 1",
  address_detail: "3층",
};
const hongdae: Shop = {
  ...shopFixture,
  id: 2,
  name: "홍대점",
  address: "서울 마포구 양화로 2",
  address_detail: null,
};
const EMPTY = "등록된 매장이 없어요. 매장은 kmcbeauty 앱에서 만들 수 있어요.";

function listHandler(shops: Shop[], pages = 1) {
  return http.get(`${TEST_API_ORIGIN}/shops`, ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get("page") ?? "1");
    return HttpResponse.json({ items: shops, total: shops.length, page, size: 100, pages });
  });
}

/** 매장 1이 선택된 로그인 상태에서 /shops…를 연다. 쿼리 캐시에 매장 1 범위 항목을 둔다. */
async function openShops(
  path: string,
  handlers = [listHandler([gangnam, hongdae]), selectShopHandler(TEST_API_ORIGIN, 204)],
) {
  const user = userEvent.setup();
  const view = renderRoute(path, { session: "S2", shop: gangnam, handlers });
  await screen.findByRole("heading", { level: 1, name: "매장 선택" });
  view.app.services.queryClient.setQueryData(qk.customers.list(1, { q: "", page: 1 }), {
    items: [],
  });
  return { ...view, user };
}

const shopButton = (name: string) => screen.findByRole("button", { name: new RegExp(name) });
const shopScopeOf = (view: Awaited<ReturnType<typeof openShops>>, id: number) =>
  view.app.services.queryClient.getQueryCache().findAll({ queryKey: ["shop", id] });
const selectedId = (view: Awaited<ReturnType<typeof openShops>>) =>
  view.app.services.queryClient.getQueryData<Shop>(qk.shops.selected())?.id;

afterEach(() => {
  vi.useRealTimers();
});

describe("AC-UI-002-12 매장 선택 — 목록", () => {
  it("카드 버튼에 이름·주소 + 상세 주소·등록일이 있고, 현재 선택 매장을 표시한다. 목록은 size=100으로 가져온다", async () => {
    const view = await openShops("/shops");
    const card = await shopButton("강남점");
    expect(card).toHaveTextContent("서울 강남구 테헤란로 1 3층");
    expect(card).toHaveTextContent("2026. 11. 1.");
    expect(within(card).getByText("현재 매장")).toBeInTheDocument();
    expect(await shopButton("홍대점")).not.toHaveTextContent("현재 매장");
    const list = view.log.requests.find((r) => r.path === "/shops");
    expect(new URLSearchParams(list?.search).get("size")).toBe("100");
  });

  it("쪽이 둘 이상이면 Pagination이 있고 2쪽을 고르면 page=2로 가져온다", async () => {
    const view = await openShops("/shops", [listHandler([gangnam, hongdae], 2)]);
    await shopButton("홍대점");
    const pagination = screen.getByRole("navigation", { name: "페이지 이동" });
    await view.user.click(within(pagination).getByRole("button", { name: "2" }));
    await waitFor(() =>
      expect(
        view.log.requests.some(
          (r) => r.path === "/shops" && new URLSearchParams(r.search).get("page") === "2",
        ),
      ).toBe(true),
    );
  });

  it("(마) 목록이 빈 배열이면 빈 상태 문구를 보인다", async () => {
    await openShops("/shops", [listHandler([])]);
    expect(await screen.findByText(EMPTY)).toBeInTheDocument();
  });
});

describe("AC-UI-002-12 매장 선택 — 고르기", () => {
  it.each([
    ["(가) next 없음", "/shops", "/reservations", "예약 캘린더"],
    ["(나) next=%2Fcustomers", "/shops?next=%2Fcustomers", "/customers", "고객"],
  ])(
    "%s: 홍대점 → POST {shop_id: 2} 1회, 선택 매장 id 2, 매장 1 범위 0개, %s",
    async (_name, path, destination, title) => {
      const view = await openShops(path);
      await view.user.click(await shopButton("홍대점"));
      await screen.findByRole("heading", { level: 1, name: title });
      const posts = view.log.requests.filter(
        (r) => r.method === "POST" && r.path === "/shops/selected",
      );
      expect(posts.map((r) => JSON.parse(r.body))).toEqual([{ shop_id: 2 }]);
      expect(selectedId(view)).toBe(2);
      expect(shopScopeOf(view, 1)).toHaveLength(0);
      expectLocation(view.router, destination);
    },
  );

  it.each([
    "%2F%2Fevil.example",
    "",
    "customers",
    "https%3A%2F%2Fevil.example",
    "javascript%3Aalert(1)",
    "/\\evil.example",
    "/%5Cevil.example",
    "/%09/evil.example",
    "/%0A/evil.example",
    "/%20/evil.example",
  ])("(다) next=%s(거부 표본) → /reservations", async (raw) => {
    const view = await openShops(`/shops?next=${raw}`);
    await view.user.click(await shopButton("홍대점"));
    await screen.findByRole("heading", { level: 1, name: "예약 캘린더" });
    expect(view.log.count("POST", "/shops/selected")).toBe(1);
    expectLocation(view.router, "/reservations");
  });

  it("(다) next=%2Fcustomers%3Fq%3D%EA%B9%80(허용 표본) → /customers?q=김", async () => {
    const view = await openShops("/shops?next=%2Fcustomers%3Fq%3D%EA%B9%80");
    await view.user.click(await shopButton("홍대점"));
    await screen.findByRole("heading", { level: 1, name: "고객" });
    expectLocation(view.router, "/customers?q=김");
  });

  it("(라) 선택 요청이 500이면 캐시·경로를 그대로 두고 destructive Alert를 보이며 hint는 그리지 않는다", async () => {
    const view = await openShops("/shops", [
      listHandler([gangnam, hongdae]),
      http.post(`${TEST_API_ORIGIN}/shops/selected`, () =>
        HttpResponse.json(
          {
            detail: { code: "SHOP_SELECT_FAILED", detail: "매장을 바꾸지 못했습니다.", hint: "놉" },
          },
          { status: 500 },
        ),
      ),
    ]);
    await view.user.click(await shopButton("홍대점"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("매장을 바꾸지 못했습니다.");
    expect(document.body.textContent).not.toContain("놉");
    expect(selectedId(view)).toBe(1);
    expect(shopScopeOf(view, 1)).toHaveLength(1);
    expectLocation(view.router, "/shops");
  });
});

describe("AC-UI-002-12 (바) 목록 오류와 스켈레톤 시점(자동 진행 없는 가짜 타이머)", () => {
  it("299ms까지 스켈레톤 없음, 300ms부터 스켈레톤, 응답 뒤 destructive Alert와 다시 시도 → 다시 요청", async () => {
    vi.useFakeTimers();
    const view = renderRoute("/shops", {
      session: "S2",
      shop: gangnam,
      handlers: [
        http.get(`${TEST_API_ORIGIN}/shops`, async () => {
          await delay(400);
          return new HttpResponse("<h1>500</h1>", { status: 500 });
        }),
      ],
    });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByRole("heading", { level: 1, name: "매장 선택" })).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(screen.queryByText("불러오는 중…")).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();

    // 500은 쿼리 재시도 규칙대로 최대 2회 더 보낸다(400ms 응답 × 3 + 재시도 간격 1s·2s)
    await act(() => vi.advanceTimersByTimeAsync(5000));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.");
    const before = view.log.count("GET", "/shops");
    expect(before).toBe(3);

    // 판정은 끝났다. 다시 시도 요청의 전달 확인은 진짜 타이머로 한다(가짜 타이머로 MSW 정리가 멈추는 것을 피함 — M2 관찰)
    vi.useRealTimers();
    await userEvent.setup().click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(view.log.count("GET", "/shops")).toBeGreaterThan(before));
  });
});
