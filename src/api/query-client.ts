// TanStack Query 기본값(plan.md §B.1 "쿼리 기본값", design.md §5).
// 401 뒤 갱신하고 한 번 다시 보내는 것은 클라이언트 미들웨어의 일이라 이 재시도 정책 밖이다.
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errors";

const STALE_TIME_MS = 30_000;
const MAX_QUERY_RETRIES = 2;

/** 쿼리 재시도 규칙: 4xx·422·취소는 재시도하지 않고, 5xx·네트워크는 최대 2회(acceptance.md §3.2 재시도 규칙). */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.kind === "aborted") return false;
    if (error.status >= 400 && error.status < 500) return false;
  }
  return failureCount < MAX_QUERY_RETRIES;
}

export function createQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetryQuery },
      mutations: { retry: 0 },
    },
  });
  // 선택 매장은 서버(사용자 단위)가 정본이다. 다른 기기에서 바꿨을 수 있으므로 신선도와 상관없이
  // 창 포커스 때 다시 가져온다(기본값 true는 staleTime 30초 안의 포커스를 놓친다 — design.md §4.4).
  queryClient.setQueryDefaults(["shops", "selected"], { refetchOnWindowFocus: "always" });
  return queryClient;
}
