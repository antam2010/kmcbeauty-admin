// @vitest-environment node
// 시험은 밖의 TZ와 상관없이 Asia/Seoul에서 돈다(acceptance.md §0, design.md §16).
// `TZ=UTC npx vitest run src/test/timezone.test.ts`로 실행해도 통과해야 한다.
import { describe, expect, it } from "vitest";

describe("시험 시간대 고정(AC-UI-002-01)", () => {
  it("현지 시각 2026-11-10 14:30은 UTC 05:30이다", () => {
    expect(new Date(2026, 10, 10, 14, 30).toISOString()).toBe("2026-11-10T05:30:00.000Z");
  });

  it("Intl이 보는 시간대가 Asia/Seoul이다", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("Asia/Seoul");
  });
});
