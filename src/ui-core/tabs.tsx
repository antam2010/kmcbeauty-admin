import * as TabsPrimitive from "@radix-ui/react-tabs";
import { type ComponentProps, type ReactNode, useState } from "react";
import { cn } from "./cn";
import { FOCUS_RING } from "./internal/class-names";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps
  extends Omit<
    ComponentProps<"div">,
    "defaultValue" | "dir" | "onChange" | "aria-label" | "children"
  > {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?(value: string): void;
  /** tablist 이름 */
  "aria-label": string;
}

/**
 * 밑줄형 탭(APG 탭, 자동 활성화 — 포커스가 옮겨 가면 선택도 바뀐다). Radix Tabs 1.2.1이
 * 방향키·Home·End와 비활성 탭 건너뛰기를 맡는다(design-direction.md §12.6).
 * 활성 탭의 밑줄은 색이 아닌 단서라 강제 색 모드에서도 남는다(REQ-UI-001-025). 그래서
 * 활성 여부를 data-state 변형이 아니라 실제 값으로 판정해 활성 탭에만 테두리 클래스를 붙인다.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  "aria-label": ariaLabel,
  className,
  ...props
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(
    () => defaultValue ?? items.find((item) => !item.disabled)?.value ?? "",
  );
  const current = value ?? uncontrolled;

  const handleValueChange = (next: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  return (
    <TabsPrimitive.Root
      {...props}
      value={current}
      onValueChange={handleValueChange}
      activationMode="automatic"
      className={cn("flex flex-col", className)}
    >
      <TabsPrimitive.List aria-label={ariaLabel} className="flex gap-1 border-b border-border">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              "-mb-px inline-flex h-10 items-center px-3 text-body font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
              FOCUS_RING,
              // 활성 탭: 2px primary 밑줄 + 기본 글자색
              item.value === current && "border-b-2 border-primary text-foreground",
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className={cn("rounded-control pt-4", FOCUS_RING)}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
