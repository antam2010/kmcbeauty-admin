// 경로 객체(plan.md §B.2 경로 표, design.md §3.1). 판정 기준은 acceptance.md §3.3 경로 표다.
// 앱(createBrowserRouter)과 시험(createMemoryRouter)이 같은 이 함수로 경로를 만든다.
import type { ReactNode } from "react";
import { Outlet, type RouteObject, redirect } from "react-router";
import { LoginPage } from "@/features/auth/LoginPage";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { PrivacyPage } from "@/features/legal/PrivacyPage";
import { TermsPage } from "@/features/legal/TermsPage";
import { ReservationCalendarPage } from "@/features/reservations/ReservationCalendarPage";
import { ShopSelectPage } from "@/features/shops/ShopSelectPage";
import { TreatmentMenusPage } from "@/features/treatment-menus/TreatmentMenusPage";
import { TreatmentHistoryPage } from "@/features/treatments/TreatmentHistoryPage";
import { createLoaders } from "./loaders";
import { NotFoundPage } from "./NotFoundPage";
import { PublicLayout } from "./PublicLayout";
import { RouteError } from "./RouteError";
import type { AppServices } from "./services";
import { AppShell } from "./shell/AppShell";

/** 앱 셸 화면의 이동 경로·제목. wide면 본문 최대 폭을 푼다(캘린더). */
export interface ShellHandle {
  section: "예약" | "관리";
  title: string;
  wide?: boolean;
}

export interface CreateRoutesOptions {
  /** 앱은 dev-routes.ts의 devRoutes를, 운영 경로 시험은 빈 목록을 넘긴다(AC-UI-002-13) */
  devRoutes: RouteObject[];
  services: AppServices;
}

const shellRoute = (path: string, handle: ShellHandle, element: ReactNode): RouteObject => ({
  path,
  handle,
  element,
});

/** 첫 loader를 기다리는 동안의 빈 화면. */
function BootFallback() {
  return null;
}

// @MX:ANCHOR: [AUTO] 앱(main.tsx → createApp)과 모든 경로 시험(render-route.tsx)이 같은 이 함수의 경로 객체를 쓴다.
// @MX:REASON: 경로·loader·레이아웃을 여기서 바꾸면 경로 표(acceptance.md §3.3)와 보호 규칙이 함께 바뀐다. 앱 전용 경로를 따로 만들면 시험이 앱과 다른 경로를 판정하게 된다.
export function createRoutes({ devRoutes, services }: CreateRoutesOptions): RouteObject[] {
  const { requireSession, requireShop, redirectIfSession } = createLoaders(services);
  return [
    {
      id: "root",
      element: <Outlet />,
      errorElement: <RouteError />,
      // 첫 loader가 끝나기 전에는 아무것도 그리지 않는다(보호 화면이 먼저 보였다가 튀지 않게)
      HydrateFallback: BootFallback,
      children: [
        {
          element: <PublicLayout />,
          children: [
            { path: "/login", loader: redirectIfSession, element: <LoginPage /> },
            { path: "/terms-of-service", element: <TermsPage /> },
            { path: "/privacy-policy", element: <PrivacyPage /> },
            { path: "/shops", loader: requireSession, element: <ShopSelectPage /> },
          ],
        },
        {
          loader: requireShop,
          element: <AppShell />,
          children: [
            {
              index: true,
              // 부모 loader와 동시에 돌므로 같은 확인을 먼저 마친 뒤 첫 화면으로 보낸다(로그인·매장 이동이 앞선다)
              loader: async (args) => {
                await requireShop(args);
                return redirect("/reservations");
              },
            },
            shellRoute(
              "/reservations",
              { section: "예약", title: "예약 캘린더", wide: true },
              <ReservationCalendarPage />,
            ),
            shellRoute(
              "/treatments",
              { section: "예약", title: "시술 이력" },
              <TreatmentHistoryPage />,
            ),
            shellRoute("/customers", { section: "관리", title: "고객" }, <CustomersPage />),
            shellRoute(
              "/treatment-menus",
              { section: "관리", title: "시술 메뉴" },
              <TreatmentMenusPage />,
            ),
          ],
        },
        ...devRoutes,
        {
          path: "*",
          element: (
            <PublicLayout>
              <NotFoundPage />
            </PublicLayout>
          ),
        },
      ],
    },
  ];
}
