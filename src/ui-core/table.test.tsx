import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { type Column, type SortState, Table } from "./table";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

interface Customer {
  id: number;
  name: string;
  phone: string;
  visits: number;
  /** 레일 시연용 색 값. ui-core는 색 값만 받는다(plan.md §A.7) */
  rail?: string;
}

const CUSTOMERS: Customer[] = [
  { id: 1, name: "김민지", phone: "010-1234-5678", visits: 12, rail: "var(--primary)" },
  { id: 2, name: "박서연", phone: "010-2345-6789", visits: 3 },
  { id: 3, name: "이수민", phone: "010-3456-7890", visits: 27 },
];

const COLUMNS: Column<Customer>[] = [
  { id: "name", header: "이름", cell: (row) => row.name, sortable: true, width: "10rem" },
  { id: "phone", header: "전화", cell: (row) => row.phone },
  {
    id: "visits",
    header: "방문 횟수",
    cell: (row) => `${row.visits}회`,
    align: "end",
    sortable: true,
  },
];

function SortHarness({ onSortChange }: { onSortChange?: (next: SortState) => void }) {
  const [sort, setSort] = useState<SortState>(null);
  return (
    <>
      <button type="button">앞 요소</button>
      <Table
        caption="고객 목록"
        rows={CUSTOMERS}
        columns={COLUMNS}
        getRowKey={(row) => row.id}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          onSortChange?.(next);
        }}
      />
    </>
  );
}

