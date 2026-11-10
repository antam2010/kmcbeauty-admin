import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";
import { CalendarRange } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Button } from "./button";
import { Calendar, type DateRange } from "./calendar";
import { cn } from "./cn";
import { useFieldControl } from "./field";
import { PICKER_TRIGGER } from "./internal/class-names";

/** 앱이 넘기는 빠른 기간(예: "이번 주", "이번 달"). ui-core는 날짜 계산을 모른다 */
export interface DateRangePreset {
  label: string;
  range: DateRange;
}

export interface DateRangePickerProps
  extends Omit<
    ComponentProps<"button">,
    "value" | "defaultValue" | "onChange" | "type" | "children" | "placeholder"
  > {
  value: DateRange | null;
  /** 시작·끝을 모두 고르거나 프리셋을 누를 때 한 번 알린다 */
  onValueChange(value: DateRange): void;
  presets?: DateRangePreset[];
  /** 기본 "기간 선택" */
  placeholder?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
}

/** "2026. 10. 12. ~ 2026. 10. 15." */
const formatRange = (range: DateRange) =>
  `${format(range.from, "yyyy. M. d.")} ~ ${format(range.to, "yyyy. M. d.")}`;

/**
 * 기간 입력. 트리거를 누르면 Radix Popover 안에 Calendar 범위 모드가 열린다(react-day-picker는 Calendar 안에만 있다).
 * 시작 → 끝을 고르면 한 번 알리고 닫히며, Esc는 값을 바꾸지 않고 닫는다. 닫히면 Radix가 트리거로 포커스를 돌린다.
 */
export function DateRangePicker({
  value,
  onValueChange,
  presets = [],
  placeholder = "기간 선택",
  invalid,
  required,
  disabled,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: DateRangePickerProps) {
  const control = useFieldControl({ id, invalid, required, "aria-describedby": ariaDescribedBy });
  const [open, setOpen] = useState(false);

  const choose = (range: DateRange) => {
    onValueChange(range);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        {...props}
        type="button"
        // DateTimePicker와 같이 대화상자를 여는 콤보박스로 알려 필수 표시와 열림 상태를 함께 전한다(AC-UI-001-16).
        role="combobox"
        aria-haspopup="dialog"
        id={control.id}
        disabled={disabled}
        aria-describedby={control.describedBy}
        aria-invalid={control.invalid || undefined}
        aria-required={control.required || undefined}
        className={cn(PICKER_TRIGGER, className)}
      >
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate tabular-nums", !value && "text-muted-foreground")}>
          {value ? formatRange(value) : placeholder}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          aria-label="기간 선택"
          align="start"
          sideOffset={4}
          // 떠 있는 레이어 2단계: popover + border + shadow-raised, z 50(system.md §6·§7)
          className="z-50 flex rounded-panel border border-border bg-popover text-popover-foreground shadow-raised motion-safe:data-[state=open]:animate-fade-in"
        >
          {presets.length > 0 ? (
            // biome-ignore lint/a11y/useSemanticElements: 버튼 묶음에 이름을 붙이는 group 역할이다(fieldset은 폼 컨트롤 묶음용).
            <div
              role="group"
              aria-label="빠른 기간"
              className="flex flex-col gap-1 border-e border-border p-3"
            >
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => choose(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          ) : null}
          {/* Calendar autoFocus가 시작 날짜 → 오늘 순으로 날짜 버튼에 먼저 포커스를 둔다(DateTimePicker와 같은 방식). */}
          <Calendar mode="range" value={value} onValueChange={choose} autoFocus />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
