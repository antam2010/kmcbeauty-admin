import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Combobox, type ComboboxOption, type ComboboxProps } from "./combobox";
import { Field } from "./field";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

// acceptance.md AC-UI-001-18~20의 로컬 옵션(이 순서)
const CUSTOMERS: ComboboxOption[] = [
  { value: "c1", label: "김민지" },
  { value: "c2", label: "김민수" },
  { value: "c3", label: "박서연" },
];

type HarnessProps = Partial<Omit<ComboboxProps, "value" | "onValueChange">> & {
  initial?: string | null;
  onValueChange?: (value: string | null) => void;
};

/** 값을 스스로 들고 있는 소비 측 흉내 */
function Harness({ initial = null, onValueChange, ...props }: HarnessProps) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <Combobox
      aria-label="고객"
      options={CUSTOMERS}
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

/** 입력 글자를 소비 측이 제어하는 흉내 */
function ControlledText({ onInputValueChange }: { onInputValueChange: (text: string) => void }) {
  const [text, setText] = useState("김민지");
  return (
    <>
      <Combobox
        aria-label="고객"
        options={CUSTOMERS}
        value="c1"
        onValueChange={() => undefined}
        inputValue={text}
        onInputValueChange={(next) => {
          setText(next);
          onInputValueChange(next);
        }}
      />
      <button type="button">다음</button>
    </>
  );
}

/** 400ms 뒤에 결과가 오는 원격 검색 흉내(가짜 타이머로 진행) */
function DelayedRemote() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComboboxOption[]>([]);
  return (
    <Combobox
      aria-label="고객"
      filtering="remote"
      value={null}
      onValueChange={() => undefined}
      options={results}
      loading={loading}
      inputValue={text}
      onInputValueChange={(next) => {
        setText(next);
        setLoading(true);
        setTimeout(() => {
          setResults([{ value: "c1", label: "김민지" }]);
          setLoading(false);
        }, 400);
      }}
    />
  );
}

const input = () => screen.getByRole("combobox");
const listbox = () => screen.getByRole("listbox");
const option = (name: string) => screen.getByRole("option", { name });
const activeOption = () => {
  const id = input().getAttribute("aria-activedescendant");
  return id ? document.getElementById(id) : null;
};
const popup = () => listbox().closest("[data-combobox-popup]") as HTMLElement;
const liveRegion = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[aria-live="polite"]');

