import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Clock } from "lucide-react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Field } from "./field";
import { Input } from "./input";

const TEXT_INPUT_FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
  "focus-visible:border-ring",
];

const textbox = (name: string) => screen.getByRole("textbox", { name });

function ControlledInput() {
  const [value, setValue] = useState("");
  return (
    <Input aria-label="고객명" value={value} onChange={(event) => setValue(event.target.value)} />
  );
}

describe("Input — 크기·테두리·상태", () => {
  it("크기 sm·default·lg가 32·40·48px 높이로 렌더링된다(기본은 40px)", () => {
    render(
      <>
        <Input aria-label="작은 입력" size="sm" />
        <Input aria-label="보통 입력" />
        <Input aria-label="큰 입력" size="lg" />
      </>,
    );
    expect(textbox("작은 입력")).toHaveClass("h-8");
    expect(textbox("보통 입력")).toHaveClass("h-10");
    expect(textbox("큰 입력")).toHaveClass("h-12");
  });

  it("테두리는 장식용 border가 아닌 border-input이고 텍스트 입력 포커스 클래스를 모두 가진다", () => {
    render(<Input aria-label="고객명" />);
    expect(textbox("고객명")).toHaveClass("border", "border-input", ...TEXT_INPUT_FOCUS_CLASSES);
    expect(textbox("고객명")).not.toHaveClass("border-border");
  });

  it("invalid면 aria-invalid='true'이고 테두리가 destructive로 바뀌며, 아니면 속성이 없다", () => {
    render(
      <>
        <Input aria-label="오류 입력" invalid />
        <Input aria-label="정상 입력" />
      </>,
    );
    expect(textbox("오류 입력")).toHaveAttribute("aria-invalid", "true");
    expect(textbox("오류 입력")).toHaveClass("aria-invalid:border-destructive");
    expect(textbox("정상 입력")).not.toHaveAttribute("aria-invalid");
  });

  it("read-only면 readonly 속성과 muted 면 클래스를 갖는다", () => {
    render(<Input aria-label="고객 번호" readOnly defaultValue="C-1024" />);
    expect(textbox("고객 번호")).toHaveAttribute("readonly");
    expect(textbox("고객 번호")).toHaveClass("read-only:bg-muted");
  });

  it("disabled면 네이티브 disabled다", () => {
    render(<Input aria-label="매장명" disabled />);
    expect(textbox("매장명")).toBeDisabled();
    expect(textbox("매장명")).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
  });

  it("className을 입력 요소에 합친다", () => {
    render(<Input aria-label="전화번호" className="tabular-nums" />);
    expect(textbox("전화번호")).toHaveClass("tabular-nums", "border-input");
  });

  it("글자를 입력하면 onChange로 알린다", async () => {
    const user = userEvent.setup();
    render(<ControlledInput />);
    await user.type(textbox("고객명"), "김민지");
    expect(textbox("고객명")).toHaveValue("김민지");
  });
});

describe("Input — 앞뒤 부가 표시(AC-UI-001-17)", () => {
  it("뒤 글자 부가 표시 '원'은 id를 갖고 입력의 aria-describedby에 들어간다", () => {
    render(<Input aria-label="가격" endAdornment="원" />);
    const suffix = screen.getByText("원");
    expect(suffix.id).not.toBe("");
    expect(textbox("가격")).toHaveAttribute("aria-describedby", suffix.id);
    expect(textbox("가격")).toHaveAccessibleDescription("원");
  });

  it("앞 글자 부가 표시도 id를 갖고 aria-describedby에 뒤 표시보다 먼저 들어간다", () => {
    render(<Input aria-label="소요 시간" startAdornment="약" endAdornment="분" />);
    expect(textbox("소요 시간")).toHaveAttribute(
      "aria-describedby",
      `${screen.getByText("약").id} ${screen.getByText("분").id}`,
    );
  });

  it("앞 아이콘 부가 표시는 보조 기술에서 숨기고 aria-describedby에 넣지 않는다", () => {
    const { container } = render(<Input aria-label="시작 시각" startAdornment={<Clock />} />);
    const icon = container.querySelector("svg");
    expect(icon?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(textbox("시작 시각")).not.toHaveAttribute("aria-describedby");
  });

  it("소비 측 aria-describedby 뒤에 글자 부가 표시 id를 잇는다", () => {
    render(
      <>
        <p id="price-hint">부가세를 포함해요.</p>
        <Input aria-label="가격" aria-describedby="price-hint" endAdornment="원" />
      </>,
    );
    expect(textbox("가격")).toHaveAttribute(
      "aria-describedby",
      `price-hint ${screen.getByText("원").id}`,
    );
  });
});

describe("Input — Field 연결(AC-UI-001-16)", () => {
  it("Field 안에서 라벨 htmlFor·id가 같고 aria-describedby가 설명 → 오류 → 글자 부가 표시 순이다", () => {
    render(
      <Field label="가격" description="부가세를 포함한 금액이에요." error="가격을 입력해 주세요.">
        <Input endAdornment="원" />
      </Field>,
    );
    const input = screen.getByLabelText("가격");
    expect(input.tagName).toBe("INPUT");
    const description = screen.getByText("부가세를 포함한 금액이에요.");
    const error = screen.getByText("가격을 입력해 주세요.");
    const suffix = screen.getByText("원");
    expect(input).toHaveAttribute("aria-describedby", `${description.id} ${error.id} ${suffix.id}`);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("오류를 지우면 aria-invalid가 사라지고 aria-describedby에서 오류 id가 빠진다", () => {
    const { rerender } = render(
      <Field label="고객명" description="실명을 입력해요." error="고객명을 입력해 주세요.">
        <Input />
      </Field>,
    );
    rerender(
      <Field label="고객명" description="실명을 입력해요.">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("고객명");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute("aria-describedby", screen.getByText("실명을 입력해요.").id);
  });

  it("필수 Field 안에서는 네이티브 required 속성을 받는다", () => {
    render(
      <Field label="고객명" required>
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText(/고객명/)).toBeRequired();
    expect(screen.getByLabelText(/고객명/)).not.toHaveAttribute("aria-required");
  });
});

describe("Input — 자동 접근성 검사", () => {
  it("크기·부가 표시·invalid·read-only·disabled·Field 상태에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <>
        <Input aria-label="작은 입력" size="sm" />
        <Input aria-label="큰 입력" size="lg" />
        <Input aria-label="시작 시각" startAdornment={<Clock />} />
        <Input aria-label="가격" endAdornment="원" />
        <Input aria-label="오류 입력" invalid />
        <Input aria-label="고객 번호" readOnly defaultValue="C-1024" />
        <Input aria-label="매장명" disabled />
        <Field
          label="전화번호"
          description="010-1234-5678 형식이에요."
          error="전화번호를 입력해 주세요."
          required
        >
          <Input inputMode="tel" />
        </Field>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
