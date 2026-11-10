import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Field } from "./field";
import { NumberInput, type NumberInputProps } from "./number-input";

const TEXT_INPUT_FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
  "focus-visible:border-ring",
];

// 폼 값을 그대로 보이는 하네스. onValueChange로 받은 값을 다시 value로 넘긴다(제어형).
function Harness({
  initial = null,
  onValueChange,
  label = "가격",
  ...props
}: Partial<Omit<NumberInputProps, "value" | "onValueChange">> & {
  initial?: number | null;
  onValueChange?: (value: number | null) => void;
  label?: string;
}) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <>
      <Field label={label}>
        <NumberInput
          {...props}
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange?.(next);
          }}
        />
      </Field>
      <output data-testid="form-value">{value === null ? "null" : String(value)}</output>
    </>
  );
}

const input = (name = "가격") => screen.getByRole("textbox", { name }) as HTMLInputElement;
const formValue = () => screen.getByTestId("form-value").textContent;

describe("NumberInput — 입력·표시·값(AC-UI-002-22 마·바·사)", () => {
  it("inputMode='numeric'인 텍스트 입력이고 숫자 스피너(type=number)가 없다", () => {
    render(<Harness />);
    expect(input()).toHaveAttribute("inputmode", "numeric");
    expect(input()).toHaveAttribute("type", "text");
  });

  it("(마) 1234567을 치면 표시는 1,234,567이고 값은 1234567이다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "1234567");
    expect(input()).toHaveValue("1,234,567");
    expect(formValue()).toBe("1234567");
  });

  it("(바) ₩12,000을 붙여넣으면 숫자만 남아 값이 12000이다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(input());
    await user.paste("₩12,000");
    expect(input()).toHaveValue("12,000");
    expect(formValue()).toBe("12000");
  });

  it("(사) 칸을 비우면 값이 null이다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={12000} />);
    expect(input()).toHaveValue("12,000");
    await user.clear(input());
    expect(input()).toHaveValue("");
    expect(formValue()).toBe("null");
  });

  it("숫자가 아닌 글자는 무시하고 값을 부르지 않는다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={12} onValueChange={onValueChange} />);
    await user.type(input(), "가a");
    expect(input()).toHaveValue("12");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("밖에서 값을 바꾸면 쉼표를 붙여 보인다", () => {
    const { rerender } = render(
      <NumberInput aria-label="가격" value={1000} onValueChange={() => undefined} />,
    );
    expect(input()).toHaveValue("1,000");
    rerender(<NumberInput aria-label="가격" value={2500000} onValueChange={() => undefined} />);
    expect(input()).toHaveValue("2,500,000");
    rerender(<NumberInput aria-label="가격" value={null} onValueChange={() => undefined} />);
    expect(input()).toHaveValue("");
  });

  it("고정폭 숫자(tabular-nums)로 보인다", () => {
    render(<Harness />);
    expect(input()).toHaveClass("tabular-nums");
  });
});

describe("NumberInput — 커서와 키(EC-24, §3.10 키보드 계약)", () => {
  it("EC-24: 1,234|,567에서 Backspace면 표시 123,567이고 커서가 지운 자리(3)에 남는다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={1234567} />);
    input().focus();
    input().setSelectionRange(5, 5);
    await user.keyboard("{Backspace}");
    expect(input()).toHaveValue("123,567");
    expect(formValue()).toBe("123567");
    expect(input().selectionStart).toBe(3);
    expect(input().selectionEnd).toBe(3);
  });

  it("가운데에 숫자를 넣어도 커서가 넣은 숫자 바로 뒤에 남는다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={123567} />);
    input().focus();
    input().setSelectionRange(3, 3); // 123|,567
    await user.keyboard("4");
    expect(input()).toHaveValue("1,234,567");
    expect(input().selectionStart).toBe(5); // 1,234|,567
  });

  it("위·아래 화살표로 값을 바꾸지 않는다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={500} onValueChange={onValueChange} />);
    input().focus();
    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowDown}");
    expect(input()).toHaveValue("500");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("NumberInput — 범위(EC-23)와 접근성 연결", () => {
  it("EC-23: max보다 큰 값을 쳐도 값을 줄이지 않고 범위 오류를 aria-invalid·aria-describedby로 알린다", async () => {
    const user = userEvent.setup();
    render(<Harness max={1000} suffix="원" />);
    await user.type(input(), "1500");
    expect(input()).toHaveValue("1,500");
    expect(formValue()).toBe("1500");
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(input()).toHaveAccessibleDescription(/1,000원 이하로 입력해 주세요\./);
    expect(screen.getByText("1,000원 이하로 입력해 주세요.")).toBeInTheDocument();
  });

  it("min보다 작으면 'min 이상', min·max가 함께 있으면 'min 이상 max 이하' 문구다", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness min={10} />);
    await user.type(input(), "5");
    expect(input()).toHaveAccessibleDescription(/10 이상 입력해 주세요\./);
    unmount();
    render(<Harness min={10} max={600} suffix="분" label="소요 시간" />);
    await user.type(input("소요 시간"), "700");
    expect(input("소요 시간")).toHaveAccessibleDescription(
      /10분 이상 600분 이하로 입력해 주세요\./,
    );
  });

  it("범위 안이면 오류가 없고 aria-invalid도 없다", async () => {
    const user = userEvent.setup();
    render(<Harness min={0} max={1000} />);
    await user.type(input(), "999");
    expect(input()).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText(/입력해 주세요/)).toBeNull();
  });

  it("단위(suffix)는 뒤 부가 표시이고 설명으로 연결되며, Field 라벨이 이름이다", () => {
    render(<Harness suffix="원" />);
    expect(input()).toHaveAccessibleName("가격");
    expect(input()).toHaveAccessibleDescription("원");
  });

  it("Field의 오류는 그대로 aria-invalid로 이어진다", () => {
    render(
      <Field label="가격" error="0 이상 입력해 주세요.">
        <NumberInput value={null} onValueChange={() => undefined} />
      </Field>,
    );
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(input()).toHaveAccessibleDescription(/0 이상 입력해 주세요\./);
  });

  it("텍스트 입력 포커스 클래스(고대비 모드에서도 남는 outline)와 invalid 테두리 클래스를 가진다", () => {
    render(<Harness />);
    expect(input()).toHaveClass(...TEXT_INPUT_FOCUS_CLASSES, "aria-invalid:border-destructive");
  });

  it("애니메이션·이동 클래스가 없어 감속 모드(AC-UI-001-13 방식)에서도 그대로다", () => {
    render(<Harness suffix="원" />);
    const classes = input().className.split(/\s+/);
    expect(
      classes.filter((name) => name.includes("animate") || name.includes("translate")),
    ).toEqual([]);
  });

  it("빈 값·값·범위 오류 상태에서 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness max={1000} suffix="원" />);
    await expectNoAxeViolations(container);
    await user.type(input(), "1500");
    await expectNoAxeViolations(container);
  });
});
