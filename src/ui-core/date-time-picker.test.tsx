import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import {
  DateTimePicker,
  type DateTimePickerProps,
  formatDateTime,
  getTimeSlots,
} from "./date-time-picker";
import { Field } from "./field";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

// acceptance.md AC-UI-001-21: 오늘을 2026-10-29(목) 10:00으로 고정한다. Date만 가짜로 두고 타이머는 실제 것을 쓴다(user-event).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 29, 10, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

const BUSINESS_HOURS = { start: "09:00", end: "21:00" };

function Harness({
  initial = null,
  onValueChange,
  ...props
}: Partial<Omit<DateTimePickerProps, "value" | "onValueChange">> & {
  initial?: Date | null;
  onValueChange?: (value: Date | null) => void;
}) {
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <DateTimePicker
      aria-label="예약 일시"
      timeRange={BUSINESS_HOURS}
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

const trigger = () => screen.getByRole("combobox", { name: "예약 일시" });
const dialog = () => screen.getByRole("dialog", { name: "날짜 선택" });
const timeTrigger = () => within(dialog()).getByRole("combobox", { name: "시간" });
const focusedDay = () => document.activeElement?.closest("[data-day]")?.getAttribute("data-day");
const dayButton = (iso: string) => {
  const found = document.querySelector<HTMLElement>(`[data-day="${iso}"] button`);
  if (!found) throw new Error(`${iso} 날짜 버튼이 없어요`);
  return found;
};

describe("getTimeSlots — 영업시간·간격 칸(AC-UI-001-21, EC-06)", () => {
  it("09:00~21:00, 30분이면 '09:00'부터 '21:00'까지 25칸이다(끝이 간격과 맞으면 포함)", () => {
    const slots = getTimeSlots("09:00", "21:00", 30);
    expect(slots).toHaveLength(25);
    expect(slots[0]).toBe("09:00");
    expect(slots[1]).toBe("09:30");
    expect(slots.at(-1)).toBe("21:00");
  });

  it("끝이 간격과 맞지 않으면(09:00~20:50) 마지막 칸은 20:30이다", () => {
    expect(getTimeSlots("09:00", "20:50", 30).at(-1)).toBe("20:30");
  });

  it("시는 두 자리로 쓰고 간격을 바꿀 수 있다", () => {
    expect(getTimeSlots("08:00", "09:00", 20)).toEqual(["08:00", "08:20", "08:40", "09:00"]);
  });

  it("끝이 시작보다 앞이거나 간격이 0 이하면 빈 배열이다", () => {
    expect(getTimeSlots("10:00", "09:00", 30)).toEqual([]);
    expect(getTimeSlots("09:00", "10:00", 0)).toEqual([]);
  });
});

describe("formatDateTime — 표기(AC-UI-001-21)", () => {
  it("'2026. 10. 29. (목) 14:30'으로 쓰고, 날짜만이면 시간을 뺀다", () => {
    expect(formatDateTime(new Date(2026, 9, 29, 14, 30), "datetime")).toBe(
      "2026. 10. 29. (목) 14:30",
    );
    expect(formatDateTime(new Date(2026, 9, 29, 9, 5), "datetime")).toBe(
      "2026. 10. 29. (목) 09:05",
    );
    expect(formatDateTime(new Date(2026, 0, 4), "date")).toBe("2026. 1. 4. (일)");
  });
});

describe("DateTimePicker — 키보드 흐름과 값 결합(AC-UI-001-21, AC-UI-001-11)", () => {
  it("AC-UI-001-11 열자마자 오늘에 포커스, 키마다 도착 날짜, 날짜 뒤 시간 칸, 시간을 고르면 한 번 알리고 닫힌다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    expect(trigger()).toHaveTextContent("날짜 선택");

    trigger().focus();
    await user.keyboard("{Enter}");
    expect(dialog()).toBeInTheDocument();
    expect(focusedDay()).toBe("2026-10-29");
    expect(within(dialog()).getByRole("grid")).toBeInTheDocument();
    expect(within(dialog()).getByText("2026년 10월")).toBeInTheDocument();

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

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(focusedDay()).toBe("2026-10-29");
    await user.keyboard("{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(timeTrigger()).toHaveFocus();

    await user.keyboard("{Enter}");
    const slots = screen.getAllByRole("option");
    expect(slots).toHaveLength(25);
    expect(slots[0]).toHaveTextContent("09:00");
    expect(slots.at(-1)).toHaveTextContent("21:00");
    // 09:00에서 14:30까지 11칸 아래
    for (let index = 0; index < 11; index += 1) await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 9, 29, 14, 30));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveTextContent("2026. 10. 29. (목) 14:30");

    await user.keyboard("{Enter}");
    expect(focusedDay()).toBe("2026-10-29");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("값이 있으면 열 때 선택 날짜에 포커스를 둔다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={new Date(2026, 10, 3, 11, 0)} />);
    await user.click(trigger());
    expect(focusedDay()).toBe("2026-11-03");
    expect(within(dialog()).getByText("2026년 11월")).toBeInTheDocument();
  });

  it("고를 수 있는 날짜가 하나도 없으면 대화상자의 첫 버튼(이전 달)에 포커스를 둔다", async () => {
    const user = userEvent.setup();
    render(<Harness isDateDisabled={() => true} />);
    await user.click(trigger());
    expect(within(dialog()).getByRole("button", { name: "이전 달로 이동" })).toHaveFocus();
  });

  it("Space로도 열린다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    trigger().focus();
    await user.keyboard(" ");
    expect(dialog()).toBeInTheDocument();
  });

  it("값이 없을 때 날짜만 고르고 Esc로 닫으면 알리지 않고 진행 중 날짜를 버린다(EC-24)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.click(dayButton("2026-10-30"));
    expect(document.querySelector('[data-day="2026-10-30"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("날짜 선택");

    // 다시 열면 진행 중 날짜가 없어 오늘에 포커스가 간다
    await user.click(trigger());
    expect(focusedDay()).toBe("2026-10-29");
    expect(document.querySelector('[data-day="2026-10-30"]')).not.toHaveAttribute("aria-selected");
  });

  it("값이 있을 때 날짜만 바꾸면 시·분을 유지해 한 번 알리고 열린 채 시간 칸으로 포커스가 간다(EC-26)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness initial={new Date(2026, 9, 29, 14, 30)} onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.click(dayButton("2026-10-30"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 9, 30, 14, 30));
    expect(dialog()).toBeInTheDocument();
    expect(timeTrigger()).toHaveFocus();
    expect(timeTrigger()).toHaveTextContent("14:30");
  });

  it("시간을 먼저 고르면 날짜를 고를 때 둘을 합쳐 알리고 닫힌다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.click(timeTrigger());
    await user.click(screen.getByRole("option", { name: "10:00" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(dialog()).toBeInTheDocument();
    await user.click(dayButton("2026-10-27"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 9, 27, 10, 0));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("granularity='date'면 시간 칸이 없고, 날짜를 고르면 그날 00:00으로 한 번 알린 뒤 닫힌다(EC-25)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness granularity="date" onValueChange={onValueChange} />);
    await user.click(trigger());
    expect(within(dialog()).queryByRole("combobox")).not.toBeInTheDocument();
    await user.click(dayButton("2026-10-31"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 9, 31, 0, 0));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent("2026. 10. 31. (토)");
    expect(trigger()).toHaveFocus();
  });

  it("minuteStep과 끝이 맞지 않는 영업시간을 시간 칸에 반영한다(EC-06)", async () => {
    const user = userEvent.setup();
    render(<Harness timeRange={{ start: "09:00", end: "20:50" }} minuteStep={30} />);
    await user.click(trigger());
    await user.click(timeTrigger());
    expect(screen.getAllByRole("option").at(-1)).toHaveTextContent("20:30");
  });

  it("간격 밖 값(14:10, 30분 간격)은 트리거와 시간 칸에 그대로 보이고 값을 바꾸지 않는다(SPEC-UI-002 후속 과제 2)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness initial={new Date(2026, 9, 29, 14, 10)} onValueChange={onValueChange} />);
    expect(trigger()).toHaveTextContent("2026. 10. 29. (목) 14:10");
    await user.click(trigger());
    expect(timeTrigger()).toHaveTextContent("14:10");
    await user.click(timeTrigger());
    expect(screen.getByRole("option", { name: "14:10" })).toHaveAttribute("aria-selected", "true");
    // 간격 칸은 그대로 있고, 간격 밖 시각은 순서에 맞는 자리에 끼운다
    const names = screen.getAllByRole("option").map((option) => option.textContent);
    expect(names.slice(names.indexOf("14:00"), names.indexOf("14:30") + 1)).toEqual([
      "14:00",
      "14:10",
      "14:30",
    ]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("timeRange가 없으면 하루 전체(00:00~23:30, 30분)를 칸으로 쓴다", async () => {
    const user = userEvent.setup();
    render(<DateTimePicker aria-label="예약 일시" value={null} onValueChange={vi.fn()} />);
    await user.click(trigger());
    await user.click(timeTrigger());
    const slots = screen.getAllByRole("option");
    expect(slots).toHaveLength(48);
    expect(slots[0]).toHaveTextContent("00:00");
    expect(slots.at(-1)).toHaveTextContent("23:30");
  });

  it("isDateDisabled가 참인 날은 고를 수 없다", async () => {
    const user = userEvent.setup();
    render(<Harness isDateDisabled={(date) => date.getDay() === 1} />);
    await user.click(trigger());
    expect(dayButton("2026-10-26")).toBeDisabled();
  });

  it("일요일·토요일 날짜는 destructive·primary 수정자 클래스를 가진다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    expect(document.querySelector('[data-day="2026-10-25"]')).toHaveClass("text-destructive");
    expect(document.querySelector('[data-day="2026-10-31"]')).toHaveClass("text-primary");
  });
});

describe("DateTimePicker — 트리거와 Field 연결(AC-UI-001-16, AC-UI-001-12)", () => {
  it("Field의 id·설명·오류가 트리거에 연결되고 필수 표시는 aria-required다", () => {
    const { rerender } = render(
      <Field
        label="예약 일시"
        description="영업시간 안에서 골라요."
        error="날짜를 골라 주세요."
        required
      >
        <DateTimePicker value={null} onValueChange={vi.fn()} />
      </Field>,
    );
    const label = screen.getByText("예약 일시", { selector: "label" });
    expect(label).toHaveAttribute("for", trigger().id);
    expect(trigger().getAttribute("aria-describedby")?.split(" ")).toHaveLength(2);
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAttribute("aria-required", "true");
    expect(trigger()).not.toHaveAttribute("required");

    rerender(
      <Field label="예약 일시" description="영업시간 안에서 골라요.">
        <DateTimePicker value={null} onValueChange={vi.fn()} />
      </Field>,
    );
    expect(trigger().getAttribute("aria-describedby")?.split(" ")).toHaveLength(1);
    expect(trigger()).not.toHaveAttribute("aria-invalid");
    expect(trigger()).not.toHaveAttribute("aria-required");
  });

  it("트리거 테두리는 border-input이고 포커스 클래스 세 개를 가지며 placeholder를 바꿀 수 있다", () => {
    render(<Harness placeholder="예약 날짜를 골라요" />);
    expect(trigger()).toHaveClass("border-input", ...FOCUS_CLASSES);
    expect(trigger()).not.toHaveClass("border-border");
    expect(trigger()).toHaveTextContent("예약 날짜를 골라요");
  });

  it("disabled면 열리지 않는다", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("팝업 애니메이션은 motion-safe: 아래에만 있다(AC-UI-001-13)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    const classes = dialog()
      .className.split(/\s+/)
      .filter((name) => name.includes("animate"));
    expect(classes.length).toBeGreaterThan(0);
    for (const name of classes) expect(name.startsWith("motion-safe:")).toBe(true);
  });

  it("닫힌 상태와 열린 대화상자 모두 axe 위반이 없다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Field label="예약 일시" description="영업시간 안에서 골라요.">
        <DateTimePicker value={null} onValueChange={vi.fn()} timeRange={BUSINESS_HOURS} />
      </Field>,
    );
    await expectNoAxeViolations(container);
    await user.click(trigger());
    await expectNoAxeViolations(dialog());
  });

  it("필수·오류 표시가 있는 트리거도 axe 위반이 없다(aria-required를 받는 combobox 역할)", async () => {
    const { container } = render(
      <Field label="예약 일시" error="예약 일시를 골라 주세요." required>
        <DateTimePicker value={null} onValueChange={vi.fn()} />
      </Field>,
    );
    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await expectNoAxeViolations(container);
  });
});
