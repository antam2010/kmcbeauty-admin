// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type CssDeclarations, parseDeclarationBlocks } from "./contrast";

// system.md가 토큰 값의 정본이다. 표 형식이 바뀌면 이 테스트가 깨지는 것이 의도한 동작이다(system.md §13).
const SYSTEM_MD = readFileSync(new URL("../../.moai/design/system.md", import.meta.url), "utf8");
const TOKENS_CSS = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const INDEX_CSS = readFileSync(new URL("./index.css", import.meta.url), "utf8");

// acceptance.md AC-UI-001-05의 기대 행 수
const EXPECTED_ROWS = { surfaces: 14, tones: 19, statuses: 5, shadows: 2, typeScale: 7 } as const;

/** 마크다운에서 제목 줄 다음부터 같은 수준 이상의 다음 제목 전까지를 돌려준다. */
function section(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) throw new Error(`system.md에서 '${heading}' 제목을 찾지 못했다`);
  const level = heading.split(" ")[0].length;
  const end = lines.findIndex(
    (line, index) => index > start && /^#{1,6} /.test(line) && line.split(" ")[0].length <= level,
  );
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n");
}

/** 표의 본문 행(머리글·구분 행 제외)을 칸 배열로 돌려준다. */
function tableRows(body: string): string[][] {
  const rows = body
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    );
  return rows.slice(2);
}

