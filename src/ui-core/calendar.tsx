import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import {
  type DayButtonProps,
  DayPicker,
  type DateRange as DayPickerRange,
  type Modifiers,
} from "react-day-picker";
import { ko } from "react-day-picker/locale";
import { cn } from "./cn";
import { FOCUS_RING } from "./internal/class-names";

/** 범위 모드의 값. 시작·끝을 모두 고른 뒤에만 알린다(from ≤ to, 하루짜리면 같은 날) */
export interface DateRange {
  from: Date;
  to: Date;
}

interface CalendarBaseProps {
  /** 고를 수 없는 날. 라이브러리 matcher 타입을 공개 API에 드러내지 않으려고 함수로 받는다 */
  isDateDisabled?(date: Date): boolean;
  /** 처음 보일 달. 없으면 값의 달, 값도 없으면 이번 달 */
  defaultMonth?: Date;
  /** 마운트될 때 선택 날짜(없으면 오늘, 그것도 없으면 첫 활성 날짜)에 포커스를 둔다 */
  autoFocus?: boolean;
  className?: string;
  /** 달력 이름. 이동 모음(nav)의 이름 "<이름> 달 이동"에 쓴다. 한 화면에 달력이 여럿이면 주어 이름이 겹치지 않게 한다 */
  "aria-label"?: string;
}

/** 단일 선택(기본) */
export interface CalendarSingleProps extends CalendarBaseProps {
  mode?: "single";
  value: Date | null;
  onValueChange(date: Date): void;
}

