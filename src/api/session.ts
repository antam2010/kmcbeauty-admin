// 메모리 액세스 토큰 저장소와 쿠키 갱신(plan.md §B.1 "세션(토큰) 저장"·"갱신", design.md §4.2·§4.3).
// 어떤 토큰도 localStorage·sessionStorage·IndexedDB·document.cookie에 쓰지 않는다(결정 10, OWASP Session Management).
// 갱신 응답 본문의 refresh_token은 읽지 않고 버린다. X-Refresh-Token 헤더는 쓰지 않는다.
import { createExternalStore } from "@/lib/external-store";
import { normalizeError } from "./errors";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const REFRESH_LOCK = "kmc-admin-refresh";

let accessToken: string | null = null;
let inflight: Promise<boolean> | null = null;
// inflight를 시작한 세션 세대. 다른 세대의 호출은 합류하지 않는다(탭 사이 순서는 navigator.locks가 그대로 줄 세운다).
let inflightGeneration = -1;
// 세션 세대: clearSession(로그아웃·갱신 401)과 startSession(로그인)마다 오른다. 갱신 성공은 올리지 않는다.
// 갱신과 요청은 시작할 때의 세대를 기억하고, 끝났을 때 세대가 바뀌었으면 그 결과를 세션에 반영하지 않는다(감사 결함 F1·F2).
let generation = 0;
// 마지막 clearSession이 갱신 401(만료)에서 왔을 때의 세대. 로그아웃으로 지운 세션과 구분한다.
let expiredGeneration = -1;
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

/** 같은 세션 안에서 토큰만 바꾼다(갱신 성공). 세대는 그대로다. */
export function setAccessToken(token: string): void {
  accessToken = token;
  sessionStore.notify();
}

/**
 * 로그인으로 새 세션을 시작한다. 세대를 올린 뒤 토큰을 저장한다.
 * 그 전에 시작된 갱신(새로고침 뒤 부팅 갱신 등)의 늦은 결과가 새 세션의 토큰을 지우거나 덮어쓰지 않는다(감사 결함 N1).
 */
export function startSession(token: string): void {
  generation += 1;
  accessToken = token;
  sessionStore.notify();
}

export function clearSession(): void {
  generation += 1;
  accessToken = null;
  sessionStore.notify();
}

/** 현재 세션 세대(요청을 보낼 때 기록해 두고 401을 받았을 때 비교한다). */
export function getSessionGeneration(): number {
  return generation;
}

/** 세션이 없고, 그 이유가 로그아웃이 아니라 갱신 401(만료)일 때 true. */
export function isSessionExpired(): boolean {
  return accessToken === null && expiredGeneration === generation;
}

async function doRefresh(started: number): Promise<boolean> {
  let response: Response;
  try {
    // 미들웨어를 거치지 않는 맨 요청이라 401 처리 재귀가 없다. 본문 없음, 쿠키는 credentials "include"로만 실린다.
    response = await config.fetch(`${config.baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    if (generation !== started) return false; // 도중에 로그아웃 — 오류도 세션 결과로 쓰지 않는다
    throw normalizeError(error);
  }
  // 갱신이 도는 사이 로그아웃(또는 다른 세션 삭제)이 있었다 — 늦은 결과는 저장하지도 지우지도 않는다
  if (generation !== started) return false;
  if (response.status === 401) return expireSession();
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    // 403·429·5xx: 오프라인이나 요청 제한을 로그아웃으로 오인하지 않는다 — 세션을 지우지 않고 그 오류로 끝낸다
    throw normalizeError(response, body);
  }
  // access_token만 꺼낸다. 본문 객체는 보관하지 않으므로 refresh_token은 이 함수 밖으로 나가지 않는다.
  const token =
    typeof body === "object" && body !== null ? Reflect.get(body, "access_token") : undefined;
  if (typeof token !== "string" || token === "") {
    return expireSession();
  }
  setAccessToken(token);
  return true;
}

/** 갱신이 세션을 되살리지 못했다(401·토큰 없는 200) — 세션을 지우고 만료로 표시한다. */
function expireSession(): false {
  clearSession();
  expiredGeneration = generation;
  return false;
}

/** 브라우저가 지원하면 탭 사이 갱신을 Web Locks로 줄 세운다(새 패키지 없음). 없으면 그냥 갱신한다(EC-03). */
async function refreshAcrossTabs(started: number): Promise<boolean> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  const run = () => doRefresh(started);
  return locks ? locks.request(REFRESH_LOCK, run) : run();
}

// @MX:WARN: [AUTO] single-flight 갱신 — 진행 중인 Promise 하나를 동시에 난 401이 함께 기다린다. 시작할 때의 세션 세대를 잡아 두고, 끝났을 때 세대가 바뀌었으면(로그아웃, 또는 로그인이 새 세대를 시작함) 결과를 버리고 false다.
// @MX:REASON: inflight를 지우는 시점(갱신이 끝난 finally)을 앞당기면 겹친 갱신이 생기고, 백엔드가 리프레시 토큰을 바꾸므로(남은 수명 절반 이하) 한쪽 토큰이 무효가 된다. 탭 사이는 navigator.locks로 줄 세운다(없으면 탭 안 single-flight만, EC-03). 세대 확인을 빼면 로그아웃 뒤 늦게 온 갱신 응답이 토큰을 되살리거나 새 로그인 토큰을 덮어쓴다(감사 결함 F1). 로그인도 startSession으로 세대를 올리므로, 로그인 전에 시작된 부팅 갱신의 늦은 401·200이 새 세션의 토큰을 지우거나 이전 사용자 토큰으로 바꾸지 않는다(감사 결함 N1). 합류도 같은 세대의 갱신에만 한다 — 앞 세대 갱신에 합류하면 새 세션의 401이 그 false를 받아 갱신 없이 끝난다(감사 결함 N2).
/** 쿠키로 액세스 토큰을 갱신한다. 200 → true, 401 → 세션 삭제 후 false, 도중에 로그아웃 → 아무것도 저장하지 않고 false, 그 밖의 실패 → ApiError를 던짐(세션 유지). */
export function refreshSession(): Promise<boolean> {
  // 같은 세대에서 시작된 갱신에만 합류한다. 앞 세대의 갱신은 끝나도 false라(세대 확인) 새 세션의 401을 살리지 못한다(감사 결함 N2).
  if (inflight && inflightGeneration === generation) return inflight;
  const started = generation;
  const run = refreshAcrossTabs(started);
  const current = run.finally(() => {
    if (inflight === current) inflight = null;
  });
  inflight = current;
  inflightGeneration = started;
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
