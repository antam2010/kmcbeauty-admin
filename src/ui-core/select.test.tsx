import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Field } from "./field";
import { Select, type SelectGroup, type SelectOption, type SelectProps } from "./select";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

// acceptance.md AC-UI-001-17의 옵션
const TREATMENTS: SelectOption[] = [
  { value: "1", label: "젤 네일" },
  { value: "2", label: "속눈썹 연장" },
];

const GROUPED: Array<SelectOption | SelectGroup> = [
  {
    label: "네일",
    options: [
      { value: "gel", label: "젤 네일" },
      { value: "care", label: "손톱 관리" },
    ],
  },
  {
    label: "속눈썹",
    options: [
      { value: "lash", label: "속눈썹 연장" },
      { value: "perm", label: "속눈썹 펌", disabled: true },
    ],
  },
];

function Harness({
  initial,
  onValueChange,
  ...props
}: Partial<Omit<SelectProps, "value" | "onValueChange">> & {
  initial?: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState<string | undefined>(initial);
  return (
    <Select
      aria-label="시술"
      options={TREATMENTS}
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

const trigger = () => screen.getByRole("combobox");
const option = (name: string) => screen.getByRole("option", { name });

describe("Select — 트리거 구조(AC-UI-001-17)", () => {
  it("트리거는 role='combobox'이고 값이 없으면 기본 문구 '선택'을 보인다", () => {
    render(<Harness />);
    expect(trigger()).toHaveAccessibleName("시술");
    expect(trigger()).toHaveTextContent("선택");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("placeholder를 주면 그 문구를 보인다", () => {
    render(<Harness placeholder="시술을 골라요" />);
    expect(trigger()).toHaveTextContent("시술을 골라요");
  });

  it("값이 있으면 저장값이 아닌 라벨을 보인다", () => {
    render(<Harness initial="2" />);
    expect(trigger()).toHaveTextContent("속눈썹 연장");
    expect(trigger()).not.toHaveTextContent("2");
  });

  it("테두리는 장식용 border가 아닌 border-input이고 포커스 윤곽선 클래스 세 개가 있다", () => {
    render(<Harness />);
    expect(trigger()).toHaveClass("border-input", ...FOCUS_CLASSES);
    expect(trigger()).not.toHaveClass("border-border");
  });

  it("크기 sm·default·lg는 높이 32·40·48px이다", () => {
    const { rerender } = render(<Harness size="sm" />);
    expect(trigger()).toHaveClass("h-8");
    rerender(<Harness size="lg" />);
    expect(trigger()).toHaveClass("h-12");
    rerender(<Harness />);
    expect(trigger()).toHaveClass("h-10");
  });

  it("className과 네이티브 속성은 트리거에 붙는다", () => {
    render(<Harness className="w-60" data-showcase="Select:default" />);
    expect(trigger()).toHaveClass("w-60");
    expect(trigger()).toHaveAttribute("data-showcase", "Select:default");
  });

  it("disabled면 트리거가 비활성이고 열리지 않는다", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("Select — 키보드로 고르기(AC-UI-001-17, AC-UI-001-11)", () => {
  it("AC-UI-001-11: Enter로 열고 ↓·↑로 '젤 네일'에 포커스를 둔 뒤 Enter를 누르면 라벨이 아닌 '1'을 알린다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    // 열린 동안 Radix가 목록 밖을 aria-hidden으로 가리므로 트리거를 먼저 잡아 둔다.
    const control = trigger();
    control.focus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(control).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowDown}");
    expect(option("속눈썹 연장")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(option("젤 네일")).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("1");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trigger()).toHaveTextContent("젤 네일");
    expect(trigger()).toHaveFocus();
  });

  it("AC-UI-001-11: 다시 열면 선택된 옵션에만 체크 아이콘이 있다(선택 단서)", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1" />);
    trigger().focus();
    await user.keyboard("{Enter}");

    expect(option("젤 네일")).toHaveAttribute("aria-selected", "true");
    expect(option("젤 네일").querySelector("svg.lucide-check")).not.toBeNull();
    expect(option("젤 네일").querySelector("svg.lucide-check")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(option("속눈썹 연장").querySelector("svg.lucide-check")).toBeNull();
  });

  it("AC-UI-001-11: Space·↓·↑로도 열린다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    trigger().focus();
    for (const key of [" ", "{ArrowDown}", "{ArrowUp}"]) {
      await user.keyboard(key);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).toBeNull();
    }
  });

  it("AC-UI-001-11: Space로 고르고 Esc로 닫으면 값은 그대로다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="1" onValueChange={onValueChange} />);
    trigger().focus();

    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("젤 네일");
    expect(trigger()).toHaveFocus();

    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard(" ");
    expect(onValueChange).toHaveBeenCalledWith("2");
  });

  it("열린 목록에서 글자를 입력하면 그 글자로 시작하는 옵션으로 포커스가 간다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    trigger().focus();
    await user.keyboard("{Enter}");
    await user.keyboard("속");
    expect(option("속눈썹 연장")).toHaveFocus();
  });

  it("마우스로 옵션을 눌러도 고를 수 있다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.click(option("속눈썹 연장"));
    expect(onValueChange).toHaveBeenCalledWith("2");
  });

  it("옵션마다 포커스 윤곽선 클래스 세 개가 있다(하이라이트 = 포커스)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    trigger().focus();
    await user.keyboard("{Enter}");
    for (const item of screen.getAllByRole("option")) {
      expect(item).toHaveClass(...FOCUS_CLASSES);
    }
  });
});

