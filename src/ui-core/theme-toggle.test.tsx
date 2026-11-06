import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

const STORAGE_KEY = "kmc-admin-theme";
const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];
// 색이 아닌 선택 단서(acceptance.md AC-UI-001-12): 굵기·밑줄, 두께가 있는 테두리·윤곽선, 또는 그 forced-colors: 변형
const NON_COLOR_CUE =
  /(^|\s)(forced-colors:)?(font-semibold|font-bold|underline|border-\d|outline-\d)(\s|$)/;

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

function renderToggle(label?: string) {
  return render(
    <ThemeProvider>
      <button type="button">앞 요소</button>
      <ThemeToggle aria-label={label} />
    </ThemeProvider>,
  );
}

const radio = (name: string) => screen.getByRole("radio", { name });
const isDark = () => document.documentElement.classList.contains("dark");

describe("ThemeToggle — 구조와 접근 이름", () => {
  it("이름이 '테마'인 radiogroup 안에 라이트·다크·시스템 세 항목이 차례로 있다", () => {
    mockSystemTheme(false);
    renderToggle();
    const group = screen.getByRole("radiogroup", { name: "테마" });
    const items = screen.getAllByRole("radio");
    expect(group).toContainElement(items[0]);
    expect(items.map((item) => item.getAttribute("aria-label") ?? item.textContent)).toEqual([
      "라이트",
      "다크",
      "시스템",
    ]);
  });

  it("aria-label을 주면 그 이름을 쓴다", () => {
    mockSystemTheme(false);
    renderToggle("화면 테마");
    expect(screen.getByRole("radiogroup", { name: "화면 테마" })).toBeInTheDocument();
  });

  it("첫 방문(저장값 없음)에는 시스템 항목이 선택돼 있다", () => {
    mockSystemTheme(false);
    renderToggle();
    expect(radio("시스템")).toHaveAttribute("aria-checked", "true");
    expect(radio("라이트")).toHaveAttribute("aria-checked", "false");
    expect(radio("다크")).toHaveAttribute("aria-checked", "false");
  });

  it("아이콘은 장식이라 보조 기술에서 숨긴다(AC-UI-001-12)", () => {
    mockSystemTheme(false);
    const { container } = renderToggle();
    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(3);
    for (const icon of icons) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });
});

describe("ThemeToggle — 키보드 조작(AC-UI-001-07, AC-UI-001-11)", () => {
  it("AC-UI-001-11: Tab으로 들어오면 선택된 시스템 항목에 포커스가 가고 ←가 포커스와 선택을 함께 다크로 옮긴다", async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(radio("시스템")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(radio("다크")).toHaveFocus();
    expect(radio("다크")).toHaveAttribute("aria-checked", "true");
    expect(radio("시스템")).toHaveAttribute("aria-checked", "false");
    expect(isDark()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("AC-UI-001-11: ←를 한 번 더 누르면 라이트가 선택되고 .dark가 사라지며 Space로는 해제되지 않는다", async () => {
    mockSystemTheme(false);
    localStorage.setItem(STORAGE_KEY, "dark");
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(radio("다크")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(radio("라이트")).toHaveFocus();
    expect(radio("라이트")).toHaveAttribute("aria-checked", "true");
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");

    await user.keyboard(" ");
    expect(radio("라이트")).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("AC-UI-001-11: →·↓·↑도 포커스와 선택을 함께 옮기고 끝에서 처음으로 돈다", async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();

    await user.keyboard("{ArrowRight}");
    expect(radio("라이트")).toHaveFocus();
    expect(radio("라이트")).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowDown}");
    expect(radio("다크")).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowUp}");
    expect(radio("라이트")).toHaveAttribute("aria-checked", "true");
  });

  it("AC-UI-001-11: Home·End는 처음·끝 항목을 고른다", async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();

    await user.keyboard("{Home}");
    expect(radio("라이트")).toHaveFocus();
    expect(radio("라이트")).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{End}");
    expect(radio("시스템")).toHaveFocus();
    expect(radio("시스템")).toHaveAttribute("aria-checked", "true");
  });

  it("마우스로 다크를 누르면 다크가 선택된다", async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    renderToggle();
    await user.click(radio("다크"));
    expect(radio("다크")).toHaveAttribute("aria-checked", "true");
    expect(isDark()).toBe(true);
  });

  it("저장이 예외를 던져도 다크를 고르면 .dark가 붙고 예외가 새지 않는다", async () => {
    mockSystemTheme(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    const user = userEvent.setup();
    renderToggle();
    await user.click(radio("다크"));
    expect(isDark()).toBe(true);
    expect(radio("다크")).toHaveAttribute("aria-checked", "true");
  });
});

describe("ThemeToggle — 포커스 표시·선택 단서·자동 접근성 검사", () => {
  it("AC-UI-001-11: 모든 항목에 포커스 윤곽선 클래스 세 개가 있다", () => {
    mockSystemTheme(false);
    renderToggle();
    for (const item of screen.getAllByRole("radio")) {
      for (const className of FOCUS_CLASSES) {
        expect(item).toHaveClass(className);
      }
    }
  });

  it("선택된 항목에만 색이 아닌 단서가 있다(REQ-UI-001-025)", () => {
    mockSystemTheme(false);
    renderToggle();
    expect(radio("시스템").className).toMatch(NON_COLOR_CUE);
    expect(radio("라이트").className).not.toMatch(NON_COLOR_CUE);
    expect(radio("다크").className).not.toMatch(NON_COLOR_CUE);
  });

  it("AC-UI-001-11: 라이트·다크 상태 모두 axe 위반이 0건이다", async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    const { container } = renderToggle();
    await expectNoAxeViolations(container);
    await user.click(radio("다크"));
    await expectNoAxeViolations(container);
  });
});
