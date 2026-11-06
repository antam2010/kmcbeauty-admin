// @vitest-environment node
// @MX:NOTE: [AUTO] 토큰 값의 정본은 .moai/design/system.md §2이고, 아래 표는 design-direction.md §5.5의 실행 가능한 사본이다. 색을 바꿀 때는 system.md를 먼저 고치고 대비를 다시 계산해 이 표의 HEX·기록값을 갱신한다(system.md §13).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type CssDeclarations,
  contrastRatio,
  parseDeclarationBlocks,
  resolveVariable,
} from "./contrast";

type Theme = "light" | "dark";

interface PairRow {
  id: string;
  fg: string;
  bg: string;
  min: number;
  light: [fg: string, bg: string, ratio: number];
  dark: [fg: string, bg: string, ratio: number];
}

const TEXT = 4.5;
const UI = 3;

// design-direction.md §5.5 첫 번째 표 — 기준 있는 52쌍(T01~T36 텍스트, U01~U16 UI). D01·D02는 장식이라 기준이 없어 뺐다.
const PAIRS: PairRow[] = [
  {
    id: "T01",
    fg: "foreground",
    bg: "background",
    min: TEXT,
    light: ["#19212e", "#f7f8fa", 15.22],
    dark: ["#e9edf7", "#11141e", 15.68],
  },
  {
    id: "T02",
    fg: "foreground",
    bg: "card",
    min: TEXT,
    light: ["#19212e", "#ffffff", 16.17],
    dark: ["#e9edf7", "#1a1f2c", 14.04],
  },
  {
    id: "T03",
    fg: "foreground",
    bg: "popover",
    min: TEXT,
    light: ["#19212e", "#ffffff", 16.17],
    dark: ["#e9edf7", "#222838", 12.54],
  },
  {
    id: "T04",
    fg: "foreground",
    bg: "muted",
    min: TEXT,
    light: ["#19212e", "#eef1f5", 14.28],
    dark: ["#e9edf7", "#262d3c", 11.77],
  },
  {
    id: "T05",
    fg: "foreground",
    bg: "accent",
    min: TEXT,
    light: ["#19212e", "#eef1f5", 14.28],
    dark: ["#e9edf7", "#2e3648", 10.32],
  },
  {
    id: "T06",
    fg: "foreground",
    bg: "primary-subtle",
    min: TEXT,
    light: ["#19212e", "#e9effd", 14.04],
    dark: ["#e9edf7", "#243249", 11.01],
  },
  {
    id: "T07",
    fg: "muted-foreground",
    bg: "background",
    min: TEXT,
    light: ["#5b6779", "#f7f8fa", 5.4],
    dark: ["#a3aec0", "#11141e", 8.2],
  },
  {
    id: "T08",
    fg: "muted-foreground",
    bg: "card",
    min: TEXT,
    light: ["#5b6779", "#ffffff", 5.74],
    dark: ["#a3aec0", "#1a1f2c", 7.34],
  },
  {
    id: "T09",
    fg: "muted-foreground",
    bg: "popover",
    min: TEXT,
    light: ["#5b6779", "#ffffff", 5.74],
    dark: ["#a3aec0", "#222838", 6.56],
  },
  {
    id: "T10",
    fg: "muted-foreground",
    bg: "muted",
    min: TEXT,
    light: ["#5b6779", "#eef1f5", 5.06],
    dark: ["#a3aec0", "#262d3c", 6.15],
  },
  {
    id: "T11",
    fg: "muted-foreground",
    bg: "accent",
    min: TEXT,
    light: ["#5b6779", "#eef1f5", 5.06],
    dark: ["#a3aec0", "#2e3648", 5.39],
  },
  {
    id: "T12",
    fg: "muted-foreground",
    bg: "primary-subtle",
    min: TEXT,
    light: ["#5b6779", "#e9effd", 4.98],
    dark: ["#a3aec0", "#243249", 5.76],
  },
  {
    id: "T13",
    fg: "primary-foreground",
    bg: "primary",
    min: TEXT,
    light: ["#ffffff", "#2563eb", 5.17],
    dark: ["#11141e", "#60a5fa", 7.23],
  },
  {
    id: "T14",
    fg: "primary-foreground",
    bg: "primary-hover",
    min: TEXT,
    light: ["#ffffff", "#1d4ed8", 6.7],
    dark: ["#11141e", "#93c5fd", 10.19],
  },
  {
    id: "T15",
    fg: "primary",
    bg: "card",
    min: TEXT,
    light: ["#2563eb", "#ffffff", 5.17],
    dark: ["#60a5fa", "#1a1f2c", 6.47],
  },
  {
    id: "T16",
    fg: "primary",
    bg: "background",
    min: TEXT,
    light: ["#2563eb", "#f7f8fa", 4.86],
    dark: ["#60a5fa", "#11141e", 7.23],
  },
  {
    id: "T17",
    fg: "primary",
    bg: "popover",
    min: TEXT,
    light: ["#2563eb", "#ffffff", 5.17],
    dark: ["#60a5fa", "#222838", 5.78],
  },
  {
    id: "T18",
    fg: "primary-subtle-foreground",
    bg: "primary-subtle",
    min: TEXT,
    light: ["#1d4ed8", "#e9effd", 5.82],
    dark: ["#93c5fd", "#243249", 7.16],
  },
  {
    id: "T19",
    fg: "destructive-foreground",
    bg: "destructive",
    min: TEXT,
    light: ["#ffffff", "#bf2846", 5.82],
    dark: ["#11141e", "#ff9aaa", 9.15],
  },
  {
    id: "T20",
    fg: "destructive-foreground",
    bg: "destructive-hover",
    min: TEXT,
    light: ["#ffffff", "#9f1d3a", 7.75],
    dark: ["#11141e", "#ffc2cb", 12.1],
  },
  {
    id: "T21",
    fg: "destructive",
    bg: "card",
    min: TEXT,
    light: ["#bf2846", "#ffffff", 5.82],
    dark: ["#ff9aaa", "#1a1f2c", 8.19],
  },
  {
    id: "T22",
    fg: "destructive",
    bg: "background",
    min: TEXT,
    light: ["#bf2846", "#f7f8fa", 5.48],
    dark: ["#ff9aaa", "#11141e", 9.15],
  },
  {
    id: "T23",
    fg: "destructive",
    bg: "popover",
    min: TEXT,
    light: ["#bf2846", "#ffffff", 5.82],
    dark: ["#ff9aaa", "#222838", 7.32],
  },
  {
    id: "T24",
    fg: "destructive-subtle-foreground",
    bg: "destructive-subtle",
    min: TEXT,
    light: ["#9f1d3a", "#f9eaec", 6.64],
    dark: ["#ffc2cb", "#3a303e", 8.27],
  },
  {
    id: "T25",
    fg: "success-foreground",
    bg: "success",
    min: TEXT,
    light: ["#ffffff", "#047857", 5.48],
    dark: ["#11141e", "#34d399", 9.56],
  },
  {
    id: "T26",
    fg: "success",
    bg: "card",
    min: TEXT,
    light: ["#047857", "#ffffff", 5.48],
    dark: ["#34d399", "#1a1f2c", 8.56],
  },
  {
    id: "T27",
    fg: "success-subtle-foreground",
    bg: "success-subtle",
    min: TEXT,
    light: ["#065f46", "#e6f2ee", 6.7],
    dark: ["#6ee7b7", "#1e383b", 8.18],
  },
  {
    id: "T28",
    fg: "warning-foreground",
    bg: "warning",
    min: TEXT,
    light: ["#ffffff", "#b45309", 5.02],
    dark: ["#11141e", "#fbbf24", 11.01],
  },
  {
    id: "T29",
    fg: "warning",
    bg: "card",
    min: TEXT,
    light: ["#b45309", "#ffffff", 5.02],
    dark: ["#fbbf24", "#1a1f2c", 9.86],
  },
  {
    id: "T30",
    fg: "warning-subtle-foreground",
    bg: "warning-subtle",
    min: TEXT,
    light: ["#92400e", "#fef3c7", 6.37],
    dark: ["#fcd34d", "#3a352b", 8.45],
  },
  {
    id: "T31",
    fg: "foreground",
    bg: "success-subtle",
    min: TEXT,
    light: ["#19212e", "#e6f2ee", 14.1],
    dark: ["#e9edf7", "#1e383b", 10.64],
  },
  {
    id: "T32",
    fg: "foreground",
    bg: "warning-subtle",
    min: TEXT,
    light: ["#19212e", "#fef3c7", 14.53],
    dark: ["#e9edf7", "#3a352b", 10.4],
  },
  {
    id: "T33",
    fg: "foreground",
    bg: "destructive-subtle",
    min: TEXT,
    light: ["#19212e", "#f9eaec", 13.87],
    dark: ["#e9edf7", "#3a303e", 10.72],
  },
  {
    id: "T34",
    fg: "muted-foreground",
    bg: "success-subtle",
    min: TEXT,
    light: ["#5b6779", "#e6f2ee", 5.0],
    dark: ["#a3aec0", "#1e383b", 5.57],
  },
  {
    id: "T35",
    fg: "muted-foreground",
    bg: "warning-subtle",
    min: TEXT,
    light: ["#5b6779", "#fef3c7", 5.15],
    dark: ["#a3aec0", "#3a352b", 5.44],
  },
  {
    id: "T36",
    fg: "muted-foreground",
    bg: "destructive-subtle",
    min: TEXT,
    light: ["#5b6779", "#f9eaec", 4.92],
    dark: ["#a3aec0", "#3a303e", 5.6],
  },
  {
    id: "U01",
    fg: "input",
    bg: "card",
    min: UI,
    light: ["#808b9d", "#ffffff", 3.44],
    dark: ["#6b768e", "#1a1f2c", 3.61],
  },
  {
    id: "U02",
    fg: "input",
    bg: "background",
    min: UI,
    light: ["#808b9d", "#f7f8fa", 3.24],
    dark: ["#6b768e", "#11141e", 4.03],
  },
  {
    id: "U03",
    fg: "input",
    bg: "popover",
    min: UI,
    light: ["#808b9d", "#ffffff", 3.44],
    dark: ["#6b768e", "#222838", 3.22],
  },
  {
    id: "U04",
    fg: "input",
    bg: "muted",
    min: UI,
    light: ["#808b9d", "#eef1f5", 3.04],
    dark: ["#6b768e", "#262d3c", 3.03],
  },
  {
    id: "U05",
    fg: "ring",
    bg: "card",
    min: UI,
    light: ["#2563eb", "#ffffff", 5.17],
    dark: ["#60a5fa", "#1a1f2c", 6.47],
  },
  {
    id: "U06",
    fg: "ring",
    bg: "background",
    min: UI,
    light: ["#2563eb", "#f7f8fa", 4.86],
    dark: ["#60a5fa", "#11141e", 7.23],
  },
  {
    id: "U07",
    fg: "ring",
    bg: "popover",
    min: UI,
    light: ["#2563eb", "#ffffff", 5.17],
    dark: ["#60a5fa", "#222838", 5.78],
  },
  {
    id: "U08",
    fg: "ring",
    bg: "primary-subtle",
    min: UI,
    light: ["#2563eb", "#e9effd", 4.49],
    dark: ["#60a5fa", "#243249", 5.08],
  },
  {
    id: "U09",
    fg: "primary",
    bg: "card",
    min: UI,
    light: ["#2563eb", "#ffffff", 5.17],
    dark: ["#60a5fa", "#1a1f2c", 6.47],
  },
  {
    id: "U10",
    fg: "primary-foreground",
    bg: "primary",
    min: UI,
    light: ["#ffffff", "#2563eb", 5.17],
    dark: ["#11141e", "#60a5fa", 7.23],
  },
  {
    id: "U11",
    fg: "warning",
    bg: "card",
    min: UI,
    light: ["#b45309", "#ffffff", 5.02],
    dark: ["#fbbf24", "#1a1f2c", 9.86],
  },
  {
    id: "U12",
    fg: "success",
    bg: "card",
    min: UI,
    light: ["#047857", "#ffffff", 5.48],
    dark: ["#34d399", "#1a1f2c", 8.56],
  },
  {
    id: "U13",
    fg: "muted-foreground",
    bg: "card",
    min: UI,
    light: ["#5b6779", "#ffffff", 5.74],
    dark: ["#a3aec0", "#1a1f2c", 7.34],
  },
  {
    id: "U14",
    fg: "destructive",
    bg: "card",
    min: UI,
    light: ["#bf2846", "#ffffff", 5.82],
    dark: ["#ff9aaa", "#1a1f2c", 8.19],
  },
  {
    id: "U15",
    fg: "warning",
    bg: "background",
    min: UI,
    light: ["#b45309", "#f7f8fa", 4.73],
    dark: ["#fbbf24", "#11141e", 11.01],
  },
  {
    id: "U16",
    fg: "success",
    bg: "background",
    min: UI,
    light: ["#047857", "#f7f8fa", 5.16],
    dark: ["#34d399", "#11141e", 9.56],
  },
];

