#!/usr/bin/env node
// 백엔드(FastAPI) 저장소에서 OpenAPI 문서를 내보낸다(plan.md §D.3, research.md 2.5).
//
//   node scripts/export-openapi.mjs [--out <경로>] [--check]
//
// - 백엔드 폴더: KMC_BACKEND_DIR(기본 ../kmcbeauty-fastapi, 저장소 루트 기준)
// - 출력: --out 경로 한 곳(기본 openapi/openapi.json). OpenAPI 3.1이 아니면 아무것도 쓰지 않고 실패한다.
// - --check: 쓰지 않고 --out 경로의 문서와 비교만 한다(같으면 0, 다르면 1). 드리프트 감지 전용이다.
// - 백엔드 폴더에는 아무것도 쓰지 않는다(C9). 네트워크를 쓰지 않는다.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const TIMEOUT_MS = 60_000;
const PYTHON_CODE =
  "import json; from app.main import app; print(json.dumps(app.openapi(), ensure_ascii=False))";

function fail(message) {
  console.error(`[api:export] ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = { out: path.join(ROOT, "openapi/openapi.json"), check: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--check") options.check = true;
    else if (argv[i] === "--out" && argv[i + 1]) options.out = path.resolve(argv[++i]);
    else fail(`알 수 없는 인자: ${argv[i]}`);
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));
const backendDir = path.resolve(ROOT, process.env.KMC_BACKEND_DIR || "../kmcbeauty-fastapi");
const python = path.join(backendDir, ".venv/bin/python");
if (!existsSync(python)) {
  fail(`${python}이 없습니다. KMC_BACKEND_DIR로 백엔드 저장소 경로를 지정하세요.`);
}

// @MX:WARN: [AUTO] 백엔드 python을 자식 프로세스로 실행한다(60초 제한).
// @MX:REASON: PYTHONDONTWRITEBYTECODE·LOG_TO_FILE·SENTRY_DSN을 빼면 백엔드 폴더에 .pyc·로그를 쓰거나
// 외부로 오류를 보낸다(C9 위반). 환경 변수와 cwd를 바꿀 때는 export-openapi.test.ts의 대역 기록 단언을 함께 본다.
const result = spawnSync(python, ["-c", PYTHON_CODE], {
  cwd: backendDir,
  encoding: "utf8",
  timeout: TIMEOUT_MS,
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1", SENTRY_DSN: "", LOG_TO_FILE: "false" },
});
if (result.error) fail(`python 실행 실패: ${result.error.message}`);
if (result.status !== 0) {
  fail(`python이 코드 ${result.status}로 끝났습니다.\n${result.stderr.slice(-2000)}`);
}

let doc;
try {
  doc = JSON.parse(result.stdout);
} catch (error) {
  fail(`표준 출력이 JSON이 아닙니다: ${error.message}`);
}
if (typeof doc?.openapi !== "string" || !doc.openapi.startsWith("3.1.")) {
  fail(
    `OpenAPI 3.1 문서가 아닙니다(openapi: ${JSON.stringify(doc?.openapi)}). 아무것도 쓰지 않았습니다.`,
  );
}

const text = `${JSON.stringify(doc, null, 2)}\n`;
if (options.check) {
  const current = existsSync(options.out) ? readFileSync(options.out, "utf8") : null;
  if (current === text) {
    console.log(`[api:check] 스냅숏과 같습니다: ${options.out}`);
    process.exit(0);
  }
  console.error(`[api:check] 백엔드 문서가 스냅숏과 다릅니다: ${options.out}`);
  process.exit(1);
}

mkdirSync(path.dirname(options.out), { recursive: true });
writeFileSync(options.out, text);
console.log(`[api:export] ${options.out} (openapi ${doc.openapi})`);
