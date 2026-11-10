import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Button } from "./button";
import { Field } from "./field";
import { Input } from "./input";
import { Modal, type ModalProps } from "./modal";

const DISCARD_PROMPT = "작성 중인 내용이 사라져요. 닫을까요?";

function Harness({
  dirty,
  closeDisabled,
  description = "예약할 때 고객을 찾을 수 있게 이름과 전화번호를 적어요.",
  size,
  onOpenChange,
}: Partial<Pick<ModalProps, "dirty" | "closeDisabled" | "size" | "onOpenChange">> & {
  description?: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        고객 등록
      </button>
      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        title="고객 등록"
        description={description ?? undefined}
        size={size}
        dirty={dirty}
        closeDisabled={closeDisabled}
        footer={<Button>저장</Button>}
      >
        <Field label="이름">
          <Input />
        </Field>
        <Field label="전화번호">
          <Input />
        </Field>
      </Modal>
    </>
  );
}

const opener = () => screen.getByRole("button", { name: "고객 등록", hidden: true });
const dialog = () => screen.getByRole("dialog");
const queryDialog = () => screen.queryByRole("dialog");
const closeButton = () => screen.getByRole("button", { name: "닫기" });
const overlay = () => document.querySelector<HTMLElement>("[data-modal-overlay]") as HTMLElement;

async function openModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(opener());
  expect(dialog()).toBeInTheDocument();
}

describe("Modal — 구조(AC-UI-001-22)", () => {
  it("role='dialog'에 제목이 이름으로, 설명이 설명으로 연결된다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openModal(user);
    expect(dialog()).toHaveAccessibleName("고객 등록");
    expect(dialog()).toHaveAccessibleDescription(
      "예약할 때 고객을 찾을 수 있게 이름과 전화번호를 적어요.",
    );
    expect(screen.getByRole("heading", { name: "고객 등록" })).toBeInTheDocument();
  });

  it("설명이 없으면 aria-describedby가 없고 콘솔 경고·오류가 0건이다(B-17)", async () => {
    const warn = vi.spyOn(console, "warn");
    const error = vi.spyOn(console, "error");
    const user = userEvent.setup();
    render(<Harness description={null} />);
    await openModal(user);
    expect(dialog()).not.toHaveAttribute("aria-describedby");
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("크기 sm·md·lg는 dialog 폭 토큰 400·560·720px이고 기본은 md다", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness />);
    await openModal(user);
    expect(dialog()).toHaveClass("max-w-dialog-md");
    rerender(<Harness size="sm" />);
    expect(dialog()).toHaveClass("max-w-dialog-sm");
    rerender(<Harness size="lg" />);
    expect(dialog()).toHaveClass("max-w-dialog-lg");
  });

  it("footer가 없으면 바닥 영역을 그리지 않는다", () => {
    render(
      <Modal open onOpenChange={() => undefined} title="안내">
        <p>본문이에요.</p>
      </Modal>,
    );
    expect([...dialog().querySelectorAll("button")]).toHaveLength(1);
    expect(dialog().querySelector("[data-modal-footer]")).toBeNull();
  });

  it("footer를 본문 뒤에 그리고, 닫기 버튼은 DOM 순서상 맨 뒤에 둔다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openModal(user);
    const buttons = [...dialog().querySelectorAll("button")].map((button) => button.textContent);
    expect(buttons).toEqual(["저장", ""]);
    expect(closeButton()).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-ring",
    );
  });
});

describe("Modal — 열기·닫기와 포커스(AC-UI-001-22, AC-UI-001-11)", () => {
  it("AC-UI-001-11: 열리면 포커스가 닫기 버튼이 아닌 첫 입력에 있다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openModal(user);
    expect(screen.getByRole("textbox", { name: "이름" })).toHaveFocus();
  });

  it("AC-UI-001-11: Tab은 대화상자 밖으로 나가지 않고 처음으로 돈다(EC-16)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openModal(user);
    await user.tab();
    expect(screen.getByRole("textbox", { name: "전화번호" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "저장" })).toHaveFocus();
    await user.tab();
    expect(closeButton()).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("textbox", { name: "이름" })).toHaveFocus();
  });

  it("AC-UI-001-11: 작성 중이 아니면 Esc로 확인 없이 닫히고 포커스가 연 버튼으로 돌아온다(EC-27)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openModal(user);
    await user.keyboard("{Escape}");
    expect(queryDialog()).toBeNull();
    expect(screen.queryByText(DISCARD_PROMPT)).toBeNull();
    expect(opener()).toHaveFocus();
  });

  it("작성 중이 아니면 스크림을 눌러 닫히고 포커스가 연 버튼으로 돌아온다(EC-27)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openModal(user);
    await user.click(overlay());
    expect(queryDialog()).toBeNull();
    expect(opener()).toHaveFocus();
  });

  it("스크림을 오른쪽 버튼으로 누르면 닫히지 않는다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openModal(user);
    await user.pointer({ keys: "[MouseRight]", target: overlay() });
    expect(dialog()).toBeInTheDocument();
  });

  it("작성 중이 아니면 닫기 버튼으로 닫힌다", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onOpenChange={onOpenChange} />);
    await openModal(user);
    await user.click(closeButton());
    expect(queryDialog()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(opener()).toHaveFocus();
  });
});

