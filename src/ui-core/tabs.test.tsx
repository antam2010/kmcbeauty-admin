import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { type TabItem, Tabs } from "./tabs";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];
// 색이 아닌 선택 단서(acceptance.md AC-UI-001-12)
const NON_COLOR_CUE =
  /(^|\s)(forced-colors:)?(font-semibold|font-bold|underline|border-(\w+-)?\d|outline-\d)(\s|$)/;

const ITEMS: TabItem[] = [
  { value: "info", label: "기본 정보", content: <p>연락처와 메모를 보여 줘요.</p> },
  { value: "history", label: "시술 이력", content: <p>지난 시술을 보여 줘요.</p> },
  { value: "dormant", label: "휴면", content: <p>휴면 고객이에요.</p>, disabled: true },
  { value: "coupon", label: "쿠폰", content: <p>남은 쿠폰을 보여 줘요.</p> },
];

function Controlled() {
  const [value, setValue] = useState("info");
  return <Tabs aria-label="고객 상세" items={ITEMS} value={value} onValueChange={setValue} />;
}

const tab = (name: string) => screen.getByRole("tab", { name });

function renderTabs(props: Partial<Parameters<typeof Tabs>[0]> = {}) {
  return render(
    <>
      <button type="button">앞 요소</button>
      <Tabs aria-label="고객 상세" items={ITEMS} {...props} />
    </>,
  );
}

async function tabIntoList(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "앞 요소" }));
  await user.tab();
}

describe("Tabs — 구조(AC-UI-001-24)", () => {
  it("이름이 있는 tablist 안에 탭이 차례로 있고, 기본값이 없으면 첫 탭이 선택된다", () => {
    renderTabs();
    expect(screen.getByRole("tablist", { name: "고객 상세" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((item) => item.textContent)).toEqual([
      "기본 정보",
      "시술 이력",
      "휴면",
      "쿠폰",
    ]);
    expect(tab("기본 정보")).toHaveAttribute("aria-selected", "true");
    expect(tab("시술 이력")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("연락처와 메모를 보여 줘요.");
  });

  it("defaultValue로 처음 탭을 고르고, disabled 탭은 비활성이다", () => {
    renderTabs({ defaultValue: "history" });
    expect(tab("시술 이력")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("지난 시술을 보여 줘요.");
    expect(tab("휴면")).toBeDisabled();
  });

  it("선택된 탭에만 밑줄 테두리(색이 아닌 단서)가 있다", async () => {
    const user = userEvent.setup();
    renderTabs();
    expect(tab("기본 정보").className).toMatch(NON_COLOR_CUE);
    expect(tab("기본 정보")).toHaveClass("border-b-2", "border-primary");
    expect(tab("시술 이력").className).not.toMatch(NON_COLOR_CUE);
    await user.click(tab("시술 이력"));
    expect(tab("시술 이력")).toHaveClass("border-b-2");
    expect(tab("기본 정보").className).not.toMatch(NON_COLOR_CUE);
  });

  it("제어형: value를 따르고 다른 탭을 누르면 onValueChange만 부른다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderTabs({ value: "history", onValueChange });
    await user.click(tab("쿠폰"));
    expect(onValueChange).toHaveBeenCalledWith("coupon");
    // 부모가 value를 바꾸지 않았으므로 선택은 그대로다.
    expect(tab("시술 이력")).toHaveAttribute("aria-selected", "true");
  });

  it("비제어형에서도 onValueChange로 바뀐 값을 알린다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });
    await user.click(tab("쿠폰"));
    expect(onValueChange).toHaveBeenCalledWith("coupon");
    expect(tab("쿠폰")).toHaveAttribute("aria-selected", "true");
  });
});

describe("Tabs — 키보드(AC-UI-001-24, AC-UI-001-11)", () => {
  it("AC-UI-001-11: Tab으로 선택된 탭에 들어가고 →로 이동과 동시에 활성화된다(자동 활성화)", async () => {
    const user = userEvent.setup();
    renderTabs();
    await tabIntoList(user);
    expect(tab("기본 정보")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tab("시술 이력")).toHaveFocus();
    expect(tab("시술 이력")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("지난 시술을 보여 줘요.");
  });

  it("AC-UI-001-11: 방향키는 비활성 탭을 건너뛰고 ←로 돌아온다", async () => {
    const user = userEvent.setup();
    renderTabs({ defaultValue: "history" });
    await tabIntoList(user);
    await user.keyboard("{ArrowRight}");
    expect(tab("쿠폰")).toHaveFocus();
    expect(tab("쿠폰")).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}");
    expect(tab("시술 이력")).toHaveFocus();
  });

  it("AC-UI-001-11: Home·End는 처음·끝 탭으로 옮기고 활성화한다", async () => {
    const user = userEvent.setup();
    renderTabs({ defaultValue: "history" });
    await tabIntoList(user);
    await user.keyboard("{End}");
    expect(tab("쿠폰")).toHaveFocus();
    expect(tab("쿠폰")).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}");
    expect(tab("기본 정보")).toHaveFocus();
    expect(tab("기본 정보")).toHaveAttribute("aria-selected", "true");
  });

  it("AC-UI-001-11: 탭에서 Tab을 누르면 탭 패널로 포커스가 간다", async () => {
    const user = userEvent.setup();
    renderTabs();
    await tabIntoList(user);
    await user.tab();
    expect(screen.getByRole("tabpanel")).toHaveFocus();
  });

  it("AC-UI-001-11: 탭과 탭 패널은 포커스 윤곽선 클래스 세 개를 가진다", () => {
    renderTabs();
    for (const item of screen.getAllByRole("tab")) expect(item).toHaveClass(...FOCUS_CLASSES);
    expect(screen.getByRole("tabpanel")).toHaveClass(...FOCUS_CLASSES);
  });

  it("AC-UI-001-11: 기본과 탭을 바꾼 뒤 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container } = renderTabs();
    await expectNoAxeViolations(container);
    await user.click(tab("쿠폰"));
    await expectNoAxeViolations(container);
  });
});

describe("Tabs — 제어형 사용 예", () => {
  it("부모 상태로 값을 쥐면 선택이 따라 바뀐다", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(tab("쿠폰"));
    expect(tab("쿠폰")).toHaveAttribute("aria-selected", "true");
  });
});
