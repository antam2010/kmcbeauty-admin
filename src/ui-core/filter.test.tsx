import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Filter, type FilterOption } from "./filter";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];
// 색이 아닌 선택 단서(acceptance.md AC-UI-001-12)
const NON_COLOR_CUE =
  /(^|\s)(forced-colors:)?(font-semibold|font-bold|underline|border-\d|outline-\d)(\s|$)/;

// acceptance.md AC-UI-001-17의 옵션
const PERIODS: FilterOption[] = [
  { value: "all", label: "전체" },
  { value: "today", label: "오늘" },
  { value: "week", label: "이번 주" },
];

function Harness({
  options = PERIODS,
  initial = "all",
  onValueChange,
}: {
  options?: FilterOption[];
  initial?: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <button type="button">앞 요소</button>
      <Filter
        aria-label="기간"
        options={options}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange?.(next);
        }}
      />
    </>
  );
}

const radio = (name: string) => screen.getByRole("radio", { name });

async function tabIntoFilter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "앞 요소" }));
  await user.tab();
}

describe("Filter — 구조(AC-UI-001-17)", () => {
  it("이름이 있는 radiogroup 안에 옵션이 차례로 있고 선택된 항목만 aria-checked='true'다", () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup", { name: "기간" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((item) => item.textContent)).toEqual([
      "전체",
      "오늘",
      "이번 주",
    ]);
    expect(radio("전체")).toHaveAttribute("aria-checked", "true");
    expect(radio("오늘")).toHaveAttribute("aria-checked", "false");
  });

  it("count가 있으면 라벨 뒤에 고정폭 숫자로 개수를 보이고 접근 이름에 포함한다", () => {
    render(
      <Harness
        options={[
          { value: "all", label: "전체", count: 128 },
          { value: "today", label: "오늘", count: 12 },
        ]}
      />,
    );
    const today = radio("오늘 12");
    const count = today.querySelector("[data-filter-count]");
    expect(count).toHaveTextContent("12");
    expect(count).toHaveClass("tabular-nums");
  });

  it("className과 네이티브 속성은 묶음에 붙는다", () => {
    render(
      <Filter
        aria-label="기간"
        options={PERIODS}
        value="all"
        onValueChange={() => undefined}
        className="w-full"
        data-showcase="Filter:default"
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "기간" });
    expect(group).toHaveClass("w-full");
    expect(group).toHaveAttribute("data-showcase", "Filter:default");
  });
});

describe("Filter — 키보드로 고르기(AC-UI-001-17, AC-UI-001-11)", () => {
  it("AC-UI-001-11: 선택된 '전체'에서 →를 누르면 포커스와 선택이 함께 '오늘'로 옮겨지고 onValueChange가 한 번 불린다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    await tabIntoFilter(user);
    expect(radio("전체")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(radio("오늘")).toHaveFocus();
    expect(radio("오늘")).toHaveAttribute("aria-checked", "true");
    expect(radio("전체")).toHaveAttribute("aria-checked", "false");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("today");
  });

  it("AC-UI-001-11: Space는 선택된 항목을 해제하지 않는다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    await tabIntoFilter(user);
    await user.keyboard("{ArrowRight}");
    await user.keyboard(" ");
    expect(radio("오늘")).toHaveAttribute("aria-checked", "true");
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("AC-UI-001-11: Tab으로 들어올 때는 선택을 바꾸지 않는다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="week" onValueChange={onValueChange} />);
    await tabIntoFilter(user);
    expect(radio("이번 주")).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("AC-UI-001-11: ←·↑·↓도 선택을 옮기고 끝에서 처음으로 돈다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await tabIntoFilter(user);

    await user.keyboard("{ArrowLeft}");
    expect(radio("이번 주")).toHaveFocus();
    expect(radio("이번 주")).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowDown}");
    expect(radio("전체")).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowUp}");
    expect(radio("이번 주")).toHaveAttribute("aria-checked", "true");
  });

  it("AC-UI-001-11: Home·End는 처음·끝 항목을 고른다", async () => {
    const user = userEvent.setup();
    render(<Harness initial="today" />);
    await tabIntoFilter(user);

    await user.keyboard("{End}");
    expect(radio("이번 주")).toHaveFocus();
    expect(radio("이번 주")).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{Home}");
    expect(radio("전체")).toHaveFocus();
    expect(radio("전체")).toHaveAttribute("aria-checked", "true");
  });

  it("마우스로 누르면 그 항목이 선택되고, 선택된 항목을 다시 눌러도 해제되지 않는다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    await user.click(radio("이번 주"));
    expect(onValueChange).toHaveBeenLastCalledWith("week");
    await user.click(radio("이번 주"));
    expect(radio("이번 주")).toHaveAttribute("aria-checked", "true");
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});

describe("Filter — 포커스 표시·선택 단서·자동 접근성 검사", () => {
  it("AC-UI-001-11: 모든 항목에 포커스 윤곽선 클래스 세 개가 있다", () => {
    render(<Harness />);
    for (const item of screen.getAllByRole("radio")) {
      expect(item).toHaveClass(...FOCUS_CLASSES);
    }
  });

  it("선택된 항목에만 배경 채움과 색이 아닌 단서가 있다(REQ-UI-001-025)", () => {
    render(<Harness />);
    expect(radio("전체")).toHaveClass("bg-primary-subtle");
    expect(radio("전체").className).toMatch(NON_COLOR_CUE);
    for (const name of ["오늘", "이번 주"]) {
      expect(radio(name)).not.toHaveClass("bg-primary-subtle");
      expect(radio(name).className).not.toMatch(NON_COLOR_CUE);
    }
  });

  it("AC-UI-001-11: 기본·개수 표시·선택이 바뀐 상태에서 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Harness />
        <Filter
          aria-label="상태"
          options={[
            { value: "all", label: "전체", count: 3 },
            { value: "open", label: "진행", count: 1 },
          ]}
          value="all"
          onValueChange={() => undefined}
        />
      </>,
    );
    await expectNoAxeViolations(container);
    await user.click(radio("오늘"));
    await expectNoAxeViolations(container);
  });
});
