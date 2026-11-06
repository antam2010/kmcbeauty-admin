import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { getPageItems, Pagination } from "./pagination";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];
// 색이 아닌 선택 단서(acceptance.md AC-UI-001-12)
const NON_COLOR_CUE =
  /(^|\s)(forced-colors:)?(font-semibold|font-bold|underline|border-\d|outline-\d)(\s|$)/;

// acceptance.md §3.1 EC-04·EC-05 기대값 표(정본). "…"는 줄임표다.
const PAGE_TABLE: [pageCount: number, page: number, expected: string][] = [
  [0, 1, ""],
  [1, 1, "1"],
  [6, 3, "1 2 3 4 5 6"],
  [7, 4, "1 2 3 4 5 6 7"],
  [8, 4, "1 2 3 4 5 … 8"],
  [8, 5, "1 … 4 5 6 7 8"],
  [20, 1, "1 2 3 4 5 … 20"],
  [20, 4, "1 2 3 4 5 … 20"],
  [20, 5, "1 … 4 5 6 … 20"],
  [20, 16, "1 … 15 16 17 … 20"],
  [20, 17, "1 … 16 17 18 19 20"],
  [20, 20, "1 … 16 17 18 19 20"],
];

const asText = (items: ReturnType<typeof getPageItems>) =>
  items.map((item) => (typeof item === "number" ? String(item) : "…")).join(" ");

/** 화면에 렌더링된 번호 배열(이전·다음 제외)을 표와 같은 문자열로 읽는다. */
function renderedItems(): string {
  const list = screen.getByRole("list");
  return within(list)
    .queryAllByRole("listitem")
    .map((item) => item.textContent)
    .join(" ");
}

function Harness({ initial, pageCount }: { initial: number; pageCount: number }) {
  const [page, setPage] = useState(initial);
  return (
    <>
      <button type="button">앞 요소</button>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </>
  );
}

describe("getPageItems — 번호 배열(EC-04·EC-05)", () => {
  it.each(PAGE_TABLE)("pageCount %i, page %i → '%s'", (pageCount, page, expected) => {
    expect(asText(getPageItems(page, pageCount))).toBe(expected);
  });

  it("8쪽 이상이면 줄임표를 포함해 언제나 7칸이다", () => {
    for (let page = 1; page <= 20; page += 1) {
      expect(getPageItems(page, 20)).toHaveLength(7);
    }
  });
});

describe("Pagination — 렌더링(AC-UI-001-24)", () => {
  it.each(PAGE_TABLE)(
    "pageCount %i, page %i의 화면 번호 배열이 표와 같다",
    (pageCount, page, expected) => {
      render(<Pagination page={page} pageCount={pageCount} onPageChange={() => undefined} />);
      expect(renderedItems()).toBe(expected);
    },
  );

  it("nav 이름은 기본 '페이지 이동'이고 바꿀 수 있다", () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={5} onPageChange={() => undefined} />,
    );
    expect(screen.getByRole("navigation", { name: "페이지 이동" })).toBeInTheDocument();
    rerender(
      <Pagination
        page={1}
        pageCount={5}
        onPageChange={() => undefined}
        aria-label="예약 쪽 이동"
      />,
    );
    expect(screen.getByRole("navigation", { name: "예약 쪽 이동" })).toBeInTheDocument();
  });

  it("현재 쪽에만 aria-current='page'와 색이 아닌 단서가 있다", () => {
    render(<Pagination page={5} pageCount={20} onPageChange={() => undefined} />);
    const current = screen.getByRole("button", { name: "5" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.className).toMatch(NON_COLOR_CUE);
    expect(current).toHaveClass("bg-primary-subtle");
    for (const name of ["1", "4", "6", "20"]) {
      const other = screen.getByRole("button", { name });
      expect(other).not.toHaveAttribute("aria-current");
      expect(other.className).not.toMatch(NON_COLOR_CUE);
    }
  });

  it("줄임표는 누를 수 없고 보조 기술에서 숨긴다", () => {
    render(<Pagination page={5} pageCount={20} onPageChange={() => undefined} />);
    const ellipses = screen.getAllByRole("listitem").filter((item) => item.textContent === "…");
    expect(ellipses).toHaveLength(2);
    for (const item of ellipses) {
      expect(within(item).queryByRole("button")).toBeNull();
      expect(item.firstElementChild).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("첫 쪽에서는 '이전'이, 끝 쪽에서는 '다음'이 비활성이다", () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={20} onPageChange={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
    rerender(<Pagination page={20} pageCount={20} onPageChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "이전" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });

  it("pageCount가 0이면 번호가 없고, 0·1이면 이전·다음 모두 비활성이다(EC-04)", () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={0} onPageChange={() => undefined} />,
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
    rerender(<Pagination page={1} pageCount={1} onPageChange={() => undefined} />);
    expect(renderedItems()).toBe("1");
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });
});

describe("Pagination — 쪽 바꾸기와 키보드(AC-UI-001-24, AC-UI-001-11)", () => {
  it("번호·이전·다음을 누르면 그 쪽으로 onPageChange를 부르고, 현재 쪽을 누르면 부르지 않는다", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={5} pageCount={20} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "6" }));
    expect(onPageChange).toHaveBeenLastCalledWith(6);
    await user.click(screen.getByRole("button", { name: "이전" }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(onPageChange).toHaveBeenLastCalledWith(6);
    onPageChange.mockClear();
    await user.click(screen.getByRole("button", { name: "5" }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("AC-UI-001-11: Tab으로 이전·번호 버튼에 닿고 Enter·Space로 쪽을 바꾼다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={5} pageCount={20} />);
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "이전" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "4" })).toHaveAttribute("aria-current", "page");
    await user.tab();
    expect(screen.getByRole("button", { name: "1" })).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
  });

  it("AC-UI-001-11: 이전·다음·번호 버튼은 모두 포커스 윤곽선 클래스 세 개를 가진다", () => {
    render(<Pagination page={5} pageCount={20} onPageChange={() => undefined} />);
    const buttons = within(screen.getByRole("navigation")).getAllByRole("button");
    expect(buttons).toHaveLength(7);
    for (const button of buttons) expect(button).toHaveClass(...FOCUS_CLASSES);
  });

  it("AC-UI-001-11: 첫 쪽·가운데·끝 쪽에서 axe 위반이 0건이다", async () => {
    const { container, rerender } = render(
      <Pagination page={1} pageCount={20} onPageChange={() => undefined} />,
    );
    await expectNoAxeViolations(container);
    rerender(<Pagination page={5} pageCount={20} onPageChange={() => undefined} />);
    await expectNoAxeViolations(container);
    rerender(<Pagination page={20} pageCount={20} onPageChange={() => undefined} />);
    await expectNoAxeViolations(container);
  });
});
