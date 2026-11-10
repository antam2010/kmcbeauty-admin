import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, MouseEvent } from "react";
import { cn } from "./cn";
import { FOCUS_RING } from "./internal/class-names";

// 변형·크기 값은 design-direction.md §12.2와 system.md §5(컨트롤 높이 32/40/48px, 아이콘 버튼 32/40px)를 따른다.
const buttonVariants = cva(
  `inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control text-body font-medium transition-colors ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline:
          "border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-body-sm",
        default: "h-10 px-4",
        lg: "h-12 px-5 [&_svg]:size-4.5",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "default" | "lg" | "icon" | "icon-sm";
  /** Radix Slot으로 자식 요소(예: 링크)에 버튼 모양을 입힌다. loading과 함께 쓰지 않는다. */
  asChild?: boolean;
  /** 처리 중. disabled가 아니라 aria-busy·aria-disabled로 실행만 막고 포커스를 유지한다. */
  loading?: boolean;
}

// @MX:ANCHOR: [AUTO] Modal·ConfirmDialog·Pagination·Search 등 ui-core 전체가 쓰는 기본 동작 요소다.
// @MX:REASON: loading은 disabled가 아니라 aria-busy·aria-disabled로 실행만 막는다(R16, REQ-UI-001-015). disabled로 바꾸면 처리 중 포커스가 사라지고 화면 낭독기가 버튼을 건너뛴다.
export function Button({
  variant,
  size,
  asChild = false,
  loading = false,
  className,
  children,
  onClick,
  "aria-disabled": ariaDisabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot className={classes} onClick={onClick} aria-disabled={ariaDisabled} {...props}>
        {children}
      </Slot>
    );
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // 처리 중에는 누르기(클릭·Enter·Space)와 폼 제출을 모두 막는다. 포커스는 그대로 둔다.
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      {...props}
      className={classes}
      onClick={handleClick}
      aria-busy={loading || undefined}
      aria-disabled={loading || ariaDisabled || undefined}
    >
      {loading ? <LoaderCircle className="motion-safe:animate-spin" /> : null}
      {children}
    </button>
  );
}
