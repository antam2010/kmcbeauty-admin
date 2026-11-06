import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Skeleton, SkeletonGroup } from "./skeleton";

function Loader({ loading }: { loading: boolean }) {
  return loading ? (
    <SkeletonGroup>
      <Skeleton variant="text" />
    </SkeletonGroup>
  ) : (
    <p>예약 목록이에요.</p>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Skeleton — 모양", () => {
  it("기본 블록은 장식(aria-hidden)이고 muted 면과 rounded-control 반경이다", () => {
    const { container } = render(<Skeleton className="h-10 w-40" />);
    const block = container.firstElementChild;
    expect(block).toHaveAttribute("aria-hidden", "true");
    expect(block).toHaveClass("bg-muted", "rounded-control", "h-10", "w-40");
  });

  it("text 변형은 높이 16px 줄(h-4, rounded-chip)이다", () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.firstElementChild).toHaveClass("h-4", "rounded-chip");
    expect(container.firstElementChild).not.toHaveClass("rounded-control");
  });

  it("깜빡임은 motion-safe: 아래에만 있어 감속 모드에서 멈춘다(AC-UI-001-13)", () => {
    const { container } = render(<Skeleton />);
    const animations = [...(container.firstElementChild as HTMLElement).classList].filter((name) =>
      name.includes("animate"),
    );
    expect(animations).toEqual(["motion-safe:animate-pulse"]);
  });
});

describe("SkeletonGroup — 표시 지연(AC-UI-001-24, EC-10)", () => {
  it("마운트 뒤 기본 300ms가 지나기 전에는 아무것도 렌더링하지 않는다", () => {
    vi.useFakeTimers();
    const { container } = render(
      <SkeletonGroup>
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(container).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("300ms가 지나면 aria-busy='true' 묶음과 숨은 문구 '불러오는 중…', 장식 블록을 보인다", () => {
    vi.useFakeTimers();
    const { container } = render(
      <SkeletonGroup>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
      </SkeletonGroup>,
    );
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const group = container.querySelector("[aria-busy='true']");
    expect(group).not.toBeNull();
    expect(screen.getByText("불러오는 중…")).toHaveClass("sr-only");
    expect(group?.querySelectorAll("[aria-hidden='true']")).toHaveLength(2);
  });

  it("EC-10: 300ms 안에 로딩이 끝나 묶음이 사라지면 한 번도 보이지 않고 타이머도 남지 않는다", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Loader loading />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.querySelector("[aria-busy]")).toBeNull();

    rerender(<Loader loading={false} />);
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.querySelector("[aria-busy]")).toBeNull();
    expect(screen.getByText("예약 목록이에요.")).toBeInTheDocument();
  });

  it("delayMs를 주면 그 시간만큼 기다린다", () => {
    vi.useFakeTimers();
    const { container } = render(
      <SkeletonGroup delayMs={500}>
        <Skeleton />
      </SkeletonGroup>,
    );
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(container).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  });

  it("delayMs가 0이면 기다리지 않고 바로 보인다", () => {
    const { container } = render(
      <SkeletonGroup delayMs={0}>
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  });

  it("label로 숨은 문구를 바꾸고 className을 묶음에 합친다", () => {
    const { container } = render(
      <SkeletonGroup delayMs={0} label="고객 목록을 불러오는 중…" className="gap-4">
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(screen.getByText("고객 목록을 불러오는 중…")).toBeInTheDocument();
    expect(container.querySelector("[aria-busy='true']")).toHaveClass("gap-4");
  });

  it("보이는 묶음에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <SkeletonGroup delayMs={0}>
        <Skeleton className="h-10" />
        <Skeleton variant="text" />
      </SkeletonGroup>,
    );
    await expectNoAxeViolations(container);
  });
});
