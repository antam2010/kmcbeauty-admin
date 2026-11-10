// @vitest-environment node
// OpenAPI 내보내기 스크립트(AC-UI-002-02). 임시 디렉터리의 가짜 백엔드 폴더로 실행하므로
// 실제 백엔드에는 닿지 않는다. 대역 python은 받은 작업 디렉터리와 환경 변수를 기록 파일(가짜 폴더 밖)에 적고
// 최소 OpenAPI 문서를 표준 출력에 낸다.
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SCRIPT = path.join(ROOT, "scripts/export-openapi.mjs");

const FAKE_PYTHON = `#!/bin/sh
{
  printf 'cwd=%s\\n' "$(pwd)"
  printf 'PYTHONDONTWRITEBYTECODE=%s\\n' "\${PYTHONDONTWRITEBYTECODE-<unset>}"
  printf 'LOG_TO_FILE=%s\\n' "\${LOG_TO_FILE-<unset>}"
  printf 'SENTRY_DSN=[%s]\\n' "\${SENTRY_DSN-<unset>}"
} > "$FAKE_LOG"
echo "Failed to initialize Firebase Admin SDK (대역)" >&2
printf '{"openapi":"%s","info":{"title":"fake","version":"1"},"paths":{}}\\n' "\${FAKE_OPENAPI_VERSION:-3.1.0}"
exit "\${FAKE_EXIT:-0}"
`;

interface Sandbox {
  dir: string;
  backend: string;
  log: string;
  out: string;
}

const sandboxes: string[] = [];

function createSandbox(withPython = true): Sandbox {
  const dir = mkdtempSync(path.join(tmpdir(), "export-openapi-"));
  sandboxes.push(dir);
  const backend = path.join(dir, "backend");
  mkdirSync(path.join(backend, ".venv/bin"), { recursive: true });
  writeFileSync(path.join(backend, "README.md"), "가짜 백엔드\n");
  if (withPython) {
    const python = path.join(backend, ".venv/bin/python");
    writeFileSync(python, FAKE_PYTHON);
    chmodSync(python, 0o755);
  }
  return { dir, backend, log: path.join(dir, "fake.log"), out: path.join(dir, "out/openapi.json") };
}

afterEach(() => {
  for (const dir of sandboxes.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function runExport(sandbox: Sandbox, args: string[], extraEnv: Record<string, string> = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, KMC_BACKEND_DIR: sandbox.backend, FAKE_LOG: sandbox.log, ...extraEnv },
  });
}

/** 폴더 안 파일의 이름·크기·수정 시각 목록(실행 전후 비교용). */
function listing(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .sort()
    .map((entry) => {
      const stat = statSync(path.join(dir, entry));
      return `${entry} ${stat.size} ${stat.mtimeMs}`;
    });
}

describe("OpenAPI 내보내기 스크립트(AC-UI-002-02)", () => {
  it("--out 경로 한 곳에만 들여쓰기 2칸 문서를 쓰고 가짜 백엔드 폴더는 그대로 둔다", () => {
    const sandbox = createSandbox();
    const before = listing(sandbox.backend);

    const result = runExport(sandbox, ["--out", sandbox.out]);

    expect(result.status, result.stderr).toBe(0);
    expect(listing(sandbox.backend)).toEqual(before);
    expect(readdirSync(path.dirname(sandbox.out))).toEqual(["openapi.json"]);
    const text = readFileSync(sandbox.out, "utf8");
    const doc = JSON.parse(text);
    expect(doc.openapi).toBe("3.1.0");
    expect(text).toBe(`${JSON.stringify(doc, null, 2)}\n`);
  });

  it("백엔드 폴더를 작업 디렉터리로, 정해진 환경 변수로 python을 부른다", () => {
    const sandbox = createSandbox();

    const result = runExport(sandbox, ["--out", sandbox.out], { SENTRY_DSN: "https://x@sentry" });

    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(sandbox.log, "utf8").split("\n").filter(Boolean)).toEqual([
      `cwd=${sandbox.backend}`,
      "PYTHONDONTWRITEBYTECODE=1",
      "LOG_TO_FILE=false",
      "SENTRY_DSN=[]",
    ]);
  });

  it('대역이 "openapi": "3.0.3" 문서를 내면 출력 파일을 만들지 않고 0이 아닌 코드로 끝난다', () => {
    const sandbox = createSandbox();

    const result = runExport(sandbox, ["--out", sandbox.out], { FAKE_OPENAPI_VERSION: "3.0.3" });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("3.0.3");
    expect(existsSync(sandbox.out)).toBe(false);
  });

  it("python이 0이 아닌 코드로 끝나면 출력 파일을 만들지 않고 실패한다", () => {
    const sandbox = createSandbox();

    const result = runExport(sandbox, ["--out", sandbox.out], { FAKE_EXIT: "3" });

    expect(result.status).not.toBe(0);
    expect(existsSync(sandbox.out)).toBe(false);
  });

  it("백엔드 폴더에 .venv/bin/python이 없으면 KMC_BACKEND_DIR을 알리고 실패한다", () => {
    const sandbox = createSandbox(false);

    const result = runExport(sandbox, ["--out", sandbox.out]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("KMC_BACKEND_DIR");
    expect(existsSync(sandbox.out)).toBe(false);
  });

  it("--check는 쓰지 않고 비교만 한다: 같으면 0, 다르면 1", () => {
    const sandbox = createSandbox();
    expect(runExport(sandbox, ["--out", sandbox.out]).status).toBe(0);
    const snapshot = readFileSync(sandbox.out, "utf8");

    expect(runExport(sandbox, ["--check", "--out", sandbox.out]).status).toBe(0);

    writeFileSync(sandbox.out, snapshot.replace('"fake"', '"old"'));
    const drift = runExport(sandbox, ["--check", "--out", sandbox.out]);
    expect(drift.status).toBe(1);
    expect(readFileSync(sandbox.out, "utf8")).toBe(snapshot.replace('"fake"', '"old"'));
    expect(readdirSync(path.dirname(sandbox.out))).toEqual(["openapi.json"]);
  });
});
