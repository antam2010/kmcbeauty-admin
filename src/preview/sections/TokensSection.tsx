import { cn } from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

// system.md §2 색 토큰 36개(면·중립 14, 톤 22)
const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  "overlay",
  "primary",
  "primary-foreground",
  "primary-hover",
  "primary-subtle",
  "primary-subtle-foreground",
  "info",
  "info-foreground",
  "info-subtle",
  "info-subtle-foreground",
  "success",
  "success-foreground",
  "success-subtle",
  "success-subtle-foreground",
  "warning",
  "warning-foreground",
  "warning-subtle",
  "warning-subtle-foreground",
  "destructive",
  "destructive-foreground",
  "destructive-hover",
  "destructive-subtle",
  "destructive-subtle-foreground",
];

// 예약 상태 토큰 시연은 system.md §9의 임시 순서를 쓴다(표시 순서는 SPEC-UI-002에서 정한다).
const STATUSES = [
  { key: "reserved", label: "예약됨" },
  { key: "visited", label: "방문함" },
  { key: "completed", label: "완료" },
  { key: "cancelled", label: "취소됨" },
  { key: "no-show", label: "노쇼" },
];
const STATUS_SLOTS = ["bg", "fg", "rail"];

// Tailwind가 소스에서 클래스 이름을 찾으므로 클래스는 글자 그대로 적는다.
const TYPE_SCALE = [
  { className: "text-caption", spec: "12/18px" },
  { className: "text-body-sm", spec: "13/20px" },
  { className: "text-body", spec: "14/22px" },
  { className: "text-subtitle", spec: "16/24px" },
  { className: "text-title", spec: "18/26px" },
  { className: "text-heading", spec: "24/32px" },
  { className: "text-display", spec: "28/36px" },
];

const RADII = [
  { className: "rounded-panel", spec: "12px" },
  { className: "rounded-control", spec: "8px" },
  { className: "rounded-badge", spec: "6px" },
  { className: "rounded-chip", spec: "4px" },
  { className: "rounded-full", spec: "원형" },
];

const ELEVATIONS = [
  { label: "0 페이지", className: "bg-background" },
  { label: "1 패널", className: "border border-border bg-card" },
  { label: "2 팝오버", className: "border border-border bg-popover shadow-raised" },
  { label: "3 대화상자", className: "border border-border bg-popover shadow-overlay" },
];

function Swatch({ variable }: { variable: string }) {
  return (
    <span
      aria-hidden="true"
      className="size-5 shrink-0 rounded-chip border border-border"
      style={{ backgroundColor: `var(--${variable})` }}
    />
  );
}

function ThemePanel({ theme, title }: { theme: "light" | "dark"; title: string }) {
  return (
    <div
      data-theme-panel={theme}
      className={cn(
        theme,
        "flex flex-col gap-6 rounded-panel border border-border bg-background p-6 text-foreground",
      )}
    >
      <h3 className="text-subtitle font-semibold">{title}</h3>

      <div className="flex flex-col gap-3">
        <h4 className="text-body font-semibold">색</h4>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {COLOR_TOKENS.map((token) => (
            <li key={token} data-color-token={token} className="flex items-center gap-2">
              <Swatch variable={token} />
              <span className="font-mono text-caption">{token}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-body font-semibold">예약 상태</h4>
        <ul className="flex flex-col gap-2">
          {STATUSES.map(({ key, label }) => (
            <li key={key} data-status-token={key} className="flex items-center gap-4">
              <span data-status-label="" className="w-14 text-body-sm font-medium">
                {label}
              </span>
              {STATUS_SLOTS.map((slot) => (
                <span
                  key={slot}
                  data-status-swatch={`${key}-${slot}`}
                  className="flex items-center gap-1.5 font-mono text-caption text-muted-foreground"
                >
                  <Swatch variable={`status-${key}-${slot}`} />
                  {slot}
                </span>
              ))}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-body font-semibold">글자 크기</h4>
        <ul className="flex flex-col gap-2">
          {TYPE_SCALE.map(({ className, spec }) => (
            <li key={className} className="flex flex-col gap-0.5">
              <span className="font-mono text-caption text-muted-foreground">
                {className} {spec}
              </span>
              <span className={className}>예약을 저장했어요.</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-body font-semibold">반경</h4>
        <ul className="flex flex-wrap gap-4">
          {RADII.map(({ className, spec }) => (
            <li key={className} className="flex flex-col items-center gap-1">
              <span
                aria-hidden="true"
                className={cn("size-12 border border-border bg-muted", className)}
              />
              <span className="font-mono text-caption text-muted-foreground">
                {className} {spec}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-body font-semibold">높이</h4>
        <ul className="grid grid-cols-2 gap-4">
          {ELEVATIONS.map(({ label, className }) => (
            <li key={label} className={cn("rounded-panel p-4 text-caption", className)}>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** 디자인 토큰을 라이트·다크 판에 나란히 보여 준다(색 36, 예약 상태 15, 글자 크기, 반경, 높이). */
export function TokensSection() {
  return (
    <PreviewSection
      id="tokens"
      title="토큰"
      description="디자인 토큰을 라이트와 다크 테마로 나란히 보여 줘요. 예약 상태 토큰은 임시 순서(예약됨 → 방문함 → 완료 → 취소됨 → 노쇼)로 보여 줘요."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ThemePanel theme="light" title="라이트" />
        <ThemePanel theme="dark" title="다크" />
      </div>
    </PreviewSection>
  );
}
