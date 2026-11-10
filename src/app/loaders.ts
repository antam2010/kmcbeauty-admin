// 경로 보호 loader(design.md §3.2). loader는 인증·매장 확인과 ensureQueryData만 하고, 화면 데이터는 화면의 훅이 가져온다.
// 화면을 그리기 전에 throw redirect()로 막으므로 보호 화면이 한 번 그려졌다가 튀지 않는다(AC-UI-002-09).
import { type LoaderFunctionArgs, redirect } from "react-router";
import { ApiError } from "@/api/errors";
import { ensureSession, getAccessToken } from "@/api/session";
import { selectedShopQueryOptions } from "@/features/shops/queries";
import { nextDestination } from "./safe-next";
import type { AppServices } from "./services";

/** 현재 요청 경로(쿼리 포함)를 next로 실은 주소. */
function withNext(target: string, request: Request): string {
  const url = new URL(request.url);
  return `${target}?next=${encodeURIComponent(url.pathname + url.search)}`;
}

export function createLoaders({ client, queryClient }: AppServices) {
  /** 세션이 없고 쿠키로도 복원되지 않으면 로그인 화면으로. 네트워크·서버 오류는 경로 오류 화면(다시 시도)으로 던진다(EC-06). */
  async function requireSession({ request }: LoaderFunctionArgs): Promise<null> {
    if (!(await ensureSession())) throw redirect(withNext("/login", request));
    return null;
  }

  /** 세션 확인 뒤 선택 매장 확인. 매장이 없으면 매장 선택으로(next에 현재 경로). */
  async function requireShop(args: LoaderFunctionArgs): Promise<null> {
    await requireSession(args);
    try {
      await queryClient.ensureQueryData(selectedShopQueryOptions(client));
    } catch (error) {
      if (error instanceof ApiError && error.code === "SHOP_NOT_SELECTED") {
        throw redirect(withNext("/shops", args.request));
      }
      // 확인 도중 세션이 끝났다(갱신 401) — 만료 처리기가 안내를 켜고 캐시를 비웠으며(그래서 이 확인은 401이나 취소로 끝난다),
      // 이동은 이 loader가 맡는다
      if (getAccessToken() === null) {
        throw redirect(withNext("/login", args.request));
      }
      throw error;
    }
    return null;
  }

  /** 로그인 화면: 세션이 있거나 복원되면 규칙을 통과한 next 또는 /reservations로 보낸다. */
  async function redirectIfSession({ request }: LoaderFunctionArgs): Promise<null> {
    let restored = false;
    try {
      restored = await ensureSession();
    } catch {
      // 갱신을 확인할 수 없으면(네트워크·서버 오류) 로그인 화면을 그대로 보인다. 제출하면 같은 오류 문구가 나온다
      restored = false;
    }
    if (restored) {
      const next = new URL(request.url).searchParams.get("next");
      throw redirect(nextDestination(next, window.location.origin));
    }
    return null;
  }

  return { requireSession, requireShop, redirectIfSession };
}
