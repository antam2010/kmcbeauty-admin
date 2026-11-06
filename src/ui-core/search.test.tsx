import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Search } from "./search";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

function Harness({
  initial = "",
  onValueChange,
  clearLabel,
}: {
  initial?: string;
  onValueChange?: (value: string) => void;
  clearLabel?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Search
      aria-label="고객 검색"
      placeholder="이름·전화번호"
      value={value}
      clearLabel={clearLabel}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}

const searchbox = () => screen.getByRole("searchbox", { name: "고객 검색" });
const clearButton = () => screen.queryByRole("button", { name: "검색어 지우기" });

describe("Search — 구조와 접근 이름(AC-UI-001-17)", () => {
  it("type='search' 입력이 aria-label로 접근 이름 '고객 검색'을 가진다", () => {
    render(<Harness />);
    expect(searchbox()).toHaveAttribute("type", "search");
    expect(searchbox()).toHaveAttribute("placeholder", "이름·전화번호");
  });

  it("앞 검색 아이콘은 장식으로 숨긴다", () => {
    const { container } = render(<Harness />);
    const icon = container.querySelector("svg.lucide-search");
    expect(icon).not.toBeNull();
    expect(icon?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("테두리는 장식용 border가 아닌 border-input이다", () => {
    render(<Harness />);
    expect(searchbox()).toHaveClass("border-input");
    expect(searchbox()).not.toHaveClass("border-border");
  });
});

describe("Search — 값과 지우기(AC-UI-001-17)", () => {
  it("값이 없으면 지우기 버튼이 없고 값이 있을 때만 '검색어 지우기' 버튼이 보인다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(clearButton()).toBeNull();
    await user.type(searchbox(), "김");
    expect(clearButton()).toBeInTheDocument();
  });

  it("글자를 입력하면 onValueChange로 바로 알린다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    await user.type(searchbox(), "김민");
    expect(onValueChange).toHaveBeenLastCalledWith("김민");
    expect(searchbox()).toHaveValue("김민");
  });

  it("지우기 버튼을 누르면 빈 값을 알리고 포커스가 입력으로 돌아가며 버튼이 사라진다", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="김민지" onValueChange={onValueChange} />);
    await user.click(clearButton() as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith("");
    expect(searchbox()).toHaveValue("");
    expect(searchbox()).toHaveFocus();
    expect(clearButton()).toBeNull();
  });

  it("clearLabel로 지우기 버튼의 이름을 바꾼다", () => {
    render(<Harness initial="젤" clearLabel="시술 검색어 지우기" />);
    expect(screen.getByRole("button", { name: "시술 검색어 지우기" })).toBeInTheDocument();
  });

  it("객체 ref와 함수 ref 모두 입력 요소를 받는다", () => {
    const objectRef = createRef<HTMLInputElement>();
    let callbackNode: HTMLInputElement | null = null;
    render(
      <>
        <Search aria-label="고객 검색" value="" onValueChange={() => undefined} ref={objectRef} />
        <Search
          aria-label="시술 검색"
          value=""
          onValueChange={() => undefined}
          ref={(node) => {
            callbackNode = node;
          }}
        />
      </>,
    );
    expect(objectRef.current).toBe(searchbox());
    expect(callbackNode).toBe(screen.getByRole("searchbox", { name: "시술 검색" }));
  });
});

describe("Search — 키보드·포커스(AC-UI-001-11)", () => {
  it("AC-UI-001-11: 글자를 입력하고 Tab으로 지우기 버튼에 닿아 Enter로 지우면 입력으로 포커스가 돌아온다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(searchbox()).toHaveFocus();
    await user.keyboard("김민지");
    await user.tab();
    expect(clearButton()).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(searchbox()).toHaveValue("");
    expect(searchbox()).toHaveFocus();
  });

  it("AC-UI-001-11: 지우기 버튼에서 Space로도 지울 수 있다", async () => {
    const user = userEvent.setup();
    render(<Harness initial="젤 네일" />);
    await user.tab();
    await user.tab();
    expect(clearButton()).toHaveFocus();
    await user.keyboard(" ");
    expect(searchbox()).toHaveValue("");
    expect(searchbox()).toHaveFocus();
  });

  it("AC-UI-001-11: 입력과 지우기 버튼에 포커스 윤곽선 클래스 세 개가 있고 입력은 focus-visible:border-ring도 있다", () => {
    render(<Harness initial="김" />);
    expect(searchbox()).toHaveClass(...FOCUS_CLASSES, "focus-visible:border-ring");
    expect(clearButton()).toHaveClass(...FOCUS_CLASSES);
  });

  it("AC-UI-001-11: 빈 값과 값이 있는 상태에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <>
        <Search aria-label="빈 검색" value="" onValueChange={() => undefined} />
        <Search aria-label="채운 검색" value="김민지" onValueChange={() => undefined} />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
