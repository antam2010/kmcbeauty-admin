import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/ui-core";
import { expectNoAxeViolations } from "../test/axe";
import { PreviewPage } from "./PreviewPage";
import { SHOWCASE } from "./showcase";

// acceptance.md AC-UI-001-14 전시 목록 표(29개 컴포넌트)를 그대로 옮겼다.
const SHOWCASE_TABLE: [component: string, states: string[]][] = [
  [
    "Button",
    [
      "default",
      "outline",
      "ghost",
      "destructive",
      "link",
      "sm",
      "lg",
      "icon",
      "icon-sm",
      "loading",
      "disabled",
      "as-child",
    ],
  ],
  ["Badge", ["neutral", "info", "success", "warning", "destructive", "icon", "dot"]],
  ["Loading", ["sm", "md"]],
  ["Skeleton", ["block", "text", "group"]],
  ["EmptyState", ["with-action"]],
  ["Alert", ["info", "success", "warning", "destructive", "live"]],
  ["Card", ["parts"]],
  ["Field", ["description", "error", "required"]],
  [
    "Input",
    ["sm", "default", "lg", "start-adornment", "end-adornment", "invalid", "read-only", "disabled"],
  ],
  ["Textarea", ["default", "invalid", "disabled"]],
  ["Checkbox", ["unchecked", "checked", "indeterminate", "disabled", "invalid"]],
  ["Search", ["empty", "filled"]],
  ["Select", ["default", "grouped", "invalid", "disabled"]],
  ["Filter", ["default", "count"]],
  ["Combobox", ["local", "remote", "create"]],
  ["Calendar", ["default", "disabled-dates"]],
  ["DateTimePicker", ["datetime", "date", "invalid"]],
  ["Modal", ["sm", "md", "lg", "dirty", "submitting"]],
  ["ConfirmDialog", ["default", "destructive", "async-failure"]],
  ["Toast", ["success", "info", "warning", "destructive", "queue", "action"]],
  ["Tooltip", ["default"]],
  ["Table", ["default", "sorted", "rail", "loading", "empty"]],
  ["Tabs", ["default", "disabled"]],
  ["Pagination", ["first", "middle", "last"]],
  ["Sidebar", ["expanded", "collapsed"]],
  ["Breadcrumb", ["default"]],
  ["PageHeader", ["page-title", "sub-nav"]],
  ["ThemeProvider", ["root"]],
  ["ThemeToggle", ["default"]],
];

// 섹션 제목 9개(AC-UI-001-14). 마일스톤마다 만든 섹션이 늘어난다.
const SECTION_TITLES = [
  "토큰",
  "동작",
  "피드백",
  "폼",
  "고급 입력",
  "오버레이",
  "데이터",
  "탐색",
  "검증",
];

// 지금까지 만든 것(M1 + M2) — 이후 마일스톤에서 늘린다(AC-UI-001-14: M1~M5는 그때까지 만든 컴포넌트 기준)
const DELIVERED_COMPONENTS = [
  "Button",
  "Field",
  "Input",
  "Textarea",
  "Checkbox",
  "Search",
  "ThemeProvider",
  "ThemeToggle",
];
const DELIVERED_SECTIONS = ["토큰", "동작", "폼"];

// system.md §9의 임시 표시 순서
const STATUS_ORDER = ["reserved", "visited", "completed", "cancelled", "no-show"];
const STATUS_LABELS = ["예약됨", "방문함", "완료", "취소됨", "노쇼"];

function mockSystemTheme(dark: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: dark,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      }) as unknown as MediaQueryList,
  );
}

function renderPreview() {
  return render(
    <ThemeProvider>
      <PreviewPage />
    </ThemeProvider>,
  );
}

function expectedShowcase() {
  return SHOWCASE_TABLE.filter(([component]) => DELIVERED_COMPONENTS.includes(component)).map(
    ([component, states]) => ({ component, states }),
  );
}

function missingShowcaseElements(container: HTMLElement): string[] {
  return SHOWCASE.flatMap(({ component, states }) =>
    states
      .map((state) => `${component}:${state}`)
      .filter((key) => container.querySelector(`[data-showcase="${key}"]`) === null),
  );
}

