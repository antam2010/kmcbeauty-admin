import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";
import { Skeleton, SkeletonGroup } from "./skeleton";

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell(row: T): ReactNode;
  /** 금액·수량·시간은 "end"(오른쪽 정렬 + tabular-nums) */
  align?: "start" | "end" | "center";
  /** CSS 폭 값(예: "10rem") */
  width?: string;
  sortable?: boolean;
}

export type SortState = { columnId: string; direction: "asc" | "desc" } | null;

export interface TableProps<T> extends Omit<ComponentProps<"section">, "children"> {
  rows: T[];
  columns: Column<T>[];
  getRowKey(row: T): string | number;
  /** 화면에서 숨긴 표 이름. 스크롤 영역의 접근 이름으로도 쓴다 */
  caption: string;
  sort?: SortState;
  /** 오름 → 내림 → 해제 순으로 다음 정렬 상태를 알린다 */
  onSortChange?(next: SortState): void;
  /** CSS 색 값(예: 상태 토큰 변수). 첫 칸의 border-inline-start 3px로 그린다 */
  getRowRail?(row: T): string | undefined;
  loading?: boolean;
  /** 행이 없을 때 표 안에 보일 자리(EmptyState 등) */
  empty?: ReactNode;
  /** 패널 안 표: 첫·마지막 칸 바깥 여백 24px */
  inPanel?: boolean;
}

const SKELETON_ROWS = 6;

const ALIGN_CLASSES = {
  start: "text-start",
  end: "text-end tabular-nums",
  center: "text-center",
} as const;

const FOCUS_CLASSES =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function nextSort(current: SortState | undefined, columnId: string): SortState {
  if (current?.columnId !== columnId) return { columnId, direction: "asc" };
  return current.direction === "asc" ? { columnId, direction: "desc" } : null;
}

function ariaSort(current: SortState | undefined, columnId: string) {
  if (current?.columnId !== columnId) return "none";
  return current.direction === "asc" ? "ascending" : "descending";
}

// @MX:NOTE: [AUTO] 레일은 색 값만 받는다 — 예약 상태와 색의 연결은 도메인 계층(SPEC-UI-002)의 몫이다(plan.md §A.7, B-16). 정렬은 제어형이라 행 순서를 바꾸지 않고 다음 상태만 알리므로 서버 정렬 파라미터(sort_by·sort_order)에 그대로 연결된다(plan.md §E.5).
/**
 * 목록 표(design.md §8.1). 네이티브 table 위에 Column<T>로 열을 정의하고,
 * 가로 스크롤 영역은 키보드로 스크롤할 수 있게 포커스를 받는다.
 */
export function Table<T>({
  rows,
  columns,
  getRowKey,
  caption,
  sort,
  onSortChange,
  getRowRail,
  loading = false,
  empty,
  inPanel = false,
  className,
  ...props
}: TableProps<T>) {
  const lastIndex = columns.length - 1;
  const edgeClasses = (index: number) =>
    cn(inPanel && index === 0 && "ps-6", inPanel && index === lastIndex && "pe-6");
  const cellClasses = (column: Column<T>, index: number) =>
    cn("px-3", ALIGN_CLASSES[column.align ?? "start"], edgeClasses(index));

  return (
    // 이름이 있는 section은 region 역할이다. 가로로 넘치는 표를 키보드로 스크롤할 수 있도록 포커스를 받는다(design.md §8.1).
    <section
      {...props}
      aria-label={caption}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 스크롤 영역은 키보드 방향키 스크롤을 위해 포커스를 받아야 한다(WCAG 2.1.1, axe scrollable-region-focusable).
      tabIndex={0}
      className={cn("overflow-x-auto", FOCUS_CLASSES, className)}
    >
      <table className="w-full border-collapse text-body">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((column, index) => (
              <th
                key={column.id}
                scope="col"
                aria-sort={column.sortable ? ariaSort(sort, column.id) : undefined}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  "h-10 whitespace-nowrap text-caption font-medium text-muted-foreground",
                  cellClasses(column, index),
                )}
              >
                {column.sortable ? (
                  <SortButton
                    direction={sort?.columnId === column.id ? sort.direction : undefined}
                    onClick={() => onSortChange?.(nextSort(sort, column.id))}
                  >
                    {column.header}
                  </SortButton>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <SkeletonGroup>
                  {/* 같은 열 구조의 자리표시 6행. 장식이라 표 구조로 읽히지 않게 한다 */}
                  <table role="presentation" className="w-full border-collapse">
                    <tbody>
                      {Array.from({ length: SKELETON_ROWS }, (_, row) => (
                        // 순서가 바뀌지 않는 고정 자리표시라 번호를 키로 쓴다.
                        // biome-ignore lint/suspicious/noArrayIndexKey: 고정 길이 자리표시
                        <tr key={row} className="h-12 border-b border-border last:border-b-0">
                          {columns.map((column, index) => (
                            <td
                              key={column.id}
                              style={column.width ? { width: column.width } : undefined}
                              className={cellClasses(column, index)}
                            >
                              <Skeleton variant="text" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SkeletonGroup>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((row) => {
              const rail = getRowRail?.(row);
              return (
                <tr key={getRowKey(row)} className="h-12 border-b border-border last:border-b-0">
                  {columns.map((column, index) => (
                    <td
                      key={column.id}
                      style={
                        index === 0 && rail ? { borderInlineStart: `3px solid ${rail}` } : undefined
                      }
                      className={cn(cellClasses(column, index), index === 0 && "font-medium")}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}

function SortButton({
  direction,
  onClick,
  children,
}: {
  direction: "asc" | "desc" | undefined;
  onClick(): void;
  children: ReactNode;
}) {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-chip font-medium transition-colors hover:text-foreground",
        FOCUS_CLASSES,
        direction && "text-foreground",
      )}
    >
      {children}
      <Icon className="size-3.5 shrink-0" />
    </button>
  );
}
