// 인증 API 처리기(POST /auth/login·/auth/refresh·/auth/logout). 응답 모양은 생성 타입으로 고정한다.
import { delay, HttpResponse, http } from "msw";
import type { components } from "@/api/schema";

type LoginResponse = components["schemas"]["LoginResponse"];

export const loginBody = (access: string, refresh: string): LoginResponse => ({
  access_token: access,
  refresh_token: refresh,
  token_type: "bearer",
});

type Respond = () => Response | Promise<Response>;

export function loginHandler(origin: string, respond: Respond) {
  return http.post(`${origin}/auth/login`, respond);
}

export function refreshHandler(origin: string, respond: Respond) {
  return http.post(`${origin}/auth/refresh`, respond);
}

export function logoutHandler(origin: string, respond: Respond) {
  return http.post(`${origin}/auth/logout`, respond);
}

/** 갱신 응답: 200이면 새 토큰 쌍, 그 밖에는 본문 없는 상태 코드. */
export function refreshWith(origin: string, outcome: number | "network", access = "access-2") {
  return refreshHandler(origin, () => {
    if (outcome === "network") return HttpResponse.error();
    if (outcome === 200) return HttpResponse.json(loginBody(access, "refresh-2"));
    return new HttpResponse(null, { status: outcome });
  });
}

/** 지연된 갱신 응답(single-flight 판정용, 가짜 타이머로 흐른다). */
export function slowRefresh(origin: string, ms: number, access = "access-2") {
  return refreshHandler(origin, async () => {
    await delay(ms);
    return HttpResponse.json(loginBody(access, "refresh-2"));
  });
}
