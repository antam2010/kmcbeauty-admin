import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Field } from "./field";
import { Textarea } from "./textarea";

const TEXT_INPUT_FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
  "focus-visible:border-ring",
];

const textbox = (name: string) => screen.getByRole("textbox", { name });

function ControlledTextarea() {
  const [value, setValue] = useState("");
  return (
    <Textarea
      aria-label="메모"
      className="min-h-32"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

describe("Textarea — 모양과 상태", () => {
  it("여러 줄 입력이고 최소 높이 96px(min-h-24)와 세로로만 크기를 바꾸는 클래스를 가진다", () => {
    render(<Textarea aria-label="메모" />);
    expect(textbox("메모").tagName).toBe("TEXTAREA");
    expect(textbox("메모")).toHaveClass("min-h-24", "resize-y");
  });

  it("테두리는 border-input이고 텍스트 입력 포커스 클래스를 모두 가진다", () => {
    render(<Textarea aria-label="메모" />);
    expect(textbox("메모")).toHaveClass("border-input", ...TEXT_INPUT_FOCUS_CLASSES);
    expect(textbox("메모")).not.toHaveClass("border-border");
  });

  it("invalid면 aria-invalid='true'이고 아니면 속성이 없다", () => {
    render(
      <>
        <Textarea aria-label="오류 메모" invalid />
        <Textarea aria-label="정상 메모" />
      </>,
    );
    expect(textbox("오류 메모")).toHaveAttribute("aria-invalid", "true");
    expect(textbox("정상 메모")).not.toHaveAttribute("aria-invalid");
  });

  it("disabled면 네이티브 disabled다", () => {
    render(<Textarea aria-label="메모" disabled />);
    expect(textbox("메모")).toBeDisabled();
  });

  it("className을 합치고 글자 입력을 onChange로 알린다", async () => {
    const user = userEvent.setup();
    render(<ControlledTextarea />);
    await user.type(textbox("메모"), "젤 네일 재방문");
    expect(textbox("메모")).toHaveValue("젤 네일 재방문");
    expect(textbox("메모")).toHaveClass("min-h-32");
    expect(textbox("메모")).not.toHaveClass("min-h-24");
  });
});

describe("Textarea — Field 연결(AC-UI-001-16)", () => {
  it("Field 안에서 라벨·설명·오류·필수와 연결된다", () => {
    render(
      <Field
        label="예약 메모"
        description="120자까지 쓸 수 있어요."
        error="메모를 입력해 주세요."
        required
      >
        <Textarea />
      </Field>,
    );
    const textarea = screen.getByLabelText(/예약 메모/);
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      `${screen.getByText("120자까지 쓸 수 있어요.").id} ${screen.getByText("메모를 입력해 주세요.").id}`,
    );
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toBeRequired();
  });
});

describe("Textarea — 자동 접근성 검사", () => {
  it("기본·invalid·disabled·Field 상태에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <>
        <Textarea aria-label="기본 메모" />
        <Textarea aria-label="오류 메모" invalid />
        <Textarea aria-label="잠긴 메모" disabled />
        <Field label="예약 메모" description="120자까지 쓸 수 있어요.">
          <Textarea />
        </Field>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
