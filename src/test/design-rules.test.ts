// @vitest-environment node
// 디자인 규칙 점검(AC-UI-001-09, AC-UI-001-10, AC-UI-001-12, AC-UI-001-13).
// 위반은 하나마다 `경로:줄`로 보고한다. 허용 구역(design-rules:allow-start ~ allow-end) 안에서는
// 기본 테마 이름 규칙 하나만 건너뛰고, 그 구역은 VerificationSection.tsx에만 둘 수 있다(design.md §9).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// ── 기대 목록(acceptance.md 정본을 옮김) ───────────────────────────────────────────────

// AC-UI-001-09 공개 이름 40개(정렬 순서)
const PUBLIC_NAMES = [
  "Alert",
  "Badge",
  "Breadcrumb",
  "Button",
  "Calendar",
  "Card",
  "CardContent",
  "CardDescription",
  "CardFooter",
  "CardHeader",
  "CardTitle",
  "Checkbox",
  "Combobox",
  "ConfirmDialog",
  "ConfirmDialogHost",
  "DateTimePicker",
  "EmptyState",
  "Field",
  "Filter",
  "Input",
  "Loading",
  "Modal",
  "PageHeader",
  "Pagination",
  "Search",
  "Select",
  "Sidebar",
  "Skeleton",
  "SkeletonGroup",
  "Table",
  "Tabs",
  "Textarea",
  "ThemeProvider",
  "ThemeToggle",
  "Toaster",
  "Tooltip",
  "cn",
  "showConfirm",
  "toast",
  "useTheme",
];

// plan.md §A.3 컴포넌트 파일 29개
const COMPONENT_FILES = [
  "button.tsx",
  "badge.tsx",
  "loading.tsx",
  "skeleton.tsx",
  "empty-state.tsx",
  "alert.tsx",
  "card.tsx",
  "field.tsx",
  "input.tsx",
  "textarea.tsx",
  "checkbox.tsx",
  "search.tsx",
  "select.tsx",
  "filter.tsx",
  "combobox.tsx",
  "calendar.tsx",
  "date-time-picker.tsx",
  "modal.tsx",
  "confirm-dialog.tsx",
  "toast.tsx",
  "tooltip.tsx",
  "table.tsx",
  "tabs.tsx",
  "pagination.tsx",
  "sidebar.tsx",
  "breadcrumb.tsx",
  "page-header.tsx",
  "theme-provider.tsx",
  "theme-toggle.tsx",
];

// AC-UI-001-09 기반 라이브러리 표
const BASE_LIBRARIES: Record<string, string[]> = {
  "button.tsx": ["@radix-ui/react-slot", "class-variance-authority"],
  "badge.tsx": ["class-variance-authority"],
  "alert.tsx": ["class-variance-authority"],
  "checkbox.tsx": ["@radix-ui/react-checkbox"],
  "select.tsx": ["@radix-ui/react-select"],
  "filter.tsx": ["@radix-ui/react-toggle-group"],
  "theme-toggle.tsx": ["@radix-ui/react-toggle-group"],
  "combobox.tsx": ["cmdk", "@radix-ui/react-popover"],
  "calendar.tsx": ["react-day-picker"],
  "date-time-picker.tsx": ["@radix-ui/react-popover"],
  "modal.tsx": ["@radix-ui/react-dialog"],
  "confirm-dialog.tsx": ["@radix-ui/react-alert-dialog"],
  "toast.tsx": ["@radix-ui/react-toast"],
  "tooltip.tsx": ["@radix-ui/react-tooltip"],
  "tabs.tsx": ["@radix-ui/react-tabs"],
};

// 시연 허용 구역을 둘 수 있는 유일한 파일(design.md §9). 다른 파일의 표시는 위반이다.
const ALLOW_ZONE_FILE = "src/preview/sections/VerificationSection.tsx";
const ALLOW_START = "design-rules:allow-start";
const ALLOW_END = "design-rules:allow-end";

// AC-UI-001-06 금지 클래스 5개: 허용 구역의 시연 상수가 이 클래스를 글자 그대로 담는다
const THEME_RESET_DEMO = ["bg-rose-700", "text-white", "rounded-lg", "shadow-xl", "text-sm"];

