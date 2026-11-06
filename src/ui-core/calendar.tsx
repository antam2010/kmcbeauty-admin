import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ComponentProps, useEffect, useRef } from "react";
import { type DayButtonProps, DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import { cn } from "./cn";

export interface CalendarProps {
  value: Date | null;
  onValueChange(date: Date): void;
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

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const navButton = cn(
  "inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50",
  focusRing,
);

/**
 * 날짜 버튼. react-day-picker의 기본 버튼처럼 focused 수정자가 붙으면 포커스를 옮기고,
 * 수정자에 따라 오늘(ring 테두리)·선택(채움 + 고대비 윤곽선 단서)을 그린다.
 */
function DayButton({ day: _day, modifiers, className, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <button
      ref={ref}
      {...props}
      className={cn(
        className,
        modifiers.today && !modifiers.selected && "border-ring font-semibold",
        // 선택 날짜는 채움에 더해 고대비 모드에서도 남는 윤곽선 단서를 가진다(REQ-UI-001-025).
        modifiers.selected &&
          "bg-primary font-semibold text-primary-foreground hover:bg-primary forced-colors:outline-2 forced-colors:-outline-offset-2",
      )}
    />
  );
}

function Chevron({ orientation, className }: ComponentProps<"svg"> & { orientation?: string }) {
  const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
  return <Icon className={cn("size-4", className)} />;
}

// @MX:NOTE: [AUTO] react-day-picker 10 API 의존을 이 파일에 가둔다(classNames·ko 로캘·modifiers·components). 일요일 destructive·토요일 primary는 한국 달력 관례다.
/**
 * 월 달력 격자(단일 선택). 키보드는 react-day-picker 10 기본 키 표를 그대로 쓴다:
 * ←→ 하루, ↑↓ 한 주, PageUp·PageDown 한 달, Shift+PageUp·PageDown 한 해, Home·End 그 주의 일·토, Enter·Space 선택.
 * 패키지 기본 CSS는 가져오지 않고 UI 요소마다 토큰 유틸리티를 준다(design.md §7.2, research.md §6.4).
 */
export function Calendar({
  value,
  onValueChange,
  isDateDisabled,
  defaultMonth,
  autoFocus,
  className,
  "aria-label": ariaLabel,
}: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      required
      selected={value ?? undefined}
      onSelect={onValueChange}
      disabled={isDateDisabled}
      defaultMonth={defaultMonth ?? value ?? undefined}
      autoFocus={autoFocus}
      locale={ko}
      labels={ariaLabel ? { labelNav: () => `${ariaLabel} 달 이동` } : undefined}
      weekStartsOn={0}
      modifiers={{ sunday: { dayOfWeek: [0] }, saturday: { dayOfWeek: [6] } }}
      modifiersClassNames={{ sunday: "text-destructive", saturday: "text-primary" }}
      components={{ DayButton, Chevron }}
      className={cn("relative w-fit p-3 text-body text-foreground", className)}
      classNames={{
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
          focusRing,
        ),
        selected: "",
        today: "",
        outside: "text-muted-foreground",
        disabled: "",
        hidden: "invisible",
      }}
    />
  );
}
