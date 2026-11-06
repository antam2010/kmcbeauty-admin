import { type ComponentProps, type ReactNode, useEffect, useState } from "react";
import { cn } from "./cn";

export interface SkeletonProps extends ComponentProps<"div"> {
  variant?: "block" | "text";
}

/** 내용 모양 자리표시. 장식이라 보조 기술에서 숨기고, 깜빡임은 감속 모드에서 멈춘다(REQ-UI-001-013). */
export function Skeleton({ variant = "block", className, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn(
        "bg-muted motion-safe:animate-pulse",
        variant === "text" ? "h-4 rounded-chip" : "rounded-control",
        className,
      )}
    />
  );
}

export interface SkeletonGroupProps extends ComponentProps<"div"> {
  children: ReactNode;
  /** 화면에 보이지 않는 문구. 기본 "불러오는 중…" */
  label?: string;
  /** 기본 300. 마운트된 뒤 이 시간이 지나기 전에는 아무것도 렌더링하지 않는다 */
  delayMs?: number;
}

/**
 * Skeleton 묶음. 300ms 안에 끝나는 로딩에서 깜빡이지 않도록 delayMs가 지난 뒤에만 보이고,
 * 보일 때는 aria-busy 영역과 숨은 문구로 진행 중임을 알린다(REQ-UI-001-023, EC-10).
 */
export function SkeletonGroup({
  children,
  label = "불러오는 중…",
  delayMs = 300,
  className,
  ...props
}: SkeletonGroupProps) {
  const [visible, setVisible] = useState(delayMs <= 0);

  useEffect(() => {
    if (visible) return;
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    // 지연 안에 로딩이 끝나 묶음이 사라지면 타이머를 지워 한 번도 보이지 않게 한다.
    return () => window.clearTimeout(timer);
  }, [delayMs, visible]);

  if (!visible) return null;

  return (
    <div {...props} aria-busy="true" className={cn("flex flex-col gap-2", className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
