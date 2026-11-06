import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Checkbox } from "./checkbox";
import { Field } from "./field";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

type CheckedState = boolean | "indeterminate";

function Harness({
  initial,
  onChange,
  disabled,
}: {
  initial: CheckedState;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const [checked, setChecked] = useState<CheckedState>(initial);
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onChange?.(next);
      }}
      label="전체 선택"
      disabled={disabled}
    />
  );
}

const noop = () => undefined;
const checkbox = (name: string | RegExp) => screen.getByRole("checkbox", { name });

describe("Checkbox — 상태 표시", () => {
  it("role='checkbox'이고 선택·해제·일부 선택이 aria-checked true·false·mixed로 보인다", () => {
    render(
      <>
        <Checkbox checked onCheckedChange={noop} label="선택됨" />
        <Checkbox checked={false} onCheckedChange={noop} label="해제됨" />
        <Checkbox checked="indeterminate" onCheckedChange={noop} label="일부 선택" />
      </>,
    );
    expect(checkbox("선택됨")).toHaveAttribute("aria-checked", "true");
    expect(checkbox("해제됨")).toHaveAttribute("aria-checked", "false");
    expect(checkbox("일부 선택")).toHaveAttribute("aria-checked", "mixed");
  });

  it("선택이면 Check, 일부 선택이면 Minus 아이콘을 장식으로 보이고 해제면 아이콘이 없다", () => {
    render(
      <>
        <Checkbox checked onCheckedChange={noop} label="선택됨" />
        <Checkbox checked="indeterminate" onCheckedChange={noop} label="일부 선택" />
        <Checkbox checked={false} onCheckedChange={noop} label="해제됨" />
      </>,
    );
    const checkIcon = checkbox("선택됨").querySelector("svg");
    const minusIcon = checkbox("일부 선택").querySelector("svg");
    expect(checkIcon).toHaveClass("lucide-check");
    expect(minusIcon).toHaveClass("lucide-minus");
    expect(checkIcon).toHaveAttribute("aria-hidden", "true");
    expect(minusIcon).toHaveAttribute("aria-hidden", "true");
    expect(checkbox("해제됨").querySelector("svg")).toBeNull();
  });
});

describe("Checkbox — 키보드·마우스(AC-UI-001-17)", () => {
  it("AC-UI-001-11: Tab으로 들어가면 Enter로는 바뀌지 않고 Space로 일부 선택에서 선택으로 바뀐다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="indeterminate" onChange={onChange} />);
    await user.tab();
    expect(checkbox("전체 선택")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(checkbox("전체 선택")).toHaveAttribute("aria-checked", "mixed");
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard(" ");
    expect(checkbox("전체 선택")).toHaveAttribute("aria-checked", "true");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("AC-UI-001-11: 선택된 상태에서 Space를 누르면 해제된다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={true} onChange={onChange} />);
    await user.tab();
    await user.keyboard(" ");
    expect(checkbox("전체 선택")).toHaveAttribute("aria-checked", "false");
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("라벨을 누르면 체크가 바뀐다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={false} />);
    await user.click(screen.getByText("전체 선택"));
    expect(checkbox("전체 선택")).toHaveAttribute("aria-checked", "true");
  });

  it("disabled면 누르거나 라벨을 눌러도 바뀌지 않는다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={false} onChange={onChange} disabled />);
    expect(checkbox("전체 선택")).toBeDisabled();
    await user.click(checkbox("전체 선택"));
    await user.click(screen.getByText("전체 선택"));
    expect(checkbox("전체 선택")).toHaveAttribute("aria-checked", "false");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Checkbox — 필수·오류·Field 연결(AC-UI-001-16)", () => {
  it("required면 aria-required='true'이고 버튼 요소에 required 속성은 없다", () => {
    render(<Checkbox checked={false} onCheckedChange={noop} label="약관 동의" required />);
    expect(checkbox("약관 동의")).toHaveAttribute("aria-required", "true");
    expect(checkbox("약관 동의")).not.toHaveAttribute("required");
  });

  it("필수가 아니면 aria-required를 붙이지 않는다", () => {
    render(<Checkbox checked={false} onCheckedChange={noop} label="마케팅 수신" />);
    expect(checkbox("마케팅 수신")).not.toHaveAttribute("aria-required");
  });

  it("invalid면 aria-invalid='true'이고 테두리가 destructive로 바뀐다", () => {
    render(<Checkbox checked={false} onCheckedChange={noop} label="약관 동의" invalid />);
    expect(checkbox("약관 동의")).toHaveAttribute("aria-invalid", "true");
    expect(checkbox("약관 동의")).toHaveClass("aria-invalid:border-destructive");
  });

  it("Field 안에서 라벨·설명·오류와 연결되고 필수면 aria-required='true'다", () => {
    render(
      <Field
        label="개인정보 수집 동의"
        description="예약 알림을 보내는 데만 써요."
        error="동의가 필요해요."
        required
      >
        <Checkbox checked={false} onCheckedChange={noop} />
      </Field>,
    );
    const element = checkbox(/개인정보 수집 동의/);
    expect(element).toHaveAttribute(
      "aria-describedby",
      `${screen.getByText("예약 알림을 보내는 데만 써요.").id} ${screen.getByText("동의가 필요해요.").id}`,
    );
    expect(element).toHaveAttribute("aria-invalid", "true");
    expect(element).toHaveAttribute("aria-required", "true");
    expect(element).not.toHaveAttribute("required");
  });

  it("id를 주면 그 id를 쓰고 라벨이 같은 id를 가리킨다", () => {
    render(<Checkbox id="agree" checked={false} onCheckedChange={noop} label="약관 동의" />);
    expect(checkbox("약관 동의")).toHaveAttribute("id", "agree");
  });
});

describe("Checkbox — 포커스 표시·테두리·자동 접근성 검사", () => {
  it("AC-UI-001-11: 체크 버튼에 포커스 윤곽선 클래스 세 개가 있고 테두리는 border-input이다", () => {
    render(<Checkbox checked={false} onCheckedChange={noop} label="전체 선택" />);
    expect(checkbox("전체 선택")).toHaveClass(...FOCUS_CLASSES, "border", "border-input");
    expect(checkbox("전체 선택")).not.toHaveClass("border-border");
  });

  it("AC-UI-001-11: 해제·선택·일부 선택·disabled·invalid 상태에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <>
        <Checkbox checked={false} onCheckedChange={noop} label="해제됨" />
        <Checkbox checked onCheckedChange={noop} label="선택됨" />
        <Checkbox checked="indeterminate" onCheckedChange={noop} label="일부 선택" />
        <Checkbox checked={false} onCheckedChange={noop} label="잠김" disabled />
        <Checkbox checked={false} onCheckedChange={noop} label="오류" invalid required />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
