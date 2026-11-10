// 앱 셸(system.md §10, design-direction.md §14.1): 사이드바(240/64px) + 상단바(56px) + 본문(여백 24/32px, 최대 폭 1280px).
// 넓을수록 좋은 화면(캘린더, 경로 handle.wide)은 본문 최대 폭을 푼다. 768px 미만은 사이드바 대신 서랍(Drawer)이다.
import { type MouseEvent, useEffect } from "react";
import { Outlet, useLocation, useMatches } from "react-router";
import { useApiClient } from "@/app/services";
import { useHasSession } from "@/features/auth/queries";
import { useSelectedShop } from "@/features/shops/queries";
import { cn, Drawer } from "@/ui-core";
import type { ShellHandle } from "../routes";
import { NavSidebar } from "./NavSidebar";
import { TopBar } from "./TopBar";
import { useSidebarState } from "./use-sidebar-state";

function isShellHandle(value: unknown): value is ShellHandle {
  return typeof value === "object" && value !== null && "title" in value && "section" in value;
}

/** 해시 이동만으로는 포커스가 본문으로 옮겨 가지 않는 브라우저가 있어 직접 옮긴다. */
function focusMain(event: MouseEvent<HTMLAnchorElement>) {
  const main = document.getElementById("main");
  if (!main) return;
  event.preventDefault();
  main.focus();
}

export function AppShell() {
  // 세션이 끝나면(로그아웃·만료) 셸을 바로 내린다. 로그인 화면으로 가는 동안 셸의 쿼리(내 정보·선택 매장)가
  // 토큰 없이 다시 만들어져 비운 캐시에 남지 않게 한다(AC-UI-002-05 (라))
  return useHasSession() ? <ShellLayout /> : null;
}

function ShellLayout() {
  const client = useApiClient();
  const shop = useSelectedShop(client);
  const sidebar = useSidebarState();
  const { pathname } = useLocation();
  const handle = useMatches()
    .map((match) => match.handle)
    .findLast(isShellHandle);
  const { setDrawerOpen } = sidebar;

  // 서랍 안 링크로 이동하면 서랍을 닫는다
  // biome-ignore lint/correctness/useExhaustiveDependencies: 경로가 바뀔 때마다 닫는 것이 목적이다
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname, setDrawerOpen]);

  const shopName = shop.data?.name ?? "";
  const breadcrumb = handle ? [{ label: handle.section }, { label: handle.title }] : [];

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* biome-ignore lint/a11y/useValidAnchor: href="#main"로 동작하는 진짜 링크이고, onClick은 포커스를 본문으로 옮기는 보강일 뿐이다 */}
      <a
        href="#main"
        onClick={focusMain}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:bg-card focus:px-4 focus:py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        본문으로 건너뛰기
      </a>
      {sidebar.band === "narrow" ? (
        <Drawer open={sidebar.drawerOpen} onOpenChange={setDrawerOpen} title="메뉴" side="left">
          <NavSidebar shopName={shopName} className="w-full border-e-0" />
        </Drawer>
      ) : (
        <NavSidebar
          shopName={shopName}
          collapsed={sidebar.collapsed}
          className="sticky top-0 h-dvh"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          band={sidebar.band}
          collapsed={sidebar.collapsed}
          onToggle={sidebar.toggle}
          breadcrumb={breadcrumb}
        />
        <main
          id="main"
          tabIndex={-1}
          className={cn("w-full flex-1 p-6 lg:p-8", !handle?.wide && "mx-auto max-w-content")}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
