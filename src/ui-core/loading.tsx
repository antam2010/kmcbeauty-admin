import { cva } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

const loadingVariants = cva("inline-flex items-center gap-2 text-muted-foreground", {
  variants: { size: { sm: "text-body-sm", md: "text-body" } },
  defaultVariants: { size: "md" },
});

const spinnerVariants = cva("shrink-0 motion-safe:animate-spin", {
  variants: { size: { sm: "size-4", md: "size-5" } },
  defaultVariants: { size: "md" },
});

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
    <div {...props} role="status" className={cn(loadingVariants({ size }), className)}>
      <LoaderCircle className={spinnerVariants({ size })} />
      <span>{label}</span>
    </div>
  );
}