describe("Combobox — 구조와 cmdk 고정 ARIA 대응(AC-UI-001-19)", () => {
  it("role='combobox' 요소는 하나이고, 닫혀 있을 때 aria-expanded는 'false'다", () => {
    const { container } = render(<Harness />);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(1);
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
    expect(input().tagName).toBe("INPUT");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("열린 뒤에도 role='combobox'는 입력 하나뿐이고 aria-expanded가 'true'다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "김");
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(input()).toHaveAttribute("aria-expanded", "true");
  });

  it("IME 조합 중 Enter(isComposing·keyCode 229)로는 고르지 않고, 조합이 끝난 Enter는 하이라이트 항목을 고른다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    await user.type(input(), "김");
    expect(activeOption()).toHaveTextContent("김민지");

    fireEvent.keyDown(input(), { key: "Enter", isComposing: true });
    fireEvent.keyDown(input(), { key: "Enter", keyCode: 229 });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input()).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(input(), { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("c1");
    expect(input()).toHaveValue("김민지");
  });
});

describe("Combobox — 하이라이트·ARIA·키보드(AC-UI-001-18, AC-UI-001-11)", () => {
  it("AC-UI-001-11 키보드만으로 고르고, 닫고, 지운다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    expect(input()).toHaveAttribute("aria-expanded", "false");

    await user.type(input(), "김");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(input()).toHaveAttribute("aria-controls", listbox().id);
    expect(listbox().id).not.toBe("");
    expect(activeOption()).toBe(option("김민지"));

    await user.keyboard("{ArrowDown}");
    expect(activeOption()).toBe(option("김민수"));

    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("c2");
    expect(input()).toHaveValue("김민수");
    expect(input()).toHaveAttribute("aria-expanded", "false");

    await user.clear(input());
    await user.type(input(), "박");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(activeOption()).toBe(option("박서연"));

    onValueChange.mockClear();
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(input()).toHaveValue("");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it("글자가 바뀌면 하이라이트가 첫 옵션으로 되돌아간다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "김");
    await user.keyboard("{ArrowDown}");
    expect(activeOption()).toBe(option("김민수"));
    // "김민"에도 두 옵션이 모두 남지만 하이라이트는 첫 옵션으로 돌아간다
    await user.type(input(), "민");
    expect(activeOption()).toBe(option("김민지"));
  });

  it("↓는 끝에서 처음으로 순환하지 않고, ↑는 처음에서 끝으로 순환하지 않는다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "김");
    await user.keyboard("{ArrowUp}");
    expect(activeOption()).toBe(option("김민지"));
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(activeOption()).toBe(option("김민수"));
  });

  it("닫힌 상태에서 ↓를 누르면 목록이 열린다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    input().focus();
    await user.keyboard("{ArrowDown}");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(activeOption()).toBe(option("김민지"));
  });

  it("옵션이 없을 때 ↓를 눌러도 오류가 없고 aria-activedescendant가 없다(EC-11)", async () => {
    const user = userEvent.setup();
    render(<Harness options={[]} />);
    await user.type(input(), "김");
    await user.keyboard("{ArrowDown}");
    expect(input()).not.toHaveAttribute("aria-activedescendant");
  });

  it("열린 상태의 Home·End는 막지 않아 입력 커서가 움직이고 하이라이트는 그대로다(EC-12)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "김");
    await user.keyboard("{ArrowDown}");
    expect(fireEvent.keyDown(input(), { key: "Home" })).toBe(true);
    expect(activeOption()).toBe(option("김민수"));
    expect(fireEvent.keyDown(input(), { key: "End" })).toBe(true);
    expect(activeOption()).toBe(option("김민수"));
  });

  it("닫힌 상태의 Enter는 막지 않는다(폼 제출을 가로채지 않음)", () => {
    render(<Harness />);
    expect(fireEvent.keyDown(input(), { key: "Enter" })).toBe(true);
  });

  it("옵션을 누르면 그 값을 고르고 목록을 닫는다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    await user.type(input(), "박");
    await user.click(option("박서연"));
    expect(onValueChange).toHaveBeenCalledWith("c3");
    expect(input()).toHaveValue("박서연");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveFocus();
  });

  it("키워드로도 거른다(로컬 부분 일치)", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        options={[
          { value: "c1", label: "김민지", keywords: ["01012345678"] },
          { value: "c3", label: "박서연" },
        ]}
      />,
    );
    await user.type(input(), "5678");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(option("김민지")).toBeInTheDocument();
  });

  it("renderOption으로 옵션 모양을 바꾸고 설명을 보인다", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        options={[{ value: "c1", label: "김민지", description: "010-1234-5678" }]}
        renderOption={(item) => (
          <span>
            {item.label} · {item.description}
          </span>
        )}
      />,
    );
    await user.type(input(), "김");
    expect(screen.getByRole("option")).toHaveTextContent("김민지 · 010-1234-5678");
  });

  it("기본 렌더링은 설명이 있으면 라벨 아래 보인다", async () => {
    const user = userEvent.setup();
    render(<Harness options={[{ value: "c1", label: "김민지", description: "단골 고객" }]} />);
    await user.type(input(), "김");
    expect(screen.getByRole("option")).toHaveTextContent("단골 고객");
  });
});

describe("Combobox — 포커스 이탈과 값 동기화(EC-22, EC-23)", () => {
  it("값이 '김민수'일 때 다른 글자를 입력하다가 Tab으로 벗어나면 입력이 되돌아가고 onValueChange는 불리지 않는다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <>
        <Harness initial="c2" onValueChange={onValueChange} />
        <button type="button">다음</button>
      </>,
    );
    expect(input()).toHaveValue("김민수");
    await user.clear(input());
    await user.type(input(), "박");
    await user.tab();
    expect(screen.getByRole("button", { name: "다음" })).toHaveFocus();
    expect(input()).toHaveValue("김민수");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("바깥을 누르면 닫히고 입력이 선택된 라벨로 되돌아간다", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness initial="c1" />
        <p>바깥</p>
      </>,
    );
    await user.type(input(), "수");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByText("바깥"));
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveValue("김민지");
  });

  it("입력을 누르면 목록이 닫히지 않는다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "김");
    await user.click(input());
    expect(input()).toHaveAttribute("aria-expanded", "true");
  });

  it("닫힌 상태에서 부모가 value를 바꾸면 입력이 새 라벨로 바뀐다", () => {
    const { rerender } = render(
      <Combobox aria-label="고객" options={CUSTOMERS} value="c1" onValueChange={vi.fn()} />,
    );
    expect(input()).toHaveValue("김민지");
    rerender(<Combobox aria-label="고객" options={CUSTOMERS} value="c3" onValueChange={vi.fn()} />);
    expect(input()).toHaveValue("박서연");
    rerender(
      <Combobox aria-label="고객" options={CUSTOMERS} value={null} onValueChange={vi.fn()} />,
    );
    expect(input()).toHaveValue("");
  });

  it("열린 상태(입력 중)에 부모가 value를 바꾸면 덮어쓰지 않고 닫힐 때 맞춘다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Combobox aria-label="고객" options={CUSTOMERS} value="c1" onValueChange={onValueChange} />,
    );
    await user.clear(input());
    await user.type(input(), "박");
    rerender(
      <Combobox aria-label="고객" options={CUSTOMERS} value="c2" onValueChange={onValueChange} />,
    );
    expect(input()).toHaveValue("박");
    await user.keyboard("{Escape}");
    expect(input()).toHaveValue("김민수");
  });

  it("목록에 없는 값은 valueLabel을 보인다", () => {
    render(
      <Combobox
        aria-label="고객"
        options={[]}
        filtering="remote"
        value="c9"
        valueLabel="최지우"
        onValueChange={vi.fn()}
      />,
    );
    expect(input()).toHaveValue("최지우");
  });

  it("inputValue를 제어하면 입력·되돌리기를 onInputValueChange로 알린다", async () => {
    const user = userEvent.setup();
    const onInputValueChange = vi.fn();
    render(<ControlledText onInputValueChange={onInputValueChange} />);
    await user.type(input(), "수");
    expect(onInputValueChange).toHaveBeenLastCalledWith("김민지수");
    expect(input()).toHaveValue("김민지수");
    await user.tab();
    expect(onInputValueChange).toHaveBeenLastCalledWith("김민지");
    expect(input()).toHaveValue("김민지");
  });
});

