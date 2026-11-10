// 앱 셸(system.md §10). 이 커밋에서는 본문 자리만 둔다 — 사이드바·상단바·서랍은 셸 커밋에서 더한다.
import { Outlet } from "react-router";

export function AppShell() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-content p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