interface StatusRow {
  status: string;
  theme: Theme;
  bg: string;
  fg: string;
  rail: string;
  recorded: [
    fgOnBg: number,
    fgOnCard: number,
    fgOnPopover: number,
    fgOnBackground: number,
    foregroundOnBg: number,
    mutedForegroundOnBg: number,
    railOnCard: number,
    railOnBackground: number,
    railOnBg: number,
  ];
}

// design-direction.md §5.5 두 번째 표 — 예약 상태 5종 × 테마 2종 × 측정 9종 = 90개 값
const STATUS_ROWS: StatusRow[] = [
  {
    status: "reserved",
    theme: "light",
    bg: "#e0e7ff",
    fg: "#4338ca",
    rail: "#4f46e5",
    recorded: [6.41, 7.9, 7.9, 7.44, 13.13, 4.66, 6.29, 5.92, 5.1],
  },
  {
    status: "visited",
    theme: "light",
    bg: "#fae8ff",
    fg: "#86198f",
    rail: "#a21caf",
    recorded: [7.08, 8.24, 8.24, 7.75, 13.9, 4.93, 6.32, 5.95, 5.43],
  },
  {
    status: "completed",
    theme: "light",
    bg: "#e0f2fe",
    fg: "#075985",
    rail: "#0369a1",
    recorded: [6.59, 7.56, 7.56, 7.12, 14.1, 5.0, 5.93, 5.58, 5.17],
  },
  {
    status: "cancelled",
    theme: "light",
    bg: "#fee2e2",
    fg: "#b91c1c",
    rail: "#dc2626",
    recorded: [5.3, 6.47, 6.47, 6.09, 13.24, 4.7, 4.83, 4.54, 3.95],
  },
  {
    status: "no-show",
    theme: "light",
    bg: "#fef3c7",
    fg: "#92400e",
    rail: "#b45309",
    recorded: [6.37, 7.09, 7.09, 6.67, 14.53, 5.15, 5.02, 4.73, 4.51],
  },
  {
    status: "reserved",
    theme: "dark",
    bg: "#282e49",
    fg: "#a5b4fc",
    rail: "#818cf8",
    recorded: [6.68, 8.25, 7.37, 9.22, 11.36, 5.94, 5.52, 6.16, 4.46],
  },
  {
    status: "visited",
    theme: "dark",
    bg: "#372c49",
    fg: "#f0abfc",
    rail: "#e879f9",
    recorded: [7.37, 9.35, 8.35, 10.45, 11.07, 5.79, 6.69, 7.47, 5.27],
  },
  {
    status: "completed",
    theme: "dark",
    bg: "#1e3549",
    fg: "#7dd3fc",
    rail: "#38bdf8",
    recorded: [7.58, 9.87, 8.82, 11.02, 10.79, 5.64, 7.68, 8.58, 5.9],
  },
  {
    status: "cancelled",
    theme: "dark",
    bg: "#392a36",
    fg: "#fca5a5",
    rail: "#f87171",
    recorded: [7.1, 8.67, 7.74, 9.68, 11.5, 6.01, 5.95, 6.64, 4.87],
  },
  {
    status: "no-show",
    theme: "dark",
    bg: "#3a352b",
    fg: "#fcd34d",
    rail: "#fbbf24",
    recorded: [8.45, 11.41, 10.19, 12.75, 10.4, 5.44, 9.86, 11.01, 7.3],
  },
];

