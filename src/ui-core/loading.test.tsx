import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Loading } from "./loading";

describe("Loading — 문구와 역할(AC-UI-001-24)", () => {
  it("role='status'와 기본 문구 '불러오는 중…'을 보인다", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent("불러오는 중…");
  });

  it("label로 문구를 바꾼다", () => {
    render(<Loading label="매장 정보를 불러오는 중…" />);
    expect(screen.getByRole("status")).toHaveTextContent("매장 정보를 불러오는 중…");
  });

  it("className을 루트에 합친다", () => {
    render(<Loading className="py-12" />);
    expect(screen.getByRole("status")).toHaveClass("py-12");
  });
});

describe("Loading — 스피너(AC-UI-001-13)", () => {
  it("크기 md(기본)는 20px, sm은 16px LoaderCircle 스피너다", () => {
    const { container, rerender } = render(<Loading />);
    expect(container.querySelector("svg")).toHaveClass("lucide-loader-circle", "size-5");
    rerender(<Loading size="sm" />);
    expect(container.querySelector("svg")).toHaveClass("size-4");
  });

  it("EC-15: 회전 클래스는 motion-safe: 아래에만 있어 감속 모드에서는 멈춘다", () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector("svg") as SVGElement;
    const animations = [...spinner.classList].filter((name) => name.includes("animate"));
    expect(animations).toEqual(["motion-safe:animate-spin"]);
  });

  it("스피너는 장식이라 보조 기술에서 숨기고 문구로 의미를 전한다", () => {
    const { container } = render(<Loading />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Loading — 자동 접근성 검사", () => {
  it("sm·md 크기에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <>
        <Loading size="sm" />
        <Loading label="예약을 불러오는 중…" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
