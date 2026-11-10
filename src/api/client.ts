// openapi-fetch 클라이언트와 인증·매장 미들웨어(plan.md §B.1 "요청 미들웨어", design.md §4.1·§4.2).
// API 계층은 라우터를 가져오지 않는다. 세션 만료·매장 미선택 처리기는 앱 시작 때 주입한다.
// 미들웨어 방식 결정 근거: M2 사전 점검(onResponse가 새 Response를 돌려줄 수 있고, options.fetch로 다시 보낸 요청은 미들웨어를 거치지 않는다).
import createClient, { type Client, type Middleware } from "openapi-fetch";
import type { paths } from "./schema";
import {
  configureSession,
  getAccessToken,
  getSessionGeneration,
  isSessionExpired,
  refreshSession,
} from "./session";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type ApiClient = Client<paths>;

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: FetchLike;
  /** 메모리 토큰으로 보낸 요청이 401이고 갱신도 401일 때(같은 갱신 결과에는 한 번). */
  onSessionExpired: () => void;
  /** 응답이 404 + detail.code "SHOP_NOT_SELECTED"일 때. */
  onShopNotSelected: () => void;
}

// 리프레시 쿠키가 모든 요청에 실려 다니지 않게, 쿠키를 주고받는 인증 경로만 credentials "include"다(나머지는 "omit")
const COOKIE_PATHS = new Set(["/auth/login", "/auth/refresh", "/auth/logout"]);

async function isShopNotSelected(response: Response): Promise<boolean> {
  if (response.status !== 404) return false;
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => undefined);
  const detail =
    typeof body === "object" && body !== null ? Reflect.get(body, "detail") : undefined;
  return (
    typeof detail === "object" &&
    detail !== null &&
    Reflect.get(detail, "code") === "SHOP_NOT_SELECTED"
  );
}

function withToken(request: Request, token: string): Request {
  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return new Request(request, { headers });
}

function sessionMiddleware(options: ApiClientOptions): Middleware {
  // 요청마다 재시도용 복제본, 보낸 토큰, 보낼 때의 세션 세대. 본문은 fetch가 읽어 버리므로 보내기 전에 복제한다.
  const sent = new WeakMap<Request, { retry: Request; token: string | null; generation: number }>();
  // 동시에 난 401 여럿이 같은 갱신 실패를 받아도 만료 처리기는 한 번만 부른다
  let expiredFor: Promise<boolean> | null = null;

  return {
    onRequest({ request, schemaPath }) {
      const token = getAccessToken();
      let next = token ? withToken(request, token) : request;
      if (COOKIE_PATHS.has(schemaPath)) next = new Request(next, { credentials: "include" });
      sent.set(next, { retry: next.clone(), token, generation: getSessionGeneration() });
      return next;
    },

    // @MX:WARN: [AUTO] 401 재시도 — 보내기 전에 만든 복제본으로 새 토큰을 붙여 한 번만 다시 보낸다. 보낸 뒤 세션 세대가 바뀌었으면(로그아웃·갱신 401) 갱신·재전송·만료 처리기 없이 그 401로 끝낸다.
    // @MX:REASON: 재전송은 options.fetch로 가서 미들웨어를 다시 거치지 않는다(그래서 두 번째 401은 그대로 돌아오는 것이 재시도 표시다). 이 경로를 client 호출로 바꾸면 무한 재시도가 되고, 복제를 빼면 POST 본문이 사라진다(EC-02). 세대 확인을 빼면 갱신 401 뒤 늦게 온 401이 갱신과 만료 처리기를 한 번 더 부른다(감사 결함 F2).
    async onResponse({ request, response, schemaPath, options: fetchOptions }) {
      let final = response;
      const record = sent.get(request);
      if (
        response.status === 401 &&
        !schemaPath.startsWith("/auth/") &&
        record &&
        record.generation === getSessionGeneration()
      ) {
        const current = getAccessToken();
        if (current !== null && current !== record.token) {
          // 다른 요청의 갱신이 이미 끝났다 — 다시 갱신하지 않고 새 토큰으로 보낸다
          final = await fetchOptions.fetch(withToken(record.retry, current));
        } else {
          const refresh = refreshSession(); // 403·429·5xx·네트워크면 그 ApiError로 원래 요청이 끝난다
          if (await refresh) {
            // 빈 토큰("Bearer ")은 보내지 않는다 — 토큰이 없으면 원래 401로 끝난다(감사 결함 F6)
            const token = getAccessToken();
            if (token !== null) final = await fetchOptions.fetch(withToken(record.retry, token));
          } else if (record.token !== null && expiredFor !== refresh && isSessionExpired()) {
            // 갱신 도중 로그아웃했으면(만료가 아님) 만료 처리기를 부르지 않는다
            // 토큰 없이 보낸 요청(첫 방문)에는 만료 처리기를 부르지 않는다(S0 결정)
            expiredFor = refresh;
            options.onSessionExpired();
          }
        }
      }
      if (await isShopNotSelected(final)) options.onShopNotSelected();
      return final;
    },
  };
}

// @MX:ANCHOR: [AUTO] 모든 쿼리 훅·loader가 쓰는 API 경계.
// @MX:REASON: 토큰 부착·쿠키 전송 범위·401 갱신·매장 미선택 처리가 모두 여기서 정해진다. 미들웨어를 우회하는 호출 경로를 만들면 이 규칙이 빠진다.
export function createApiClient(options: ApiClientOptions): ApiClient {
  // fetch는 부를 때 찾는다(시험에서 MSW가 globalThis.fetch를 바꾼다)
  const fetch: FetchLike = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  configureSession({ baseUrl: options.baseUrl, fetch });
  const client = createClient<paths>({
    baseUrl: options.baseUrl,
    fetch: (request) => fetch(request),
    // 인증 3개 경로 밖의 요청은 쿠키를 싣지 않는다(사용자 결정 F5). 개발 프록시처럼 같은 출처가 되는 경우에도
    // 리프레시 쿠키가 일반 요청에 실려 다니지 않게 하려는 것이다. 인증 경로는 미들웨어가 "include"로 바꾼다.
    credentials: "omit",
  });
  client.use(sessionMiddleware(options));
  return client;
}