/** 마침표·물음표로 끝나는 조각 가운데 마지막 글자가 한글인 문장이 해요체(요. / 요?)로 끝나지 않으면 돌려준다. */
function nonHaeyoSentences(text: string): string[] {
  const sentences = text.match(/[^.?]+[.?]/g) ?? [];
  return sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => /[가-힣][.?]$/.test(sentence) && !/요[.?]$/.test(sentence));
}

describe("미리보기 페이지(AC-UI-001-14, M1 범위)", () => {
  it("전시 목록 표는 29개 컴포넌트이고 showcase.ts는 지금까지 만든 컴포넌트의 행과 같다", () => {
    expect(SHOWCASE_TABLE).toHaveLength(29);
    expect(SHOWCASE).toEqual(expectedShowcase());
  });

  it("h1은 페이지 제목 하나이고 '본문으로 건너뛰기' 링크가 main을 가리킨다", () => {
    mockSystemTheme(false);
    renderPreview();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("컴포넌트 미리보기");
    const skipLink = screen.getByRole("link", { name: "본문으로 건너뛰기" });
    expect(skipLink).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("섹션 제목(h2)은 지금까지 만든 섹션과 같고 정해진 9개 안에 있다", () => {
    mockSystemTheme(false);
    renderPreview();
    const titles = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(DELIVERED_SECTIONS);
    for (const title of titles) {
      expect(SECTION_TITLES).toContain(title);
    }
  });

  it("전시 목록의 모든 항목이 라이트와 다크에서 렌더링되고 axe 위반이 0건이다", async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    const { container } = renderPreview();
    expect(document.documentElement).not.toHaveClass("dark");
    expect(missingShowcaseElements(container)).toEqual([]);
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("radio", { name: "다크" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(missingShowcaseElements(container)).toEqual([]);
    await expectNoAxeViolations(container);
  });

  it("토큰 섹션은 라이트·다크 판에 색 36개와 예약 상태 15개를 나란히 보인다", () => {
    mockSystemTheme(false);
    const { container } = renderPreview();
    for (const theme of ["light", "dark"]) {
      const panel = container.querySelector<HTMLElement>(`[data-theme-panel="${theme}"]`);
      expect(panel).not.toBeNull();
      expect(panel).toHaveClass(theme);
      const scope = within(panel as HTMLElement);
      expect(panel?.querySelectorAll("[data-color-token]")).toHaveLength(36);
      expect(panel?.querySelectorAll("[data-status-swatch]")).toHaveLength(15);
      expect(scope.getAllByText("예약됨").length).toBeGreaterThan(0);
    }
  });

  it("예약 상태 토큰은 예약됨 → 방문함 → 완료 → 취소됨 → 노쇼 순으로 시연한다", () => {
    mockSystemTheme(false);
    const { container } = renderPreview();
    const panel = container.querySelector<HTMLElement>('[data-theme-panel="light"]') as HTMLElement;
    const rows = [...panel.querySelectorAll<HTMLElement>("[data-status-token]")];
    expect(rows.map((row) => row.dataset.statusToken)).toEqual(STATUS_ORDER);
    expect(rows.map((row) => row.querySelector("[data-status-label]")?.textContent)).toEqual(
      STATUS_LABELS,
    );
  });

  it("렌더링된 문장 가운데 한글로 끝나는 문장은 모두 해요체(요. / 요?)로 끝난다", () => {
    mockSystemTheme(false);
    renderPreview();
    const text = document.body.textContent ?? "";
    expect(text.length).toBeGreaterThan(0);
    expect(nonHaeyoSentences(text)).toEqual([]);
  });

  it("해요체 검사는 합니다체·해라체 문장을 잡아낸다(자기 검사)", () => {
    expect(
      nonHaeyoSentences("저장했어요. 저장했습니다. 저장한다. 닫을까요? 2026. 10. 29."),
    ).toEqual(["저장했습니다.", "저장한다."]);
  });
});
