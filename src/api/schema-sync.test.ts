// @vitest-environment node
// OpenAPI 스냅숏과 생성 타입의 동기(AC-UI-002-02, QG-16).
// openapi-typescript CLI를 `api:types`와 같은 옵션으로 임시 경로에 다시 실행해 커밋된 schema.d.ts와 글자 단위로 비교한다.
// 머리 값은 백엔드 eb8b06d에서 내보낸 스냅숏의 값이다(acceptance.md AC-UI-002-02).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SNAPSHOT = path.join(ROOT, "openapi/openapi.json");
const SCHEMA = path.join(ROOT, "src/api/schema.d.ts");
const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"];

interface OpenApiDocument {
  openapi: string;
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, unknown> };
}

describe("OpenAPI 스냅숏 머리 값(AC-UI-002-02)", () => {
  const doc: OpenApiDocument = JSON.parse(readFileSync(SNAPSHOT, "utf8"));

  it("openapi 3.1.0, 경로 31개, 연산 50개, 스키마 58개다", () => {
    const operations = Object.values(doc.paths).reduce(
      (count, item) => count + HTTP_METHODS.filter((method) => method in item).length,
      0,
    );
    expect({
      openapi: doc.openapi,
      paths: Object.keys(doc.paths).length,
      operations,
      schemas: Object.keys(doc.components.schemas).length,
    }).toEqual({ openapi: "3.1.0", paths: 31, operations: 50, schemas: 58 });
  });
});

describe("생성 타입 동기(QG-16)", () => {
  it("CLI로 다시 생성한 타입이 커밋된 schema.d.ts와 글자 단위로 같다", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "schema-sync-"));
    try {
      const out = path.join(dir, "schema.d.ts");
      const result = spawnSync(
        path.join(ROOT, "node_modules/.bin/openapi-typescript"),
        ["openapi/openapi.json", "-o", out],
        { cwd: ROOT, encoding: "utf8", timeout: 60_000 },
      );
      expect(result.status, result.stderr).toBe(0);
      expect(readFileSync(out, "utf8")).toBe(readFileSync(SCHEMA, "utf8"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
