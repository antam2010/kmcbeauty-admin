// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { beforeAll, describe, expect, it } from "vitest";

const STYLES_DIR = fileURLToPath(new URL(".", import.meta.url));
const TAILWIND_DIR = path.dirname(
  createRequire(import.meta.url).resolve("tailwindcss/package.json"),
);

// acceptance.md AC-UI-001-06의 후보 클래스
const FORBIDDEN = ["bg-rose-700", "text-white", "rounded-lg", "shadow-xl", "text-sm"];
const TOKEN_CLASSES = [
  "bg-background",
  "rounded-panel",
  "shadow-raised",
  "text-body",
  "text-heading",
  "max-w-content",
  "bg-status-reserved-bg",
];
const STATIC_UTILITIES = [
  "rounded-full",
  "rounded-none",
  "bg-transparent",
  "bg-current",
  "shadow-none",
];

/** src/styles/index.css를 Tailwind의 compile API로 실제 파이프라인과 같은 방식으로 컴파일한다. */
async function compileIndexCss(): Promise<(candidates: string[]) => string> {
  const css = readFileSync(path.join(STYLES_DIR, "index.css"), "utf8");
  const compiler = await compile(css, {
    base: STYLES_DIR,
    loadStylesheet: async (id, base) => {
      if (id === "tailwindcss") {
        const file = path.join(TAILWIND_DIR, "index.css");
        return { path: file, base: TAILWIND_DIR, content: readFileSync(file, "utf8") };
      }
      if (id.startsWith("@fontsource")) {
        // 글꼴 패키지의 @font-face는 이 검사와 관계가 없어 빈 내용으로 바꾼다.
        return { path: id, base, content: "" };
      }
      const file = path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
    },
  });
  return (candidates) => compiler.build(candidates);
}

/** `.클래스 {`로 시작하는 규칙 블록 전체(중첩 블록 포함)를 돌려준다. 없으면 null. */
function ruleFor(css: string, className: string): string | null {
  const selector = new RegExp(`(^|[\\s,}])\\.${className.replace(/[-/[\]]/g, "\\$&")}\\s*\\{`, "m");
  const match = selector.exec(css);
  if (!match) return null;
  let depth = 0;
  for (let index = match.index; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(match.index, index + 1);
    }
  }
  return null;
}

describe("Tailwind 기본 테마 정리(AC-UI-001-06, design-direction §6.5 1~4)", () => {
  let output = "";

  beforeAll(async () => {
    const build = await compileIndexCss();
    output = build([...FORBIDDEN, ...TOKEN_CLASSES, ...STATIC_UTILITIES, "outline-hidden"]);
  });

  it.each(FORBIDDEN)("기본 테마 클래스 %s는 규칙을 만들지 않는다", (className) => {
    expect(ruleFor(output, className)).toBeNull();
  });

  it.each(TOKEN_CLASSES)("토큰 클래스 %s는 규칙을 만든다", (className) => {
    expect(ruleFor(output, className)).not.toBeNull();
  });

  it.each(STATIC_UTILITIES)("정리 뒤에도 정적 유틸리티 %s는 규칙을 만든다", (className) => {
    expect(ruleFor(output, className)).not.toBeNull();
  });

  it("text-heading 규칙에 자간 하위 값이 함께 들어간다", () => {
    expect(ruleFor(output, "text-heading")).toMatch(
      /letter-spacing:\s*var\(--tw-tracking,\s*var\(--text-heading--letter-spacing\)\)/,
    );
    expect(output).toMatch(/--text-heading--letter-spacing:\s*-0\.02em/);
  });

  it("text-body 규칙의 줄높이는 --text-body--line-height(1.375rem = 22px)를 쓴다", () => {
    expect(ruleFor(output, "text-body")).toMatch(
      /line-height:\s*var\(--tw-leading,\s*var\(--text-body--line-height\)\)/,
    );
    expect(output).toMatch(/--text-body--line-height:\s*1\.375rem/);
  });

  it("outline-hidden은 forced-colors 블록에서 윤곽선을 남긴다", () => {
    const rule = ruleFor(output, "outline-hidden") ?? "";
    expect(rule).toMatch(
      /@media \(forced-colors: active\)\s*\{[^}]*outline:\s*2px solid transparent/,
    );
  });

  it("토큰 클래스는 런타임 변수를 가리킨다(테마 전환이 변수 값만 바꾼다)", () => {
    expect(ruleFor(output, "bg-background")).toMatch(/background-color:\s*var\(--background\)/);
    expect(ruleFor(output, "rounded-panel")).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(ruleFor(output, "bg-status-reserved-bg")).toMatch(/var\(--status-reserved-bg\)/);
  });
});

describe("감속 모드 안전망(AC-UI-001-13)", () => {
  it("기본 계층에 prefers-reduced-motion 안전망(0.01ms, 반복 1회)이 있다", async () => {
    const build = await compileIndexCss();
    const output = build([]);
    const start = output.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(start).toBeGreaterThan(-1);
    const block = output.slice(start, start + 600);
    expect(block).toMatch(/animation-duration:\s*0\.01ms/);
    expect(block).toMatch(/animation-iteration-count:\s*1/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms/);
  });
});