describe("Combobox — 두 거르기 모드의 알림과 새 값 만들기(AC-UI-001-20)", () => {
  const createAction = (onSelect = vi.fn()) => ({
    label: (text: string) => `‘${text}’ 새 고객 등록`,
    onSelect,
  });

  it("로컬: '박'은 결과 1개를 알리고 목록 끝에 새 값 만들기가 있다", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness createAction={createAction()} />);
    await user.type(input(), "박");
    expect(liveRegion(container)).toHaveTextContent("결과 1개");
    const options = within(listbox()).getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("박서연");
    expect(options[1]).toHaveTextContent("‘박’ 새 고객 등록");
  });

  it("로컬: '최'는 빈 결과 문구를 알리고, 새 값 만들기를 고르면 입력 문자열로 onSelect가 불린다", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onValueChange = vi.fn();
    const { container } = render(
      <Harness createAction={createAction(onSelect)} onValueChange={onValueChange} />,
    );
    await user.type(input(), "최");
    expect(liveRegion(container)).toHaveTextContent("일치하는 항목이 없어요.");
    expect(
      screen.getByText("일치하는 항목이 없어요.", { selector: ":not([aria-live])" }),
    ).toBeVisible();
    expect(activeOption()).toHaveTextContent("‘최’ 새 고객 등록");
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("최");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("로컬: 라벨이 똑같은 옵션이 있으면('김민지') 새 값 만들기가 없다", async () => {
    const user = userEvent.setup();
    render(<Harness createAction={createAction()} />);
    await user.type(input(), "김민지");
    expect(screen.queryByRole("option", { name: /새 고객 등록/ })).not.toBeInTheDocument();
  });

  it("공백뿐인 입력에는 새 값 만들기가 없고, 앞뒤 공백을 지운 값으로 onSelect가 불린다(EC-30)", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness createAction={createAction(onSelect)} />);
    await user.type(input(), "  ");
    expect(screen.queryByRole("option", { name: /새 고객 등록/ })).not.toBeInTheDocument();
    await user.type(input(), "최 ");
    await user.click(screen.getByRole("option", { name: /새 고객 등록/ }));
    expect(onSelect).toHaveBeenCalledWith("최");
  });

  it("원격: 불러오는 중 → 빈 배열 → 맞지 않는 결과 순으로 다시 렌더링한다", async () => {
    const user = userEvent.setup();
    const props = {
      "aria-label": "고객",
      value: null,
      onValueChange: vi.fn(),
      filtering: "remote" as const,
      emptyText: "‘김민’과 일치하는 고객이 없어요.",
      createAction: createAction(),
    };
    const { container, rerender } = render(<Combobox {...props} options={[]} loading />);
    await user.type(input(), "김민");
    expect(within(popup()).getByRole("status")).toHaveTextContent("불러오는 중…");
    expect(liveRegion(container)).not.toHaveTextContent(/결과/);
    expect(liveRegion(container)).toHaveTextContent("");

    rerender(<Combobox {...props} options={[]} loading={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(liveRegion(container)).toHaveTextContent("‘김민’과 일치하는 고객이 없어요.");
    expect(option("‘김민’ 새 고객 등록")).toBeInTheDocument();

    rerender(<Combobox {...props} options={[{ value: "c3", label: "박서연" }]} loading={false} />);
    expect(option("박서연")).toBeInTheDocument();
    expect(liveRegion(container)).toHaveTextContent("결과 1개");
  });

  it("원격: 입력을 onInputValueChange로 알린다(디바운스는 소비 측)", async () => {
    const user = userEvent.setup();
    const onInputValueChange = vi.fn();
    render(<Harness filtering="remote" options={[]} onInputValueChange={onInputValueChange} />);
    await user.type(input(), "김");
    expect(onInputValueChange).toHaveBeenLastCalledWith("김");
  });

  it("닫혀 있으면 알림 영역이 비어 있다", () => {
    const { container } = render(<Harness />);
    expect(liveRegion(container)).toHaveTextContent("");
  });
});

