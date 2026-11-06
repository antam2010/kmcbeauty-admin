import { PageHeader, type ThemePreference, ThemeToggle, useTheme } from "@/ui-core";
import { ActionsSection } from "./sections/ActionsSection";
import { AdvancedInputsSection } from "./sections/AdvancedInputsSection";
import { DataSection } from "./sections/DataSection";
import { FeedbackSection } from "./sections/FeedbackSection";
import { FormsSection } from "./sections/FormsSection";
import { NavigationSection } from "./sections/NavigationSection";
import { OverlaysSection } from "./sections/OverlaysSection";
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
        {/* 페이지 머리: 화면당 h1 하나는 PageHeader 기본값(h1)이 지킨다(design.md §8.3). */}
        <PageHeader
          data-showcase="PageHeader:page-title"
          title="컴포넌트 미리보기"
          className="mx-auto max-w-content px-6 py-4 lg:px-8"
          secondaryActions={
            <>
              <p data-showcase="ThemeProvider:root" className="text-body-sm text-muted-foreground">
                선택 {THEME_LABELS[preference]} · 적용 {THEME_LABELS[resolved]}
              </p>
              <div data-showcase="ThemeToggle:default">
                <ThemeToggle />
              </div>
            </>
          }
        />
      </header>
      <main id="main" className="mx-auto flex max-w-content flex-col gap-6 p-6 lg:p-8">
        <TokensSection />
        <ActionsSection />
        <FeedbackSection />
        <FormsSection />
        <AdvancedInputsSection />
        <OverlaysSection />
        <DataSection />
        <NavigationSection />
      </main>
    </div>
  );
}
