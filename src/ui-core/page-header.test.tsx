import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { PageHeader } from "./page-header";

describe("PageHeader — 제목 수준(AC-UI-001-25)", () => {
  it("기본 렌더링에서 제목은 h1 하나다", () => {
    render(<PageHeader title="고객 관리" />);
    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "고객 관리" })).toBeInTheDocument();
  });

  it("titleAs='h2'면 h1 없이 h2로 렌더링한다", () => {
    render(<PageHeader title="고객 관리" titleAs="h2" />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "고객 관리" })).toBeInTheDocument();
  });

  it("titleAs='h3'면 h3로 렌더링한다", () => {
    render(<PageHeader title="고객 관리" titleAs="h3" />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: "고객 관리" })).toBeInTheDocument();
  });
});

describe("PageHeader — 자리 배치(design-direction.md §14.2)", () => {
  it("이동 경로 → 제목 줄(제목·배지 …… 보조 동작·주요 동작) → 설명 → 하위 탐색 순으로 둔다", () => {
    const { container } = render(
      <PageHeader
        title="고객 관리"
        breadcrumb={<nav aria-label="현재 위치">경로</nav>}
        badge={<span>128명</span>}
        description="등록한 고객을 찾고 관리해요."
        secondaryActions={<button type="button">내보내기</button>}
        primaryAction={<button type="button">고객 등록</button>}
        subNav={<div>하위 탐색</div>}
      />,
    );
    const text = container.textContent ?? "";
    const order = [
      "경로",
      "고객 관리",
      "128명",
      "내보내기",
      "고객 등록",
      "등록한 고객",
      "하위 탐색",
    ];
    const positions = order.map((part) => text.indexOf(part));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(screen.getByText("등록한 고객을 찾고 관리해요.")).toHaveClass("text-muted-foreground");
  });

  it("선택 자리를 주지 않으면 그 자리를 렌더링하지 않는다", () => {
    const { container } = render(<PageHeader title="고객 관리" />);
    expect(container.querySelector("[data-page-header-actions]")).toBeNull();
    expect(container.querySelector("[data-page-header-sub-nav]")).toBeNull();
    expect(container.querySelector("p")).toBeNull();
  });

  it("네이티브 속성을 루트에 넘기고 className을 병합한다", () => {
    const { container } = render(
      <PageHeader title="고객 관리" data-testid="head" className="pb-6" />,
    );
    expect(container.firstElementChild).toHaveAttribute("data-testid", "head");
    expect(container.firstElementChild).toHaveClass("pb-6");
  });

  it("모든 자리를 채운 상태에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <PageHeader
        title="고객 관리"
        breadcrumb={<nav aria-label="현재 위치">경로</nav>}
        badge={<span>128명</span>}
        description="등록한 고객을 찾고 관리해요."
        secondaryActions={<button type="button">내보내기</button>}
        primaryAction={<button type="button">고객 등록</button>}
        subNav={<div>하위 탐색</div>}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
