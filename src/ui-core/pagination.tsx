import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { SELECTED_ITEM } from "./internal/class-names";

export type PageItem = number | "start-ellipsis" | "end-ellipsis";

// 현재 쪽 양옆은 한 쪽으로 고정한다(siblingCount prop 없음). 8쪽 이상이면 줄임표를 포함해 언제나 7칸이다.
const FULL_LIST_LIMIT = 7;
const EDGE_RUN = 5;

/**
 * 쪽 번호 배열(design.md §8.3, 정본은 acceptance.md §3.1 표). 공개 API가 아니다.
 * - 7쪽 이하: 모든 번호
 * - 현재 쪽 p ≤ 4: 1 2 3 4 5 … 끝
 * - p ≥ 끝−3: 1 … 끝−4 끝−3 끝−2 끝−1 끝
 * - 그 사이: 1 … p−1 p p+1 … 끝
 */
export function getPageItems(page: number, pageCount: number): PageItem[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index);

  if (pageCount <= FULL_LIST_LIMIT) return range(1, pageCount);
  if (page <= EDGE_RUN - 1) return [...range(1, EDGE_RUN), "end-ellipsis", pageCount];
  if (page >= pageCount - 3) {
    return [1, "start-ellipsis", ...range(pageCount - EDGE_RUN + 1, pageCount)];
  }
  return [1, "start-ellipsis", page - 1, page, page + 1, "end-ellipsis", pageCount];
}

export interface PaginationProps extends Omit<ComponentProps<"nav">, "onChange"> {
  page: number;
  pageCount: number;
  onPageChange(page: number): void;
  /** 기본 "페이지 이동" */
  "aria-label"?: string;
  /** 기본 "이전" */
  previousLabel?: string;
  /** 기본 "다음" */
  nextLabel?: string;
}

/** 목록 바닥의 쪽 이동(design-direction.md §12.6). 전체 개수("총 128명")는 소비 측이 따로 둔다. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  "aria-label": ariaLabel = "페이지 이동",
  previousLabel = "이전",
  nextLabel = "다음",
  className,
  ...props
}: PaginationProps) {
  const goTo = (next: number) => {
    if (next !== page && next >= 1 && next <= pageCount) onPageChange(next);
  };

  return (
    <nav {...props} aria-label={ariaLabel} className={cn("flex items-center gap-1", className)}>
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => goTo(page - 1)}>
        <ChevronLeft />
        {previousLabel}
      </Button>
      <ul className="flex items-center gap-1">
        {getPageItems(page, pageCount).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                variant="ghost"
                size="sm"
                aria-current={item === page ? "page" : undefined}
                onClick={() => goTo(item)}
                className={cn(
                  "min-w-8 px-2 tabular-nums",
                  // 현재 쪽: primary-subtle 면 + 강제 색 모드에서도 남는 단서(font-semibold + 테두리, REQ-UI-001-025)
                  item === page && SELECTED_ITEM,
                )}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item}>
              <span
                aria-hidden="true"
                className="inline-flex size-8 items-center justify-center text-muted-foreground"
              >
                …
              </span>
            </li>
          ),
        )}
      </ul>
      <Button variant="ghost" size="sm" disabled={page >= pageCount} onClick={() => goTo(page + 1)}>
        {nextLabel}
        <ChevronRight />
      </Button>
    </nav>
  );
}
