import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

// @MX:WARN: [AUTO] 저장 키·값 판정·클래스 이름이 index.html의 테마 초기화 인라인 스크립트(data-theme-init)와 두 곳에 정의돼 있다.
// @MX:REASON: 한쪽만 바꾸면 첫 렌더링 전 판정과 ThemeProvider 판정이 달라져 화면이 깜빡이거나 테마가 뒤바뀐다(theme-init.test.ts가 같은 키와 판정을 확인).
export const THEME_STORAGE_KEY = "kmc-admin-theme";
const DARK_CLASS = "dark";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** 저장값이 없거나 잘못됐거나 저장소 접근이 실패하면 시스템으로 본다. */
function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
}

function applyThemeClass(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle(DARK_CLASS, resolved === "dark");
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference(next: ThemePreference): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
}

/** 라이트·다크·시스템 테마 상태를 두고 <html>의 .dark 클래스를 맞춘다(기본 선택은 시스템). */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);
  const resolved = resolveTheme(preference, prefersDark);

  // 선택이 시스템인 동안에만 운영체제 설정 변화를 따른다.
  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    setPrefersDark(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preference]);

  useEffect(() => {
    applyThemeClass(resolved);
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    // 클래스를 먼저 바꾸고 저장을 시도한다. 저장이 실패해도 그 세션 동안은 메모리의 선택을 쓴다.
    applyThemeClass(resolveTheme(next, systemPrefersDark()));
    setPreferenceState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // 사생활 보호 모드·용량 초과 등에서는 저장하지 않고 넘어간다.
    }
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/** 현재 테마 선택과 판정 결과, 선택을 바꾸는 함수를 돌려준다. ThemeProvider 안에서만 쓴다. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
