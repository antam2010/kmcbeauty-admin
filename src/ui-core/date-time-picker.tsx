import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { CalendarDays } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { Calendar } from "./calendar";
import { cn } from "./cn";
import { useFieldControl } from "./field";
import { PICKER_TRIGGER } from "./internal/class-names";
import { Select } from "./select";

export interface DateTimePickerProps
  extends Omit<
    ComponentProps<"button">,
    "value" | "defaultValue" | "onChange" | "type" | "children" | "placeholder"
  > {
  value: Date | null;
  /** 날짜와 시간이 모두 정해질 때만 알린다 */
  onValueChange(value: Date | null): void;
  /** 기본 "datetime". "date"면 그날 00:00으로 알린다 */
  granularity?: "date" | "datetime";
  /** "HH:mm" 영업시간. end는 간격과 맞을 때 포함한다. 기본 하루 전체 */
  timeRange?: { start: string; end: string };
  /** 기본 30 */
  minuteStep?: number;
  isDateDisabled?(date: Date): boolean;
  /** 기본 "날짜 선택" */
  placeholder?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const pad = (value: number) => String(value).padStart(2, "0");

/** 영업시간과 간격으로 시간 칸("HH:mm")을 만든다. 끝 시각은 간격과 맞을 때만 포함한다(EC-06). */
export function getTimeSlots(start: string, end: string, stepMinutes: number): string[] {
  if (stepMinutes <= 0) return [];
  const slots: string[] = [];
  for (let minutes = toMinutes(start); minutes <= toMinutes(end); minutes += stepMinutes) {
    slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  return slots;
}

/** "2026. 10. 29. (목) 14:30"(24시간제 두 자리 시, D4). 날짜만이면 시간을 뺀다. */
export function formatDateTime(date: Date, granularity: "date" | "datetime"): string {
  return format(date, granularity === "date" ? "yyyy. M. d. (EEE)" : "yyyy. M. d. (EEE) HH:mm", {
    locale: ko,
  });
}

const withTime = (date: Date, time: string) => {
  const minutes = toMinutes(time);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
  );
};

/**
 * 간격 칸에 없는 현재 시각(예: 30분 간격의 14:10)을 순서에 맞는 자리에 끼운다.
 * 값을 간격에 맞춰 몰래 바꾸지 않고 그대로 보이기 위해서다(SPEC-UI-002 후속 과제 2).
 * "HH:mm"은 두 자리 고정이라 문자열 비교가 시각 순서와 같다.
 */
const withCurrentTime = (slots: string[], current: string | undefined) =>
  current === undefined || slots.includes(current) ? slots : [...slots, current].sort();

const FULL_DAY = { start: "00:00", end: "23:59" };

// @MX:NOTE: [AUTO] 시간 표기는 24시간제 HH:mm(D4)이다. 날짜와 시간이 모두 정해질 때만 onValueChange를 부르고, 값이 없을 때 고른 날짜는 대화상자 안의 진행 중 날짜로만 둔다(plan.md §A.6-10).
/**
 * 예약 일시 입력(APG 날짜 선택 대화상자). 트리거를 누르면 Radix Popover 안에 Calendar와 시간 Select가 열린다.
 */
export function DateTimePicker({
  value,
  onValueChange,
  granularity = "datetime",
  timeRange = FULL_DAY,
  minuteStep = 30,
  isDateDisabled,
  placeholder = "날짜 선택",
  invalid,
  required,
  disabled,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: DateTimePickerProps) {
  const control = useFieldControl({ id, invalid, required, "aria-describedby": ariaDescribedBy });
  const [open, setOpen] = useState(false);
  // 진행 중 값: 값이 없을 때 대화상자 안에서만 고른 날짜·시간. 닫으면 버린다.
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [draftTime, setDraftTime] = useState<string | undefined>(undefined);
  const timeTriggerRef = useRef<HTMLButtonElement>(null);
  // 날짜를 고른 뒤 시간 칸 트리거로 포커스를 옮긴다(보강). 렌더링이 끝난 뒤 옮겨야
  // react-day-picker 날짜 버튼의 포커스 효과보다 늦게 실행된다.
  const [focusTimeRequest, setFocusTimeRequest] = useState(0);
  useEffect(() => {
    if (focusTimeRequest > 0) timeTriggerRef.current?.focus();
  }, [focusTimeRequest]);

  const currentTime = value ? format(value, "HH:mm") : draftTime;
  const slots = withCurrentTime(
    getTimeSlots(timeRange.start, timeRange.end, minuteStep),
    currentTime,
  );
  const shownDate = draftDate ?? value;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setDraftDate(null);
      setDraftTime(undefined);
    }
  };

  const finish = (next: Date) => {
    onValueChange(next);
    handleOpenChange(false);
  };

  const handleDate = (date: Date) => {
    if (granularity === "date") {
      finish(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
      return;
    }
    if (value) {
      // 값이 있을 때 날짜만 바꾸면 시·분을 유지해 바로 알린다(EC-26).
      onValueChange(withTime(date, format(value, "HH:mm")));
      setDraftDate(date);
      setFocusTimeRequest((count) => count + 1);
      return;
    }
    if (draftTime) {
      finish(withTime(date, draftTime));
      return;
    }
    setDraftDate(date);
    setFocusTimeRequest((count) => count + 1);
  };

  const handleTime = (time: string) => {
    const date = draftDate ?? value;
    if (!date) {
      setDraftTime(time);
      return;
    }
    finish(withTime(date, time));
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        {...props}
        type="button"
        // 버튼 역할은 aria-required를 받지 못한다. 대화상자를 여는 콤보박스(APG 날짜 선택 콤보박스)로 알려
        // 필수 표시(aria-required)와 열림 상태(aria-expanded)를 함께 전한다(AC-UI-001-16).
        role="combobox"
        aria-haspopup="dialog"
        id={control.id}
        disabled={disabled}
        aria-describedby={control.describedBy}
        aria-invalid={control.invalid || undefined}
        aria-required={control.required || undefined}
        className={cn(PICKER_TRIGGER, className)}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate tabular-nums", !value && "text-muted-foreground")}>
          {value ? formatDateTime(value, granularity) : placeholder}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          aria-label="날짜 선택"
          align="start"
          sideOffset={4}
          // 떠 있는 레이어 2단계: popover + border + shadow-raised, z 50(system.md §6·§7)
          className="z-50 flex flex-col rounded-panel border border-border bg-popover text-popover-foreground shadow-raised motion-safe:data-[state=open]:animate-fade-in"
        >
          {/* 첫 포커스는 DOM 순서의 첫 요소(이전 달 버튼)가 아니라 날짜다(보강). Calendar autoFocus가 선택 날짜 →
              오늘 → 이 달의 첫 활성 날짜 순으로 고른 날짜 버튼에 먼저 포커스를 두므로, Radix FocusScope는 이미 안에
              포커스가 있어 옮기지 않는다. 고를 수 있는 날짜가 하나도 없을 때만 FocusScope 기본값(첫 버튼)을 쓴다. */}
          <Calendar
            value={shownDate}
            onValueChange={handleDate}
            isDateDisabled={isDateDisabled}
            autoFocus
          />
          {granularity === "datetime" ? (
            <div className="flex items-center gap-3 border-t border-border px-3 py-3">
              <span className="text-body-sm font-medium text-muted-foreground">시간</span>
              <Select
                ref={timeTriggerRef}
                aria-label="시간"
                size="sm"
                placeholder="시간 선택"
                options={slots.map((slot) => ({ value: slot, label: slot }))}
                value={currentTime}
                onValueChange={handleTime}
              />
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
