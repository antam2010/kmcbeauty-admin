// 상단바(system.md §10, 높이 56px h-14, card, 위쪽 고정 z 20): 왼쪽에 사이드바 접기(768px 미만은 서랍 열기)와 이동 경로,
// 오른쪽에 오늘 날짜("11월 9일 (월)" 꼴)·테마 전환·사용자 메뉴.
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Breadcrumb, type BreadcrumbItem, Button, ThemeToggle } from "@/ui-core";
import { AccountMenu } from "./AccountMenu";
import { RouterLink } from "./RouterLink";
import type { SidebarBand } from "./use-sidebar-state";

const TODAY_PARTS = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

/** 오늘 날짜를 system.md §11 날짜 머리 표기("10월 29일 (목)")로 맞춘다. */
export function todayLabel(date: Date): string {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    TODAY_PARTS.formatToParts(date).find((p) => p.type === type)?.value ?? "";
  return `${part("month")}월 ${part("day")}일 (${part("weekday")})`;
}

export function TopBar({
  band,
  collapsed,
  onToggle,
  breadcrumb,
}: {
  band: SidebarBand;
  collapsed: boolean;
  onToggle: () => void;
  breadcrumb: BreadcrumbItem[];
}) {
  const toggle =
    band === "narrow"
      ? { label: "메뉴 열기", icon: <Menu /> }
      : collapsed
        ? { label: "사이드바 펼치기", icon: <PanelLeftOpen /> }
        : { label: "사이드바 접기", icon: <PanelLeftClose /> };
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
      <Button variant="ghost" size="icon" aria-label={toggle.label} onClick={onToggle}>
        {toggle.icon}
      </Button>
      <Breadcrumb items={breadcrumb} linkComponent={RouterLink} className="min-w-0" />
      <div className="ms-auto flex items-center gap-3">
        <span className="text-body-sm text-muted-foreground tabular-nums">
          {todayLabel(new Date())}
        </span>
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
