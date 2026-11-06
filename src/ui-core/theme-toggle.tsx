import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { useRef } from "react";
import { cn } from "./cn";
import { type ThemePreference, useTheme } from "./theme-provider";

// @MX:NOTE: [AUTO] Radix ToggleGroup 1.2.1은 방향키로 포커스만 옮긴다(로빙 포커스). APG 라디오 묶음처럼 선택도 함께 옮기려고 보탠 동작이며, M3에서 filter.tsx의 내부 훅으로 옮겨 Filter와 함께 쓴다(plan.md §E.5).
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

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "system", label: "시스템", icon: Monitor },
];

export interface ThemeToggleProps {
  "aria-label"?: string;
}

/**
 * 라이트·다크·시스템 가운데 하나를 고르는 단일 선택 묶음(radiogroup).
 * Radix ToggleGroup의 방향키는 포커스만 옮기므로, APG 라디오 묶음처럼 방향키·Home·End로 포커스가
 * 옮겨 간 항목을 함께 선택한다(plan.md §A.6-8, §B B-19). Tab으로 들어올 때는 선택을 바꾸지 않는다.
 */
export function ThemeToggle({ "aria-label": ariaLabel = "테마" }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme();
  const navigatingRef = useRef(false);

  const select = (next: string) => {
    // 선택된 항목을 다시 누르면 빈 값이 오는데, 라디오 묶음이므로 해제하지 않는다.
    const option = OPTIONS.find((candidate) => candidate.value === next);
    if (option) setPreference(option.value);
  };

  return (
    <ToggleGroup.Root
      type="single"
      value={preference}
      onValueChange={select}
      aria-label={ariaLabel}
      onKeyDownCapture={(event) => {
        // Radix는 keydown 뒤 setTimeout으로 포커스를 옮기므로, 표시를 남겨 두고 포커스를 받은 항목에서 쓴다.
        // keyup에서 지우면 포커스가 옮겨 가기 전에 표시가 사라질 수 있어 다음 keydown이 덮어쓰게 둔다.
        navigatingRef.current = NAVIGATION_KEYS.has(event.key);
      }}
      className="inline-flex items-center gap-1 rounded-control border border-border bg-card p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroup.Item
          key={value}
          value={value}
          onFocus={() => {
            if (!navigatingRef.current) return;
            navigatingRef.current = false;
            select(value);
          }}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-chip px-2.5 text-body-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            preference === value &&
              "bg-primary-subtle font-semibold text-primary-subtle-foreground hover:bg-primary-subtle hover:text-primary-subtle-foreground forced-colors:border-2",
          )}
        >
          <Icon className="size-4" />
          {label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
