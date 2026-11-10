#!/usr/bin/env node
// 운영 빌드 산출물 검사(acceptance.md §4.1 QG-18 블록, plan.md §B.9).
// 미리보기 화면은 개발 서버 전용 경로라 운영 빌드의 JS에 들어가면 안 된다. 제목 "컴포넌트 미리보기"와
// 시연 클래스 bg-rose-700이 dist의 JS 파일에 하나라도 있으면 실패한다. CSS는 테마 정리로 원래 그 규칙이 없어 판정하지 않는다.
// CSP 해시 검사(QG-17)는 M8에서 이 스크립트에 더한다.
// 사용법: node scripts/check-dist.mjs [dist 경로, 기본 dist]
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const PREVIEW_MARKERS = ["컴포넌트 미리보기", "bg-rose-700"];

const dist = path.resolve(process.argv[2] ?? "dist");

if (!existsSync(path.join(dist, "index.html"))) {
  console.error(`check:dist: ${path.join(dist, "index.html")}이 없습니다. 먼저 빌드하세요.`);
  process.exit(1);
}

const jsFiles = readdirSync(dist, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".js"))
  .map((file) => file.split(path.sep).join("/"))
  .sort();

if (jsFiles.length === 0) {
  console.error(`check:dist: ${dist}에 JS 파일이 없습니다. 빌드 결과를 확인하세요.`);
  process.exit(1);
}

const leaks = jsFiles.flatMap((file) => {
  const text = readFileSync(path.join(dist, file), "utf8");
  return PREVIEW_MARKERS.filter((marker) => text.includes(marker)).map(
    (marker) => `${file}: ${marker}`,
  );
});

if (leaks.length > 0) {
  console.error("check:dist: 운영 빌드 JS에 미리보기 흔적이 있습니다.");
  for (const leak of leaks) console.error(`  ${leak}`);
  process.exit(1);
}

console.log(`check:dist ok: JS 파일 ${jsFiles.length}개에 미리보기 흔적이 없습니다.`);
