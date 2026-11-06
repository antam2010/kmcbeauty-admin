import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Calendar, type CalendarProps } from "./calendar";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

// acceptance.md AC-UI-001-21: 오늘을 2026-10-29(목) 10:00으로 고정한다. 타이머는 실제 것을 쓴다(user-event).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 29, 10, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

function Harness({
  initial = null,
  onValueChange,
  ...props
}: Partial<Omit<CalendarProps, "value" | "onValueChange">> & {
  initial?: Date | null;
  onValueChange?: (date: Date) => void;
}) {
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <Calendar
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

const cell = (iso: string) => document.querySelector<HTMLElement>(`[data-day="${iso}"]`);
const dayButton = (iso: string) => {
  const found = cell(iso)?.querySelector("button");
  if (!found) throw new Error(`${iso} 날짜 버튼이 없어요`);
  return found;
};
/** 포커스된 날짜 버튼의 칸에 붙은 ISO 날짜 */
const focusedDay = () => document.activeElement?.closest("[data-day]")?.getAttribute("data-day");
const caption = () => screen.getByRole("status");

describe("Calendar — 한국어 머리와 격자(AC-UI-001-21)", () => {
  it("월 머리는 '2026년 10월'이고 요일 머리는 일요일부터 7개다", () => {
    render(<Harness />);
    expect(caption()).toHaveTextContent("2026년 10월");
    const grid = screen.getByRole("grid");
    // react-day-picker는 요일 머리를 aria-hidden으로 두고 날짜 버튼 이름에 요일을 넣는다("2026년 10월 29일 목요일").
    const headers = within(grid).getAllByRole("columnheader", { hidden: true });
    expect(headers.map((header) => header.textContent)).toEqual([
      "일",
      "월",
      "화",
      "수",
      "목",
      "금",
      "토",
    ]);
    expect(headers[0]).toHaveAttribute("aria-label", "일요일");
    expect(dayButton("2026-10-29")).toHaveAccessibleName(/2026년 10월 29일 목요일/);
  });

  it("aria-label을 주면 이동 모음 이름이 '<이름> 달 이동'이 된다(달력이 여럿일 때 이름이 겹치지 않게)", () => {
    render(<Harness aria-label="휴무일 달력" />);
    expect(screen.getByRole("navigation")).toHaveAccessibleName("휴무일 달력 달 이동");
  });

  it("aria-label이 없으면 이동 모음은 로캘 기본 이름을 쓴다", () => {
    render(<Harness />);
    expect(screen.getByRole("navigation")).toHaveAccessibleName("탐색 모음");
  });

  it("defaultMonth를 주면 그 달을 보인다", () => {
    render(<Harness defaultMonth={new Date(2026, 11, 1)} />);
    expect(caption()).toHaveTextContent("2026년 12월");
  });

  it("값이 있으면 그 달을 보이고 선택 날짜는 aria-selected다", () => {
    render(<Harness initial={new Date(2027, 0, 5)} />);
    expect(caption()).toHaveTextContent("2027년 1월");
    expect(cell("2027-01-05")).toHaveAttribute("aria-selected", "true");
  });

  it("이전·다음 달 버튼에 한국어 이름이 있고 누르면 달이 바뀐다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "다음 달로 이동" }));
    expect(caption()).toHaveTextContent("2026년 11월");
    await user.click(screen.getByRole("button", { name: "이전 달로 이동" }));
    expect(caption()).toHaveTextContent("2026년 10월");
  });
});

