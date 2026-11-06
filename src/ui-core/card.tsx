import type { ComponentProps } from "react";
import { cn } from "./cn";

/** 패널 면. 그림자 없이 card 면 + 장식 테두리이고, 카드 안에 카드를 넣지 않는다(system.md §7·§8). */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col gap-4 rounded-panel border border-border bg-card p-6 text-card-foreground",
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("flex flex-col gap-1", className)} />;
}

export interface CardTitleProps extends ComponentProps<"h2"> {
  /** 제목 수준. 기본 "h2" */
  as?: "h2" | "h3";
}

export function CardTitle({ as: Heading = "h2", className, ...props }: CardTitleProps) {
  return <Heading {...props} className={cn("text-subtitle font-semibold", className)} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("text-body-sm text-muted-foreground", className)} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("text-body", className)} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("flex items-center gap-2", className)} />;
}
