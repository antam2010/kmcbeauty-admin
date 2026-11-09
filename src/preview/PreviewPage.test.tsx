import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/ui-core";
import { expectNoAxeViolations } from "../test/axe";
import { PreviewPage } from "./PreviewPage";
import {
  classifyTnum,
  THEME_RESET_DEMO_CLASSES,
  type TnumWidths,
  VerificationSection,
} from "./sections/VerificationSection";
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

// 섹션 제목 9개와 순서(AC-UI-001-14, design.md §9). M6에서 '검증'까지 모두 갖췄다.
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

// acceptance.md §3.2(EC-28) tnum 판정 표. 너비는 px이고 비교는 0.5px 허용 오차, 0 검사가 먼저다.
const W = (plain1111: number, plain0000: number, tabular1111: number, tabular0000: number) => ({
  plain1111,
  plain0000,
  tabular1111,
  tabular0000,
});
const TNUM_TABLE: [label: string, widths: TnumWidths, verdict: string][] = [
  ["네 너비가 모두 0", W(0, 0, 0, 0), "측정 불가"],
  ["기본 숫자 하나만 0", W(0, 64, 64, 64), "측정 불가"],
  ["tabular-nums 하나만 0(다른 칸은 미지원 모양)", W(40, 64, 64, 0), "측정 불가"],
  ["기본 ≠, tabular =", W(40, 64, 64, 64), "지원"],
  ["기본 =, tabular =", W(64, 64, 64, 64), "기본 고정폭"],
  ["기본 ≠, tabular ≠", W(40, 64, 40, 64), "미지원"],
  ["기본 =, tabular ≠", W(64, 64, 40, 64), "미지원"],
  ["허용 오차 경계: 0.5px 차이는 같다고 본다", W(40, 64, 64, 64.5), "지원"],
  ["허용 오차 경계: 0.5px 안의 기본 숫자 차이는 기본 고정폭", W(64, 64.5, 64, 64), "기본 고정폭"],
  ["허용 오차 밖: 0.6px 차이는 다르다", W(40, 64, 64, 64.6), "미지원"],
];

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
  return SHOWCASE_TABLE.map(([component, states]) => ({ component, states }));
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

