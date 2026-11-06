import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Field, useFieldControl } from "./field";

interface ProbeProps {
  id?: string;
  "aria-describedby"?: string;
  invalid?: boolean;
  required?: boolean;
}

// 네이티브 입력형 대역: 필수 여부를 required 속성으로 붙인다(Input·Textarea·Combobox 입력과 같은 규칙).
function ProbeInput(props: ProbeProps) {
  const control = useFieldControl(props);
  return (
    <input
      id={control.id}
      aria-describedby={control.describedBy}
      aria-invalid={control.invalid || undefined}
      required={control.required}
    />
  );
}

// 버튼형 대역: 필수 여부를 aria-required로 붙인다(Select 트리거·Checkbox·DateTimePicker 트리거와 같은 규칙).
function ProbeCheckbox(props: ProbeProps) {
  const control = useFieldControl(props);
  return (
    // biome-ignore lint/a11y/useSemanticElements: Radix Checkbox처럼 role="checkbox"를 단 버튼형 컨트롤을 흉내 내는 대역이다.
    <button
      type="button"
      role="checkbox"
      aria-checked="false"
      id={control.id}
      aria-describedby={control.describedBy}
      aria-invalid={control.invalid || undefined}
      aria-required={control.required || undefined}
    />
  );
}

const DESCRIPTION = "010-1234-5678 형식으로 입력해요.";
const ERROR = "전화번호를 입력해 주세요.";

const idOf = (text: string) => screen.getByText(text).id;

describe("Field — 라벨·설명·오류 연결(AC-UI-001-16)", () => {
  it("라벨 htmlFor와 컨트롤 id가 같아 라벨로 컨트롤을 찾을 수 있다", () => {
    render(
      <Field label="전화번호">
        <ProbeInput />
      </Field>,
    );
    const input = screen.getByLabelText("전화번호");
    const label = screen.getByText("전화번호").closest("label");
    expect(input.id).not.toBe("");
    expect(label).toHaveAttribute("for", input.id);
  });

  it("설명과 오류가 있으면 aria-describedby가 설명 id → 오류 id 순의 두 개이고 aria-invalid가 true다", () => {
    render(
      <Field label="전화번호" description={DESCRIPTION} error={ERROR}>
        <ProbeInput />
      </Field>,
    );
    const input = screen.getByLabelText("전화번호");
    expect(input).toHaveAttribute("aria-describedby", `${idOf(DESCRIPTION)} ${idOf(ERROR)}`);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(`${DESCRIPTION} ${ERROR}`);
  });

  it("오류 문장 앞에 장식 아이콘(CircleAlert)이 있고 destructive 색이다", () => {
    render(
      <Field label="전화번호" error={ERROR}>
        <ProbeInput />
      </Field>,
    );
    const error = screen.getByText(ERROR);
    const icon = error.firstElementChild;
    expect(icon?.tagName.toLowerCase()).toBe("svg");
    expect(icon).toHaveClass("lucide-circle-alert");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(error).toHaveClass("text-destructive");
  });

  it("오류를 지우면 aria-describedby에 설명 id 하나만 남고 aria-invalid가 사라진다", () => {
    const { rerender } = render(
      <Field label="전화번호" description={DESCRIPTION} error={ERROR}>
        <ProbeInput />
      </Field>,
    );
    rerender(
      <Field label="전화번호" description={DESCRIPTION}>
        <ProbeInput />
      </Field>,
    );
    const input = screen.getByLabelText("전화번호");
    expect(input).toHaveAttribute("aria-describedby", idOf(DESCRIPTION));
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText(ERROR)).toBeNull();
  });

  it("EC-13: 설명만 있고 오류가 없으면 aria-describedby에 설명 id 하나이고 aria-invalid가 없다", () => {
    render(
      <Field label="전화번호" description={DESCRIPTION}>
        <ProbeInput />
      </Field>,
    );
    const input = screen.getByLabelText("전화번호");
    expect(input).toHaveAttribute("aria-describedby", idOf(DESCRIPTION));
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("설명도 오류도 없으면 aria-describedby를 붙이지 않는다", () => {
    render(
      <Field label="전화번호">
        <ProbeInput />
      </Field>,
    );
    expect(screen.getByLabelText("전화번호")).not.toHaveAttribute("aria-describedby");
  });

  it("컨트롤 자신의 aria-describedby는 설명 → 오류 뒤에 잇는다", () => {
    render(
      <>
        <p id="extra-hint">하이픈 없이 입력해도 돼요.</p>
        <Field label="전화번호" description={DESCRIPTION} error={ERROR}>
          <ProbeInput aria-describedby="extra-hint" />
        </Field>
      </>,
    );
    expect(screen.getByLabelText("전화번호")).toHaveAttribute(
      "aria-describedby",
      `${idOf(DESCRIPTION)} ${idOf(ERROR)} extra-hint`,
    );
  });

  it("컨트롤에 id를 주면 라벨이 그 id를 가리킨다", () => {
    render(
      <Field label="고객명">
        <ProbeInput id="customer-name" />
      </Field>,
    );
    expect(screen.getByLabelText("고객명")).toHaveAttribute("id", "customer-name");
  });
});

describe("Field — 필수 표시(AC-UI-001-16)", () => {
  it("필수면 라벨 뒤에 보조 기술에서 숨긴 * 표시가 있고 네이티브 입력은 required를 받는다", () => {
    render(
      <Field label="고객명" required>
        <ProbeInput />
      </Field>,
    );
    const asterisk = screen.getByText("*");
    expect(asterisk).toHaveAttribute("aria-hidden", "true");
    expect(asterisk).toHaveClass("text-destructive");
    expect(screen.getByLabelText(/고객명/)).toBeRequired();
  });

  it("필수인 버튼형 컨트롤은 aria-required='true'를 받는다", () => {
    render(
      <Field label="개인정보 수집 동의" required>
        <ProbeCheckbox />
      </Field>,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-required", "true");
  });

  it("필수가 아니면 * 표시가 없고 컨트롤도 필수가 아니다", () => {
    render(
      <Field label="메모">
        <ProbeInput />
      </Field>,
    );
    expect(screen.queryByText("*")).toBeNull();
    expect(screen.getByLabelText("메모")).not.toBeRequired();
  });
});

describe("Field 밖과 자동 접근성 검사", () => {
  it("Field 밖에서는 컨트롤 자신의 props를 그대로 쓴다", () => {
    render(
      <>
        <label htmlFor="standalone">단독 입력</label>
        <ProbeInput id="standalone" invalid required />
      </>,
    );
    const input = screen.getByLabelText("단독 입력");
    expect(input).toHaveAttribute("id", "standalone");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toBeRequired();
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("설명·오류·필수 표시가 모두 있을 때와 없을 때 axe 위반이 0건이다", async () => {
    const { container, rerender } = render(
      <Field label="전화번호" description={DESCRIPTION} error={ERROR} required>
        <ProbeInput />
      </Field>,
    );
    await expectNoAxeViolations(container);
    rerender(
      <Field label="전화번호">
        <ProbeInput />
      </Field>,
    );
    await expectNoAxeViolations(container);
  });
});
