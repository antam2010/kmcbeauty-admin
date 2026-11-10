// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type DependencyMap = Record<string, string>;

interface DependencySections {
  dependencies?: DependencyMap;
  devDependencies?: DependencyMap;
}

interface PackageJson extends DependencySections {
  engines?: Record<string, string>;
}

// SPEC-UI-002 acceptance.md §3.4 고정 목록(25 + 19)을 글자 그대로 옮겼다. 기대값을 테스트가 만들지 않는다.
const PINNED = {
  dependencies: {
    "@fontsource-variable/noto-sans-kr": "5.3.1",
    "@radix-ui/react-alert-dialog": "1.2.1",
    "@radix-ui/react-checkbox": "1.4.1",
    "@radix-ui/react-dialog": "1.3.1",
    "@radix-ui/react-popover": "1.3.1",
    "@radix-ui/react-select": "2.4.1",
    "@radix-ui/react-slot": "1.5.0",
    "@radix-ui/react-tabs": "1.2.1",
    "@radix-ui/react-toast": "1.3.1",
    "@radix-ui/react-toggle-group": "1.2.1",
    "@radix-ui/react-tooltip": "1.4.1",
    "@fullcalendar/react": "7.1.4",
    "@tanstack/react-query": "5.107.1",
    "class-variance-authority": "0.7.1",
    clsx: "2.1.1",
    cmdk: "1.1.1",
    "date-fns": "4.4.0",
    "lucide-react": "1.64.0",
    "openapi-fetch": "0.17.0",
    react: "19.3.1",
    "react-day-picker": "10.0.2",
    "react-dom": "19.3.1",
    "react-router": "8.5.1",
    "tailwind-merge": "3.7.0",
    "temporal-polyfill": "1.0.8",
  },
  devDependencies: {
    "@biomejs/biome": "2.6.4",
    "@tailwindcss/vite": "4.3.3",
    "@testing-library/dom": "10.4.2",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.8",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.2",
    "@vitest/coverage-v8": "5.0.5",
    "axe-core": "4.14.0",
    jsdom: "29.1.1",
    msw: "3.0.4",
    "openapi-typescript": "7.13.0",
    tailwindcss: "4.3.3",
    typescript: "5.9.3",
    vite: "8.3.5",
    vitest: "5.0.5",
  },
} satisfies Required<DependencySections>;

// acceptance.md AC-UI-002-01: react-router 8의 node >=22.22.0 요구에 맞춘 engines 값
const ENGINES_NODE = "^22.22.0 || ^24.0.0";

/** 고정 목록과 다른 점을 한 줄씩 돌려준다. 빈 배열이면 이름과 버전 문자열까지 같다. */
function diffPins(actual: DependencySections, expected: Required<DependencySections>): string[] {
  const problems: string[] = [];
  for (const section of ["dependencies", "devDependencies"] as const) {
    const want = expected[section];
    const have = actual[section] ?? {};
    for (const [name, version] of Object.entries(want)) {
      if (!Object.hasOwn(have, name)) {
        problems.push(`${section}: ${name} 없음(기대 ${version})`);
      } else if (have[name] !== version) {
        problems.push(`${section}: ${name} = ${have[name]}(기대 ${version})`);
      }
    }
    for (const name of Object.keys(have)) {
      if (!Object.hasOwn(want, name)) {
        problems.push(`${section}: 고정 목록에 없는 ${name}`);
      }
    }
  }
  return problems;
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
}

function copyPinned(): Required<DependencySections> {
  return {
    dependencies: { ...PINNED.dependencies },
    devDependencies: { ...PINNED.devDependencies },
  };
}

describe("의존성 정확 고정(AC-UI-002-01)", () => {
  it("package.json의 dependencies·devDependencies가 고정 목록과 이름·버전 문자열까지 같다", () => {
    expect(diffPins(readPackageJson(), PINNED)).toEqual([]);
  });

  it("고정 목록은 dependencies 25개, devDependencies 19개다", () => {
    expect(Object.keys(PINNED.dependencies)).toHaveLength(25);
    expect(Object.keys(PINNED.devDependencies)).toHaveLength(19);
  });

  it(`engines.node가 "${ENGINES_NODE}"다`, () => {
    expect(readPackageJson().engines?.node).toBe(ENGINES_NODE);
  });

  it("고정 목록의 버전은 모두 범위 기호 없는 정확한 버전이다", () => {
    const versions = [
      ...Object.values(PINNED.dependencies),
      ...Object.values(PINNED.devDependencies),
    ];
    for (const version of versions) {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});

describe("비교 함수 자기 검사(EC-29)", () => {
  it("고정 목록과 같은 사본은 차이가 없다고 본다", () => {
    expect(diffPins(copyPinned(), PINNED)).toEqual([]);
  });

  it("고정 목록에 없는 항목이 남으면 실패로 보고한다", () => {
    const copy = copyPinned();
    copy.dependencies.zustand = "5.0.3";
    expect(diffPins(copy, PINNED)).toEqual(["dependencies: 고정 목록에 없는 zustand"]);
  });

  it("^ 범위 기호가 붙은 버전을 실패로 보고한다", () => {
    const copy = copyPinned();
    copy.dependencies.react = "^19.3.1";
    expect(diffPins(copy, PINNED)).toEqual(["dependencies: react = ^19.3.1(기대 19.3.1)"]);
  });

  it("다른 버전을 실패로 보고한다", () => {
    const copy = copyPinned();
    copy.devDependencies.vite = "7.3.7";
    expect(diffPins(copy, PINNED)).toEqual(["devDependencies: vite = 7.3.7(기대 8.3.5)"]);
  });

  it("빠진 항목을 실패로 보고한다", () => {
    const copy = copyPinned();
    delete copy.devDependencies.jsdom;
    expect(diffPins(copy, PINNED)).toEqual(["devDependencies: jsdom 없음(기대 29.1.1)"]);
  });
});
