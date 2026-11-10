// 주 메뉴(system.md §10): 머리에 매장 머리글자 + 현재 매장명 + "매장 변경"(→ /shops), 묶음 "예약"·"관리".
// 활성 판정은 접두사 일치다 — /treatment-menus?menu=3도 시술 메뉴가 활성이다(plan.md §B.2 링크 어댑터).
import { CalendarDays, ClipboardList, ListTree, Users } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Sidebar, type SidebarGroup, type SidebarItem } from "@/ui-core";
import { RouterLink } from "./RouterLink";

const GROUPS: SidebarGroup[] = [
  {
    label: "예약",
    items: [
      { to: "/reservations", label: "예약 캘린더", icon: CalendarDays },
      { to: "/treatments", label: "시술 이력", icon: ClipboardList },
    ],
  },
  {
    label: "관리",
    items: [
      { to: "/customers", label: "고객", icon: Users },
      { to: "/treatment-menus", label: "시술 메뉴", icon: ListTree },
    ],
  },
];

const isActive = (item: SidebarItem, currentPath: string) =>
  currentPath === item.to || currentPath.startsWith(`${item.to}/`);

function ShopHeader({ shopName, collapsed }: { shopName: string; collapsed: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-control bg-primary-subtle font-semibold text-primary-subtle-foreground"
      >
        {shopName.slice(0, 1)}
      </span>
      {collapsed ? (
        <span className="sr-only">{shopName}</span>
      ) : (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body font-semibold text-foreground">{shopName}</span>
          <Link
            to="/shops"
            className="text-caption text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            매장 변경
          </Link>
        </span>
      )}
    </>
  );
}

export function NavSidebar({
  shopName,
  collapsed = false,
  className,
}: {
  shopName: string;
  collapsed?: boolean;
  className?: string;
}) {
  const { pathname } = useLocation();
  return (
    <Sidebar
      groups={GROUPS}
      currentPath={pathname}
      isActive={isActive}
      collapsed={collapsed}
      linkComponent={RouterLink}
      header={<ShopHeader shopName={shopName} collapsed={collapsed} />}
      className={className}
    />
  );
}
