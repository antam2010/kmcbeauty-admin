import { PageHeader, type ThemePreference, ThemeToggle, useTheme } from "@/ui-core";
import { ActionsSection } from "./sections/ActionsSection";
import { AdvancedInputsSection } from "./sections/AdvancedInputsSection";
import { DataSection } from "./sections/DataSection";
import { FeedbackSection } from "./sections/FeedbackSection";
import { FormsSection } from "./sections/FormsSection";
import { NavigationSection } from "./sections/NavigationSection";
import { OverlaysSection } from "./sections/OverlaysSection";
import { TokensSection } from "./sections/TokensSection";
import { VerificationSection } from "./sections/VerificationSection";

const THEME_LABELS: Record<ThemePreference, string> = {
  light: "라이트",
  dark: "다크",
  system: "시스템",
};

// 같은 페이지 앵커 목차(design.md §9). id는 각 섹션의 PreviewSection id와 같아야 한다.
const TABLE_OF_CONTENTS = [
  { id: "tokens", title: "토큰" },
  { id: "actions", title: "동작" },
  { id: "feedback", title: "피드백" },
  { id: "forms", title: "폼" },
  { id: "advanced-inputs", title: "고급 입력" },
  { id: "overlays", title: "오버레이" },
  { id: "data", title: "데이터" },
  { id: "navigation", title: "탐색" },
  { id: "verification", title: "검증" },
];

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
      {/* 목차는 main 앞에 두어 '본문으로 건너뛰기'가 머리와 함께 건너뛴다. */}
      <nav aria-label="목차" className="border-b border-border bg-card">
        <ol className="mx-auto flex max-w-content flex-wrap gap-x-4 gap-y-1 px-6 py-3 lg:px-8">
          {TABLE_OF_CONTENTS.map(({ id, title }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="rounded-chip text-body-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <main id="main" className="mx-auto flex max-w-content flex-col gap-6 p-6 lg:p-8">
        <TokensSection />
        <ActionsSection />
        <FeedbackSection />
        <FormsSection />
        <AdvancedInputsSection />
        <OverlaysSection />
        <DataSection />
        <NavigationSection />
        <VerificationSection />
      </main>
    </div>
  );
}
