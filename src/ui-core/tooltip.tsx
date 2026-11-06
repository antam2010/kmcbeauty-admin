import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

export interface TooltipProps {
  content: ReactNode;
  /** 기본 "top" */
  side?: "top" | "right" | "bottom" | "left";
  /** 포인터를 올린 뒤 열릴 때까지의 시간(ms). 기본값은 Radix 기본 */
  delayDuration?: number;
  /** 포커스·hover로 여는 트리거 하나(포커스를 받을 수 있는 요소) */
  children: ReactElement;
}

/**
 * 짧은 보조 설명(APG 툴팁). 트리거 포커스로 열리고 포커스를 잃거나 Esc로 닫히며,
 * 열린 동안 트리거의 aria-describedby로 연결된다(Radix Tooltip 1.4.1 기본 동작).
 * Provider를 컴포넌트마다 두어 소비 측이 따로 감싸지 않아도 된다.
 */
export function Tooltip({ content, side = "top", delayDuration, children }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            data-tooltip-content=""
            side={side}
            sideOffset={6}
            // 떠 있는 레이어 2단계: popover + border + shadow-raised, z 50(system.md §6·§7)
            className="z-50 max-w-reading rounded-control border border-border bg-popover px-2.5 py-1.5 text-body-sm text-popover-foreground shadow-raised motion-safe:data-[state=delayed-open]:animate-fade-in motion-safe:data-[state=instant-open]:animate-fade-in"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