describe("Calendar — 키 이동(AC-UI-001-21, AC-UI-001-11)", () => {
  it("AC-UI-001-11 키마다 react-day-picker 10 키 표대로 도착한다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={new Date(2026, 9, 29)} />);
    dayButton("2026-10-29").focus();
    const steps: Array<[string, string]> = [
      ["{ArrowRight}", "2026-10-30"],
      ["{ArrowLeft}", "2026-10-29"],
      ["{ArrowDown}", "2026-11-05"],
      ["{ArrowUp}", "2026-10-29"],
      ["{PageDown}", "2026-11-29"],
      ["{PageUp}", "2026-10-29"],
      ["{Shift>}{PageDown}{/Shift}", "2027-10-29"],
      ["{Shift>}{PageUp}{/Shift}", "2026-10-29"],
      ["{Home}", "2026-10-25"],
      ["{End}", "2026-10-31"],
    ];
    const landed: string[] = [];
    for (const [key] of steps) {
      await user.keyboard(key);
      landed.push(focusedDay() ?? "(없음)");
    }
    expect(landed).toEqual(steps.map(([, iso]) => iso));
  });

  it("↓로 다음 달로 넘어가면 월 머리가 '2026년 11월'이 된다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={new Date(2026, 9, 29)} />);
    dayButton("2026-10-29").focus();
    await user.keyboard("{ArrowDown}");
    expect(caption()).toHaveTextContent("2026년 11월");
  });

  it("Enter와 Space로 포커스된 날짜를 고른다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness initial={new Date(2026, 9, 29)} onValueChange={onValueChange} />);
    dayButton("2026-10-29").focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 9, 30));
    await user.keyboard("{ArrowRight}[Space]");
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 9, 31));
    expect(cell("2026-10-31")).toHaveAttribute("aria-selected", "true");
  });

  it("선택된 날짜를 다시 골라도 선택이 풀리지 않는다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness initial={new Date(2026, 9, 29)} onValueChange={onValueChange} />);
    await user.click(dayButton("2026-10-29"));
    expect(cell("2026-10-29")).toHaveAttribute("aria-selected", "true");
  });

  it("autoFocus면 선택 날짜(없으면 오늘)에 포커스를 둔다", () => {
    const { unmount } = render(<Harness autoFocus />);
    expect(focusedDay()).toBe("2026-10-29");
    unmount();
    render(<Harness autoFocus initial={new Date(2026, 9, 12)} />);
    expect(focusedDay()).toBe("2026-10-12");
  });
});

describe("Calendar — 비활성 날짜(EC-07)", () => {
  const isWednesday = (date: Date) => date.getDay() === 3;

  it("isDateDisabled가 참인 날은 고를 수 없고 비활성으로 표시된다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness isDateDisabled={isWednesday} onValueChange={onValueChange} />);
    const wednesday = dayButton("2026-10-28");
    expect(wednesday).toBeDisabled();
    expect(cell("2026-10-28")).toHaveAttribute("data-disabled", "true");
    await user.click(wednesday);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("방향키 이동은 비활성 날짜를 건너뛴다", async () => {
    const user = userEvent.setup();
    render(<Harness isDateDisabled={isWednesday} initial={new Date(2026, 9, 27)} />);
    dayButton("2026-10-27").focus();
    await user.keyboard("{ArrowRight}");
    expect(focusedDay()).toBe("2026-10-29");
  });
});

describe("Calendar — 주말 색·오늘·선택 단서(AC-UI-001-21, AC-UI-001-12)", () => {
  it("일요일은 destructive, 토요일은 primary 수정자 클래스를 가지고 평일은 갖지 않는다", () => {
    render(<Harness />);
    expect(cell("2026-10-25")).toHaveClass("text-destructive");
    expect(cell("2026-10-31")).toHaveClass("text-primary");
    expect(cell("2026-10-27")).not.toHaveClass("text-destructive");
    expect(cell("2026-10-27")).not.toHaveClass("text-primary");
  });

  it("오늘은 ring 테두리를 가지고 다른 날은 갖지 않는다", () => {
    render(<Harness />);
    expect(cell("2026-10-29")).toHaveAttribute("data-today", "true");
    expect(dayButton("2026-10-29")).toHaveClass("border-ring");
    expect(dayButton("2026-10-28")).not.toHaveClass("border-ring");
  });

  it("선택 날짜에만 forced-colors 윤곽선 단서가 있다", () => {
    render(<Harness initial={new Date(2026, 9, 20)} />);
    expect(dayButton("2026-10-20")).toHaveClass("forced-colors:outline-2");
    expect(dayButton("2026-10-21")).not.toHaveClass("forced-colors:outline-2");
    expect(dayButton("2026-10-20")).toHaveClass("bg-primary");
  });

  it("날짜·이동 버튼은 포커스 클래스 세 개를 가진다", () => {
    render(<Harness />);
    expect(dayButton("2026-10-29")).toHaveClass(...FOCUS_CLASSES);
    expect(screen.getByRole("button", { name: "다음 달로 이동" })).toHaveClass(...FOCUS_CLASSES);
  });

  it("값이 있거나 없거나 axe 위반이 없다", async () => {
    const { container, rerender } = render(<Harness />);
    await expectNoAxeViolations(container);
    rerender(<Harness initial={new Date(2026, 9, 20)} isDateDisabled={(d) => d.getDay() === 3} />);
    await expectNoAxeViolations(container);
  });
});
