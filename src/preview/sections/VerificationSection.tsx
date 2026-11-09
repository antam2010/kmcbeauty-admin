import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Button, cn, Input } from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

// @MX:NOTE: [AUTO] 디자인 규칙 점검의 유일한 허용 구역이 이 파일에 있다. 금지 클래스는 시연용으로 아래 표시 두 줄 사이에만 둔다(design.md §9).
// 기본 테마 정리 시연(AC-UI-001-06): Tailwind가 이 파일을 후보로 훑어도 기본 테마를 지웠으므로 빌드 CSS에 규칙이 없어야 한다.
// 이어 붙여 만든 문자열은 Tailwind가 보지 못해 증거가 되지 않으므로 상수 하나에 글자 그대로 적는다.
// design-rules:allow-start
export const THEME_RESET_DEMO_CLASSES = "bg-rose-700 text-white rounded-lg shadow-xl text-sm";
// design-rules:allow-end

/** "1111"·"0000"을 기본 숫자와 tabular-nums로 잰 너비(px) */
export interface TnumWidths {
  plain1111: number;
  plain0000: number;
  tabular1111: number;
  tabular0000: number;
}

export type TnumVerdict = "지원" | "기본 고정폭" | "미지원" | "측정 불가";

const TOLERANCE_PX = 0.5;
const sameWidth = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE_PX;

/** acceptance.md §3.2(EC-28) 표대로 판정한다. 0 검사를 먼저 하고, 너비 비교는 0.5px 허용 오차로 한다. */
export function classifyTnum(widths: TnumWidths): TnumVerdict {
  const { plain1111, plain0000, tabular1111, tabular0000 } = widths;
  if ([plain1111, plain0000, tabular1111, tabular0000].some((width) => !(width > 0))) {
    return "측정 불가";
  }
  if (!sameWidth(tabular1111, tabular0000)) return "미지원";
  return sameWidth(plain1111, plain0000) ? "기본 고정폭" : "지원";
}

const TNUM_SAMPLES: { key: keyof TnumWidths; label: string; digits: string; className: string }[] =
  [
    { key: "plain1111", label: "기본 숫자", digits: "1111", className: "normal-nums" },
    { key: "plain0000", label: "기본 숫자", digits: "0000", className: "normal-nums" },
    { key: "tabular1111", label: "tabular-nums", digits: "1111", className: "tabular-nums" },
    { key: "tabular0000", label: "tabular-nums", digits: "0000", className: "tabular-nums" },
  ];

const NO_WIDTHS: TnumWidths = { plain1111: 0, plain0000: 0, tabular1111: 0, tabular0000: 0 };

// 자간 하위 값이 있는 글자 크기(system.md §4)와 비교용 text-body. 클래스는 Tailwind가 찾도록 글자 그대로 적는다.
const TRACKING_SAMPLES = [
  { className: "text-display", expected: "-0.02em" },
  { className: "text-heading", expected: "-0.02em" },
  { className: "text-title", expected: "-0.01em" },
  { className: "text-body", expected: "0" },
];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6">
      <h3 className="text-subtitle font-semibold">{title}</h3>
      {children}
    </div>
  );
}

