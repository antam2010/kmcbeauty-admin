import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import {
  ConfirmDialog,
  ConfirmDialogHost,
  type ConfirmOptions,
  resetConfirmStore,
  showConfirm,
} from "./confirm-dialog";

// 모듈 수준 저장소가 테스트 사이에 새지 않게 매 테스트 뒤 비운다(plan.md §B B-13).
afterEach(() => {
  act(() => resetConfirmStore());
  vi.useRealTimers();
});

// acceptance.md AC-UI-001-22 (다)
const DELETE_CUSTOMER: ConfirmOptions = {
  title: "김민지 고객을 삭제할까요?",
  description: "고객 정보와 시술 이력이 모두 삭제되고 되돌릴 수 없어요.",
  confirmLabel: "삭제",
  tone: "destructive",
};

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** 호출 버튼과 Host를 함께 그리고, showConfirm의 결과를 기록한다. */
function renderWithHost(options: ConfirmOptions = DELETE_CUSTOMER) {
  const results: boolean[] = [];
  const view = render(
    <>
      <button
        type="button"
        onClick={() => {
          void showConfirm(options).then((result) => results.push(result));
        }}
      >
        고객 삭제
      </button>
      <ConfirmDialogHost />
    </>,
  );
  return { ...view, results };
}

const dialog = () => screen.getByRole("alertdialog");
const queryDialog = () => screen.queryByRole("alertdialog");
const opener = () => screen.getByRole("button", { name: "고객 삭제", hidden: true });

describe("showConfirm — 구조(AC-UI-001-22)", () => {
  it("role='alertdialog'에 제목과 설명이 연결되고 처음 포커스는 취소 버튼이다", async () => {
    const user = userEvent.setup();
    renderWithHost();
    await user.click(opener());
    expect(dialog()).toHaveAccessibleName("김민지 고객을 삭제할까요?");
    expect(dialog()).toHaveAccessibleDescription(
      "고객 정보와 시술 이력이 모두 삭제되고 되돌릴 수 없어요.",
    );
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
  });

  it("위험 동작(tone='destructive')은 확인 버튼이 destructive 변형이고 기본 tone은 default 변형이다", async () => {
    const user = userEvent.setup();
    renderWithHost();
    await user.click(opener());
    expect(screen.getByRole("button", { name: "삭제" })).toHaveClass("bg-destructive");
    await user.keyboard("{Escape}");

    act(() => {
      void showConfirm({
        title: "예약을 확정할까요?",
        description: "고객에게 알림이 가요.",
        confirmLabel: "확정",
      });
    });
    expect(screen.getByRole("button", { name: "확정" })).toHaveClass("bg-primary");
    expect(screen.getByRole("button", { name: "확정" })).not.toHaveClass("bg-destructive");
  });

  it("cancelLabel을 주면 취소 버튼 문구가 바뀐다(취소 동작을 묻는 대화상자는 '닫기')", async () => {
    const user = userEvent.setup();
    renderWithHost({
      title: "예약을 취소할까요?",
      description: "고객에게 취소 알림이 가요.",
      confirmLabel: "예약 취소",
      cancelLabel: "닫기",
      tone: "destructive",
    });
    await user.click(opener());
    expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "취소" })).toBeNull();
  });
});

describe("showConfirm — 결과(AC-UI-001-22, AC-UI-001-11)", () => {
  it("AC-UI-001-11: Esc는 false로 끝나고 대화상자가 닫히며 포커스가 연 버튼으로 돌아온다", async () => {
    const user = userEvent.setup();
    const { results } = renderWithHost();
    await user.click(opener());
    await user.keyboard("{Escape}");
    expect(queryDialog()).toBeNull();
    expect(results).toEqual([false]);
    expect(opener()).toHaveFocus();
  });

  it("AC-UI-001-11: 취소 버튼은 false, 확인 버튼은 true로 끝난다", async () => {
    const user = userEvent.setup();
    const { results } = renderWithHost();
    await user.click(opener());
    await user.keyboard("{Enter}");
    expect(queryDialog()).toBeNull();

    await user.click(opener());
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(queryDialog()).toBeNull();
    expect(results).toEqual([false, true]);
  });

  it("AC-UI-001-11: Tab은 대화상자 밖으로 나가지 않고 두 버튼 사이를 돈다", async () => {
    const user = userEvent.setup();
    renderWithHost();
    await user.click(opener());
    await user.tab();
    expect(screen.getByRole("button", { name: "삭제" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "삭제" })).toHaveFocus();
  });

  it("두 번 연달아 부르면 두 번째는 첫 번째가 닫힌 뒤 열린다(EC-08)", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialogHost />);
    const order: string[] = [];
    act(() => {
      void showConfirm({ ...DELETE_CUSTOMER, title: "첫 번째일까요?" }).then((r) =>
        order.push(`첫 번째:${r}`),
      );
      void showConfirm({ ...DELETE_CUSTOMER, title: "두 번째일까요?" }).then((r) =>
        order.push(`두 번째:${r}`),
      );
    });
    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    expect(dialog()).toHaveAccessibleName("첫 번째일까요?");

    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(dialog()).toHaveAccessibleName("두 번째일까요?");
    await user.keyboard("{Escape}");
    expect(queryDialog()).toBeNull();
    expect(order).toEqual(["첫 번째:true", "두 번째:false"]);
  });

  it("Host가 붙기 전에 부른 요청은 Host가 붙으면 보인다", () => {
    act(() => {
      void showConfirm(DELETE_CUSTOMER);
    });
    render(<ConfirmDialogHost />);
    expect(dialog()).toHaveAccessibleName("김민지 고객을 삭제할까요?");
  });

  it("저장소를 초기화하면 남은 요청은 false로 끝나고 대화상자가 사라진다", async () => {
    render(<ConfirmDialogHost />);
    let result: boolean | undefined;
    act(() => {
      void showConfirm(DELETE_CUSTOMER).then((r) => {
        result = r;
      });
    });
    expect(dialog()).toBeInTheDocument();
    await act(async () => resetConfirmStore());
    expect(queryDialog()).toBeNull();
    expect(result).toBe(false);
  });
});

