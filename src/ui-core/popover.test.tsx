import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Button } from "./button";
import { Popover } from "./popover";

function Harness({ align }: { align?: "start" | "center" | "end" }) {
  return (
    <>
      <Popover
        trigger={<Button variant="ghost">김민지 원장</Button>}
        aria-label="사용자 메뉴"
        align={align}
      >
        <p>kim@example.com</p>
        <Button variant="outline">로그아웃</Button>
      </Popover>
      <button type="button">바깥 버튼</button>
    </>
  );
}

const trigger = () => screen.getByRole("button", { name: "김민지 원장" });
const content = () => screen.getByRole("dialog", { name: "사용자 메뉴" });
const queryContent = () => screen.queryByRole("dialog");

describe("Popover — 키보드 계약(acceptance.md §3.10)", () => {
  it("트리거에 aria-expanded가 있고, 열리면 aria-controls가 내용의 id를 가리킨다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    // 닫혀 있을 때는 가리킬 내용이 DOM에 없으므로 Radix가 aria-controls를 두지 않는다(없는 id를 가리키지 않음).
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger().getAttribute("aria-controls")).toBe(content().id);
  });

  it("트리거에서 Enter로 열린다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    trigger().focus();
    await user.keyboard("{Enter}");
    expect(content()).toBeInTheDocument();
  });

  it("트리거에서 Space로 열린다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    trigger().focus();
    await user.keyboard(" ");
    expect(content()).toBeInTheDocument();
  });

  it("Esc로 닫히고 포커스가 트리거로 돌아온다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    expect(content()).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(queryContent()).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("바깥을 누르면 닫힌다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "바깥 버튼" }));
    expect(queryContent()).toBeNull();
  });

  it("열리면 내용 안의 첫 동작 요소로 포커스가 간다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    expect(screen.getByRole("button", { name: "로그아웃" })).toHaveFocus();
  });
});

describe("Popover — 모양·감속 모드·고대비", () => {
  it("떠 있는 레이어 2단계(popover 면 + border + shadow-raised, rounded-panel)이고 z 50이다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    expect(content()).toHaveClass(
      "bg-popover",
      "border",
      "border-border",
      "shadow-raised",
      "rounded-panel",
      "z-50",
    );
  });

  it("등장 애니메이션은 motion-safe: 아래에만 있다(AC-UI-001-13 방식)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    const classes = content()
      .className.split(/\s+/)
      .filter((name) => name.includes("animate"));
    expect(classes.length).toBeGreaterThan(0);
    for (const name of classes) expect(name.startsWith("motion-safe:")).toBe(true);
  });

  it("align을 주면 그 정렬로 놓인다(기본 end)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);
    await user.click(trigger());
    expect(content()).toHaveAttribute("data-align", "end");
    unmount();
    render(<Harness align="start" />);
    await user.click(trigger());
    expect(content()).toHaveAttribute("data-align", "start");
  });

  it("닫힌 상태와 열린 상태 모두 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await expectNoAxeViolations(container);
    await user.click(trigger());
    await expectNoAxeViolations(document.body);
  });
});
