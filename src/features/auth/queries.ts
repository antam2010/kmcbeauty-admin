// 인증·내 정보 쿼리(design.md §4.3). 클라이언트는 앱 시작 때 만든 것을 받는다.
// 로그인 응답의 refresh_token은 이 함수 밖으로 나가지 않는다 — mutationFn은 access_token만 세션에 넘기고 undefined를 돌려준다
// (변경 캐시의 data에도 토큰이 남지 않는다, AC-UI-002-05).
import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiClient } from "@/api/client";
import { ApiError, SERVER_ERROR_MESSAGE, unwrap } from "@/api/errors";
import { qk } from "@/api/query-keys";
import { clearSession, sessionStore, startSession } from "@/api/session";
import { useExternalStore } from "@/lib/external-store";

export interface LoginInput {
  email: string;
  password: string;
}

/** POST /auth/login(form-urlencoded, 쿠키는 미들웨어가 credentials "include"로 받는다) → 메모리 토큰. */
export async function login(client: ApiClient, input: LoginInput): Promise<undefined> {
  const data = await unwrap(
    client.POST("/auth/login", {
      body: { username: input.email, password: input.password, grant_type: "password", scope: "" },
      bodySerializer: (body) => new URLSearchParams(body as Record<string, string>),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),
  );
  const token = data?.access_token;
  if (typeof token !== "string" || token === "") {
    // 계약과 다른 응답(EC-04: refresh_token만 있음) — 세션을 만들지 않고 서버 문제로 끝낸다
    throw new ApiError({ status: 502, kind: "http", message: SERVER_ERROR_MESSAGE });
  }
  // 로그인은 새 세션이다 — 세대를 올려 그 전에 시작된 갱신의 늦은 결과를 버린다(감사 결함 N1)
  startSession(token);
  return undefined;
}

/**
 * 로그아웃은 응답을 기다리지 않는다(REQ-UI-002-007). 요청은 한 번 보내고 결과는 버린 뒤,
 * 바로 토큰과 캐시를 비운다 — 응답이 오지 않아도 토큰이 메모리에 남지 않는다.
 */
export function logout(client: ApiClient, queryClient: QueryClient): void {
  void client.POST("/auth/logout").catch(() => undefined);
  clearSession();
  queryClient.clear();
}

export const loginMutationOptions = (client: ApiClient) =>
  mutationOptions({ mutationFn: (input: LoginInput) => login(client, input) });

export const meQueryOptions = (client: ApiClient) =>
  queryOptions({
    queryKey: qk.me(),
    queryFn: ({ signal }) => unwrap(client.GET("/users/me", { signal })),
  });

export function useLogin(client: ApiClient) {
  return useMutation(loginMutationOptions(client));
}

export function useLogout(client: ApiClient): () => void {
  const queryClient = useQueryClient();
  return () => logout(client, queryClient);
}

export function useMe(client: ApiClient) {
  return useQuery(meQueryOptions(client));
}

/** 메모리 토큰 유무(로그인 상태 표시용). */
export function useHasSession(): boolean {
  return useExternalStore(sessionStore);
}
