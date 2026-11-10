// 매장 훅(목록·선택 매장·매장 선택). 매장을 고르면 선택 매장 캐시를 바꾸고 이전 매장 범위 캐시를 버린다(design.md §4.4).
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { createApiClient } from "@/api/client";
import type { ApiError } from "@/api/errors";
import { createQueryClient } from "@/api/query-client";
import { qk } from "@/api/query-keys";
import { __resetSessionForTest, setAccessToken } from "@/api/session";
import { shopFixture } from "@/test/msw/fixtures";
import {
  selectedShopHandler,
  selectShopHandler,
  shopsListHandler,
} from "@/test/msw/handlers/shops";
import { createRequestLog } from "@/test/msw/request-log";
import { server } from "@/test/msw/server";
import { useSelectedShop, useSelectShop, useShops } from "./queries";

const BASE = "http://api.test";
const otherShop = { ...shopFixture, id: 8, name: "키엠씨 뷰티 2호점" };
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
  setAccessToken("access-1");
  log = createRequestLog();
});

describe("useShops", () => {
  it("쪽 번호를 키와 page 매개변수로 쓴다", async () => {
    server.use(shopsListHandler(BASE, [shopFixture, otherShop]));
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useShops(client, 2), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items.map((shop) => shop.id)).toEqual([7, 8]);
    expect(log.requests[0]).toMatchObject({ method: "GET", path: "/shops" });
    expect(new URLSearchParams(log.requests[0].search).get("page")).toBe("2");
  });
});

describe("useSelectedShop", () => {
  it("선택 매장을 돌려준다", async () => {
    server.use(selectedShopHandler(BASE, shopFixture));
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useSelectedShop(client), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(7);
  });

  it("매장이 없으면 SHOP_NOT_SELECTED 오류이고 재시도하지 않는다", async () => {
    server.use(selectedShopHandler(BASE, null));
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useSelectedShop(client), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).code).toBe("SHOP_NOT_SELECTED");
    expect(log.requests).toHaveLength(1);
  });
});

describe("useSelectShop", () => {
  it("성공하면 선택 매장 캐시를 바꾸고 매장 범위 캐시를 모두 버린다", async () => {
    server.use(selectShopHandler(BASE, 204));
    const { client, wrapper, queryClient } = setup();
    queryClient.setQueryData(qk.shops.selected(), shopFixture);
    queryClient.setQueryData(qk.customers.list(7, { q: "", page: 1 }), []);
    queryClient.setQueryData(qk.menus.details(7, 2), []);
    const { result } = renderHook(() => useSelectShop(client), { wrapper });

    await act(() => result.current.mutateAsync(otherShop));

    expect(JSON.parse(log.requests[0].body)).toEqual({ shop_id: 8 });
    expect(queryClient.getQueryData(qk.shops.selected())).toEqual(otherShop);
    expect(queryClient.getQueryCache().findAll({ queryKey: qk.shopScope() })).toHaveLength(0);
  });

  it("실패하면 캐시를 그대로 둔다", async () => {
    server.use(selectShopHandler(BASE, 404));
    const { client, wrapper, queryClient } = setup();
    queryClient.setQueryData(qk.shops.selected(), shopFixture);
    queryClient.setQueryData(qk.customers.groups(7), []);
    const { result } = renderHook(() => useSelectShop(client), { wrapper });

    await act(() => result.current.mutateAsync(otherShop).catch(() => undefined));

    expect(queryClient.getQueryData(qk.shops.selected())).toEqual(shopFixture);
    expect(queryClient.getQueryCache().findAll({ queryKey: qk.shopScope() })).toHaveLength(1);
  });
});
