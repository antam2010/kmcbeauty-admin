// 빌드 설정 도우미(plan.md §B.10, design.md §11·§13).
// vite.config.ts가 쓰고, 시험(src/test/vite-plugins.test.ts)은 명시한 env 객체로 직접 부른다.
// M8에서 같은 파일에 CSP 플러그인을 더한다.
import type { Plugin, ProxyOptions } from "vite";

const API_BASE_URL_KEY = "VITE_API_BASE_URL";
const DEFAULT_PROXY_TARGET = "http://localhost:8000";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** 운영 API 주소가 https 절대 주소인지 본다. 아니면 이유를 돌려준다. */
function invalidReason(value: string | undefined): string | null {
  if (!value) return "값이 없습니다";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return `URL로 해석할 수 없습니다: ${value}`;
  }
  if (url.protocol !== "https:") return `https 주소가 아닙니다: ${value}`;
  if (url.hostname === "") return `호스트가 비었습니다: ${value}`;
  return null;
}

// @MX:NOTE: [AUTO] 운영 빌드(모드가 development가 아님)에서만 VITE_API_BASE_URL을 검사한다.
// 접두사 검사만으로는 `https://`·`https://a b`가 통과해 뒤의 CSP 플러그인에서 늦게 깨지므로 new URL로 해석한다.
// 개발 서버와 vitest(command: serve)는 검사하지 않는다 — 앱이 /api 프록시를 쓰기 때문이다.
export function envCheckPlugin(): Plugin {
  return {
    name: "kmc-env-check",
    configResolved(config) {
      if (config.command !== "build" || config.mode === "development") return;
      const reason = invalidReason(config.env[API_BASE_URL_KEY]);
      if (reason) {
        throw new Error(
          `[env-check] 운영 빌드에는 https 주소인 ${API_BASE_URL_KEY} 값이 필요합니다(${reason}).`,
        );
      }
    },
  };
}

/** 개발 서버 프록시: /api → DEV_API_PROXY_TARGET(기본 로컬 백엔드), /api 접두사를 지운다. */
export function buildDevProxy(
  env: Record<string, string | undefined>,
): Record<"/api", ProxyOptions> {
  const target = env.DEV_API_PROXY_TARGET || DEFAULT_PROXY_TARGET;
  if (!LOCAL_HOSTS.has(new URL(target).hostname)) {
    // 운영 API를 대상으로 개발하면 실제 매장 데이터가 바뀐다(plan.md §B.10, R6)
    console.warn(
      `[dev-proxy] /api 대상이 로컬이 아닙니다: ${target} — 실제 데이터가 바뀔 수 있습니다.`,
    );
  }
  return {
    "/api": {
      target,
      changeOrigin: true,
      rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
    },
  };
}