describe("Modal — 작성 중 닫기 확인(AC-UI-001-22 가)", () => {
  const paths: [string, (user: ReturnType<typeof userEvent.setup>) => Promise<void>][] = [
    ["닫기 버튼", (user) => user.click(closeButton())],
    ["Esc", (user) => user.keyboard("{Escape}")],
    ["스크림", (user) => user.click(overlay())],
  ];

  for (const [name, attemptClose] of paths) {
    it(`${name}으로 닫으려 하면 확인을 띄우고, '계속 작성'이면 열린 채 남는다`, async () => {
      const user = userEvent.setup();
      render(<Harness dirty />);
      await openModal(user);
      await attemptClose(user);
      expect(screen.getByRole("alertdialog")).toHaveAccessibleName(DISCARD_PROMPT);
      await user.click(screen.getByRole("button", { name: "계속 작성" }));
      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(dialog()).toBeInTheDocument();
    });

    it(`${name}으로 닫으려 할 때 확인에서 '닫기'를 고르면 닫히고 포커스가 연 버튼으로 돌아온다`, async () => {
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness dirty onOpenChange={onOpenChange} />);
      await openModal(user);
      await attemptClose(user);
      const prompt = screen.getByRole("alertdialog");
      await user.click(
        [...prompt.querySelectorAll("button")].find(
          (button) => button.textContent === "닫기",
        ) as HTMLElement,
      );
      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(queryDialog()).toBeNull();
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(opener()).toHaveFocus();
    });
  }

  it("확인 대화상자의 Esc는 확인만 닫고 Modal은 남는다", async () => {
    const user = userEvent.setup();
    render(<Harness dirty />);
    await openModal(user);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(dialog()).toBeInTheDocument();
  });
});

// 부모가 버튼으로 open을 바꾸는 제어형 하네스(후속 과제 1 재현용)
function ControlledHarness() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(false)}>
        밖에서 닫기
      </button>
      <button type="button" onClick={() => setOpen(true)}>
        다시 열기
      </button>
      <Modal open={open} onOpenChange={setOpen} title="고객 등록" dirty>
        <Field label="이름">
          <Input />
        </Field>
      </Modal>
    </>
  );
}

describe("Modal — 밖에서 닫고 다시 열기(SPEC-UI-002 후속 과제 1)", () => {
  it("버리기 확인을 띄운 채 부모가 open=false → open=true로 바꾸면 다시 열린 Modal에 버리기 확인이 없다", async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toHaveAccessibleName(DISCARD_PROMPT);

    // 확인이 떠 있는 동안 포커스는 대화상자 안에 갇혀 있으므로, 부모의 상태 변경은 버튼 fireEvent.click으로 흉내 낸다.
    fireEvent.click(screen.getByRole("button", { name: "밖에서 닫기", hidden: true }));
    await screen.findByRole("button", { name: "다시 열기" });
    expect(queryDialog()).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "다시 열기" }));
    expect(await screen.findByRole("dialog", { hidden: true })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog", { hidden: true })).toBeNull();
    expect(screen.queryByText(DISCARD_PROMPT)).toBeNull();
    expect(dialog()).toBeInTheDocument();
  });
});

describe("Modal — 제출 중 닫기 막기(AC-UI-001-22 나)", () => {
  it("dirty와 closeDisabled가 함께 참이어도 세 방법 모두 닫히지 않고 확인도 뜨지 않으며 닫기 버튼은 aria-disabled다", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness dirty closeDisabled onOpenChange={onOpenChange} />);
    await openModal(user);
    expect(closeButton()).toHaveAttribute("aria-disabled", "true");
    expect(closeButton()).not.toBeDisabled();

    await user.click(closeButton());
    await user.keyboard("{Escape}");
    await user.click(overlay());

    expect(dialog()).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByText(DISCARD_PROMPT)).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Modal — 자동 접근성 검사", () => {
  it("열린 상태와 작성 중 확인 상태에서 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    render(<Harness dirty />);
    await openModal(user);
    await expectNoAxeViolations(dialog());
    await user.keyboard("{Escape}");
    await expectNoAxeViolations(screen.getByRole("alertdialog"));
  });
});