/** 검증: 기본 테마 정리 시연, 자간, 포커스 윤곽선, 고정폭 숫자 판정(plan.md §F M6, design.md §9). */
export function VerificationSection() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<TnumWidths>(NO_WIDTHS);
  const [tracking, setTracking] = useState<string[]>([]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const width = (key: keyof TnumWidths) =>
        root.querySelector(`[data-tnum-sample="${key}"]`)?.getBoundingClientRect().width ?? 0;
      setWidths({
        plain1111: width("plain1111"),
        plain0000: width("plain0000"),
        tabular1111: width("tabular1111"),
        tabular0000: width("tabular0000"),
      });
      setTracking(
        TRACKING_SAMPLES.map(({ className }) => {
          const sample = root.querySelector(`[data-tracking-sample="${className}"]`);
          return sample ? getComputedStyle(sample).letterSpacing : "";
        }),
      );
    };
    measure();
    // 웹 글꼴이 늦게 내려오면 처음 값은 대체 글꼴로 잰 것이라, 글꼴을 다 불러온 뒤 다시 잰다.
    // jsdom에는 document.fonts가 없다.
    document.fonts?.ready.then(measure);
    return () => {
      active = false;
    };
  }, []);

  return (
    <PreviewSection
      id="verification"
      title="검증"
      description="디자인 시스템이 브라우저에서 의도대로 적용되는지 확인해요. 측정값은 브라우저에서 읽어 기록해요."
    >
      <div ref={rootRef} className="grid gap-6 lg:grid-cols-2">
        <Panel title="기본 테마 정리">
          <p className="text-body-sm text-muted-foreground">
            왼쪽 상자에는 Tailwind 기본 테마 이름 클래스를 그대로 붙였어요. 기본 테마를 지웠으므로
            아무 스타일 없이 보여야 해요. 오른쪽 상자는 토큰 클래스로 칠한 비교용이에요.
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <div data-theme-reset-demo="" className={THEME_RESET_DEMO_CLASSES}>
              기본 테마 클래스 상자
            </div>
            <div
              data-token-demo=""
              className="rounded-panel bg-primary px-4 py-3 text-body text-primary-foreground shadow-raised"
            >
              토큰 클래스 상자
            </div>
          </div>
          <code className="font-mono text-caption text-muted-foreground">
            {THEME_RESET_DEMO_CLASSES}
          </code>
        </Panel>

        <Panel title="자간">
          <p className="text-body-sm text-muted-foreground">
            제목용 글자 크기에는 음수 자간이 붙어요. 계산값은 브라우저가 계산한 자간이에요.
          </p>
          <ul className="flex flex-col gap-3">
            {TRACKING_SAMPLES.map(({ className, expected }, index) => (
              <li key={className} className="flex flex-col gap-0.5">
                <span className="flex flex-wrap gap-3 font-mono text-caption text-muted-foreground">
                  <span>{className}</span>
                  <span>기대 자간 {expected}</span>
                  <span>계산값 {tracking[index] || "측정 불가"}</span>
                </span>
                <span data-tracking-sample={className} className={className}>
                  예약 현황을 확인해요.
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="포커스 윤곽선">
          <p className="text-body-sm text-muted-foreground">
            Tab으로 버튼과 입력에 포커스를 옮기면 2px 윤곽선이 2px 떨어져 보여야 해요. Windows
            고대비 모드에서도 윤곽선이 보여야 해요.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline">포커스 확인 버튼</Button>
            <Input aria-label="포커스 확인 입력" placeholder="포커스 확인 입력" className="w-60" />
          </div>
        </Panel>

        <Panel title="고정폭 숫자(tnum)">
          <p className="text-body-sm text-muted-foreground">
            “1111”과 “0000”의 너비를 기본 숫자와 tabular-nums로 각각 재서 판정해요. 웹 글꼴을 다
            불러온 뒤 다시 재요. 대체 숫자 글꼴은 SPEC-UI-002에서 정해요.
          </p>
          <ul className="flex flex-col gap-2">
            {TNUM_SAMPLES.map(({ key, label, digits, className }) => (
              <li key={key} className="flex items-center gap-4 text-body-sm">
                <span className="w-24 text-muted-foreground">{label}</span>
                <span
                  data-tnum-sample={key}
                  className={cn("whitespace-nowrap text-display", className)}
                >
                  {digits}
                </span>
                <span className="font-mono text-caption text-muted-foreground">
                  {`${widths[key].toFixed(2)}px`}
                </span>
              </li>
            ))}
          </ul>
          <p data-tnum-verdict="" className="text-subtitle font-semibold">
            고정폭 숫자: {classifyTnum(widths)}
          </p>
        </Panel>
      </div>
    </PreviewSection>
  );
}