describe("Combobox — Field 연결과 상태(AC-UI-001-16, AC-UI-001-12)", () => {
  it("Field의 id·설명·오류·필수 표시가 입력에 연결된다", () => {
    const { rerender } = render(
      <Field
        label="고객"
        description="이름이나 전화번호로 찾아요."
        error="고객을 골라 주세요."
        required
      >
        <Combobox options={CUSTOMERS} value={null} onValueChange={vi.fn()} />
      </Field>,
    );
    const label = screen.getByText("고객", { selector: "label" });
    expect(label).toHaveAttribute("for", input().id);
    expect(input()).toHaveAccessibleName("고객");
    expect(input().getAttribute("aria-describedby")?.split(" ")).toHaveLength(2);
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(input()).toBeRequired();

    rerender(
      <Field label="고객" description="이름이나 전화번호로 찾아요.">
        <Combobox options={CUSTOMERS} value={null} onValueChange={vi.fn()} />
      </Field>,
    );
    expect(input().getAttribute("aria-describedby")?.split(" ")).toHaveLength(1);
    expect(input()).not.toHaveAttribute("aria-invalid");
    expect(input()).not.toBeRequired();
  });

  it("입력 테두리는 border-input이고 포커스 클래스 세 개를 가진다", () => {
    render(<Harness placeholder="이름으로 찾아요" />);
    expect(input()).toHaveClass("border-input", ...FOCUS_CLASSES);
    expect(input()).not.toHaveClass("border-border");
    expect(input()).toHaveAttribute("placeholder", "이름으로 찾아요");
  });

  it("하이라이트 옵션에만 forced-colors 윤곽선 단서가 붙는다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "김");
    const highlighted = option("김민지");
    const other = option("김민수");
    expect(highlighted).toHaveAttribute("data-selected", "true");
    expect(highlighted).toHaveClass("forced-colors:outline-2");
    expect(other).toHaveAttribute("data-selected", "false");
    expect(other).not.toHaveClass("forced-colors:outline-2");
    await user.keyboard("{ArrowDown}");
    expect(option("김민수")).toHaveClass("forced-colors:outline-2");
    expect(option("김민지")).not.toHaveClass("forced-colors:outline-2");
  });

  it("disabled면 입력이 비활성이고 열리지 않는다", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);
    expect(input()).toBeDisabled();
    await user.type(input(), "김");
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("목록 팝업은 대화상자 역할을 갖지 않고 목록에 한국어 이름이 있다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "김");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(listbox()).toHaveAccessibleName("고객 검색 결과");
  });

  it("팝업 애니메이션은 motion-safe: 아래에만 있다(AC-UI-001-13)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "김");
    const classes = popup()
      .className.split(/\s+/)
      .filter((name) => name.includes("animate"));
    expect(classes.length).toBeGreaterThan(0);
    for (const name of classes) expect(name.startsWith("motion-safe:")).toBe(true);
  });

  it("닫힌 상태와 열린 상태 모두 axe 위반이 없다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Field label="고객" description="이름으로 찾아요.">
        <Combobox
          options={CUSTOMERS}
          value={null}
          onValueChange={vi.fn()}
          createAction={{ label: (text) => `‘${text}’ 새 고객 등록`, onSelect: vi.fn() }}
        />
      </Field>,
    );
    await expectNoAxeViolations(container);
    await user.type(input(), "김");
    await expectNoAxeViolations(container);
    await expectNoAxeViolations(popup());
    await user.clear(input());
    await user.type(input(), "최");
    await expectNoAxeViolations(container);
    await expectNoAxeViolations(popup());
  });

  it("불러오는 중 상태도 axe 위반이 없다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Combobox aria-label="고객" options={[]} value={null} onValueChange={vi.fn()} loading />,
    );
    await user.type(input(), "김");
    await expectNoAxeViolations(container);
    await expectNoAxeViolations(popup());
  });

  it("가짜 타이머 아래에서도 지연 응답을 결정적으로 보인다", () => {
    vi.useFakeTimers();
    try {
      render(<DelayedRemote />);
      fireEvent.change(input(), { target: { value: "김" } });
      expect(screen.getByRole("status")).toHaveTextContent("불러오는 중…");
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(option("김민지")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