describe("Select — 묶음과 비활성 옵션", () => {
  it("묶음은 이름이 있는 group이고 옵션은 그 안에 있다", async () => {
    const user = userEvent.setup();
    render(<Harness options={GROUPED} />);
    trigger().focus();
    await user.keyboard("{Enter}");
    const nail = screen.getByRole("group", { name: "네일" });
    expect(
      within(nail)
        .getAllByRole("option")
        .map((item) => item.textContent),
    ).toEqual(["젤 네일", "손톱 관리"]);
    expect(screen.getByRole("group", { name: "속눈썹" })).toBeInTheDocument();
  });

  it("비활성 옵션은 aria-disabled이고 방향키가 건너뛴다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness options={GROUPED} initial="lash" onValueChange={onValueChange} />);
    trigger().focus();
    await user.keyboard("{Enter}");
    expect(option("속눈썹 펌")).toHaveAttribute("aria-disabled", "true");
    expect(option("속눈썹 연장")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(option("속눈썹 연장")).toHaveFocus();
    await user.click(option("속눈썹 펌"));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("Select — Field 연결(AC-UI-001-16)", () => {
  it("Field 안이면 라벨이 트리거의 이름이 되고 설명·오류·필수 여부가 트리거에 붙는다", () => {
    render(
      <Field label="시술" description="한 가지만 골라요." error="시술을 골라 주세요." required>
        <Select value={undefined} onValueChange={() => undefined} options={TREATMENTS} />
      </Field>,
    );
    const control = trigger();
    expect(control).toHaveAccessibleName("시술");
    expect(control).toHaveAccessibleDescription("한 가지만 골라요. 시술을 골라 주세요.");
    expect(control).toHaveAttribute("aria-invalid", "true");
    // 버튼에는 required가 유효하지 않으므로 aria-required로 붙인다
    expect(control).toHaveAttribute("aria-required", "true");
    expect(control).not.toHaveAttribute("required");
  });

  it("Field 밖에서 invalid·required를 주면 트리거에 aria-invalid·aria-required가 붙는다", () => {
    render(<Harness invalid required />);
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAttribute("aria-required", "true");
  });

  it("invalid가 아니면 aria-invalid가 없다", () => {
    render(<Harness />);
    expect(trigger()).not.toHaveAttribute("aria-invalid");
  });
});

describe("Select — 자동 접근성 검사", () => {
  it("닫힌 상태·열린 상태·Field 안 오류 상태에서 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Harness options={GROUPED} />
        <Field label="담당자" error="담당자를 골라 주세요.">
          <Select value={undefined} onValueChange={() => undefined} options={TREATMENTS} />
        </Field>
      </>,
    );
    await expectNoAxeViolations(container);
    screen.getAllByRole("combobox")[0].focus();
    await user.keyboard("{Enter}");
    // 목록은 body 끝의 포털에 그려지므로 목록 요소를 따로 검사한다.
    await expectNoAxeViolations(screen.getByRole("listbox"));
  });
});
