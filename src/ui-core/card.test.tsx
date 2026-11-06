import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

function FullCard({ titleAs }: { titleAs?: "h2" | "h3" }) {
  return (
    <Card data-testid="card">
      <CardHeader data-testid="header">
        <CardTitle as={titleAs}>오늘 예약</CardTitle>
        <CardDescription>2026. 10. 29. 기준으로 보여 줘요.</CardDescription>
      </CardHeader>
      <CardContent data-testid="content">예약 12건이 있어요.</CardContent>
      <CardFooter data-testid="footer">
        <Button variant="outline">전체 보기</Button>
      </CardFooter>
    </Card>
  );
}

describe("Card — 조합 부품(AC-UI-001-24)", () => {
  it("Card·CardHeader·CardTitle·CardDescription·CardContent·CardFooter를 순서대로 렌더링한다", () => {
    render(<FullCard />);
    const card = screen.getByTestId("card");
    expect(card.children).toHaveLength(3);
    expect(card.children[0]).toBe(screen.getByTestId("header"));
    expect(card.children[1]).toBe(screen.getByTestId("content"));
    expect(card.children[2]).toBe(screen.getByTestId("footer"));
    expect(screen.getByText("2026. 10. 29. 기준으로 보여 줘요.")).toHaveClass(
      "text-body-sm",
      "text-muted-foreground",
    );
    expect(screen.getByRole("button", { name: "전체 보기" })).toBeInTheDocument();
  });

  it("Card는 card 면·장식 테두리·rounded-panel이고 그림자가 없다", () => {
    render(<FullCard />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("bg-card", "border", "border-border", "rounded-panel");
    expect([...card.classList].some((name) => name.startsWith("shadow"))).toBe(false);
  });

  it("CardTitle은 기본 h2이고 as='h3'이면 h3로 렌더링한다", () => {
    const { rerender } = render(<FullCard />);
    expect(screen.getByRole("heading", { level: 2, name: "오늘 예약" })).toBeInTheDocument();
    rerender(<FullCard titleAs="h3" />);
    expect(screen.getByRole("heading", { level: 3, name: "오늘 예약" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("각 부품은 className을 합친다", () => {
    render(
      <Card data-testid="card" className="max-w-reading">
        <CardHeader data-testid="header" className="pb-2">
          <CardTitle className="text-title">제목</CardTitle>
          <CardDescription className="line-clamp-1">설명이에요.</CardDescription>
        </CardHeader>
        <CardContent data-testid="content" className="tabular-nums">
          12건
        </CardContent>
        <CardFooter data-testid="footer" className="justify-end">
          바닥
        </CardFooter>
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("max-w-reading", "bg-card");
    expect(screen.getByTestId("header")).toHaveClass("pb-2");
    expect(screen.getByText("제목")).toHaveClass("text-title");
    expect(screen.getByText("제목")).not.toHaveClass("text-subtitle");
    expect(screen.getByText("설명이에요.")).toHaveClass("line-clamp-1");
    expect(screen.getByTestId("content")).toHaveClass("tabular-nums");
    expect(screen.getByTestId("footer")).toHaveClass("justify-end");
  });
});

describe("Card — 자동 접근성 검사", () => {
  it("모든 부품을 쓴 카드에서 axe 위반이 0건이다", async () => {
    const { container } = render(<FullCard />);
    await expectNoAxeViolations(container);
  });
});
