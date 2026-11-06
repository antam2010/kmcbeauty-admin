import { render, screen } from "@testing-library/react";
import { Scissors } from "lucide-react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Badge } from "./badge";

describe("Badge — tone(AC-UI-001-24)", () => {
  it("tone을 주지 않으면 neutral(muted 면과 muted-foreground 글자)이다", () => {
    render(<Badge>VIP</Badge>);
    expect(screen.getByText("VIP")).toHaveClass(
      "bg-muted",
      "text-muted-foreground",
      "rounded-badge",
      "text-caption",
    );
  });

  it("tone 4종이 각자의 subtle 면과 subtle-foreground 글자 토큰 클래스를 가진다", () => {
    render(
      <>
        <Badge tone="info">신규</Badge>
        <Badge tone="success">재방문</Badge>
        <Badge tone="warning">미수금</Badge>
        <Badge tone="destructive">차단</Badge>
      </>,
    );
    expect(screen.getByText("신규")).toHaveClass("bg-info-subtle", "text-info-subtle-foreground");
    expect(screen.getByText("재방문")).toHaveClass(
      "bg-success-subtle",
      "text-success-subtle-foreground",
    );
    expect(screen.getByText("미수금")).toHaveClass(
      "bg-warning-subtle",
      "text-warning-subtle-foreground",
    );
    expect(screen.getByText("차단")).toHaveClass(
      "bg-destructive-subtle",
      "text-destructive-subtle-foreground",
    );
  });

  it("className으로 tone 면과 글자색을 덮어쓴다(cn 병합)", () => {
    render(<Badge className="bg-primary-subtle text-primary-subtle-foreground">덮어쓰기</Badge>);
    const badge = screen.getByText("덮어쓰기");
    expect(badge).toHaveClass("bg-primary-subtle", "text-primary-subtle-foreground");
    expect(badge).not.toHaveClass("bg-muted");
    expect(badge).not.toHaveClass("text-muted-foreground");
  });

  it("숫자는 고정폭(tabular-nums)으로 보인다", () => {
    render(<Badge>12</Badge>);
    expect(screen.getByText("12")).toHaveClass("tabular-nums");
  });
});

describe("Badge — 아이콘과 점(AC-UI-001-12)", () => {
  it("icon을 주면 라벨 앞에 12px 장식 아이콘을 보인다", () => {
    const { container } = render(<Badge icon={Scissors}>시술</Badge>);
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("lucide-scissors", "size-3");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("시술").firstElementChild).toBe(icon);
  });

  it("dot이면 라벨 앞에 6px 점을 장식으로 보인다", () => {
    const { container } = render(<Badge dot>운영 중</Badge>);
    const dot = container.querySelector("[data-badge-dot]");
    expect(dot).toHaveClass("size-1.5", "rounded-full", "bg-current");
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });

  it("icon과 dot이 없으면 장식이 없다", () => {
    const { container } = render(<Badge>기본</Badge>);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("[data-badge-dot]")).toBeNull();
  });
});

describe("Badge — 자동 접근성 검사", () => {
  it("tone 5종·아이콘·점 상태에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <>
        <Badge>VIP</Badge>
        <Badge tone="info">신규</Badge>
        <Badge tone="success">재방문</Badge>
        <Badge tone="warning">미수금</Badge>
        <Badge tone="destructive">차단</Badge>
        <Badge icon={Scissors}>시술</Badge>
        <Badge dot>운영 중</Badge>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
