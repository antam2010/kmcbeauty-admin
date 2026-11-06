import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export interface PageHeaderProps extends Omit<ComponentProps<"div">, "title"> {
  title: string;
  /** 기본 "h1". 화면당 h1 하나라는 규칙은 기본값이 지킨다(design.md §8.3) */
  titleAs?: "h1" | "h2" | "h3";
  breadcrumb?: ReactNode;
  badge?: ReactNode;
  description?: string;
  secondaryActions?: ReactNode;
  /** 주요 동작 하나(Button default) */
  primaryAction?: ReactNode;
  /** 하위 탐색(Tabs 또는 기간 선택) */
  subNav?: ReactNode;
}

/**
 * 화면 머리(design-direction.md §14.2): 이동 경로 → 제목 줄(제목·배지 …… 보조 동작·주요 동작)
 * → 설명 → 하위 탐색. 좁은 화면에서는 동작이 제목 아래로 내려간다.
 */
export function PageHeader({
  title,
  titleAs: Title = "h1",
  breadcrumb,
  badge,
  description,
  secondaryActions,
  primaryAction,
  subNav,
  className,
  ...props
}: PageHeaderProps) {
  const hasActions = secondaryActions != null || primaryAction != null;
  return (
    <div {...props} className={cn("flex flex-col", className)}>
      {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Title className="text-heading font-bold text-foreground">{title}</Title>
          {badge}
        </div>
        {hasActions ? (
          <div data-page-header-actions="" className="flex flex-wrap items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1 text-body-sm text-muted-foreground">{description}</p>
      ) : null}
      {subNav ? (
        <div data-page-header-sub-nav="" className="mt-4">
          {subNav}
        </div>
      ) : null}
    </div>
  );
}
