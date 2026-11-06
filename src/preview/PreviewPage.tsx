import { type ThemePreference, ThemeToggle, useTheme } from "@/ui-core";
import { TokensSection } from "./sections/TokensSection";

const THEME_LABELS: Record<ThemePreference, string> = {
  light: "라이트",
  dark: "다크",
  system: "시스템",
};

/** 컴포넌트 미리보기 페이지. 라우터 없이 src/main.tsx가 바로 렌더링한다(design.md §9). */
export function PreviewPage() {
  const { preference, resolved } = useTheme();

  return (
    <div className="min-h-screen bg-background text-body text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:bg-card focus:px-4 focus:py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        본문으로 건너뛰기
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
          {/* 임시 페이지 제목이다. M5에서 PageHeader(기본 h1)로 바꾼다. */}
          <h1 className="text-heading font-bold">컴포넌트 미리보기</h1>
          <div className="flex flex-wrap items-center gap-3">
            <p data-showcase="ThemeProvider:root" className="text-body-sm text-muted-foreground">
              선택 {THEME_LABELS[preference]} · 적용 {THEME_LABELS[resolved]}
            </p>
            <div data-showcase="ThemeToggle:default">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto flex max-w-content flex-col gap-6 p-6 lg:p-8">
        <TokensSection />
      </main>
    </div>
  );
}
