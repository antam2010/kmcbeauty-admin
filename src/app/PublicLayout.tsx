// 공개 레이아웃(system.md §10): 로그인·매장 선택·약관·404는 앱 셸 없이 그린다.
// 셸은 현재 매장을 보여 주므로 매장을 고르기 전 화면(매장 선택)도 셸을 쓰지 않는다.
import type { ReactNode } from "react";
import { Outlet } from "react-router";
import { ThemeToggle } from "@/ui-core";

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex justify-end px-6 py-4">
        <ThemeToggle />
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-content flex-1 px-6 pb-12">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
