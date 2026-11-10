// 메모리 액세스 토큰 저장소와 쿠키 갱신(plan.md §B.1 "세션(토큰) 저장"·"갱신", design.md §4.2·§4.3).
// 어떤 토큰도 localStorage·sessionStorage·IndexedDB·document.cookie에 쓰지 않는다(결정 10, OWASP Session Management).
// 갱신 응답 본문의 refresh_token은 읽지 않고 버린다. X-Refresh-Token 헤더는 쓰지 않는다.
import { createExternalStore } from "@/lib/external-store";
import { normalizeError } from "./errors";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const REFRESH_LOCK = "kmc-admin-refresh";

let accessToken: string | null = null;
let inflight: Promise<boolean> | null = null;
// createApiClient가 정한다. fetch는 부를 때 찾는다(MSW 시험이 globalThis.fetch를 바꾼다).
let config: { baseUrl: string; fetch: FetchLike } = {
  baseUrl: "",
  fetch: (input, init) => globalThis.fetch(input, init),
};

/** 로그인 상태 구독용(useExternalStore(sessionStore)). 값은 토큰 유무뿐이다. */
export const sessionStore = createExternalStore(() => accessToken !== null);

export function configureSession(options: { baseUrl: string; fetch?: FetchLike }): void {
  config = { baseUrl: options.baseUrl, fetch: options.fetch ?? config.fetch };
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  sessionStore.notify();
}

export function clearSession(): void {
  accessToken = null;
  sessionStore.notify();
}

async function doRefresh(): Promise<boolean> {
  let response: Response;
  try {
    // 미들웨어를 거치지 않는 맨 요청이라 401 처리 재귀가 없다. 본문 없음, 쿠키는 credentials "include"로만 실린다.
    response = await config.fetch(`${config.baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    throw normalizeError(error);
  }
  if (response.status === 401) {
    clearSession();
    return false;
  }
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    // 403·429·5xx: 오프라인이나 요청 제한을 로그아웃으로 오인하지 않는다 — 세션을 지우지 않고 그 오류로 끝낸다
    throw normalizeError(response, body);
  }
  // access_token만 꺼낸다. 본문 객체는 보관하지 않으므로 refresh_token은 이 함수 밖으로 나가지 않는다.
  const token =
    typeof body === "object" && body !== null ? Reflect.get(body, "access_token") : undefined;
  if (typeof token !== "string" || token === "") {
    clearSession();
    return false;
  }
  setAccessToken(token);
  return true;
}

/** 브라우저가 지원하면 탭 사이 갱신을 Web Locks로 줄 세운다(새 패키지 없음). 없으면 그냥 갱신한다(EC-03). */
async function refreshAcrossTabs(): Promise<boolean> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  return locks ? locks.request(REFRESH_LOCK, doRefresh) : doRefresh();
}

// @MX:WARN: [AUTO] single-flight 갱신 — 진행 중인 Promise 하나를 동시에 난 401이 함께 기다린다.
// @MX:REASON: inflight를 지우는 시점(갱신이 끝난 finally)을 앞당기면 겹친 갱신이 생기고, 백엔드가 리프레시 토큰을 바꾸므로(남은 수명 절반 이하) 한쪽 토큰이 무효가 된다. 탭 사이는 navigator.locks로 줄 세운다(없으면 탭 안 single-flight만, EC-03).
/** 쿠키로 액세스 토큰을 갱신한다. 200 → true, 401 → 세션 삭제 후 false, 그 밖의 실패 → ApiError를 던짐(세션 유지). */
export function refreshSession(): Promise<boolean> {
  if (inflight) return inflight;
  const run = refreshAcrossTabs();
  const current = run.finally(() => {
    if (inflight === current) inflight = null;
  });
  inflight = current;
  return current;
}

/** 토큰이 있으면 true, 없으면(새로고침 뒤) 쿠키 갱신을 한 번 시도한다. 만료 처리기는 부르지 않는다(첫 방문 S0). */
export function ensureSession(): Promise<boolean> {
  return accessToken !== null ? Promise.resolve(true) : refreshSession();
}

/** 시험 전용: 토큰과 진행 중 갱신을 지운다(새로고침 흉내). */
export function __resetSessionForTest(): void {
  accessToken = null;
  inflight = null;
  sessionStore.notify();
}
