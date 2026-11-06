import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

/** 피드백·표시 컴포넌트가 함께 쓰는 의미 색 단계(plan.md §A.5 공통 타입) */
export type Tone = "neutral" | "info" | "success" | "warning" | "destructive";

// 높이 22px, 좌우 8px, text-caption 500, 틴트형 하나(design-direction.md §12.5, system.md §5)
const badgeVariants = cva(
  "inline-flex h-5.5 shrink-0 items-center gap-1 whitespace-nowrap rounded-badge px-2 text-caption font-medium tabular-nums",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        info: "bg-info-subtle text-info-subtle-foreground",
        success: "bg-success-subtle text-success-subtle-foreground",
        warning: "bg-warning-subtle text-warning-subtle-foreground",
        destructive: "bg-destructive-subtle text-destructive-subtle-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps extends ComponentProps<"span"> {
  tone?: Tone;
  /** 12px 장식 아이콘 */
  icon?: LucideIcon;
  /** 6px 점. icon과 함께 쓰지 않는다 */
  dot?: boolean;
}

// @MX:NOTE: [AUTO] 예약 상태 → 색 연결은 도메인 계층의 몫이다. Badge는 tone·className·icon만 알고, 예약 상태 배지는 소비 측이 상태 토큰 클래스를 className으로 넘겨 cn 병합으로 tone 면을 덮는다(system.md §9).
/** 짧은 분류·상태 표시(REQ-UI-001-023). */
export function Badge({
  tone,
  icon: Icon,
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span {...props} className={cn(badgeVariants({ tone }), className)}>
      {Icon ? (
        <Icon className="size-3 shrink-0" />
      ) : dot ? (
        <span
          data-badge-dot=""
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {children}
    </span>
  );
}