// 측정 9종의 [전경 변수, 배경 변수, 기준]. {s}는 상태 키로 바꾼다.
const STATUS_MEASURES: [fg: string, bg: string, min: number][] = [
  ["status-{s}-fg", "status-{s}-bg", TEXT],
  ["status-{s}-fg", "card", TEXT],
  ["status-{s}-fg", "popover", TEXT],
  ["status-{s}-fg", "background", TEXT],
  ["foreground", "status-{s}-bg", TEXT],
  ["muted-foreground", "status-{s}-bg", TEXT],
  ["status-{s}-rail", "card", UI],
  ["status-{s}-rail", "background", UI],
  ["status-{s}-rail", "status-{s}-bg", UI],
];

// 기록된 최저값(design-direction.md §5.5 '최저값')
const RECORDED_MINIMUM = {
  light: { text: 4.86, ui: 3.04, statusText: 4.66, statusRail: 3.95 },
  dark: { text: 5.39, ui: 3.03, statusText: 5.44, statusRail: 4.46 },
} as const;

const TOLERANCE = 0.01;

function loadThemes(): Record<Theme, CssDeclarations> {
  const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
  const blocks = parseDeclarationBlocks(css);
  const light = blocks.get(":root, .light");
  const dark = blocks.get(".dark");
  if (!light || !dark) {
    throw new Error("tokens.css에서 ':root, .light' 또는 '.dark' 블록을 찾지 못했다");
  }
  return { light, dark };
}