describe("showConfirm — 비동기 onConfirm(AC-UI-001-22)", () => {
  it("처리 중에 저장소를 초기화하면 false로 끝나고, 뒤늦게 성공해도 결과가 바뀌지 않는다", async () => {
    const work = deferred();
    const user = userEvent.setup();
    const { results } = renderWithHost({ ...DELETE_CUSTOMER, onConfirm: () => work.promise });
    await user.click(opener());
    await user.click(screen.getByRole("button", { name: "삭제" }));
    await act(async () => resetConfirmStore());
    expect(queryDialog()).toBeNull();
    await act(async () => work.resolve());
    expect(results).toEqual([false]);
  });

  it("확인을 누르면 확인 버튼이 loading이 되고 대화상자가 남았다가, 성공하면 true로 닫힌다", async () => {
    const work = deferred();
    const onConfirm = vi.fn(() => work.promise);
    const user = userEvent.setup();
    const { results } = renderWithHost({ ...DELETE_CUSTOMER, onConfirm });
    await user.click(opener());
    await user.click(screen.getByRole("button", { name: "삭제" }));

    const confirm = screen.getByRole("button", { name: "삭제" });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveAttribute("aria-busy", "true");
    expect(confirm).toHaveAttribute("aria-disabled", "true");
    expect(dialog()).toBeInTheDocument();

    // 처리 중에는 Esc·취소·확인을 다시 눌러도 닫히거나 다시 불리지 않는다.
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "취소" }));
    await user.click(confirm);
    expect(dialog()).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => work.resolve());
    expect(queryDialog()).toBeNull();
    expect(results).toEqual([true]);
  });

  it("onConfirm이 실패하면 대화상자가 남고 안에 role='alert' 알림이 보이며 취소하면 false로 끝난다", async () => {
    const work = deferred();
    const user = userEvent.setup();
    const { results } = renderWithHost({ ...DELETE_CUSTOMER, onConfirm: () => work.promise });
    await user.click(opener());
    await user.click(screen.getByRole("button", { name: "삭제" }));
    await act(async () => work.reject(new Error("network")));

    expect(dialog()).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("요청을 처리하지 못했어요");
    expect(screen.getByRole("button", { name: "삭제" })).not.toHaveAttribute("aria-busy");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(queryDialog()).toBeNull();
    expect(results).toEqual([false]);
  });

  it("실패 뒤 다시 확인해 성공하면 true로 끝난다(가짜 타이머로 기다림)", async () => {
    vi.useFakeTimers();
    let attempt = 0;
    const onConfirm = () =>
      new Promise<void>((resolve, reject) => {
        attempt += 1;
        const current = attempt;
        setTimeout(() => (current === 1 ? reject(new Error("timeout")) : resolve()), 1000);
      });
    // 가짜 타이머 아래에서는 user-event 대신 동기 fireEvent를 쓴다(Testing Library의 비동기 감싸기가 실제 setTimeout을 기다린다).
    const { results } = renderWithHost({ ...DELETE_CUSTOMER, onConfirm });

    fireEvent.click(opener());
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.queryByRole("alert")).toBeNull();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(queryDialog()).toBeNull();
    expect(results).toEqual([true]);
  });
});

function Declarative({ onConfirm }: { onConfirm?: () => Promise<void> }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <p>{open ? "열림" : "닫힘"}</p>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="예약을 확정할까요?"
        description="고객에게 알림이 가요."
        confirmLabel="확정"
        onConfirm={onConfirm}
      />
    </>
  );
}

describe("ConfirmDialog — 선언형", () => {
  it("확인하면 onConfirm을 부른 뒤 onOpenChange(false)로 닫힌다", async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    const user = userEvent.setup();
    render(<Declarative onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "확정" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(queryDialog()).toBeNull();
    expect(screen.getByText("닫힘")).toBeInTheDocument();
  });

  it("onConfirm 없이 확인하거나 취소해도 닫힌다", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Declarative />);
    await user.click(screen.getByRole("button", { name: "확정" }));
    expect(screen.getByText("닫힘")).toBeInTheDocument();
    unmount();

    render(<Declarative />);
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByText("닫힘")).toBeInTheDocument();
  });
});

describe("ConfirmDialog — 자동 접근성 검사와 콘솔 경고", () => {
  it("열린 상태와 실패 알림 상태에서 axe 위반이 0건이고 콘솔 경고·오류가 없다", async () => {
    const warn = vi.spyOn(console, "warn");
    const error = vi.spyOn(console, "error");
    const user = userEvent.setup();
    renderWithHost({ ...DELETE_CUSTOMER, onConfirm: () => Promise.reject(new Error("x")) });
    await user.click(opener());
    await expectNoAxeViolations(dialog());
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await expectNoAxeViolations(dialog());
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
