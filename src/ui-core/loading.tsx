import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

export interface LoadingProps extends Omit<ComponentProps<"div">, "children"> {
  size?: "sm" | "md";
  /** 기본 "불러오는 중…" */
  label?: string;
}

/**
 * 진행 표시. 스피너는 장식이고 문구가 의미를 전한다(role="status").
 * 회전은 motion-safe: 아래에만 두어 감속 모드에서는 멈춘다(REQ-UI-001-013).
 */
export function Loading({
  size = "md",
  label = "불러오는 중…",
  className,
  ...props
}: LoadingProps) {
  return (
    <div
      {...props}
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-muted-foreground",
        size === "sm" ? "text-body-sm" : "text-body",
        className,
      )}
    >
      <LoaderCircle
        className={cn("shrink-0 motion-safe:animate-spin", size === "sm" ? "size-4" : "size-5")}
      />
      <span>{label}</span>
    </div>
  );
}