function measurePair(variables: CssDeclarations, fg: string, bg: string): number {
  return contrastRatio(resolveVariable(variables, fg), resolveVariable(variables, bg));
}

/** 기준을 넘지 못한 쌍을 한 줄씩 돌려준다(EC-19 자기 검사에도 같은 함수를 쓴다). */
function findContrastFailures(variables: CssDeclarations, theme: Theme): string[] {
  return PAIRS.flatMap((pair) => {
    const ratio = measurePair(variables, pair.fg, pair.bg);
    return ratio >= pair.min
      ? []
      : [`${pair.id} ${theme} ${pair.fg} / ${pair.bg} = ${ratio.toFixed(2)}:1 < ${pair.min}:1`];
  });
}

function statusMeasures(variables: CssDeclarations, status: string): number[] {
  return STATUS_MEASURES.map(([fg, bg]) =>
    measurePair(variables, fg.replace("{s}", status), bg.replace("{s}", status)),
  );
}

describe("면·톤 토큰 대비(AC-UI-001-05, REQ-UI-001-009)", () => {
  const themes = loadThemes();

  it("기준 있는 쌍은 52개다(텍스트 36, UI 16)", () => {
    expect(PAIRS).toHaveLength(52);
    expect(PAIRS.filter((pair) => pair.min === TEXT)).toHaveLength(36);
    expect(PAIRS.filter((pair) => pair.min === UI)).toHaveLength(16);
  });

  for (const theme of ["light", "dark"] as const) {
    it(`${theme}: 각 쌍의 토큰 값이 §5.5 표의 HEX와 같다`, () => {
      const mismatches = PAIRS.flatMap((pair) => {
        const [fgHex, bgHex] = pair[theme];
        const fg = resolveVariable(themes[theme], pair.fg);
        const bg = resolveVariable(themes[theme], pair.bg);
        return fg === fgHex && bg === bgHex
          ? []
          : [`${pair.id} ${pair.fg}=${fg}(기대 ${fgHex}) ${pair.bg}=${bg}(기대 ${bgHex})`];
      });
      expect(mismatches).toEqual([]);
    });

    it(`${theme}: 52쌍이 모두 기준(텍스트 4.5:1, UI 3:1)을 넘는다`, () => {
      expect(findContrastFailures(themes[theme], theme)).toEqual([]);
    });

    it(`${theme}: 각 쌍의 대비가 기록값과 ±0.01 안에서 같다`, () => {
      const drifts = PAIRS.flatMap((pair) => {
        const recorded = pair[theme][2];
        const ratio = measurePair(themes[theme], pair.fg, pair.bg);
        return Math.abs(ratio - recorded) <= TOLERANCE
          ? []
          : [`${pair.id} ${ratio.toFixed(3)}:1(기록 ${recorded}:1)`];
      });
      expect(drifts).toEqual([]);
    });

    it(`${theme}: 텍스트·UI 최저값이 기록된 최저값과 ±0.01 안에서 같다`, () => {
      const lowest = (min: number) =>
        Math.min(
          ...PAIRS.filter((pair) => pair.min === min).map((pair) =>
            measurePair(themes[theme], pair.fg, pair.bg),
          ),
        );
      expect(Math.abs(lowest(TEXT) - RECORDED_MINIMUM[theme].text)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(lowest(UI) - RECORDED_MINIMUM[theme].ui)).toBeLessThanOrEqual(TOLERANCE);
    });
  }
});