describe("미리보기 페이지(AC-UI-001-14)", () => {
  it("전시 목록 표는 29개 컴포넌트이고 showcase.ts는 그 표와 정확히 같다", () => {
    expect(SHOWCASE_TABLE).toHaveLength(29);
    expect(SHOWCASE).toEqual(expectedShowcase());
  });

  it("h1은 페이지 머리(PageHeader 기본 h1) 하나이고 '본문으로 건너뛰기' 링크가 main을 가리킨다", () => {
    mockSystemTheme(false);
    const { container } = renderPreview();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("컴포넌트 미리보기");
    const pageHead = container.querySelector('[data-showcase="PageHeader:page-title"]');
    expect(pageHead).not.toBeNull();
    expect(pageHead).toContainElement(headings[0]);
    const skipLink = screen.getByRole("link", { name: "본문으로 건너뛰기" });
    expect(skipLink).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("시연용 PageHeader는 titleAs='h3'로 렌더링해 h1을 늘리지 않는다(AC-UI-001-25)", () => {
    mockSystemTheme(false);
    const { container } = renderPreview();
    const demo = container.querySelector<HTMLElement>('[data-showcase="PageHeader:sub-nav"]');
    expect(demo).not.toBeNull();
    const scope = within(demo as HTMLElement);
    expect(scope.queryByRole("heading", { level: 1 })).toBeNull();
    expect(scope.getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect(scope.getByRole("tablist")).toBeInTheDocument();
  });

  it("섹션 제목(h2)은 정해진 9개이고 순서도 같다", () => {
    mockSystemTheme(false);
    renderPreview();
    const titles = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(SECTION_TITLES);
  });

  it("검증 섹션은 jsdom에서 너비가 0이라 '고정폭 숫자: 측정 불가'로 판정한다", () => {
    mockSystemTheme(false);
    renderPreview();
    const section = screen.getByRole("region", { name: "검증" });
    expect(within(section).getByText("고정폭 숫자: 측정 불가")).toBeInTheDocument();
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
    // 페이지 전체 axe 검사 두 번은 커버리지 계측과 병렬 실행에서 기본 제한(5초)을 넘는다(M4 실측 4.6~5.0초, M5 실측 6.6초 — 단독 2.3초).
  }, 20_000);

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

  it("피드백 섹션의 예약 상태 배지 시연은 임시 순서이고 상태 클래스가 Badge tone 기본 면을 대신한다", () => {
    mockSystemTheme(false);
    const { container } = renderPreview();
    const badges = [...container.querySelectorAll<HTMLElement>("[data-status-badge]")];
    expect(badges.map((badge) => badge.dataset.statusBadge)).toEqual(STATUS_ORDER);
    expect(badges.map((badge) => badge.textContent)).toEqual(STATUS_LABELS);
    for (const badge of badges) {
      const status = badge.dataset.statusBadge;
      expect(badge).toHaveClass(`bg-status-${status}-bg`, `text-status-${status}-fg`);
      expect(badge).not.toHaveClass("bg-muted");
      expect(badge).not.toHaveClass("text-muted-foreground");
      expect(badge.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
    expect(
      screen.getByText("토큰 시연용 조합이에요. 예약 상태 배지는 SPEC-UI-002에서 만들어요."),
    ).toBeInTheDocument();
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

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

describe("검증 섹션(AC-UI-001-06·14, EC-28, plan.md §E.4)", () => {
  afterEach(() => {
    Reflect.deleteProperty(document, "fonts");
  });

  it("기본 테마 정리 시연 상자는 금지 클래스 5개를 그대로 달고, 그 목록을 화면에 보인다", () => {
    const { container } = render(<VerificationSection />);
    const box = container.querySelector<HTMLElement>("[data-theme-reset-demo]");
    expect(box?.className).toBe(THEME_RESET_DEMO_CLASSES);
    expect(box?.classList).toHaveLength(5);
    expect(screen.getByText(THEME_RESET_DEMO_CLASSES)).toBeInTheDocument();
    // 비교용 상자는 토큰 클래스로 칠해 규칙이 생기는 모습을 함께 보인다.
    expect(container.querySelector("[data-token-demo]")).toHaveClass(
      "bg-primary",
      "text-primary-foreground",
      "rounded-panel",
      "shadow-raised",
    );
  });

  it("자간 확인은 자간이 있는 글자 크기 3개와 text-body를 기대값과 함께 보인다", () => {
    const { container } = render(<VerificationSection />);
    const samples = [...container.querySelectorAll<HTMLElement>("[data-tracking-sample]")];
    expect(samples.map((sample) => sample.dataset.trackingSample)).toEqual([
      "text-display",
      "text-heading",
      "text-title",
      "text-body",
    ]);
    for (const sample of samples) {
      expect(sample).toHaveClass(sample.dataset.trackingSample as string);
    }
    expect(screen.getAllByText(/^기대 자간 /).map((label) => label.textContent)).toEqual([
      "기대 자간 -0.02em",
      "기대 자간 -0.02em",
      "기대 자간 -0.01em",
      "기대 자간 0",
    ]);
  });

  it("포커스 윤곽선 확인용 버튼과 입력은 Tab으로 차례로 포커스를 받고 윤곽선 클래스를 가진다", async () => {
    const user = userEvent.setup();
    render(<VerificationSection />);
    const button = screen.getByRole("button", { name: "포커스 확인 버튼" });
    const input = screen.getByRole("textbox", { name: "포커스 확인 입력" });
    await user.tab();
    expect(button).toHaveFocus();
    await user.tab();
    expect(input).toHaveFocus();
    expect(button).toHaveClass(...FOCUS_CLASSES);
    expect(input).toHaveClass(...FOCUS_CLASSES, "focus-visible:border-ring");
  });

  it("웹 글꼴을 다 불러온 뒤 다시 재서 판정 문구와 측정값을 바꾼다(브라우저 경로)", async () => {
    let fontsLoaded = false;
    const widths = W(40, 64, 64, 64);
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
      this: Element,
    ) {
      const key = (this as HTMLElement).dataset?.tnumSample as keyof TnumWidths | undefined;
      const width = fontsLoaded && key ? widths[key] : 0;
      return { width, height: 0, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 0 } as DOMRect;
    });
    let resolveFonts: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      resolveFonts = () => resolve();
    });
    Object.defineProperty(document, "fonts", { configurable: true, value: { ready } });

    render(<VerificationSection />);
    expect(screen.getByText("고정폭 숫자: 측정 불가")).toBeInTheDocument();

    await act(async () => {
      fontsLoaded = true;
      resolveFonts();
      await ready;
    });
    expect(screen.getByText("고정폭 숫자: 지원")).toBeInTheDocument();
    expect(screen.getByText("40.00px")).toBeInTheDocument();
  });

  it.each(TNUM_TABLE)("classifyTnum은 EC-28 표대로 판정한다: %s", (_label, widths, verdict) => {
    expect(classifyTnum(widths)).toBe(verdict);
  });
});
