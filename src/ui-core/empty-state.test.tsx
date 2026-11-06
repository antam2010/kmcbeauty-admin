import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

describe("EmptyState — 내용(AC-UI-001-24)", () => {
  it("제목·설명·동작 하나를 보인다", () => {
    render(
      <EmptyState
        icon={Users}
        title="아직 등록된 고객이 없어요"
        description="첫 고객을 등록하면 바로 예약을 잡을 수 있어요."
        action={<Button>고객 등록</Button>}
      />,
    );
    expect(screen.getByText("아직 등록된 고객이 없어요")).toHaveClass(
      "text-subtitle",
      "font-semibold",
    );
    expect(screen.getByText("첫 고객을 등록하면 바로 예약을 잡을 수 있어요.")).toHaveClass(
      "text-body-sm",
      "text-muted-foreground",
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "고객 등록" })).toBeInTheDocument();
  });

  it("아이콘은 48px 원(muted 면) 안의 24px 장식이다(AC-UI-001-12)", () => {
    const { container } = render(<EmptyState icon={Users} title="아직 등록된 고객이 없어요" />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("lucide-users", "size-6");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon?.parentElement).toHaveClass("size-12", "rounded-full", "bg-muted");
  });

  it("아이콘·설명·동작을 주지 않으면 제목만 보인다", () => {
    const { container } = render(<EmptyState title="조건에 맞는 예약이 없어요" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.firstElementChild?.childElementCount).toBe(1);
  });

  it("className을 루트에 합친다", () => {
    const { container } = render(<EmptyState title="결과가 없어요" className="py-16" />);
    expect(container.firstElementChild).toHaveClass("py-16");
  });
});

describe("EmptyState — 자동 접근성 검사", () => {
  it("아이콘·설명·동작이 모두 있을 때 axe 위반이 0건이다", async () => {
    const { container } = render(
      <EmptyState
        icon={Users}
        title="아직 등록된 고객이 없어요"
        description="첫 고객을 등록하면 바로 예약을 잡을 수 있어요."
        action={<Button>고객 등록</Button>}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