// 표에 적힌 파일 밖에서 가져오면 안 되는 패키지
const CONFINED_PACKAGES: Record<string, string[]> = {
  "react-day-picker": ["calendar.tsx"],
  cmdk: ["combobox.tsx"],
};

// ── 설치된 패키지에서 만드는 이름 집합 ─────────────────────────────────────────────────

const THEME_CSS = readFileSync(path.join(ROOT, "node_modules/tailwindcss/theme.css"), "utf8");
const LUCIDE_DTS = readFileSync(
  path.join(ROOT, "node_modules/lucide-react/dist/lucide-react.d.ts"),
  "utf8",
);

function themeNames(pattern: RegExp): string[] {
  return [...new Set([...THEME_CSS.matchAll(pattern)].map((match) => match[1]))];
}

const COLOR_SCALE = [...THEME_CSS.matchAll(/--color-([a-z]+)-(\d+):/g)];
const COLOR_FAMILIES = [...new Set(COLOR_SCALE.map((match) => match[1]))];
const COLOR_SHADES = [...new Set(COLOR_SCALE.map((match) => match[2]))];
const RADIUS_NAMES = themeNames(/--radius-([\w-]+):/g);
const SHADOW_NAMES = themeNames(/--shadow-([\w-]+):/g);
const INSET_SHADOW_NAMES = themeNames(/--inset-shadow-([\w-]+):/g);
const DROP_SHADOW_NAMES = themeNames(/--drop-shadow-([\w-]+):/g);
const TEXT_SHADOW_NAMES = themeNames(/--text-shadow-([\w-]+):/g);
const TEXT_NAMES = themeNames(/--text-([a-z0-9]+):/g).filter((name) => name !== "shadow");
const CONTAINER_NAMES = themeNames(/--container-([\w-]+):/g);
const LUCIDE_NAMES = new Set(
  [...LUCIDE_DTS.matchAll(/declare const (\w+): LucideIcon;/g)].map((match) => match[1]),
);

const alternation = (names: string[]) => names.map((name) => name.replace(/[.]/g, "\\.")).join("|");

const COLOR_RULE = new RegExp(
  `-(?:(?:${alternation(COLOR_FAMILIES)})-(?:${alternation(COLOR_SHADES)})|black|white)(?:/[^\\s]*)?!?$`,
);
const RADIUS_RULE = new RegExp(`^-?rounded(?:-[a-z]{1,2})?-(?:${alternation(RADIUS_NAMES)})!?$`);
const SHADOW_RULE = new RegExp(
  `^(?:shadow-(?:${alternation(SHADOW_NAMES)})|inset-shadow-(?:${alternation(INSET_SHADOW_NAMES)})|drop-shadow-(?:${alternation(DROP_SHADOW_NAMES)})|text-shadow-(?:${alternation(TEXT_SHADOW_NAMES)}))(?:/[^\\s]*)?!?$`,
);
const TEXT_SIZE_RULE = new RegExp(`^text-(?:${alternation(TEXT_NAMES)})(?:/[^\\s]*)?!?$`);
const CONTAINER_RULE = new RegExp(
  `^-?(?:w|min-w|max-w|inline|min-inline|max-inline|basis|columns)-(?:${alternation(CONTAINER_NAMES)})!?$`,
);
const CONTAINER_VARIANT_RULE = new RegExp(
  `^@(?:min-|max-)?(?:${alternation(CONTAINER_NAMES)})(?:/[\\w-]+)?$`,
);

// ── 규칙 ───────────────────────────────────────────────────────────────────────────────

interface Violation {
  location: string;
  rule: string;
  detail: string;
}

const format = (violation: Violation) =>
  `${violation.location} ${violation.rule}: ${violation.detail}`;

