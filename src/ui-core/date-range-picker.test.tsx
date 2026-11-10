import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import type { DateRange } from "./calendar";
import { DateRangePicker, type DateRangePickerProps } from "./date-range-picker";
import { Field } from "./field";

// 오늘을 2026-10-29(목) 10:00으로 고정한다. Date만 가짜로 두고 타이머는 실제 것을 쓴다(user-event, B-6).
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
}: Partial<Omit<DateRangePickerProps, "value" | "onValueChange">> & {
  initial?: DateRange | null;
  onValueChange?: (value: DateRange) => void;
}) {
  const [value, setValue] = useState<DateRange | null>(initial);
  return (
    <Field label="시술 기간">
      <DateRangePicker
        {...props}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange?.(next);
        }}
      />
    </Field>
  );
}

const trigger = () => screen.getByRole("combobox", { name: "시술 기간" });
const dialog = () => screen.getByRole("dialog", { name: "기간 선택" });
const queryDialog = () => screen.queryByRole("dialog");
const focusedDay = () => document.activeElement?.closest("[data-day]")?.getAttribute("data-day");
const cell = (iso: string) => document.querySelector<HTMLElement>(`[data-day="${iso}"]`);
const dayButton = (iso: string) => {
  const found = cell(iso)?.querySelector("button");
  if (!found) throw new Error(`${iso} 날짜 버튼이 없어요`);
  return found;
};

describe("DateRangePicker — 키보드 계약(acceptance.md §3.10)", () => {
  it("값이 없으면 placeholder를 보이고, 트리거에서 Enter로 열려 오늘에 포커스가 간다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(trigger()).toHaveTextContent("기간 선택");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    trigger().focus();
    await user.keyboard("{Enter}");
    expect(dialog()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(focusedDay()).toBe("2026-10-29");
  });

  it("트리거에서 Space로도 열린다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    trigger().focus();
    await user.keyboard(" ");
    expect(dialog()).toBeInTheDocument();
  });

  it("화살표로 날짜를 옮겨 Enter로 시작, 다시 Enter로 끝을 고르면 { from, to }로 한 번 알리고 닫히며 포커스가 트리거로 돌아온다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    trigger().focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowLeft}");
    expect(focusedDay()).toBe("2026-10-28");
    await user.keyboard("{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(dialog()).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith({
      from: new Date(2026, 9, 28),
      to: new Date(2026, 10, 5),
    });
    expect(queryDialog()).toBeNull();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveTextContent("2026. 10. 28. ~ 2026. 11. 5.");
  });

  it("Esc는 값을 바꾸지 않고 닫으며 포커스를 트리거로 돌린다(시작만 고른 상태도 버린다)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const RANGE = { from: new Date(2026, 9, 12), to: new Date(2026, 9, 15) };
    render(<Harness initial={RANGE} onValueChange={onValueChange} />);
    await user.click(trigger());
    expect(focusedDay()).toBe("2026-10-12");
    await user.keyboard("{ArrowRight}{Enter}");
    await user.keyboard("{Escape}");
    expect(queryDialog()).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveTextContent("2026. 10. 12. ~ 2026. 10. 15.");
    // 다시 열면 원래 범위가 그대로 보인다
    await user.click(trigger());
    expect(dayButton("2026-10-12")).toHaveAccessibleName(/시작 날짜/);
    expect(dayButton("2026-10-15")).toHaveAccessibleName(/끝 날짜/);
  });

  it("시작·끝·사이 날짜에 색이 아닌 단서(aria-selected와 시작·끝 접근 이름)가 있다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ from: new Date(2026, 9, 12), to: new Date(2026, 9, 14) }} />);
    await user.click(trigger());
    for (const iso of ["2026-10-12", "2026-10-13", "2026-10-14"]) {
      expect(cell(iso)).toHaveAttribute("aria-selected", "true");
    }
    expect(dayButton("2026-10-12")).toHaveAccessibleName(/시작 날짜/);
    expect(dayButton("2026-10-14")).toHaveAccessibleName(/끝 날짜/);
  });
});

describe("DateRangePicker — 프리셋·Field 연결·모양", () => {
  const PRESETS = [
    { label: "이번 주", range: { from: new Date(2026, 9, 25), to: new Date(2026, 9, 31) } },
    { label: "이번 달", range: { from: new Date(2026, 9, 1), to: new Date(2026, 9, 31) } },
  ];

  it("프리셋을 누르면 그 범위로 한 번 알리고 닫힌다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness presets={PRESETS} onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.click(within(dialog()).getByRole("button", { name: "이번 달" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(PRESETS[1].range);
    expect(queryDialog()).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("프리셋이 없으면 프리셋 버튼 묶음을 그리지 않는다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    expect(within(dialog()).queryByRole("group", { name: "빠른 기간" })).toBeNull();
  });

  it("placeholder를 바꿀 수 있고, Field의 라벨·오류가 트리거에 연결된다", () => {
    render(
      <Field label="시술 기간" error="기간을 골라 주세요.">
        <DateRangePicker value={null} onValueChange={() => undefined} placeholder="전체 기간" />
      </Field>,
    );
    expect(trigger()).toHaveTextContent("전체 기간");
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAccessibleDescription("기간을 골라 주세요.");
  });

  it("트리거는 input 테두리·포커스 윤곽선 클래스를 갖고, 팝업 애니메이션은 motion-safe: 아래에만 있다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(trigger()).toHaveClass(
      "border-input",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-ring",
    );
    await user.click(trigger());
    const classes = dialog()
      .className.split(/\s+/)
      .filter((name) => name.includes("animate"));
    expect(classes.length).toBeGreaterThan(0);
    for (const name of classes) expect(name.startsWith("motion-safe:")).toBe(true);
  });

  it("닫힌 상태와 열린 상태(프리셋 포함) 모두 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Harness
        presets={PRESETS}
        initial={{ from: new Date(2026, 9, 12), to: new Date(2026, 9, 14) }}
      />,
    );
    await expectNoAxeViolations(container);
    await user.click(trigger());
    await expectNoAxeViolations(dialog());
  });
});
