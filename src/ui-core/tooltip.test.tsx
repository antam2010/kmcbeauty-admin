import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

function renderTooltip(side?: "top" | "right" | "bottom" | "left") {
  return render(
    <>
      <button type="button">앞 요소</button>
      <Tooltip content="예약 새로고침" side={side}>
        <Button size="icon" variant="ghost" aria-label="새로고침">
          ↻
        </Button>
      </Tooltip>
    </>,
  );
}

const trigger = () => screen.getByRole("button", { name: "새로고침" });

describe("Tooltip — 포커스로 열고 Esc로 닫기(AC-UI-001-25, AC-UI-001-11)", () => {
  it("닫혀 있을 때는 내용이 없다", () => {
    renderTooltip();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("AC-UI-001-11: 트리거에 키보드 포커스가 가면 열리고 트리거와 aria-describedby로 연결된다", async () => {
    const user = userEvent.setup();
    renderTooltip();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(trigger()).toHaveFocus();
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("예약 새로고침");
    expect(trigger()).toHaveAttribute("aria-describedby", tooltip.id);
    expect(trigger()).toHaveAccessibleDescription("예약 새로고침");
  });

  it("AC-UI-001-11: Esc를 누르면 닫히고 포커스는 트리거에 남는다", async () => {
    const user = userEvent.setup();
    renderTooltip();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("AC-UI-001-11: 포커스를 잃으면 닫힌다", async () => {
    const user = userEvent.setup();
    renderTooltip();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await user.tab({ shift: true });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("side를 주면 그 방향에 둔다(기본 top)", async () => {
    const user = userEvent.setup();
    const { unmount } = renderTooltip();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(document.querySelector("[data-tooltip-content]")).toHaveAttribute("data-side", "top");
    unmount();

    renderTooltip("right");
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(document.querySelector("[data-tooltip-content]")).toHaveAttribute("data-side", "right");
  });

  it("떠 있는 레이어 2단계 면(popover + border + shadow-raised)을 쓴다", async () => {
    const user = userEvent.setup();
    renderTooltip();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(document.querySelector("[data-tooltip-content]")).toHaveClass(
      "bg-popover",
      "border-border",
      "shadow-raised",
    );
  });

  it("열린 상태에서 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container } = renderTooltip();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    await expectNoAxeViolations(container);
    await expectNoAxeViolations(screen.getByRole("tooltip"));
  });
});
