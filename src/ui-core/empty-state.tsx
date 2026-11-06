import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  /** 동작 하나 */
  action?: ReactNode;
}

/** 데이터 없음·결과 없음. 패널 안 가운데에 아이콘 + 제목 + 설명 + 동작 하나를 둔다(design-direction.md §12.5). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      {...props}
      className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}
    >
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </span>
      ) : null}
      <p className="text-subtitle font-semibold text-foreground">{title}</p>
      {description ? (
        <div className="max-w-90 text-body-sm text-muted-foreground">{description}</div>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
