// @vitest-environment node
// 빌드 산출물 검사 스크립트(AC-UI-002-13 (다) 동작, QG-18 미리보기 부분). 임시 디렉터리에 만든 가짜 dist로 실행한다.
// CSP 해시 검사(QG-17)는 M8에서 같은 스크립트에 더한다.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = path.join(process.cwd(), "scripts/check-dist.mjs");
const sandboxes: string[] = [];

function fakeDist(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "check-dist-"));
  sandboxes.push(dir);
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(dir, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return dir;
}

function run(dist: string) {
  return spawnSync(process.execPath, [SCRIPT, dist], { encoding: "utf8" });
}

afterEach(() => {
  for (const dir of sandboxes.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const INDEX =
  '<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="root"></div></body></html>';

describe("scripts/check-dist.mjs — 운영 빌드에 미리보기 없음(QG-18)", () => {
  it("JS 파일에 미리보기 흔적이 없으면 종료 코드 0이다", () => {
    const dist = fakeDist({
      "index.html": INDEX,
      "assets/index-abc.js": 'console.log("예약 캘린더")',
      "assets/nested/chunk-1.js": "export const a = 1;",
    });
    const result = run(dist);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("check:dist ok");
    expect(result.stderr).toBe("");
  });

  it.each([
    ["미리보기 제목", 'const t = "컴포넌트 미리보기";'],
    ["시연 클래스", 'className: "bg-rose-700 text-white"'],
  ])("JS 파일에 %s가 있으면 종료 코드 1이고 그 파일 경로를 알린다", (_name, content) => {
    const dist = fakeDist({ "index.html": INDEX, "assets/preview-xyz.js": content });
    const result = run(dist);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("assets/preview-xyz.js");
  });

  it("CSS에 시연 클래스가 있어도 판정하지 않는다(테마 정리로 원래 규칙이 없다 — plan.md §B.9)", () => {
    const dist = fakeDist({
      "index.html": INDEX,
      "assets/index.js": "export {};",
      "assets/index.css": ".bg-rose-700{}",
    });
    expect(run(dist).status).toBe(0);
  });

  it("dist/index.html이 없으면(빌드 전) 종료 코드 1이다", () => {
    const dist = fakeDist({ "assets/index.js": "1" });
    const result = run(dist);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("index.html");
  });

  it("JS 파일이 하나도 없으면 종료 코드 1이다(빈 산출물을 통과로 보지 않는다)", () => {
    const result = run(fakeDist({ "index.html": INDEX }));
    expect(result.status).toBe(1);
  });
});

describe("package.json check:dist 스크립트", () => {
  it("node scripts/check-dist.mjs를 실행한다", async () => {
    const pkg = (await import("../../package.json", { with: { type: "json" } })).default as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["check:dist"]).toBe("node scripts/check-dist.mjs");
  });
});
