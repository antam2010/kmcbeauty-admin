import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./theme-provider";

const STORAGE_KEY = "kmc-admin-theme";
const QUERY = "(prefers-color-scheme: dark)";

/** 운영체제 테마 설정을 흉내 낸다. setDark로 변경 이벤트를 보낸다. */
function mockSystemTheme(initialDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    matches: initialDark,
    media: QUERY,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    dispatchEvent: () => true,
  };
  vi.spyOn(window, "matchMedia").mockImplementation(
    () => mediaQueryList as unknown as MediaQueryList,
  );
  return {
    setDark(next: boolean) {
      mediaQueryList.matches = next;
      act(() => {
        for (const listener of listeners) {
          listener({ matches: next, media: QUERY } as MediaQueryListEvent);
        }
      });
    },
  };
}

function ThemeProbe() {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <div>
      <p data-testid="preference">{preference}</p>
      <p data-testid="resolved">{resolved}</p>
      <button type="button" onClick={() => setPreference("light")}>
        라이트로
      </button>
      <button type="button" onClick={() => setPreference("dark")}>
        다크로
      </button>
      <button type="button" onClick={() => setPreference("system")}>
        시스템으로
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

const isDark = () => document.documentElement.classList.contains("dark");

describe("ThemeProvider — 기본값과 저장값(AC-UI-001-08)", () => {
  it("저장값이 없고 운영체제가 다크면 선택은 시스템이고 .dark가 붙는다", () => {
    mockSystemTheme(true);
    renderProvider();
    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(isDark()).toBe(true);
  });

  it("저장값이 없고 운영체제가 라이트면 .dark가 없다", () => {
    mockSystemTheme(false);
    renderProvider();
    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(isDark()).toBe(false);
  });

  it("저장값이 dark면 운영체제가 라이트여도 .dark가 붙는다", () => {
    mockSystemTheme(false);
    localStorage.setItem(STORAGE_KEY, "dark");
    renderProvider();
    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
    expect(isDark()).toBe(true);
  });

  it("저장값이 light면 운영체제가 다크여도 .dark가 없다", () => {
    mockSystemTheme(true);
    localStorage.setItem(STORAGE_KEY, "light");
    renderProvider();
    expect(screen.getByTestId("preference")).toHaveTextContent("light");
    expect(isDark()).toBe(false);
  });

  it("저장값이 잘못됐으면(blue) 시스템으로 판정한다(EC-02)", () => {
    mockSystemTheme(true);
    localStorage.setItem(STORAGE_KEY, "blue");
    renderProvider();
    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(isDark()).toBe(true);
  });

  it("마운트 때 저장소 읽기가 예외를 던져도 시스템으로 판정하고 예외를 내보내지 않는다(EC-21)", () => {
    mockSystemTheme(false);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(() => renderProvider()).not.toThrow();
    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(isDark()).toBe(false);
  });
});

describe("ThemeProvider — 선택 저장(AC-UI-001-07)", () => {
  it("다크를 고르면 즉시 .dark가 붙고 kmc-admin-theme에 dark를 저장한다", async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByRole("button", { name: "다크로" }));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
  });

  it("저장이 예외를 던져도 클래스는 바뀌고 예외가 새지 않으며 세션 동안 선택을 유지한다", async () => {
    mockSystemTheme(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByRole("button", { name: "다크로" }));
    expect(isDark()).toBe(true);
    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
  });

  it("다크에서 시스템으로 바꾸면 system을 저장하고 운영체제 설정을 따른다(EC-03)", async () => {
    mockSystemTheme(false);
    localStorage.setItem(STORAGE_KEY, "dark");
    const user = userEvent.setup();
    renderProvider();
    expect(isDark()).toBe(true);
    await user.click(screen.getByRole("button", { name: "시스템으로" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("system");
    expect(isDark()).toBe(false);
  });
});

describe("ThemeProvider — 시스템 추종(AC-UI-001-08 While)", () => {
  it("선택이 시스템인 동안 운영체제가 다크로 바뀌면 .dark가 붙고 라이트로 돌아가면 떨어진다", () => {
    const system = mockSystemTheme(false);
    renderProvider();
    expect(isDark()).toBe(false);
    system.setDark(true);
    expect(isDark()).toBe(true);
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    system.setDark(false);
    expect(isDark()).toBe(false);
  });

  it("선택이 light이면 운영체제 변경 이벤트에도 .dark가 붙지 않는다", () => {
    const system = mockSystemTheme(false);
    localStorage.setItem(STORAGE_KEY, "light");
    renderProvider();
    system.setDark(true);
    expect(isDark()).toBe(false);
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
  });
});

describe("useTheme", () => {
  it("ThemeProvider 밖에서 부르면 오류를 알린다", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<ThemeProbe />)).toThrow(/ThemeProvider/);
  });
});
