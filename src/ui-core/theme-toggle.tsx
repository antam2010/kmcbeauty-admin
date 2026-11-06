import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { segmentGroupClasses, segmentItemClasses, useArrowKeySelection } from "./filter";
import { type ThemePreference, useTheme } from "./theme-provider";

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "system", label: "시스템", icon: Monitor },
];
const VALUES = OPTIONS.map((option) => option.value);

export interface ThemeToggleProps {
  "aria-label"?: string;
}

/**
 * 라이트·다크·시스템 가운데 하나를 고르는 단일 선택 묶음(radiogroup).
 * 방향키 선택 보강과 항목 모양은 Filter와 같은 것을 쓴다(filter.tsx의 useArrowKeySelection, plan.md §A.6-8, §B B-19).
 */
export function ThemeToggle({ "aria-label": ariaLabel = "테마" }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme();
  const { rootProps, itemProps } = useArrowKeySelection(VALUES, preference, setPreference);

  return (
    <ToggleGroup.Root
      type="single"
      value={preference}
      onValueChange={rootProps.onValueChange}
      onKeyDownCapture={rootProps.onKeyDownCapture}
      aria-label={ariaLabel}
      className={segmentGroupClasses}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroup.Item
          key={value}
          value={value}
          {...itemProps(value)}
          className={segmentItemClasses(preference === value)}
        >
          <Icon className="size-4" />
          {label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