const sortButton = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`) });
const header = (name: string) => screen.getByRole("columnheader", { name: new RegExp(`^${name}`) });

afterEach(() => {
  vi.useRealTimers();
});

describe("Table — 구조(AC-UI-001-24)", () => {
  it("숨긴 caption이 표 이름이 되고 머리글은 scope='col'인 th다", () => {
    render(
      <Table caption="고객 목록" rows={CUSTOMERS} columns={COLUMNS} getRowKey={(r) => r.id} />,
    );
    const table = screen.getByRole("table", { name: "고객 목록" });
    expect(table.querySelector("caption")).toHaveClass("sr-only");
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((th) => th.textContent)).toEqual(["이름", "전화", "방문 횟수"]);
    for (const th of headers) expect(th).toHaveAttribute("scope", "col");
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    expect(within(table).getByRole("cell", { name: "010-2345-6789" })).toBeInTheDocument();
  });

  it("가로 스크롤 영역은 tabIndex=0과 표 이름과 같은 접근 이름을 가진다", () => {
    render(
      <Table caption="고객 목록" rows={CUSTOMERS} columns={COLUMNS} getRowKey={(r) => r.id} />,
    );
    const region = screen.getByRole("region", { name: "고객 목록" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveClass("overflow-x-auto");
  });

  it("width가 있는 열은 머리글에 그 폭을 준다", () => {
    render(
      <Table caption="고객 목록" rows={CUSTOMERS} columns={COLUMNS} getRowKey={(r) => r.id} />,
    );
    expect(header("이름")).toHaveStyle({ width: "10rem" });
  });

  it("align: 'end' 열은 머리글과 칸 모두 오른쪽 정렬과 tabular-nums를 가진다", () => {
    render(
      <Table caption="고객 목록" rows={CUSTOMERS} columns={COLUMNS} getRowKey={(r) => r.id} />,
    );
    expect(header("방문 횟수")).toHaveClass("text-end");
    const cell = screen.getByRole("cell", { name: "27회" });
    expect(cell).toHaveClass("text-end", "tabular-nums");
    expect(screen.getByRole("cell", { name: "010-2345-6789" })).not.toHaveClass("tabular-nums");
  });

  it("inPanel이면 첫 칸과 마지막 칸의 바깥 여백이 24px(ps-6·pe-6)이다", () => {
    render(
      <Table
        caption="고객 목록"
        rows={CUSTOMERS}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        inPanel
      />,
    );
    const cells = within(screen.getAllByRole("row")[1]).getAllByRole("cell");
    expect(cells[0]).toHaveClass("ps-6");
    expect(cells[2]).toHaveClass("pe-6");
    expect(cells[1]).not.toHaveClass("ps-6");
    expect(header("이름")).toHaveClass("ps-6");
  });
});

describe("Table — 제어형 정렬(AC-UI-001-24)", () => {
  it("정렬 머리글 버튼을 세 번 누르면 오름 → 내림 → 해제 순으로 알리고 aria-sort가 따라 바뀐다", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortHarness onSortChange={onSortChange} />);
    expect(header("이름")).toHaveAttribute("aria-sort", "none");

    await user.click(sortButton("이름"));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: "name", direction: "asc" });
    expect(header("이름")).toHaveAttribute("aria-sort", "ascending");

    await user.click(sortButton("이름"));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: "name", direction: "desc" });
    expect(header("이름")).toHaveAttribute("aria-sort", "descending");

    await user.click(sortButton("이름"));
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(header("이름")).toHaveAttribute("aria-sort", "none");
    expect(onSortChange).toHaveBeenCalledTimes(3);
  });

  it("다른 열을 누르면 그 열의 오름차순으로 시작하고 앞 열은 aria-sort='none'이 된다", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortHarness onSortChange={onSortChange} />);
    await user.click(sortButton("이름"));
    await user.click(sortButton("방문 횟수"));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: "visits", direction: "asc" });
    expect(header("방문 횟수")).toHaveAttribute("aria-sort", "ascending");
    expect(header("이름")).toHaveAttribute("aria-sort", "none");
  });

  it("정렬할 수 없는 열은 버튼과 aria-sort가 없다", () => {
    render(<SortHarness />);
    expect(header("전화")).not.toHaveAttribute("aria-sort");
    expect(within(header("전화")).queryByRole("button")).toBeNull();
  });

  it("정렬은 제어형이라 행 순서를 스스로 바꾸지 않는다", async () => {
    const user = userEvent.setup();
    render(<SortHarness />);
    await user.click(sortButton("방문 횟수"));
    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0].textContent);
    expect(names).toEqual(["김민지", "박서연", "이수민"]);
  });

  it("AC-UI-001-11: Tab으로 스크롤 영역과 정렬 머리글 버튼에 차례로 닿고 Enter·Space로 정렬이 바뀐다", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortHarness onSortChange={onSortChange} />);
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(screen.getByRole("region", { name: "고객 목록" })).toHaveFocus();
    await user.tab();
    expect(sortButton("이름")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: "name", direction: "asc" });
    await user.keyboard(" ");
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: "name", direction: "desc" });
    await user.tab();
    expect(sortButton("방문 횟수")).toHaveFocus();
  });

  it("AC-UI-001-11: 스크롤 영역과 정렬 머리글 버튼은 포커스 윤곽선 클래스 세 개를 가진다", () => {
    render(<SortHarness />);
    expect(screen.getByRole("region", { name: "고객 목록" })).toHaveClass(...FOCUS_CLASSES);
    expect(sortButton("이름")).toHaveClass(...FOCUS_CLASSES);
    expect(sortButton("방문 횟수")).toHaveClass(...FOCUS_CLASSES);
  });

  it("AC-UI-001-11: 정렬 전후 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container } = render(<SortHarness />);
    await expectNoAxeViolations(container);
    await user.click(sortButton("이름"));
    await expectNoAxeViolations(container);
  });
});

describe("Table — 레일(AC-UI-001-24)", () => {
  it("getRowRail이 돌려준 색 값을 첫 칸의 border-inline-start 3px로 그린다", () => {
    render(
      <Table
        caption="고객 목록"
        rows={CUSTOMERS}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        getRowRail={(row) => row.rail}
      />,
    );
    const [, first, second] = screen.getAllByRole("row");
    const [firstCell, middleCell] = within(first).getAllByRole("cell");
    expect(firstCell.style.borderInlineStart).toBe("3px solid var(--primary)");
    expect(middleCell.style.borderInlineStart).toBe("");
    expect(within(second).getAllByRole("cell")[0].style.borderInlineStart).toBe("");
  });

  it("getRowRail이 없으면 어느 칸에도 레일이 없다", () => {
    render(
      <Table caption="고객 목록" rows={CUSTOMERS} columns={COLUMNS} getRowKey={(r) => r.id} />,
    );
    for (const cell of screen.getAllByRole("cell")) {
      expect(cell.style.borderInlineStart).toBe("");
    }
  });
});

describe("Table — 로딩과 빈 상태(AC-UI-001-24, EC-10)", () => {
  it("loading이면 300ms 전에는 스켈레톤이 없고, 그 뒤 같은 열 구조의 6행이 aria-busy 영역에 보인다", () => {
    vi.useFakeTimers();
    const { container } = render(
      <Table
        caption="고객 목록"
        rows={CUSTOMERS}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        loading
      />,
    );
    // 로딩 중에는 행을 그리지 않고, 지연 전에는 스켈레톤도 없다.
    expect(screen.queryByRole("cell", { name: "김민지" })).toBeNull();
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    const busy = container.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(busy).not.toBeNull();
    expect(busy).toHaveTextContent("불러오는 중…");
    const skeletonRows = busy.querySelectorAll("tr");
    expect(skeletonRows).toHaveLength(6);
    for (const row of skeletonRows) {
      expect(row.querySelectorAll("td")).toHaveLength(COLUMNS.length);
    }
    // 머리글은 그대로 남아 같은 열 구조를 보인다.
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });

  it("300ms 안에 로딩이 끝나면 스켈레톤이 한 번도 보이지 않는다", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Table
        caption="고객 목록"
        rows={CUSTOMERS}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        loading
      />,
    );
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender(
      <Table caption="고객 목록" rows={CUSTOMERS} columns={COLUMNS} getRowKey={(r) => r.id} />,
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(screen.getByRole("cell", { name: "김민지" })).toBeInTheDocument();
  });

  it("행이 없으면 empty 자리를 열 전체를 덮는 한 칸에 렌더링한다", () => {
    render(
      <Table
        caption="고객 목록"
        rows={[]}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        empty={<p>조건에 맞는 고객이 없어요.</p>}
      />,
    );
    const cell = screen.getByRole("cell", { name: "조건에 맞는 고객이 없어요." });
    expect(cell).toHaveAttribute("colspan", "3");
  });

  it("로딩(지연 뒤)과 빈 상태에서 axe 위반이 0건이다", async () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Table caption="고객 목록" rows={[]} columns={COLUMNS} getRowKey={(r) => r.id} loading />,
    );
    act(() => {
      vi.advanceTimersByTime(300);
    });
    vi.useRealTimers();
    await expectNoAxeViolations(container);
    rerender(
      <Table
        caption="고객 목록"
        rows={[]}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        empty={<p>조건에 맞는 고객이 없어요.</p>}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
