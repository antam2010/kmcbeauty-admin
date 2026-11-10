// 앱 조립(design.md §4.1·§4.2·§4.4): API 클라이언트·QueryClient·라우터를 한 번 만들고 세션 만료·매장 미선택 처리기를 잇는다.
// main.tsx가 모듈 범위에서 한 번 부른다. 시험은 같은 함수에 메모리 라우터를 넘긴다(src/test/render-route.tsx).
// configureSession이 모듈 전역 설정을 덮어쓰므로 클라이언트는 이 함수 밖에서 만들지 않는다(감사 결함 F8).
import type { QueryClient } from "@tanstack/react-query";
import { type DataRouter, type RouteObject, RouterProvider } from "react-router";
import { createApiClient } from "@/api/client";
import { createQueryClient } from "@/api/query-client";
import { qk } from "@/api/query-keys";
import { getSessionGeneration } from "@/api/session";
import { Providers } from "./providers";
import { createRoutes } from "./routes";
import { type AppServices, createSessionNotice } from "./services";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface CreateAppOptions {
  baseUrl: string;
  fetch?: FetchLike;
  devRoutes: RouteObject[];
  createRouter: (routes: RouteObject[]) => DataRouter;
  queryClient?: QueryClient;
}

export interface AppInstance {
  router: DataRouter;
  services: AppServices;
  handlers: { onSessionExpired: () => void; onShopNotSelected: () => void };
}

// 처리기마다 이동하지 않는 화면이 다르다(M4 감사 F-2).
// 세션 만료: 로그인 화면만 건너뛴다. 이미 그 화면이고 만료 문구는 안내 상태로 켜진다.
// 매장 선택 화면 등 나머지는 업무 화면처럼 /login?next=<현재 경로>로 보낸다(REQ-UI-002-006).
const EXPIRY_SKIP_PATHS: ReadonlySet<string> = new Set(["/login"]);
// 매장 미선택: 그 화면이 다음 경로를 스스로 정하는 공개 화면은 건너뛴다
// (로그인 직후 선택 매장 확인의 SHOP_NOT_SELECTED가 /shops?next=/login…으로 튀지 않게).
const SHOP_NOT_SELECTED_SKIP_PATHS: ReadonlySet<string> = new Set([
  "/login",
  "/shops",
  "/terms-of-service",
  "/privacy-policy",
]);

export function createApp(options: CreateAppOptions): AppInstance {
  const queryClient = options.queryClient ?? createQueryClient();
  const sessionNotice = createSessionNotice();
  let router: DataRouter | null = null;
  let handledExpiry = -1;

  /** 지금 이동해도 되는 화면이면 현재 경로(쿼리 포함)를, 아니면 null. skip은 그 처리기가 건너뛰는 경로명이다. */
  const idleAppLocation = (skip: ReadonlySet<string>): string | null => {
    if (!router) return null;
    const { location, navigation, initialized } = router.state;
    // 첫 로딩 중이거나 이동 중이면 그 loader가 목적지를 next로 실어 보낸다(지금 위치는 떠나는 화면이다)
    if (!initialized || navigation.state !== "idle") return null;
    if (skip.has(location.pathname)) return null;
    return location.pathname + location.search;
  };

  /** 이 탭에서 로그인돼 있던 세션이 갱신 401로 끝났다(S0 첫 방문에는 클라이언트가 부르지 않는다). */
  const onSessionExpired = () => {
    // 같은 만료에 두 번 불려도 이동·안내는 한 번(만료마다 세션 세대가 하나씩 오른다)
    const generation = getSessionGeneration();
    if (generation === handledExpiry) return;
    handledExpiry = generation;
    queryClient.clear();
    sessionNotice.markExpired();
    const from = idleAppLocation(EXPIRY_SKIP_PATHS);
    if (from !== null) {
      void router?.navigate(`/login?next=${encodeURIComponent(from)}`, { replace: true });
    }
  };

  // @MX:NOTE: [AUTO] 선택 매장은 서버(Redis)의 사용자 단위 상태다 — 다른 기기에서 바뀌거나 만료될 수 있다. 어느 요청에서든
  // SHOP_NOT_SELECTED를 받으면 매장 범위 캐시를 버리고, 문서 새로고침 없이 라우터로 /shops에 보낸다(REQ-UI-002-008).
  const onShopNotSelected = () => {
    queryClient.removeQueries({ queryKey: qk.shopScope() });
    const from = idleAppLocation(SHOP_NOT_SELECTED_SKIP_PATHS);
    if (from !== null) void router?.navigate(`/shops?next=${encodeURIComponent(from)}`);
  };

  const client = createApiClient({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
    onSessionExpired,
    onShopNotSelected,
  });
  const services: AppServices = { client, queryClient, sessionNotice };
  router = options.createRouter(createRoutes({ devRoutes: options.devRoutes, services }));
  return { router, services, handlers: { onSessionExpired, onShopNotSelected } };
}

/** main.tsx가 그리는 앱 뿌리. app은 모듈 범위에서 한 번 만든 것을 받는다(StrictMode 이중 렌더링과 무관). */
export function App({ app }: { app: AppInstance }) {
  return (
    <Providers services={app.services}>
      <RouterProvider router={app.router} />
    </Providers>
  );
}
