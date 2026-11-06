import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "../ui-core/theme-provider";

// jsdom 환경에서는 Vite가 `new URL(상대 경로, import.meta.url)`을 개발 서버 주소로 바꾸므로 파일 경로로 직접 푼다.
const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = readFileSync(path.resolve(TEST_DIR, "../../index.html"), "utf8");
const parsed = new DOMParser().parseFromString(INDEX_HTML, "text/html");
const initScript = parsed.querySelector("script[data-theme-init]");

function mockSystemTheme(dark: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query === "(prefers-color-scheme: dark)" ? dark : false,
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

/** index.html의 인라인 스크립트를 브라우저가 렌더링 전에 실행하듯 그대로 실행한다. */
function runInitScript() {
  // index.html의 인라인 스크립트 원문을 전역 범위에서 그대로 실행한다.
  new Function(initScript?.textContent ?? "")();
}

const isDark = () => document.documentElement.classList.contains("dark");

type StoredValue = string | null | "throws";

// acceptance.md AC-UI-001-08 기대값 표
const CASES: [label: string, stored: StoredValue, systemDark: boolean, expectedDark: boolean][] = [
  ["없음(첫 방문), 운영체제 다크", null, true, true],
  ["없음(첫 방문), 운영체제 라이트", null, false, false],
  ["dark, 운영체제 라이트", "dark", false, true],
  ["light, 운영체제 다크", "light", true, false],
  ["system, 운영체제 다크", "system", true, true],
  ["blue(잘못된 값), 운영체제 다크", "blue", true, true],
  ["저장소 접근 예외, 운영체제 라이트", "throws", false, false],
];

describe("index.html 테마 초기화 스크립트(AC-UI-001-08)", () => {
  it('문서는 <html lang="ko">이다', () => {
    expect(parsed.documentElement.getAttribute("lang")).toBe("ko");
  });

  it('data-theme-init 스크립트가 <head> 안에 있고 type="module" 스크립트보다 앞에 있다', () => {
    expect(initScript).not.toBeNull();
    expect(initScript?.parentElement?.tagName).toBe("HEAD");
    const moduleScript = parsed.querySelector('script[type="module"]');
    expect(moduleScript).not.toBeNull();
    const order = initScript?.compareDocumentPosition(moduleScript as Node) ?? 0;
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("스크립트의 저장 키는 ThemeProvider와 같은 kmc-admin-theme이다", () => {
    expect(THEME_STORAGE_KEY).toBe("kmc-admin-theme");
    expect(initScript?.textContent).toContain(`"${THEME_STORAGE_KEY}"`);
  });

  it.each(CASES)(
    "저장값 %s → 렌더링 전 .dark 판정이 표와 같다",
    (_label, stored, systemDark, expectedDark) => {
      mockSystemTheme(systemDark);
      if (stored === "throws") {
        vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
          throw new DOMException("denied", "SecurityError");
        });
      } else if (stored !== null) {
        localStorage.setItem(THEME_STORAGE_KEY, stored);
      }
      expect(() => runInitScript()).not.toThrow();
      expect(isDark()).toBe(expectedDark);
    },
  );

  it("저장소의 getItem이 예외를 던져도 예외가 새지 않고 시스템으로 판정한다", () => {
    mockSystemTheme(true);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(() => runInitScript()).not.toThrow();
    expect(isDark()).toBe(true);
  });

  it("이미 붙어 있던 .dark는 라이트 판정일 때 떨어진다", () => {
    mockSystemTheme(false);
    document.documentElement.classList.add("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    runInitScript();
    expect(isDark()).toBe(false);
  });
});
