// 앱이 부를 API 기준 주소. 코드에서 VITE_API_BASE_URL을 읽는 곳은 이 파일 하나다(plan.md §B.10).
// 개발 서버는 Vite 프록시(/api)를 거치고, 운영 빌드는 빌드 때 검사한 https 주소를 그대로 쓴다.

interface ApiEnv {
  DEV: boolean;
  VITE_API_BASE_URL?: string;
}

/** env 객체로 기준 주소를 정한다. 시험할 수 있게 import.meta.env를 직접 읽지 않는다. */
export function apiBaseUrl(env: ApiEnv): string {
  if (env.DEV) return "/api";
  if (!env.VITE_API_BASE_URL) {
    // 운영 빌드 검사(vite-plugins.ts envCheckPlugin)를 통과했다면 여기에 오지 않는다
    throw new Error("VITE_API_BASE_URL이 없습니다.");
  }
  return env.VITE_API_BASE_URL;
}

export const API_BASE_URL = apiBaseUrl(import.meta.env);
