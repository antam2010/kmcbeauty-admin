import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { type ComponentProps, type KeyboardEvent, useRef } from "react";
import { cn } from "./cn";
import { FOCUS_RING, SELECTED_ITEM } from "./internal/class-names";

// Radix 로빙 포커스가 포커스를 옮기는 키(research.md §6.14). 이 키로 포커스가 옮겨 가면 선택도 함께 옮긴다.
const NAVIGATION_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

// @MX:NOTE: [AUTO] Radix ToggleGroup 1.2.1은 방향키로 포커스만 옮긴다(로빙 포커스). APG 라디오 묶음처럼 선택도 함께 옮기려고 보탠 훅이며 Filter와 ThemeToggle이 함께 쓴다(plan.md §E.5, design.md §6.4). 공개 API가 아니다.
/**
 * 단일 선택 ToggleGroup을 APG 라디오 묶음처럼 동작하게 한다.
 * - 방향키·Home·End로 포커스가 옮겨 간 항목을 선택한다. Tab으로 들어올 때는 선택을 바꾸지 않는다.
 * - 선택된 항목을 다시 누르면 Radix가 빈 값을 보내는데, 라디오 묶음이므로 무시해 해제되지 않게 한다.
 * - 이미 선택된 값은 다시 알리지 않는다.
 */
export function useArrowKeySelection<T extends string>(
  values: readonly T[],
  value: T,
  onSelect: (next: T) => void,
) {
  const navigatingRef = useRef(false);
  const isValue = (candidate: string): candidate is T =>
    (values as readonly string[]).includes(candidate);

  const select = (next: string) => {
    if (next !== value && isValue(next)) onSelect(next);
  };

  return {
    rootProps: {
      onValueChange: select,
      onKeyDownCapture: (event: KeyboardEvent) => {
        // Radix는 keydown 뒤 setTimeout으로 포커스를 옮기므로, 표시를 남겨 두고 포커스를 받은 항목에서 쓴다.
        // keyup에서 지우면 포커스가 옮겨 가기 전에 표시가 사라질 수 있어 다음 keydown이 덮어쓰게 둔다.
        navigatingRef.current = NAVIGATION_KEYS.has(event.key);
      },
    },
    itemProps: (itemValue: string) => ({
      onFocus: () => {
        if (!navigatingRef.current) return;
        navigatingRef.current = false;
        select(itemValue);
      },
    }),
  };
}

/** Filter·ThemeToggle이 함께 쓰는 단일 선택 묶음의 틀 */
export const segmentGroupClasses =
  "inline-flex items-center gap-1 rounded-control border border-border bg-card p-1";

/**
 * Filter·ThemeToggle이 함께 쓰는 단일 선택 항목 모양. 선택된 항목은 primary-subtle 면에
 * 강제 색 모드에서도 남는 단서(font-semibold + forced-colors 테두리)를 더한다(REQ-UI-001-025).
 */
export function segmentItemClasses(selected: boolean, className?: string) {
  return cn(
    `inline-flex h-8 items-center gap-1.5 rounded-chip px-2.5 text-body-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${FOCUS_RING}`,
    selected && SELECTED_ITEM,
    className,
  );
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterProps
  extends Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "dir"> {
  options: FilterOption[];
  value: string;
  /** 선택 해제는 없고, 방향키로 선택이 옮겨질 때마다 불린다(이전 요청 취소는 소비 측 몫 — plan.md §B B-19). */
  onValueChange(value: string): void;
  "aria-label": string;
}

/** 목록 위의 단일 선택 거르기(APG 라디오 묶음, REQ-UI-001-017). */
export function Filter({ options, value, onValueChange, className, ...props }: FilterProps) {
  const { rootProps, itemProps } = useArrowKeySelection(
    options.map((option) => option.value),
    value,
    onValueChange,
  );

  return (
    <ToggleGroup.Root
      {...props}
      type="single"
      value={value}
      onValueChange={rootProps.onValueChange}
      onKeyDownCapture={rootProps.onKeyDownCapture}
      className={cn(segmentGroupClasses, className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          {...itemProps(option.value)}
          className={segmentItemClasses(option.value === value)}
        >
          {option.label}
          {option.count !== undefined ? (
            <>
              {" "}
              <span data-filter-count="" className="tabular-nums">
                {option.count}
              </span>
            </>
          ) : null}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
