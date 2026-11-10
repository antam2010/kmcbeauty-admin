import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ReactElement, ReactNode } from "react";
import { cn } from "./cn";

export interface PopoverProps {
  /** 여닫는 단추 하나(Button 등). Radix Trigger가 aria-expanded·aria-controls·aria-haspopup을 붙인다 */
  trigger: ReactElement;
  children: ReactNode;
  /** 트리거 기준 정렬. 기본 "end"(상단바 오른쪽의 사용자 메뉴) */
  align?: "start" | "center" | "end";
  /** 내용(대화상자 역할)의 이름. 화면 낭독기가 열린 내용을 부를 때 쓴다 */
  "aria-label"?: string;
  className?: string;
}

/**
 * 트리거 하나와 내용 하나의 단순 팝오버(system.md §8). 떠 있는 레이어 2단계이고 쓰는 곳은 사용자 메뉴다.
 * Enter·Space로 열고, Esc는 닫은 뒤 트리거로 포커스를 돌려주며, 바깥을 누르면 닫힌다(Radix Popover 1.3.1 기본).
 */
export function Popover({
  trigger,
  children,
  align = "end",
  "aria-label": ariaLabel,
  className,
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          aria-label={ariaLabel}
          align={align}
          sideOffset={4}
          // 떠 있는 레이어 2단계: popover + border + shadow-raised, z 50(system.md §6·§7)
          className={cn(
            "z-50 flex min-w-48 flex-col gap-2 rounded-panel border border-border bg-popover p-3 text-popover-foreground shadow-raised motion-safe:data-[state=open]:animate-fade-in",
            className,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
