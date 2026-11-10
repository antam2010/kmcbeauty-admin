import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Toaster, toast } from "./toast";

// acceptance.md AC-UI-001-23의 문구
const SAVED = "예약을 저장했어요.";
const INFO = "새 예약이 들어왔어요.";
const WARNING = "영업시간이 30분 남았어요.";
const ERROR = "예약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";

// 가짜 타이머(Date 포함) 아래에서는 user-event 대신 동기 fireEvent를 쓴다.
// Testing Library의 비동기 감싸기가 실제 setTimeout을 기다려 멈추기 때문이다.
beforeEach(() => {
  vi.useFakeTimers();
});

// 모듈 수준 대기열은 src/test/setup.ts가 매 테스트 뒤 act 안에서 비운다(plan.md §B B-13). 여기서는 타이머만 되돌린다.
afterEach(() => {
  vi.useRealTimers();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const region = () => screen.getByRole("region", { name: "알림 (F8)" });
const toastItem = (message: string) => screen.getByText(message).closest("li") as HTMLElement;
const visibleMessages = () =>
  [...region().querySelectorAll("li")].map(
    (item) => item.querySelector("[data-toast-title]")?.textContent,
  );

function show(fn: () => void) {
  act(fn);
}

describe("Toaster — 알림 영역(AC-UI-001-23)", () => {
  it("이름이 '알림 (F8)'인 영역이 하나 있다", () => {
    render(<Toaster />);
    expect(region()).toBeInTheDocument();
  });

  it("F8을 누르면 포커스가 알림 영역으로 옮겨 간다", () => {
    render(
      <>
        <button type="button">앞 요소</button>
        <Toaster />
      </>,
    );
    show(() => toast.error(ERROR));
    screen.getByRole("button", { name: "앞 요소" }).focus();
    fireEvent.keyDown(document, { key: "F8", code: "F8" });
    expect(region()).toContainElement(document.activeElement as HTMLElement);
  });

  it("Toaster가 붙기 전에 띄운 알림은 Toaster가 붙으면 보인다", () => {
    show(() => toast.success(SAVED));
    render(<Toaster />);
    expect(visibleMessages()).toEqual([SAVED]);
  });
});

describe("toast — 대기열과 표시 시간(AC-UI-001-23)", () => {
  it("네 개를 띄우면 앞의 셋만 보이고 넷째(error)는 앞 알림이 닫히면 나타난다", () => {
    render(<Toaster />);
    show(() => {
      toast.success(SAVED);
      toast.info(INFO);
      toast.warning(WARNING);
      toast.error(ERROR);
    });
    expect(visibleMessages()).toEqual([SAVED, INFO, WARNING]);

    advance(4999);
    expect(visibleMessages()).toEqual([SAVED, INFO, WARNING]);
    advance(1);
    // success·info는 5초 뒤 닫히고 대기하던 error가 나타난다
    expect(visibleMessages()).toEqual([WARNING, ERROR]);

    advance(1999);
    expect(visibleMessages()).toEqual([WARNING, ERROR]);
    advance(1);
    // warning은 7초 뒤 닫힌다
    expect(visibleMessages()).toEqual([ERROR]);

    advance(60_000);
    // error(destructive)는 닫을 때까지 남는다
    expect(visibleMessages()).toEqual([ERROR]);
  });

  it("알림 영역에 포인터가 있는 동안은 멈추고, 포인터가 떠나면 남은 시간 뒤 닫힌다", () => {
    render(<Toaster />);
    show(() => toast.success(SAVED));
    advance(4000);
    fireEvent.pointerMove(toastItem(SAVED));
    advance(10_000);
    expect(visibleMessages()).toEqual([SAVED]);

    fireEvent.pointerLeave(region());
    advance(999);
    expect(visibleMessages()).toEqual([SAVED]);
    advance(1);
    expect(visibleMessages()).toEqual([]);
  });

  it("포커스가 알림 영역 안에 있을 때도 멈춘다", () => {
    render(<Toaster />);
    show(() => toast.info(INFO));
    advance(4000);
    act(() => toastItem(INFO).focus());
    advance(10_000);
    expect(visibleMessages()).toEqual([INFO]);
  });
});

describe("toast — 닫기(AC-UI-001-23)", () => {
  it("포커스된 error 알림은 Esc로 닫힌다", () => {
    render(<Toaster />);
    show(() => toast.error(ERROR));
    const item = toastItem(ERROR);
    act(() => item.focus());
    fireEvent.keyDown(item, { key: "Escape" });
    expect(visibleMessages()).toEqual([]);
  });

  it("'알림 닫기' 버튼은 error 알림을 닫는다", () => {
    render(<Toaster />);
    show(() => toast.error(ERROR));
    fireEvent.click(within(toastItem(ERROR)).getByRole("button", { name: "알림 닫기" }));
    expect(visibleMessages()).toEqual([]);
  });

  it("toast.dismiss(id)는 그 알림만 닫고, 없는 id는 오류 없이 무시한다(EC-09)", () => {
    render(<Toaster />);
    let first = "";
    let second = "";
    show(() => {
      first = toast.info(INFO);
      second = toast.warning(WARNING);
    });
    expect(first).not.toBe(second);
    show(() => toast.dismiss(first));
    expect(visibleMessages()).toEqual([WARNING]);
    expect(() => show(() => toast.dismiss("없는-id"))).not.toThrow();
    expect(visibleMessages()).toEqual([WARNING]);
  });
});

describe("toast — 내용과 알림 방식(AC-UI-001-23)", () => {
  it("error는 assertive, 나머지는 polite로 '알림' 이름을 붙여 알린다", () => {
    render(<Toaster />);
    show(() => toast.error(ERROR));
    // Radix는 다음 프레임에 알림 문구를 넣는다.
    advance(100);
    expect(
      [...document.querySelectorAll('[aria-live="assertive"]')].some(
        (node) => node.textContent === `알림 ${ERROR}`,
      ),
    ).toBe(true);

    show(() => toast.success(SAVED));
    advance(100);
    expect(
      [...document.querySelectorAll('[aria-live="polite"]')].some((node) =>
        node.textContent?.includes(SAVED),
      ),
    ).toBe(true);
    expect(
      [...document.querySelectorAll('[aria-live="assertive"]')].some((node) =>
        node.textContent?.includes(SAVED),
      ),
    ).toBe(false);
  });

  it("tone별 아이콘은 장식이라 숨기고, 설명을 함께 보인다", () => {
    render(<Toaster />);
    show(() => {
      toast.success(SAVED, { description: "김민지 · 10월 29일 14:30" });
      toast.info(INFO);
      toast.warning(WARNING);
    });
    const icons: [string, string][] = [
      [SAVED, "lucide-circle-check"],
      [INFO, "lucide-info"],
      [WARNING, "lucide-triangle-alert"],
    ];
    for (const [message, iconClass] of icons) {
      const icon = toastItem(message).querySelector(`svg.${iconClass}`);
      expect(icon).not.toBeNull();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
    expect(within(toastItem(SAVED)).getByText("김민지 · 10월 29일 14:30")).toBeInTheDocument();
  });

  it("error 알림의 아이콘은 CircleAlert다", () => {
    render(<Toaster />);
    show(() => toast.error(ERROR));
    expect(toastItem(ERROR).querySelector("svg.lucide-circle-alert")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("동작은 알림당 하나이고, 누르면 onClick을 부른 뒤 알림을 닫는다", () => {
    const onClick = vi.fn();
    render(<Toaster />);
    show(() => toast.success("예약을 취소했어요.", { action: { label: "되돌리기", onClick } }));
    const item = toastItem("예약을 취소했어요.");
    const buttons = within(item).getAllByRole("button");
    expect(
      buttons.map((button) => button.textContent || button.getAttribute("aria-label")),
    ).toEqual(["되돌리기", "알림 닫기"]);
    fireEvent.click(within(item).getByRole("button", { name: "되돌리기" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(visibleMessages()).toEqual([]);
  });

  it("버튼에는 포커스 윤곽선 클래스 세 개가 있다", () => {
    render(<Toaster />);
    show(() => toast.info(INFO, { action: { label: "보기", onClick: () => undefined } }));
    for (const button of within(toastItem(INFO)).getAllByRole("button")) {
      expect(button).toHaveClass(
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-ring",
      );
    }
  });
});

describe("toast — 키보드와 자동 접근성 검사(AC-UI-001-11)", () => {
  it("AC-UI-001-11: F8로 알림 영역에 들어가 Tab으로 '알림 닫기'에 닿아 Enter로 닫는다", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(
      <>
        <button type="button">앞 요소</button>
        <Toaster />
      </>,
    );
    act(() => {
      toast.error(ERROR);
    });
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    // Radix는 event.code로 단축키를 판정하므로 code를 지정해 누른다.
    await user.keyboard("[F8]");
    expect(region()).toContainElement(document.activeElement as HTMLElement);

    const close = within(toastItem(ERROR)).getByRole("button", { name: "알림 닫기" });
    for (let step = 0; step < 3 && document.activeElement !== close; step += 1) {
      await user.tab();
    }
    expect(close).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(visibleMessages()).toEqual([]);
  });

  it("네 tone을 띄운 상태에서 알림 영역의 axe 위반이 0건이다", async () => {
    vi.useRealTimers();
    render(<Toaster />);
    act(() => {
      toast.success(SAVED, { action: { label: "보기", onClick: () => undefined } });
      toast.warning(WARNING);
      toast.error(ERROR);
    });
    await expectNoAxeViolations(region());
  });
});