/** 범위 선택. 첫 선택이 시작, 두 번째 선택이 끝이고, 두 번째에서 한 번만 알린다 */
export interface CalendarRangeProps extends CalendarBaseProps {
  mode: "range";
  value: DateRange | null;
  onValueChange(range: DateRange): void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

const navButton = cn(
  "inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50",
  FOCUS_RING,
);

/** 범위 모드의 시작·끝·사이 판정. 단일 모드에서는 모두 거짓이다 */
function rangeRole(modifiers: Modifiers) {
  const edge = Boolean(modifiers.rangeStart || modifiers.rangeEnd);
  return { edge, middle: Boolean(modifiers.rangeMiddle) && !edge };
}

/**
 * 날짜 버튼. react-day-picker의 기본 버튼처럼 focused 수정자가 붙으면 포커스를 옮기고,
 * 수정자에 따라 오늘(ring 테두리)·선택(채움 + 고대비 윤곽선 단서)·범위 사이(띠 글자색 + 얇은 윤곽선)를 그린다.
 */
function DayButton({ day: _day, modifiers, className, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const { middle } = rangeRole(modifiers);
  const filled = modifiers.selected && !middle;
  return (
    <button
      ref={ref}
      {...props}
      className={cn(
        className,
        modifiers.today && !modifiers.selected && "border-ring font-semibold",
        // 선택 날짜(범위의 시작·끝 포함)는 채움에 더해 고대비 모드에서도 남는 윤곽선 단서를 가진다(REQ-UI-001-025).
        filled &&
          "bg-primary font-semibold text-primary-foreground hover:bg-primary forced-colors:outline-2 forced-colors:-outline-offset-2",
        // 범위 사이 날짜: 칸의 primary-subtle 띠 위 글자색, 고대비 모드에서는 얇은 윤곽선으로 범위를 남긴다.
        middle &&
          "text-primary-subtle-foreground hover:bg-primary-subtle forced-colors:outline-1 forced-colors:-outline-offset-2",
      )}
    />
  );
}

function Chevron({ orientation, className }: ComponentProps<"svg"> & { orientation?: string }) {
  const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
  return <Icon className={cn("size-4", className)} />;
}

const baseLabelDayButton = ko.labels?.labelDayButton;

/** 날짜 버튼 이름: 로캘 기본 이름 뒤에 범위의 시작·끝·사이를 붙인다(색이 아닌 단서, system.md §8) */
function labelDayButton(date: Date, modifiers: Modifiers, ...rest: unknown[]): string {
  const base =
    typeof baseLabelDayButton === "function"
      ? (baseLabelDayButton as (d: Date, m: Modifiers, ...r: unknown[]) => string)(
          date,
          modifiers,
          ...rest,
        )
      : date.toLocaleDateString("ko-KR");
  if (modifiers.rangeStart && modifiers.rangeEnd) return `${base}, 시작 날짜, 끝 날짜`;
  if (modifiers.rangeStart) return `${base}, 시작 날짜`;
  if (modifiers.rangeEnd) return `${base}, 끝 날짜`;
  if (modifiers.rangeMiddle) return `${base}, 선택한 기간`;
  return base;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// @MX:NOTE: [AUTO] react-day-picker 10 API 의존을 이 파일에 가둔다(classNames·ko 로캘·modifiers·components·범위 시작·끝·사이 수정자). 일요일 destructive·토요일 primary는 한국 달력 관례다.
// 범위 모드는 라이브러리의 범위 계산을 쓰지 않고 누른 날(triggerDate)만 받아 시작 → 끝을 직접 정한다(두 번째 선택에서 한 번만 알리기 위해).
/**
 * 월 달력 격자(단일 선택 기본, mode="range"면 범위 선택). 키보드는 react-day-picker 10 기본 키 표를 그대로 쓴다:
 * ←→ 하루, ↑↓ 한 주, PageUp·PageDown 한 달, Shift+PageUp·PageDown 한 해, Home·End 그 주의 일·토, Enter·Space 선택.
 * 패키지 기본 CSS는 가져오지 않고 UI 요소마다 토큰 유틸리티를 준다(design.md §7.2, research.md §6.4).
 */
export function Calendar(props: CalendarProps) {
  const { isDateDisabled, defaultMonth, autoFocus, className, "aria-label": ariaLabel } = props;
  // 범위 모드에서 시작만 고른 상태. 끝을 고르면 알리고 비운다.
  const [pendingFrom, setPendingFrom] = useState<Date | null>(null);

  const common = {
    disabled: isDateDisabled,
    autoFocus,
    locale: ko,
    weekStartsOn: 0 as const,
    components: { DayButton, Chevron },
    className: cn("relative w-fit p-3 text-body text-foreground", className),
    classNames: {
      months: "relative flex flex-col gap-4",
      month: "flex flex-col gap-3",
      nav: "absolute inset-x-3 top-3 flex items-center justify-between",
      button_previous: navButton,
      button_next: navButton,
      month_caption: "flex h-8 items-center justify-center",
      caption_label: "text-body font-semibold",
      month_grid: "border-collapse",
      weekdays: "",
      weekday: "size-9 text-caption font-medium text-muted-foreground",
      weeks: "",
      week: "",
      day: "size-9 p-0 text-center",
      day_button: cn(
        "inline-flex size-9 items-center justify-center rounded-control border border-transparent tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50",
        FOCUS_RING,
      ),
      selected: "",
      today: "",
      outside: "text-muted-foreground",
      disabled: "",
      hidden: "invisible",
    },
  };

  if (props.mode === "range") {
    const { value, onValueChange } = props;
    const selected: DayPickerRange | undefined = pendingFrom
      ? { from: pendingFrom, to: undefined }
      : value
        ? { from: value.from, to: value.to }
        : undefined;
    const pick = (day: Date) => {
      if (!pendingFrom) {
        setPendingFrom(day);
        return;
      }
      setPendingFrom(null);
      const [from, to] = day < pendingFrom ? [day, pendingFrom] : [pendingFrom, day];
      onValueChange({ from, to });
    };
    // 시작·끝·사이는 라이브러리 수정자(range_*) 대신 직접 계산한다. 시작만 고른 상태에서도 시작을 알리기 위해서다.
    const from = selected?.from ? startOfDay(selected.from) : undefined;
    const to = selected?.to ? startOfDay(selected.to) : from;
    const rangeStart = (date: Date) => from !== undefined && sameDay(date, from);
    const rangeEnd = (date: Date) =>
      selected?.to !== undefined && to !== undefined && sameDay(date, to);
    const rangeMiddle = (date: Date) =>
      from !== undefined && to !== undefined && date > from && date < to;
    // 띠 위의 주말 날짜는 주말 숫자 색 대신 띠·채움의 글자 토큰을 쓴다(system.md §8).
    const inRange = (date: Date) => rangeStart(date) || rangeEnd(date) || rangeMiddle(date);
    return (
      <DayPicker
        {...common}
        mode="range"
        selected={selected}
        onSelect={(_range, triggerDate) => pick(triggerDate)}
        defaultMonth={defaultMonth ?? value?.from}
        labels={{
          labelDayButton,
          ...(ariaLabel ? { labelNav: () => `${ariaLabel} 달 이동` } : {}),
        }}
        modifiers={{
          sunday: (date: Date) => date.getDay() === 0 && !inRange(date),
          saturday: (date: Date) => date.getDay() === 6 && !inRange(date),
          rangeStart,
          rangeMiddle,
          rangeEnd,
        }}
        modifiersClassNames={{
          sunday: "text-destructive",
          saturday: "text-primary",
          // 띠: 칸 전체를 primary-subtle로 칠하고 시작·끝 칸의 바깥쪽 모서리만 둥글게 한다(모양으로도 범위를 알림).
          rangeStart: "bg-primary-subtle rounded-s-control",
          rangeMiddle: "bg-primary-subtle",
          rangeEnd: "bg-primary-subtle rounded-e-control",
        }}
      />
    );
  }

  const { value, onValueChange } = props;
  return (
    <DayPicker
      {...common}
      mode="single"
      required
      selected={value ?? undefined}
      onSelect={onValueChange}
      defaultMonth={defaultMonth ?? value ?? undefined}
      labels={ariaLabel ? { labelNav: () => `${ariaLabel} 달 이동` } : undefined}
      modifiers={{ sunday: { dayOfWeek: [0] }, saturday: { dayOfWeek: [6] } }}
      modifiersClassNames={{ sunday: "text-destructive", saturday: "text-primary" }}
    />
  );
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
