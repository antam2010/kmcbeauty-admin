import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Plus } from "lucide-react";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Button } from "./button";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

const button = (name: string) => screen.getByRole("button", { name });

describe("Button — 변형과 크기", () => {
  it("변형 5종이 각자의 토큰 클래스로 렌더링된다(기본은 default)", () => {
    render(
      <>
        <Button>저장</Button>
        <Button variant="outline">취소</Button>
        <Button variant="ghost">더보기</Button>
        <Button variant="destructive">삭제</Button>
        <Button variant="link">자세히 보기</Button>
      </>,
    );
    expect(button("저장")).toHaveClass(
      "bg-primary",
      "text-primary-foreground",
      "hover:bg-primary-hover",
    );
    expect(button("취소")).toHaveClass("border", "border-border", "bg-card", "hover:bg-accent");
    expect(button("더보기")).toHaveClass("text-muted-foreground", "hover:bg-accent");
    expect(button("더보기")).not.toHaveClass("bg-card");
    expect(button("삭제")).toHaveClass(
      "bg-destructive",
      "text-destructive-foreground",
      "hover:bg-destructive-hover",
    );
    expect(button("자세히 보기")).toHaveClass(
      "text-primary",
      "underline-offset-4",
      "hover:underline",
    );
  });

  it("크기 5종이 높이·정사각 클래스로 렌더링된다(기본은 40px)", () => {
    render(
      <>
        <Button size="sm">작게</Button>
        <Button>보통</Button>
        <Button size="lg">크게</Button>
        <Button size="icon" aria-label="추가">
          <Plus />
        </Button>
        <Button size="icon-sm" aria-label="작은 추가">
          <Plus />
        </Button>
      </>,
    );
    expect(button("작게")).toHaveClass("h-8");
    expect(button("보통")).toHaveClass("h-10");
    expect(button("크게")).toHaveClass("h-12");
    expect(button("추가")).toHaveClass("size-10");
    expect(button("작은 추가")).toHaveClass("size-8");
  });

  it("className을 마지막에 합쳐 변형 클래스를 덮어쓴다", () => {
    render(<Button className="bg-destructive">덮어쓰기</Button>);
    expect(button("덮어쓰기")).toHaveClass("bg-destructive");
    expect(button("덮어쓰기")).not.toHaveClass("bg-primary");
  });

  it("아이콘 전용 버튼은 aria-label로 접근 이름을 갖고 아이콘은 장식으로 숨긴다", () => {
    const { container } = render(
      <Button size="icon" aria-label="고객 추가">
        <Plus />
      </Button>,
    );
    expect(button("고객 추가")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("asChild로 감싼 링크는 버튼이 아닌 <a>로 렌더링되고 변형 클래스를 받는다", () => {
    render(
      <Button asChild variant="outline">
        <a href="/customers">고객 목록</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "고객 목록" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/customers");
    expect(link).toHaveClass("bg-card", ...FOCUS_CLASSES);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("disabled면 네이티브 disabled이고 누르기를 받지 않는다", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        저장
      </Button>,
    );
    expect(button("저장")).toBeDisabled();
    expect(button("저장")).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
    await user.click(button("저장"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Button — loading(AC-UI-001-15)", () => {
  it("AC-UI-001-11: loading인 동안 클릭·Enter·Space로 onClick이 불리지 않고 aria-busy·aria-disabled이며 disabled 속성 없이 포커스가 남는다", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading onClick={onClick}>
        저장
      </Button>,
    );
    await user.tab();
    expect(button("저장")).toHaveFocus();

    await user.click(button("저장"));
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onClick).not.toHaveBeenCalled();
    expect(button("저장")).toHaveAttribute("aria-busy", "true");
    expect(button("저장")).toHaveAttribute("aria-disabled", "true");
    expect(button("저장")).not.toHaveAttribute("disabled");
    expect(button("저장")).toHaveFocus();
  });

  it("AC-UI-001-11: loading이 끝나면 aria-busy·aria-disabled가 사라지고 다음 누르기에서 onClick이 한 번 불린다", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Button loading onClick={onClick}>
        저장
      </Button>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).not.toHaveBeenCalled();

    rerender(<Button onClick={onClick}>저장</Button>);
    expect(button("저장")).not.toHaveAttribute("aria-busy");
    expect(button("저장")).not.toHaveAttribute("aria-disabled");
    expect(button("저장")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("loading인 제출 버튼은 폼을 제출하지 않는다", async () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const user = userEvent.setup();
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          저장
        </Button>
      </form>,
    );
    await user.click(button("저장"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("loading이면 라벨 앞에 LoaderCircle 스피너를 두고 회전은 motion-safe: 아래에만 둔다", () => {
    const { container } = render(<Button loading>저장</Button>);
    const spinner = container.querySelector("svg") as SVGElement;
    expect(spinner).toHaveClass("lucide-loader-circle");
    // 애니메이션 클래스는 감속 모드에서 멈추도록 모두 motion-safe: 조건 아래에 있어야 한다(AC-UI-001-13)
    const animations = [...spinner.classList].filter((name) => name.includes("animate"));
    expect(animations).toEqual(["motion-safe:animate-spin"]);
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(button("저장")).toHaveTextContent("저장");
  });

  it("loading이 아니면 스피너가 없다", () => {
    const { container } = render(<Button>저장</Button>);
    expect(container.querySelector("svg")).toBeNull();
  });
});

describe("Button — 키보드·포커스·자동 접근성 검사", () => {
  it("AC-UI-001-11: Tab으로 포커스가 가고 Enter와 Space로 누를 수 있다", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>저장</Button>);
    await user.tab();
    expect(button("저장")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("AC-UI-001-11: 변형·크기마다 포커스 윤곽선 클래스 세 개가 있다", () => {
    render(
      <>
        <Button>기본</Button>
        <Button variant="outline">보조</Button>
        <Button variant="ghost">가벼운</Button>
        <Button variant="destructive">위험</Button>
        <Button variant="link">링크</Button>
        <Button size="icon-sm" aria-label="아이콘">
          <Plus />
        </Button>
      </>,
    );
    for (const element of screen.getAllByRole("button")) {
      expect(element).toHaveClass(...FOCUS_CLASSES);
    }
  });

  it("AC-UI-001-11: 변형·loading·disabled·asChild 상태에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <>
        <Button>저장</Button>
        <Button variant="outline">취소</Button>
        <Button variant="ghost">더보기</Button>
        <Button variant="destructive">삭제</Button>
        <Button variant="link">자세히 보기</Button>
        <Button size="icon" aria-label="고객 추가">
          <Plus />
        </Button>
        <Button loading>불러오기</Button>
        <Button disabled>보내기</Button>
        <Button asChild>
          <a href="/customers">고객 목록</a>
        </Button>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
