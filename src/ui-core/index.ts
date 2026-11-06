// @MX:ANCHOR: [AUTO] ui-core의 공개 API 경계다. 소비 측(미리보기, SPEC-UI-002 화면)은 @/ui-core에서만 가져온다.
// @MX:REASON: 내보내기를 지우거나 이름을 바꾸면 소비 화면이 깨진다. 별표 일괄 내보내기를 쓰지 않고 이름을 하나씩 다시 내보내며, 남는 이름은 design-rules.test.ts가 잡는다(AC-UI-001-09).
export { cn } from "./cn";
export type { ThemePreference, ThemeProviderProps } from "./theme-provider";
export { ThemeProvider, useTheme } from "./theme-provider";
export type { ThemeToggleProps } from "./theme-toggle";
export { ThemeToggle } from "./theme-toggle";
