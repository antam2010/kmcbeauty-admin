import { ChevronRight } from "lucide-react";
import type { ComponentProps, ComponentType, ReactNode } from "react";
import { cn } from "./cn";

export interface LinkComponentProps {
  to: string;
  className?: string;
  "aria-current"?: "page";
  children: ReactNode;
}

/** 라우터 링크 자리. 기본값은 <a href={to}>이고 SPEC-UI-002가 라우터 링크를 넘긴다(design.md §8.2). */
export type LinkComponent = ComponentType<LinkComponentProps>;

/** 기본 링크: 받은 to를 href로 쓰는 네이티브 링크. Sidebar도 같은 기본값을 쓴다. */
export function DefaultLink({ to, children, ...props }: LinkComponentProps) {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
}

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps extends Omit<ComponentProps<"nav">, "children"> {
  /** 3단계까지 쓴다(system.md §8). 마지막 항목이 현재 위치다 */
  items: BreadcrumbItem[];
  linkComponent?: LinkComponent;
}

/** 이동 경로(design-direction.md §12.7). nav 이름 기본 "현재 위치", 구분 기호는 장식이다. */
export function Breadcrumb({
  items,
  linkComponent: Link = DefaultLink,
  "aria-label": ariaLabel = "현재 위치",
  className,
  ...props
}: BreadcrumbProps) {
  const lastIndex = items.length - 1;
  return (
    <nav {...props} aria-label={ariaLabel} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-caption">
        {items.map((item, index) => (
          <li key={`${item.label}:${item.to ?? ""}`} className="inline-flex items-center gap-1.5">
            {index === lastIndex ? (
              <span aria-current="page" className="font-medium text-foreground">
                {item.label}
              </span>
            ) : item.to ? (
              <Link
                to={item.to}
                className={cn(
                  "rounded-chip text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-muted-foreground">{item.label}</span>
            )}
            {index < lastIndex ? (
              <ChevronRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
