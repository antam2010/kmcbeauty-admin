// @vitest-environment node
// 배포 중지 가드는 이 테스트로만 확인한다. 임시 디렉터리에 deploy.sh를 복사하고, 더미 .env.stage와
// PATH 맨 앞의 대역 npm·scp로 실행하므로 실제 빌드·전송은 일어나지 않는다(design.md §13).
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const DEPLOY_SH = fileURLToPath(new URL("../../deploy.sh", import.meta.url));
const BASH = existsSync("/bin/bash") ? "/bin/bash" : "/usr/bin/bash";
const GUARD_VARIABLE = "ALLOW_PREVIEW_ONLY_DEPLOY";

interface Sandbox {
  dir: string;
  bin: string;
}

const sandboxes: Sandbox[] = [];

function createSandbox(): Sandbox {
  const dir = mkdtempSync(path.join(tmpdir(), "deploy-guard-"));
  const bin = path.join(dir, "bin");
  mkdirSync(bin);
  copyFileSync(DEPLOY_SH, path.join(dir, "deploy.sh"));
  writeFileSync(
    path.join(dir, ".env.stage"),
    [
      "SCP_USER=tester",
      "SCP_HOST=example.invalid",
      "SCP_DIR=/srv/none",
      "SCP_PORT=2222",
      // 이 파일이 읽히면 표시 파일이 생긴다(가드가 .env.stage를 읽기 전에 멈추는지 확인).
      ": > env-stage-read",
      "",
    ].join("\n"),
  );
  for (const name of ["npm", "scp"]) {
    const stub = path.join(bin, name);
    writeFileSync(stub, `#!/bin/sh\necho "$*" >> "${path.join(dir, `${name}.calls`)}"\nexit 0\n`);
    chmodSync(stub, 0o755);
  }
  const sandbox = { dir, bin };
  sandboxes.push(sandbox);
  return sandbox;
}

function runDeploy(sandbox: Sandbox, allow: string | undefined) {
  // PATH에는 대역 디렉터리만 둔다. 실제 npm·scp·bun에는 닿지 않는다.
  const env: NodeJS.ProcessEnv = { PATH: sandbox.bin, HOME: sandbox.dir, LANG: "C.UTF-8" };
  if (allow !== undefined) env[GUARD_VARIABLE] = allow;
  const result = spawnSync(BASH, ["deploy.sh"], { cwd: sandbox.dir, env, encoding: "utf8" });
  const calls = (name: string) => {
    const file = path.join(sandbox.dir, `${name}.calls`);
    return existsSync(file) ? readFileSync(file, "utf8").trim().split("\n") : [];
  };
  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
    envStageRead: existsSync(path.join(sandbox.dir, "env-stage-read")),
    npmCalls: calls("npm"),
    scpCalls: calls("scp"),
  };
}

afterEach(() => {
  for (const sandbox of sandboxes.splice(0)) {
    rmSync(sandbox.dir, { recursive: true, force: true });
  }
});

describe("deploy.sh 배포 중지 가드(AC-UI-001-04)", () => {
  it.each([
    ["없음", undefined],
    ["0", "0"],
    ["true(EC-17)", "true"],
  ])(
    "ALLOW_PREVIEW_ONLY_DEPLOY가 %s이면 .env.stage를 읽기 전에 종료 코드 1로 멈춘다",
    (_label, allow) => {
      const result = runDeploy(createSandbox(), allow);
      expect(result.status).toBe(1);
      expect(result.output).toContain(GUARD_VARIABLE);
      expect(result.envStageRead).toBe(false);
      expect(result.npmCalls).toEqual([]);
      expect(result.scpCalls).toEqual([]);
    },
  );

  it("ALLOW_PREVIEW_ONLY_DEPLOY가 1이면 가드를 지나 npm 빌드와 scp 전송을 한 번씩 실행한다", () => {
    const result = runDeploy(createSandbox(), "1");
    expect(result.status).toBe(0);
    expect(result.output).not.toContain(GUARD_VARIABLE);
    expect(result.envStageRead).toBe(true);
    expect(result.npmCalls).toEqual(["run build -- --mode stage"]);
    expect(result.scpCalls).toHaveLength(1);
    expect(result.scpCalls[0]).toContain("-P 2222");
    expect(result.scpCalls[0]).toContain("tester@example.invalid:/srv/none");
  });

  it("저장소의 deploy.sh는 bun을 호출하지 않는다", () => {
    expect(readFileSync(DEPLOY_SH, "utf8")).not.toMatch(/(^|\s)bun\s/m);
  });
});