/** `hover:data-[state=on]:bg-x`를 변형 목록과 유틸리티로 나눈다(대괄호 안의 콜론은 나누지 않는다). */
function splitVariants(token: string): { variants: string[]; utility: string } {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of token) {
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (char === ":" && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  return { variants: parts, utility: current };
}

function classTokens(line: string): string[] {
  return line.split(/[\s"'`{}()<>,;]+/).filter(Boolean);
}

function isThemeName(variants: string[], utility: string): boolean {
  if (utility !== "font-black" && COLOR_RULE.test(utility)) return true;
  if (
    [RADIUS_RULE, SHADOW_RULE, TEXT_SIZE_RULE, CONTAINER_RULE].some((rule) => rule.test(utility))
  ) {
    return true;
  }
  return variants.some((variant) => CONTAINER_VARIANT_RULE.test(variant));
}

/** 소스 한 파일의 클래스 규칙 위반(AC-UI-001-10, AC-UI-001-12, AC-UI-001-13)을 찾는다. */
function checkClassRules(file: string, text: string): Violation[] {
  const violations: Violation[] = [];
  let zoneStart: string | null = null; // 열린 허용 구역의 시작 표시 위치
  text.split("\n").forEach((line, index) => {
    const location = `${file}:${index + 1}`;
    if (line.includes(ALLOW_START) || line.includes(ALLOW_END)) {
      // 허용 구역은 VerificationSection.tsx 하나뿐이다. 다른 파일의 표시는 구역을 열지 않고 위반으로 보고한다.
      if (file !== ALLOW_ZONE_FILE) {
        violations.push({
          location,
          rule: "허용 구역 표시",
          detail: `${ALLOW_ZONE_FILE}에서만 쓴다`,
        });
      } else {
        zoneStart = line.includes(ALLOW_START) ? location : null;
        return;
      }
    }
    const inAllowZone = zoneStart !== null;
    for (const token of classTokens(line)) {
      const { variants, utility } = splitVariants(token);
      if (utility === "") continue;
      const add = (rule: string) => violations.push({ location, rule, detail: token });
      if (variants.includes("dark")) add("dark: 변형");
      if (!inAllowZone && isThemeName(variants, utility)) add("기본 테마 이름");
      if (utility === "outline-none") add("outline-none");
      if (variants.includes("hover") && utility.startsWith("opacity-")) add("hover:opacity-");
      const focusVariant = variants.some((variant) => variant.startsWith("focus"));
      if ((focusVariant && /^ring(-|$)/.test(utility)) || utility.startsWith("ring-offset-")) {
        add("box-shadow 포커스 링");
      }
      if (
        utility.startsWith("animate-") &&
        utility !== "animate-none" &&
        !variants.includes("motion-safe")
      ) {
        add("조건 없는 animate-*");
      }
    }
  });
  if (zoneStart !== null) {
    violations.push({ location: zoneStart, rule: "허용 구역 표시", detail: "끝 표시가 없다" });
  }
  return violations;
}

/** lucide-react에서 값으로 가져온 이름이 정식 이름인지 본다(타입 가져오기는 대상이 아니다). */
function checkLucideImports(file: string, text: string): Violation[] {
  const violations: Violation[] = [];
  const lineOf = (offset: number) => text.slice(0, offset).split("\n").length;
  for (const match of text.matchAll(/import\s+(type\s+)?([^;]*?)\s+from\s+["']lucide-react["']/g)) {
    const location = `${file}:${lineOf(match.index ?? 0)}`;
    if (match[1]) continue;
    const clause = match[2].trim();
    if (!clause.startsWith("{")) {
      violations.push({
        location,
        rule: "lucide 가져오기",
        detail: `이름 지정 가져오기만 쓴다: ${clause}`,
      });
      continue;
    }
    const names = clause
      .replace(/[{}]/g, "")
      .split(",")
      .map((specifier) => specifier.trim())
      .filter((specifier) => specifier !== "" && !specifier.startsWith("type "))
      .map((specifier) => specifier.split(/\s+as\s+/)[0]);
    for (const name of names) {
      if (!LUCIDE_NAMES.has(name)) {
        violations.push({ location, rule: "lucide 정식 이름 아님", detail: name });
      }
    }
  }
  return violations;
}

const STATUS_PATTERN =
  /RESERVED|VISITED|COMPLETED|CANCELLED|NO_SHOW|status-(reserved|visited|completed|cancelled|no-show)/;

/** ui-core는 예약 상태 키와 상태 토큰 클래스를 모른다(REQ-UI-001-011). */
function checkDomainBoundary(file: string, text: string): Violation[] {
  return text.split("\n").flatMap((line, index) => {
    const found = line.match(STATUS_PATTERN);
    return found
      ? [{ location: `${file}:${index + 1}`, rule: "예약 상태 참조", detail: found[0] }]
      : [];
  });
}

/** index.css에는 .dark 외의 클래스 선택자를 두지 않는다(R1, 전역 CSS는 토큰과 기본 계층만). */
function checkGlobalCssSelectors(file: string, css: string): Violation[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, " "),
  );
  const withoutStrings = withoutComments.replace(/"[^"\n]*"|'[^'\n]*'/g, (quoted) =>
    quoted.replace(/./g, " "),
  );
  return withoutStrings.split("\n").flatMap((line, index) =>
    [...line.matchAll(/(?<![\w-])\.([a-zA-Z_][\w-]*)/g)]
      .filter((match) => match[1] !== "dark")
      .map((match) => ({
        location: `${file}:${index + 1}`,
        rule: "허용 밖 클래스 선택자",
        detail: `.${match[1]}`,
      })),
  );
}

/** 미리보기는 @/ui-core에서만 ui-core를 가져온다(하위 경로·상대 경로 금지). */
function checkPreviewImports(file: string, text: string): Violation[] {
  const lineOf = (offset: number) => text.slice(0, offset).split("\n").length;
  return [...text.matchAll(/from\s+["']([^"']+)["']/g)]
    .filter((match) => /ui-core/.test(match[1]) && match[1] !== "@/ui-core")
    .map((match) => ({
      location: `${file}:${lineOf(match.index ?? 0)}`,
      rule: "@/ui-core 외 경로 가져오기",
      detail: match[1],
    }));
}

/** 표에 적힌 파일 밖에서 react-day-picker·cmdk를 가져오는지 본다. */
function checkConfinedPackages(file: string, text: string): Violation[] {
  const base = path.basename(file);
  return Object.entries(CONFINED_PACKAGES).flatMap(([pkg, allowed]) =>
    new RegExp(`from\\s+["']${pkg}["']`).test(text) && !allowed.includes(base)
      ? [
          {
            location: file,
            rule: "가져오기 범위",
            detail: `${pkg}는 ${allowed.join(", ")}에서만 쓴다`,
          },
        ]
      : [],
  );
}

// ── 대상 파일 ──────────────────────────────────────────────────────────────────────────

function listSources(relativeDir: string): string[] {
  const absolute = path.join(ROOT, relativeDir);
  return readdirSync(absolute, { recursive: true, encoding: "utf8" })
    .filter((entry) => /\.(ts|tsx)$/.test(entry))
    .map((entry) => path.posix.join(relativeDir, entry.split(path.sep).join("/")))
    .sort();
}

const read = (relative: string) => readFileSync(path.join(ROOT, relative), "utf8");
const UI_CORE_FILES = listSources("src/ui-core");
const PREVIEW_FILES = listSources("src/preview");
const SCANNED_FILES = [...UI_CORE_FILES, ...PREVIEW_FILES];

// ── 실제 소스 검사 ─────────────────────────────────────────────────────────────────────

describe("디자인 규칙 — 금지 패턴(AC-UI-001-10, AC-UI-001-12, AC-UI-001-13)", () => {
  it("검사 대상은 src/ui-core(테스트 포함)와 src/preview의 소스다", () => {
    expect(UI_CORE_FILES.length).toBeGreaterThan(0);
    expect(PREVIEW_FILES.length).toBeGreaterThan(0);
  });

  it("dark: 변형, 기본 테마 이름, outline-none, hover:opacity-, box-shadow 포커스 링, 조건 없는 animate-*가 0건이다", () => {
    const violations = SCANNED_FILES.flatMap((file) => checkClassRules(file, read(file)));
    expect(violations.map(format)).toEqual([]);
  });

  it("허용 구역은 VerificationSection.tsx에 하나이고, AC-UI-001-06 금지 클래스 5개를 글자 그대로 담은 문자열 하나다", () => {
    const lines = read(ALLOW_ZONE_FILE).split("\n");
    expect(lines.filter((line) => line.includes(ALLOW_START))).toHaveLength(1);
    expect(lines.filter((line) => line.includes(ALLOW_END))).toHaveLength(1);
    const start = lines.findIndex((line) => line.includes(ALLOW_START));
    const end = lines.findIndex((line) => line.includes(ALLOW_END));
    expect(start).toBeLessThan(end);
    // 이어 붙인 문자열은 Tailwind가 후보로 보지 못해 빌드 CSS 검사의 증거가 되지 않는다(AC-UI-001-06).
    const literals = [
      ...lines
        .slice(start + 1, end)
        .join("\n")
        .matchAll(/"([^"]*)"/g),
    ];
    expect(literals).toHaveLength(1);
    expect(literals[0][1].split(/\s+/).sort()).toEqual([...THEME_RESET_DEMO].sort());
  });

  it("lucide-react에서 가져온 이름이 모두 lucide-react.d.ts의 정식 이름이다", () => {
    const violations = SCANNED_FILES.flatMap((file) => checkLucideImports(file, read(file)));
    expect(violations.map(format)).toEqual([]);
  });

  it("ui-core에 예약 상태 키 5종과 상태 토큰 클래스가 0건이다(테스트 파일 포함)", () => {
    const violations = UI_CORE_FILES.flatMap((file) => checkDomainBoundary(file, read(file)));
    expect(violations.map(format)).toEqual([]);
  });

  it("src/styles/index.css에 .dark 외의 클래스 선택자가 없다", () => {
    const file = "src/styles/index.css";
    expect(checkGlobalCssSelectors(file, read(file)).map(format)).toEqual([]);
  });
});

describe("디자인 규칙 — 공개 API와 구성(AC-UI-001-09)", () => {
  // M5에서 공개 이름 40개와 컴포넌트 파일 29개가 완성됐다(M1~M4는 '지금까지 만든 것' 목록과 비교했다).
  it("@/ui-core의 런타임 내보내기가 공개 이름 40개와 정확히 같다", async () => {
    const module = await import("@/ui-core");
    expect(PUBLIC_NAMES).toHaveLength(40);
    expect(Object.keys(module).sort()).toEqual([...PUBLIC_NAMES].sort());
    // @/ui-core 전체를 처음 불러오는 사례라 전체 스위트의 병렬 실행에서 기본 제한(5초)에 닿는다(2026-11-09 실측 5.0~5.1초 — 단독 2.0초).
  }, 20_000);

  it("index.ts에 export *가 없다", () => {
    expect(read("src/ui-core/index.ts")).not.toMatch(/export\s+\*/);
  });

  it("컴포넌트 파일(테스트·cn.ts·index.ts 제외)이 정해진 29개와 정확히 같다", () => {
    const files = UI_CORE_FILES.map((file) => path.basename(file)).filter(
      (file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"),
    );
    expect(COMPONENT_FILES).toHaveLength(29);
    expect(files.sort()).toEqual([...COMPONENT_FILES].sort());
  });

  it("각 컴포넌트 파일이 기반 라이브러리 표의 패키지를 가져온다", () => {
    const missing = COMPONENT_FILES.flatMap((file) => {
      const text = read(`src/ui-core/${file}`);
      return (BASE_LIBRARIES[file] ?? [])
        .filter((pkg) => !new RegExp(`from\\s+["']${pkg}["']`).test(text))
        .map((pkg) => `${file}: ${pkg}`);
    });
    expect(missing).toEqual([]);
  });

  it("react-day-picker와 cmdk는 표에 적힌 파일 밖에서 가져오지 않는다", () => {
    const violations = SCANNED_FILES.flatMap((file) => checkConfinedPackages(file, read(file)));
    expect(violations.map(format)).toEqual([]);
  });

  it("미리보기는 @/ui-core에서만 ui-core를 가져온다", () => {
    const violations = PREVIEW_FILES.flatMap((file) => checkPreviewImports(file, read(file)));
    expect(violations.map(format)).toEqual([]);
  });
});

// ── 자기 검사(EC-18) ───────────────────────────────────────────────────────────────────

describe("디자인 규칙 자기 검사(EC-18)", () => {
  it("설치된 theme.css·lucide-react.d.ts에서 만든 이름 집합의 크기가 조사 기록과 같다", () => {
    expect(COLOR_FAMILIES).toHaveLength(26);
    expect(COLOR_SHADES).toHaveLength(11);
    // 26계열 × 11단계 = 286개에 black·white를 더해 288개
    expect(COLOR_SCALE).toHaveLength(286);
    expect(THEME_CSS).toMatch(/--color-black:/);
    expect(THEME_CSS).toMatch(/--color-white:/);
    expect(RADIUS_NAMES).toHaveLength(8);
    expect(SHADOW_NAMES).toHaveLength(8);
    expect(INSET_SHADOW_NAMES).toHaveLength(3);
    expect(DROP_SHADOW_NAMES).toHaveLength(6);
    expect(TEXT_SHADOW_NAMES).toHaveLength(5);
    expect(TEXT_NAMES).toHaveLength(13);
    expect(CONTAINER_NAMES).toHaveLength(13);
    expect(LUCIDE_NAMES.size).toBe(1999);
  });

  const sample = [
    'const base = "bg-card text-body rounded-control";', // 1 위반 없음
    'const dark = "dark:bg-card";', // 2
    'const palette = "bg-rose-700 hover:text-white";', // 3
    'const size = "rounded-lg shadow-xl text-sm";', // 4
    'const container = "basis-md @md:flex";', // 5
    'const outline = "outline-none hover:opacity-80";', // 6
    'const ring = "focus-visible:ring-2 ring-offset-2";', // 7
    'const spin = "animate-spin motion-safe:animate-spin";', // 8
    'const fine = "font-black max-w-dialog-md rounded-full shadow-none";', // 9 위반 없음
  ].join("\n");

  it("규칙마다 위반 표본을 잡고 실패 메시지에 경로:줄이 들어 있다", () => {
    const messages = checkClassRules("src/ui-core/sample.tsx", sample).map(format);
    expect(messages).toEqual([
      "src/ui-core/sample.tsx:2 dark: 변형: dark:bg-card",
      "src/ui-core/sample.tsx:3 기본 테마 이름: bg-rose-700",
      "src/ui-core/sample.tsx:3 기본 테마 이름: hover:text-white",
      "src/ui-core/sample.tsx:4 기본 테마 이름: rounded-lg",
      "src/ui-core/sample.tsx:4 기본 테마 이름: shadow-xl",
      "src/ui-core/sample.tsx:4 기본 테마 이름: text-sm",
      "src/ui-core/sample.tsx:5 기본 테마 이름: basis-md",
      "src/ui-core/sample.tsx:5 기본 테마 이름: @md:flex",
      "src/ui-core/sample.tsx:6 outline-none: outline-none",
      "src/ui-core/sample.tsx:6 hover:opacity-: hover:opacity-80",
      "src/ui-core/sample.tsx:7 box-shadow 포커스 링: focus-visible:ring-2",
      "src/ui-core/sample.tsx:7 box-shadow 포커스 링: ring-offset-2",
      "src/ui-core/sample.tsx:8 조건 없는 animate-*: animate-spin",
    ]);
  });

  it("font-black과 토큰 클래스 max-w-dialog-md는 잡지 않는다(거짓 실패 방지)", () => {
    const messages = checkClassRules("src/ui-core/sample.tsx", sample).map(format).join("\n");
    expect(messages).not.toContain("font-black");
    expect(messages).not.toContain("max-w-dialog-md");
  });

  it("VerificationSection.tsx의 허용 구역 안에서는 기본 테마 이름만 건너뛰고, 구역 바로 앞뒤의 표본은 잡는다", () => {
    const zone = [
      'const before = "bg-rose-700";', // 1 허용 구역 바로 앞
      "// design-rules:allow-start", // 2
      'const demo = "bg-rose-700 text-white rounded-lg shadow-xl text-sm dark:bg-card";', // 3
      "// design-rules:allow-end", // 4
      'const leak = "bg-rose-700";', // 5 허용 구역 바로 뒤
    ].join("\n");
    expect(checkClassRules(ALLOW_ZONE_FILE, zone).map(format)).toEqual([
      `${ALLOW_ZONE_FILE}:1 기본 테마 이름: bg-rose-700`,
      `${ALLOW_ZONE_FILE}:3 dark: 변형: dark:bg-card`,
      `${ALLOW_ZONE_FILE}:5 기본 테마 이름: bg-rose-700`,
    ]);
  });

  it("다른 파일의 허용 구역 표시는 위반으로 보고하고 구역을 열지 않는다", () => {
    const zone = [
      "// design-rules:allow-start",
      'const demo = "bg-rose-700";',
      "// design-rules:allow-end",
    ].join("\n");
    for (const file of ["src/ui-core/button.tsx", "src/preview/sections/ActionsSection.tsx"]) {
      expect(checkClassRules(file, zone).map(format)).toEqual([
        `${file}:1 허용 구역 표시: ${ALLOW_ZONE_FILE}에서만 쓴다`,
        `${file}:2 기본 테마 이름: bg-rose-700`,
        `${file}:3 허용 구역 표시: ${ALLOW_ZONE_FILE}에서만 쓴다`,
      ]);
    }
  });

  it("끝 표시가 없는 허용 구역은 위반으로 보고한다(파일 끝까지 건너뛰는 거짓 통과 방지)", () => {
    const zone = ["// design-rules:allow-start", 'const demo = "bg-rose-700";'].join("\n");
    expect(checkClassRules(ALLOW_ZONE_FILE, zone).map(format)).toEqual([
      `${ALLOW_ZONE_FILE}:1 허용 구역 표시: 끝 표시가 없다`,
    ]);
  });

  it("lucide 별칭(Loader2)과 …Icon 접미 이름을 잡고 정식 이름과 타입 가져오기는 통과시킨다", () => {
    const source = [
      'import type { LucideIcon } from "lucide-react";',
      'import { LoaderCircle, Sun } from "lucide-react";',
      'import { Loader2, SunIcon } from "lucide-react";',
    ].join("\n");
    expect(checkLucideImports("src/ui-core/sample.tsx", source).map(format)).toEqual([
      "src/ui-core/sample.tsx:3 lucide 정식 이름 아님: Loader2",
      "src/ui-core/sample.tsx:3 lucide 정식 이름 아님: SunIcon",
    ]);
  });

  it("예약 상태 키와 상태 토큰 클래스를 잡는다", () => {
    const source = [
      'const ok = "bg-muted";',
      'const key = "NO_SHOW";',
      'const cls = "bg-status-no-show-rail";',
    ].join("\n");
    expect(checkDomainBoundary("src/ui-core/sample.tsx", source).map(format)).toEqual([
      "src/ui-core/sample.tsx:2 예약 상태 참조: NO_SHOW",
      "src/ui-core/sample.tsx:3 예약 상태 참조: status-no-show",
    ]);
  });

  it("index.css의 허용 밖 클래스 선택자를 잡고 .dark·소수·주석·문자열은 건너뛴다", () => {
    const css = [
      "@custom-variant dark (&:where(.dark, .dark *));",
      "/* .comment 는 무시 */",
      '@import "./tokens.css";',
      "body { line-height: 1.5; transition-duration: 0.01ms; }",
      ".card { color: red; }",
    ].join("\n");
    expect(checkGlobalCssSelectors("src/styles/index.css", css).map(format)).toEqual([
      "src/styles/index.css:5 허용 밖 클래스 선택자: .card",
    ]);
  });

  it("미리보기의 ui-core 하위 경로·상대 경로 가져오기를 잡는다", () => {
    const source = [
      'import { Button } from "@/ui-core";',
      'import { Button as B } from "@/ui-core/button";',
      'import { cn } from "../ui-core/cn";',
    ].join("\n");
    expect(checkPreviewImports("src/preview/Sample.tsx", source).map(format)).toEqual([
      "src/preview/Sample.tsx:2 @/ui-core 외 경로 가져오기: @/ui-core/button",
      "src/preview/Sample.tsx:3 @/ui-core 외 경로 가져오기: ../ui-core/cn",
    ]);
  });

  it("cmdk를 표에 없는 파일에서 가져오면 잡는다", () => {
    expect(
      checkConfinedPackages("src/ui-core/select.tsx", 'import { Command } from "cmdk";'),
    ).toHaveLength(1);
    expect(
      checkConfinedPackages("src/ui-core/combobox.tsx", 'import { Command } from "cmdk";'),
    ).toHaveLength(0);
  });
});
