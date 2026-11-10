// 경로 시험 도우미(design.md §16): 앱과 같은 경로 함수(createRoutes)로 만든 메모리 라우터 + 새 QueryClient + MSW.
// 화면 폭은 matchMedia 대역으로 정한다(jsdom에는 레이아웃이 없다 — acceptance.md §0).
import { render } from "@testing-library/react";
import type { HttpHandler } from "msw";
import { StrictMode } from "react";
import { createMemoryRouter, type DataRouter, type RouteObject } from "react-router";
import { expect, onTestFinished, vi } from "vitest";
import { createQueryClient } from "@/api/query-client";
import type { components } from "@/api/schema";
import { __resetSessionForTest, setAccessToken } from "@/api/session";
import { App, createApp } from "@/app/create-app";
import { shopFixture, TEST_API_ORIGIN, userFixture } from "./msw/fixtures";
import { refreshWith } from "./msw/handlers/auth";
import { selectedShopHandler, shopsListHandler } from "./msw/handlers/shops";
import { meHandler } from "./msw/handlers/users";
import { createRequestLog } from "./msw/request-log";
import { server } from "./msw/server";

type Shop = components["schemas"]["ShopResponse"];

/**
 * 세 세션 상태(acceptance.md AC-UI-002-09 Given):
 * S0 비로그인(갱신 401), S1 로그인·매장 없음(선택 매장 404 SHOP_NOT_SELECTED), S2 로그인 + 매장.
 */
export type SessionState = "S0" | "S1" | "S2";

export interface RenderRouteOptions {
  session?: SessionState;
  /** 운영 경로 시험은 빈 목록(기본값), 개발 경로 시험은 dev-routes.ts의 목록을 넘긴다 */
  devRoutes?: RouteObject[];
  /** S2의 선택 매장(기본 매장 7) */
  shop?: Shop;
  /** 매장 목록(기본 [선택 매장]) */
  shops?: Shop[];
  /** 기본 처리기 뒤에 더한다 — 같은 경로면 이쪽이 이긴다 */
  handlers?: HttpHandler[];
  strict?: boolean;
}

function sessionHandlers(state: SessionState, shop: Shop, shops: Shop[]): HttpHandler[] {
  const base = [refreshWith(TEST_API_ORIGIN, 401), meHandler(TEST_API_ORIGIN, userFixture)];
  if (state === "S0") return base;
  return [
    ...base,
    selectedShopHandler(TEST_API_ORIGIN, state === "S2" ? shop : null),
    shopsListHandler(TEST_API_ORIGIN, shops),
  ];
}

/** 화면에 한 번이라도 그려진 h1 글을 모두 모은다(보호 화면 h1을 한 번도 그리지 않았는지 판정). */
function recordHeadings(): string[] {
  const seen: string[] = [];
  const collect = (node: Node) => {
    if (!(node instanceof Element)) return;
    const headings = node.matches("h1") ? [node] : [...node.querySelectorAll("h1")];
    for (const heading of headings) seen.push(heading.textContent ?? "");
  };
  const observer = new MutationObserver((records) => {
    for (const record of records) record.addedNodes.forEach(collect);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  onTestFinished(() => observer.disconnect());
  return seen;
}

export function renderRoute(path: string, options: RenderRouteOptions = {}) {
  const state = options.session ?? "S0";
  const shop = options.shop ?? shopFixture;
  __resetSessionForTest();
  if (state !== "S0") setAccessToken("access-1");
  server.use(...sessionHandlers(state, shop, options.shops ?? [shop]));
  // 한 번의 server.use 안에서는 앞의 처리기가 이긴다 — 시험의 처리기는 따로 더해 기본값보다 앞에 둔다
  if (options.handlers?.length) server.use(...options.handlers);
  const log = createRequestLog();
  const queryClient = createQueryClient();
  // 시험 도중 캐시가 사라지지 않게 쿼리 gcTime만 무한으로 둔다(재시도 규칙은 그대로)
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, gcTime: Infinity },
  });
  const app = createApp({
    baseUrl: TEST_API_ORIGIN,
    fetch: log.fetch,
    devRoutes: options.devRoutes ?? [],
    queryClient,
    createRouter: (routes) => createMemoryRouter(routes, { initialEntries: [path] }),
  });
  const headings = recordHeadings();
  const element = <App app={app} />;
  const view = render(options.strict ? <StrictMode>{element}</StrictMode> : element);
  return { ...view, app, router: app.router, log, headings };
}

/** 디코딩한 경로명 + 순서와 상관없는 쿼리 (이름, 값) 다중 집합(acceptance.md §0 쿼리 비교). */
function comparable(url: string) {
  const parsed = new URL(url, "http://localhost");
  return {
    pathname: decodeURIComponent(parsed.pathname),
    query: [...parsed.searchParams.entries()].map(([k, v]) => `${k}=${v}`).sort(),
  };
}

export function locationOf(router: DataRouter): string {
  const { pathname, search } = router.state.location;
  return pathname + search;
}

export function expectLocation(router: DataRouter, expected: string): void {
  expect(comparable(locationOf(router))).toEqual(comparable(expected));
}

type Listener = (event: MediaQueryListEvent) => void;

/** `(min-width: Npx)`·`(max-width: Npx)` 조건을 모두 만족하면 true. 그 밖의 조건(색 구성 등)은 false. */
function evaluate(query: string, width: number): boolean {
  const conditions = [...query.matchAll(/\((min|max)-width:\s*(\d+)px\)/g)];
  if (conditions.length === 0) return false;
  return conditions.every(([, kind, value]) =>
    kind === "min" ? width >= Number(value) : width <= Number(value),
  );
}

/**
 * 폭을 정한 matchMedia 대역을 설치한다. setup.ts의 vi.restoreAllMocks가 시험 뒤 되돌린다.
 * resize(폭)는 바뀐 조건마다 change 이벤트를 보낸다.
 */
export function installViewport(initialWidth: number) {
  let width = initialWidth;
  const lists = new Set<{ query: string; listeners: Set<Listener>; last: boolean }>();
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const entry = { query, listeners: new Set<Listener>(), last: evaluate(query, width) };
    lists.add(entry);
    const list = {
      get matches() {
        return evaluate(query, width);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => entry.listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => entry.listeners.delete(listener),
      addListener: (listener: Listener) => entry.listeners.add(listener),
      removeListener: (listener: Listener) => entry.listeners.delete(listener),
      dispatchEvent: () => false,
    };
    return list as unknown as MediaQueryList;
  });
  return {
    resize(next: number) {
      width = next;
      for (const entry of lists) {
        const matches = evaluate(entry.query, width);
        if (matches === entry.last) continue;
        entry.last = matches;
        for (const listener of entry.listeners) {
          listener({ matches, media: entry.query } as MediaQueryListEvent);
        }
      }
    },
  };
}
