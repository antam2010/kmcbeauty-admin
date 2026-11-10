import type { LucideIcon } from "lucide-react";
import { type ComponentProps, type ReactNode, useId } from "react";
import { DefaultLink, type LinkComponent } from "./breadcrumb";
import { cn } from "./cn";
import { FOCUS_RING, SELECTED_ITEM } from "./internal/class-names";
import { Tooltip } from "./tooltip";

export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarGroup {
  label?: string;
  items: SidebarItem[];
}

export interface SidebarProps extends Omit<ComponentProps<"div">, "children" | "aria-label"> {
  groups: SidebarGroup[];
  currentPath: string;
  /** 기본값은 경로 완전 일치. 접두사 판정이 필요하면 주입한다 */
  isActive?(item: SidebarItem, currentPath: string): boolean;
  /** 접힘 상태 저장과 화면 폭에 따른 전환은 앱 셸(SPEC-UI-002)이 맡는다 */
  collapsed?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  linkComponent?: LinkComponent;
  /** 기본 "주 메뉴" */
  "aria-label"?: string;
}

// 접두사 일치로 판정하면 '/manager' 같은 상위 경로가 하위 화면에서도 활성으로 보인다(design.md §8.2).
const exactMatch = (item: SidebarItem, currentPath: string) => item.to === currentPath;

/**
 * 주 메뉴(design-direction.md §12.7). 펼침 240px, 접힘 64px.
 * 접히면 이름은 숨긴 텍스트로 남아 접근 이름을 지키고, 포커스·hover 때 오른쪽 Tooltip이 이름을 보인다.
 */
export function Sidebar({
  groups,
  currentPath,
  isActive = exactMatch,
  collapsed = false,
  header,
  footer,
  linkComponent = DefaultLink,
  "aria-label": ariaLabel = "주 메뉴",
  className,
  ...props
}: SidebarProps) {
  const baseId = useId();

  return (
    <div
      {...props}
      data-sidebar=""
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex h-full shrink-0 flex-col border-e border-border bg-card motion-safe:transition-[width]",
        collapsed ? "w-(--sidebar-width-collapsed)" : "w-(--sidebar-width)",
        className,
      )}
    >
      {header ? (
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
          {header}
        </div>
      ) : null}
      <nav aria-label={ariaLabel} className="flex-1 overflow-y-auto p-3">
        {groups.map((group, groupIndex) => {
          const labelId = `${baseId}-group-${groupIndex}`;
          return (
            <div key={labelId} className={cn(groupIndex > 0 && !collapsed && "mt-4")}>
              {collapsed && groupIndex > 0 ? (
                // 접힘: 묶음 이름 대신 구분선(장식)
                <div
                  data-sidebar-separator=""
                  aria-hidden="true"
                  className="mx-2 my-2 border-t border-border"
                />
              ) : null}
              {group.label ? (
                <p
                  id={labelId}
                  className={cn(
                    collapsed
                      ? "sr-only"
                      : "px-3 pb-1 text-caption font-medium text-muted-foreground",
                  )}
                >
                  {group.label}
                </p>
              ) : null}
              <ul
                aria-labelledby={group.label ? labelId : undefined}
                className="flex flex-col gap-1"
              >
                {group.items.map((item) => (
                  <li key={item.to}>
                    <SidebarLink
                      item={item}
                      active={isActive(item, currentPath)}
                      collapsed={collapsed}
                      Link={linkComponent}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      {footer ? <div className="shrink-0 border-t border-border p-3">{footer}</div> : null}
    </div>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  Link,
}: {
  item: SidebarItem;
  active: boolean;
  collapsed: boolean;
  Link: LinkComponent;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-control px-3 text-body font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        FOCUS_RING,
        collapsed && "justify-center px-0",
        // 활성: primary-subtle 면 + 강제 색 모드에서도 남는 단서(font-semibold + 테두리, REQ-UI-001-025)
        active && SELECTED_ITEM,
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
    </Link>
  );

  if (!collapsed) return link;
  // 소비 측 링크 컴포넌트가 Radix의 트리거 속성을 넘기지 않아도 되도록 감싼 span을 트리거로 쓴다.
  // React의 focus·blur 이벤트는 거품이 일어 링크 포커스로 Tooltip이 열리고 닫힌다.
  return (
    <Tooltip content={item.label} side="right">
      <span className="block">{link}</span>
    </Tooltip>
  );
}