describe("예약 상태 토큰 대비 90개 값(AC-UI-001-05)", () => {
  const themes = loadThemes();

  it("상태 5종 × 테마 2종 × 측정 9종으로 90개 값을 잰다", () => {
    expect(STATUS_ROWS).toHaveLength(10);
    expect(STATUS_ROWS.length * STATUS_MEASURES.length).toBe(90);
  });

  for (const row of STATUS_ROWS) {
    it(`${row.theme} ${row.status}: bg·fg·rail 값이 §5.5 표와 같다`, () => {
      const variables = themes[row.theme];
      expect(resolveVariable(variables, `status-${row.status}-bg`)).toBe(row.bg);
      expect(resolveVariable(variables, `status-${row.status}-fg`)).toBe(row.fg);
      expect(resolveVariable(variables, `status-${row.status}-rail`)).toBe(row.rail);
    });

    it(`${row.theme} ${row.status}: 측정 9개가 기준을 넘고 기록값과 ±0.01 안에서 같다`, () => {
      const measured = statusMeasures(themes[row.theme], row.status);
      const problems = measured.flatMap((ratio, index) => {
        const [, , min] = STATUS_MEASURES[index];
        const recorded = row.recorded[index];
        const issues: string[] = [];
        if (ratio < min) issues.push(`측정 ${index + 1}: ${ratio.toFixed(2)}:1 < ${min}:1`);
        if (Math.abs(ratio - recorded) > TOLERANCE) {
          issues.push(`측정 ${index + 1}: ${ratio.toFixed(3)}:1(기록 ${recorded}:1)`);
        }
        return issues;
      });
      expect(problems).toEqual([]);
    });
  }

  for (const theme of ["light", "dark"] as const) {
    it(`${theme}: 상태 텍스트·레일 최저값이 기록된 최저값과 ±0.01 안에서 같다`, () => {
      const all = STATUS_ROWS.filter((row) => row.theme === theme).map((row) =>
        statusMeasures(themes[theme], row.status),
      );
      const textMin = Math.min(...all.flatMap((values) => values.slice(0, 6)));
      const railMin = Math.min(...all.flatMap((values) => values.slice(6)));
      expect(Math.abs(textMin - RECORDED_MINIMUM[theme].statusText)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(railMin - RECORDED_MINIMUM[theme].statusRail)).toBeLessThanOrEqual(TOLERANCE);
    });
  }
});

describe("대비 검사 자기 검사(EC-19)", () => {
  it("토큰 하나를 기준 미달 값으로 바꾼 사본에서 실패를 보고한다", () => {
    const copy = { ...loadThemes().light, "--muted-foreground": "#a3aec0" };
    const failures = findContrastFailures(copy, "light");
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]).toMatch(/^T07 light muted-foreground \/ background = /);
  });
});
