import { cva } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";
import type { Tone } from "./badge";
import { cn } from "./cn";

type AlertTone = Exclude<Tone, "neutral">;

// 면은 {tone}-subtle, 테두리는 {tone}의 25%(장식), 아이콘·제목은 {tone}-subtle-foreground(design-direction.md §12.5)
const alertVariants = cva("flex gap-3 rounded-panel border p-4 text-body", {
  variants: {
    tone: {
      info: "border-info/25 bg-info-subtle",
      success: "border-success/25 bg-success-subtle",
      warning: "border-warning/25 bg-warning-subtle",
      destructive: "border-destructive/25 bg-destructive-subtle",
    },
  },
  defaultVariants: { tone: "info" },
});

const TONE_ACCENT: Record<AlertTone, { icon: LucideIcon; className: string }> = {
  info: { icon: Info, className: "text-info-subtle-foreground" },
  success: { icon: CircleCheck, className: "text-success-subtle-foreground" },
  warning: { icon: TriangleAlert, className: "text-warning-subtle-foreground" },
  destructive: { icon: CircleAlert, className: "text-destructive-subtle-foreground" },
};

export interface AlertProps extends ComponentProps<"div"> {
  tone?: AlertTone;
  title?: string;
  /** 동적으로 나타나는 오류에만 켠다. 켰을 때만 role="alert"(R15) */
  live?: boolean;
}

/** 화면·대화상자 안의 알림. tone별 아이콘은 장식이다(REQ-UI-001-023). */
export function Alert({
  tone = "info",
  title,
  live = false,
  role,
  className,
  children,
  ...props
}: AlertProps) {
  const { icon: Icon, className: accent } = TONE_ACCENT[tone];
  return (
    <div {...props} role={live ? "alert" : role} className={cn(alertVariants({ tone }), className)}>
      <Icon className={cn("mt-0.75 size-4 shrink-0", accent)} />
      <div className="flex min-w-0 flex-col gap-1">
        {title ? <p className={cn("font-semibold", accent)}>{title}</p> : null}
        {children ? <div className="text-foreground">{children}</div> : null}
      </div>
    </div>
  );
}