/** 칸 안의 첫 번째 백틱 조각을 돌려준다. */
function code(cell: string): string {
  const match = cell.match(/`([^`]+)`/);
  if (!match) throw new Error(`백틱 값이 없는 칸: ${cell}`);
  return match[1];
}

function allCodes(cell: string): string[] {
  return [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

/** 공백을 하나로 모으고 소수를 같은 꼴로 맞춘다(서식 도구가 `0.10`을 `0.1`로 바꿔도 같은 값으로 본다). */
const normalize = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/-?\d*\.\d+/g, (number) => String(Number(number)));

/** 16px 기준으로 rem과 px을 같은 값으로 본다. */
function toPx(value: string): number {
  const match = value.trim().match(/^(-?[\d.]+)(px|rem)$/);
  if (!match) throw new Error(`크기 값이 아니다: ${value}`);
  return match[2] === "rem" ? Number(match[1]) * 16 : Number(match[1]);
}

interface Expectation {
  where: string;
  name: string;
  expected: string;
  actual: string | undefined;
}

interface SyncResult {
  rows: Record<keyof typeof EXPECTED_ROWS, number>;
  checked: number;
  problems: string[];
}

function block(blocks: Map<string, CssDeclarations>, selector: string): CssDeclarations {
  return blocks.get(selector) ?? {};
}

/** system.md의 값과 tokens.css·index.css의 값을 비교해 다른 점을 돌려준다(EC-20 자기 검사에도 같은 함수를 쓴다). */
function compareTokens(systemMd: string, tokensCss: string, indexCss: string): SyncResult {
  const tokenBlocks = parseDeclarationBlocks(tokensCss);
  const indexBlocks = parseDeclarationBlocks(indexCss);
  const light = block(tokenBlocks, ":root, .light");
  const dark = block(tokenBlocks, ".dark");
  const root = block(tokenBlocks, ":root");
  const theme = block(indexBlocks, "@theme");
  const themeInline = block(indexBlocks, "@theme inline");
  const expectations: Expectation[] = [];
  const expectBoth = (name: string, lightValue: string, darkValue: string) => {
    expectations.push({
      where: "tokens.css 라이트",
      name,
      expected: lightValue,
      actual: light[name],
    });
    expectations.push({ where: "tokens.css 다크", name, expected: darkValue, actual: dark[name] });
  };

  // §2 면·중립
  const surfaces = tableRows(section(systemMd, "### 면·중립"));
  for (const [token, lightCell, darkCell] of surfaces) {
    expectBoth(`--${code(token)}`, code(lightCell), code(darkCell));
  }

  // §2 톤 — info-*는 primary-*의 별칭
  const tones = tableRows(section(systemMd, "### 톤"));
  for (const [token, lightCell, darkCell] of tones) {
    const name = code(token);
    if (name === "info-*") {
      for (const slot of ["", "-foreground", "-subtle", "-subtle-foreground"]) {
        expectBoth(`--info${slot}`, `var(--primary${slot})`, `var(--primary${slot})`);
      }
    } else {
      expectBoth(`--${name}`, code(lightCell), code(darkCell));
    }
  }

  // §2 예약 상태 — 한 칸에 bg / fg / rail
  const statuses = tableRows(section(systemMd, "### 예약 상태"));
  for (const [label, lightCell, darkCell] of statuses) {
    const key = code(label);
    const lightValues = allCodes(lightCell);
    const darkValues = allCodes(darkCell);
    ["bg", "fg", "rail"].forEach((slot, index) => {
      expectBoth(`--status-${key}-${slot}`, lightValues[index], darkValues[index]);
    });
  }

  // §2 그림자
  const shadows = tableRows(section(systemMd, "### 그림자"));
  for (const [token, lightCell, darkCell] of shadows) {
    expectBoth(`--${code(token)}`, normalize(code(lightCell)), normalize(code(darkCell)));
  }

  // §3 테마 무관 값, 파생 반경 식, 폭
  const mapping = section(systemMd, "## 3. Tailwind 4 매핑");
  const declarations = [...mapping.matchAll(/`(--[\w/-]+): ([^`]+)`/g)].map(
    (match) => [match[1], match[2].trim()] as const,
  );
  for (const [name, value] of declarations) {
    if (/^--(radius|sidebar-width|sidebar-width-collapsed)$/.test(name)) {
      expectations.push({ where: "tokens.css :root", name, expected: value, actual: root[name] });
    } else if (name.startsWith("--radius-") || name.startsWith("--shadow-")) {
      expectations.push({
        where: "index.css @theme inline",
        name,
        expected: value,
        actual: themeInline[name],
      });
    } else if (name.startsWith("--container-")) {
      // `--container-dialog-sm/md/lg: 25/35/45rem` 같은 묶음 표기를 풀어 비교한다.
      const [first, ...rest] = name.replace("--container-", "").split("/");
      const prefix = first.slice(0, first.lastIndexOf("-") + 1);
      const names = [first, ...rest.map((suffix) => prefix + suffix)];
      const unit = value.replace(/^[\d/.]+/, "");
      const numbers = value.replace(unit, "").split("/");
      names.forEach((widthName, index) => {
        expectations.push({
          where: "index.css @theme",
          name: `--container-${widthName}`,
          expected: `${numbers[index]}${unit}`,
          actual: theme[`--container-${widthName}`],
        });
      });
    }
  }

  // §4 글꼴
  const typography = section(systemMd, "## 4. 타이포그래피");
  for (const match of typography.matchAll(/^- `(--font-(?:sans|mono))`: `([^`]+)`/gm)) {
    expectations.push({
      where: "index.css @theme",
      name: match[1],
      expected: normalize(match[2]),
      actual: theme[match[1]] === undefined ? undefined : normalize(theme[match[1]]),
    });
  }

  // §4 글자 크기 7행 — 크기 / 줄높이(px) · 자간
  const typeScale = tableRows(typography);
  const sizeProblems: string[] = [];
  for (const [utility, sizeCell, trackingCell] of typeScale) {
    const name = code(utility).replace(/^text-/, "");
    const [size, lineHeight] = sizeCell
      .replace("px", "")
      .split("/")
      .map((part) => Number(part.trim()));
    const actualSize = theme[`--text-${name}`];
    const actualLineHeight = theme[`--text-${name}--line-height`];
    const actualTracking = theme[`--text-${name}--letter-spacing`];
    if (actualSize === undefined || toPx(actualSize) !== size) {
      sizeProblems.push(`--text-${name}: system.md ${size}px ≠ index.css ${actualSize}`);
    }
    if (actualLineHeight === undefined || toPx(actualLineHeight) !== lineHeight) {
      sizeProblems.push(
        `--text-${name}--line-height: system.md ${lineHeight}px ≠ index.css ${actualLineHeight}`,
      );
    }
    if (actualTracking === undefined || normalize(actualTracking) !== normalize(trackingCell)) {
      sizeProblems.push(
        `--text-${name}--letter-spacing: system.md ${trackingCell} ≠ index.css ${actualTracking}`,
      );
    }
  }

  const problems = [
    ...expectations
      .filter(
        (entry) =>
          entry.actual === undefined || normalize(entry.actual) !== normalize(entry.expected),
      )
      .map(
        (entry) =>
          `${entry.name}(${entry.where}): system.md ${entry.expected} ≠ ${entry.actual ?? "없음"}`,
      ),
    ...sizeProblems,
  ];

  return {
    rows: {
      surfaces: surfaces.length,
      tones: tones.length,
      statuses: statuses.length,
      shadows: shadows.length,
      typeScale: typeScale.length,
    },
    checked: expectations.length + typeScale.length * 3,
    problems,
  };
}

describe("토큰 동기화 — system.md ↔ tokens.css·index.css(AC-UI-001-05)", () => {
  const result = compareTokens(SYSTEM_MD, TOKENS_CSS, INDEX_CSS);

  it("system.md 표에서 읽은 행 수가 기대값(14·19·5·2·7)과 같다", () => {
    expect(result.rows).toEqual(EXPECTED_ROWS);
  });

  it("색 36개·상태 15개의 라이트·다크 값, 그림자, 반경, 글꼴, 글자 크기, 폭, 사이드바 폭이 모두 같다", () => {
    expect(result.problems).toEqual([]);
  });

  it("비교한 값의 수가 표 전체를 덮는다(빈 비교로 통과하지 않음)", () => {
    const colors = (36 + 15) * 2; // 색 36 + 상태 15, 라이트·다크
    const shadows = 2 * 2 + 2; // 그림자 값 2 × 2테마 + 매핑 2
    const radius = 1 + 4; // --radius와 파생 반경 4
    const sidebar = 2;
    const widths = 5;
    const fonts = 2;
    const typeScale = 7 * 3; // 크기·줄높이·자간
    expect(result.checked).toBe(colors + shadows + radius + sidebar + widths + fonts + typeScale);
  });

  it("테마마다 color-scheme을 지정한다(라이트 light, 다크 dark)", () => {
    const blocks = parseDeclarationBlocks(TOKENS_CSS);
    expect(blocks.get(":root, .light")?.["color-scheme"]).toBe("light");
    expect(blocks.get(".dark")?.["color-scheme"]).toBe("dark");
  });
});

describe("토큰 동기화 자기 검사(EC-20)", () => {
  it("system.md 사본의 값 하나를 바꾸면 그 토큰 이름과 두 값을 보고한다", () => {
    const changed = SYSTEM_MD.replace("| `card` | `#ffffff` |", "| `card` | `#fefefe` |");
    expect(changed).not.toBe(SYSTEM_MD);
    const { problems } = compareTokens(changed, TOKENS_CSS, INDEX_CSS);
    expect(problems).toEqual(["--card(tokens.css 라이트): system.md #fefefe ≠ #ffffff"]);
  });

  it("글자 크기 값을 바꾸면 그 하위 값을 보고한다", () => {
    const changed = SYSTEM_MD.replace("| `text-body` | 14 / 22px |", "| `text-body` | 14 / 24px |");
    expect(changed).not.toBe(SYSTEM_MD);
    const { problems } = compareTokens(changed, TOKENS_CSS, INDEX_CSS);
    expect(problems).toEqual(["--text-body--line-height: system.md 24px ≠ index.css 1.375rem"]);
  });
});
