// 쿼리 기본값(AC-UI-002-08 (가)(나), REQ-UI-002-008의 refetchOnWindowFocus "always").
// 시간은 자동 진행이 없는 가짜 타이머로만 흘린다(acceptance.md §0).
import {
  focusManager,
  MutationObserver,
  QueryClientProvider,
  QueryObserver,
  useQuery,
} from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { delay, HttpResponse, http } from "msw";
import createClient from "openapi-fetch";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { ApiError, unwrap } from "./errors";
import { createQueryClient, shouldRetryQuery } from "./query-client";
import type { paths } from "./schema";

const BASE = "http://api.test";
const client = createClient<paths>({
  baseUrl: BASE,
  fetch: (request) => globalThis.fetch(request),
});
const page = (items: { name: string }[]) => ({
  items,
  total: items.length,
  page: 1,
  size: 20,
  pages: 1,
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("shouldRetryQuery", () => {
  const http4xx = (status: number) => new ApiError({ status, kind: "http", message: "" });
  it.each([400, 401, 403, 404, 409, 429])("http %i는 재시도하지 않는다", (status) => {
    expect(shouldRetryQuery(0, http4xx(status))).toBe(false);
  });

  it("422(validation)와 aborted는 재시도하지 않는다", () => {
    expect(
      shouldRetryQuery(0, new ApiError({ status: 422, kind: "validation", message: "" })),
    ).toBe(false);
    expect(shouldRetryQuery(0, new ApiError({ status: 0, kind: "aborted", message: "" }))).toBe(
      false,
    );
  });

  it("5xx·network는 두 번까지 재시도한다", () => {
    const cases = [
      new ApiError({ status: 500, kind: "http", message: "" }),
      new ApiError({ status: 503, kind: "http", message: "" }),
      new ApiError({ status: 0, kind: "network", message: "" }),
    ];
    for (const error of cases) {
      expect([0, 1, 2].map((count) => shouldRetryQuery(count, error))).toEqual([true, true, false]);
    }
  });
});

describe("createQueryClient 기본값", () => {
  it("staleTime 30초, 변경 재시도 0, 쿼리 재시도는 shouldRetryQuery", () => {
    const queryClient = createQueryClient();
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.retry).toBe(shouldRetryQuery);
    expect(defaults.mutations?.retry).toBe(0);
  });

  it('["shops","selected"]는 refetchOnWindowFocus "always"다', () => {
    const queryClient = createQueryClient();
    expect(queryClient.getQueryDefaults(["shops", "selected"]).refetchOnWindowFocus).toBe("always");
    expect(
      queryClient.getQueryDefaults(["shops", "list", { page: 1 }]).refetchOnWindowFocus,
    ).toBeUndefined();
  });
});

describe("요청 횟수(AC-UI-002-08 (가))", () => {
  async function countQueryRequests(respond: () => Response | Promise<Response>): Promise<number> {
    let count = 0;
    server.use(
      http.get(`${BASE}/phonebooks`, () => {
        count += 1;
        return respond();
      }),
    );
    const queryClient = createQueryClient();
    const observer = new QueryObserver(queryClient, {
      queryKey: ["shop", 7, "customers", "list", { q: "", page: 1 }],
      queryFn: ({ signal }) => unwrap(client.GET("/phonebooks", { signal })),
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(observer.getCurrentResult().status).toBe("error");
    unsubscribe();
    return count;
  }

  it.each([400, 401, 403, 404, 409, 422, 429])("쿼리 %i는 1회", async (status) => {
    expect(await countQueryRequests(() => new HttpResponse(null, { status }))).toBe(1);
  });

  it.each([500, 503])("쿼리 %i는 3회(처음 1 + 재시도 2)", async (status) => {
    expect(await countQueryRequests(() => new HttpResponse(null, { status }))).toBe(3);
  });

  it("쿼리 네트워크 오류는 3회", async () => {
    expect(await countQueryRequests(() => HttpResponse.error())).toBe(3);
  });

  it("쿼리 aborted는 1회(재시도 없음)", async () => {
    let count = 0;
    server.use(
      http.get(`${BASE}/phonebooks`, async () => {
        count += 1;
        await delay(500);
        return HttpResponse.json(page([]));
      }),
    );
    const outside = new AbortController();
    const queryClient = createQueryClient();
    const observer = new QueryObserver(queryClient, {
      queryKey: ["shop", 7, "customers", "list", { q: "", page: 1 }],
      queryFn: () => unwrap(client.GET("/phonebooks", { signal: outside.signal })),
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await vi.advanceTimersByTimeAsync(100);
    outside.abort();
    await vi.advanceTimersByTimeAsync(10_000);
    const result = observer.getCurrentResult();
    expect((result.error as ApiError).kind).toBe("aborted");
    expect(count).toBe(1);
    unsubscribe();
  });

  it.each([400, 500, 503])("변경 %i는 언제나 1회", async (status) => {
    let count = 0;
    server.use(
      http.post(`${BASE}/shops/selected`, () => {
        count += 1;
        return new HttpResponse(null, { status });
      }),
    );
    const observer = new MutationObserver(createQueryClient(), {
      mutationFn: () => unwrap(client.POST("/shops/selected", { body: { shop_id: 7 } })),
    });
    await expect(observer.mutate()).rejects.toBeInstanceOf(ApiError);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(count).toBe(1);
  });

  it("변경 네트워크 오류도 1회", async () => {
    let count = 0;
    server.use(
      http.post(`${BASE}/shops/selected`, () => {
        count += 1;
        return HttpResponse.error();
      }),
    );
    const observer = new MutationObserver(createQueryClient(), {
      mutationFn: () => unwrap(client.POST("/shops/selected", { body: { shop_id: 7 } })),
    });
    await expect(observer.mutate()).rejects.toBeInstanceOf(ApiError);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(count).toBe(1);
  });
});

function wrapperFor(queryClient: ReturnType<typeof createQueryClient>) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("이전 요청 취소(AC-UI-002-08 (나))", () => {
  it("키가 바뀌면 앞 요청의 signal이 취소되고 최종 데이터는 새 키의 응답이다", async () => {
    server.use(
      http.get(`${BASE}/phonebooks`, async ({ request }) => {
        await delay(500);
        const search = new URL(request.url).searchParams.get("search") ?? "";
        return HttpResponse.json(page([{ name: search }]));
      }),
    );
    const signals: AbortSignal[] = [];
    const queryClient = createQueryClient();
    const { result, rerender } = renderHook(
      ({ q }: { q: string }) =>
        useQuery({
          queryKey: ["shop", 7, "customers", "list", { q, page: 1 }],
          queryFn: ({ signal }) => {
            signals.push(signal);
            return unwrap(
              client.GET("/phonebooks", { params: { query: { search: q, page: 1 } }, signal }),
            );
          },
        }),
      { initialProps: { q: "김" }, wrapper: wrapperFor(queryClient) },
    );
    await act(() => vi.advanceTimersByTimeAsync(100));
    rerender({ q: "김민" });
    await act(() => vi.advanceTimersByTimeAsync(1_000));

    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    expect(result.current.data).toEqual(page([{ name: "김민" }]));
    expect(result.current.error).toBeNull();
  });
});

describe('["shops","selected"] 창 포커스', () => {
  it("신선한 데이터(staleTime 안)여도 포커스를 다시 받으면 다시 가져온다", async () => {
    let count = 0;
    server.use(
      http.get(`${BASE}/shops/selected`, () => {
        count += 1;
        return HttpResponse.json({ id: count === 1 ? 7 : 8 });
      }),
    );
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["shops", "selected"],
          queryFn: ({ signal }) => unwrap(client.GET("/shops/selected", { signal })),
        }),
      { wrapper: wrapperFor(queryClient) },
    );
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current.data?.id).toBe(7);

    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });
    await act(() => vi.advanceTimersByTimeAsync(100));
    focusManager.setFocused(undefined);

    expect(count).toBe(2);
    expect(result.current.data?.id).toBe(8);
  });
});
