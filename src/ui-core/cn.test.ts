import { describe, expect, it } from "vitest";
import { cn } from "./cn";

// ui-core 안의 테스트라 예약 상태 클래스는 쓰지 않고 중립 토큰으로 병합을 확인한다(design.md §4.2).
describe("cn — 클래스 병합(AC-UI-001-09)", () => {
  it("글자 크기 토큰과 글자색 토큰을 서로 다른 분류로 보고 둘 다 남긴다", () => {
    expect(cn("text-body text-muted-foreground")).toBe("text-body text-muted-foreground");
  });

  it("반경 토큰이 겹치면 뒤의 rounded-panel만 남긴다", () => {
    expect(cn("rounded-control rounded-panel")).toBe("rounded-panel");
  });

  it("배경색 토큰이 겹치면 뒤의 bg-primary-subtle만 남긴다", () => {
    expect(cn("bg-muted bg-primary-subtle")).toBe("bg-primary-subtle");
  });

  it("그림자 토큰이 겹치면 뒤의 shadow-overlay만 남긴다", () => {
    expect(cn("shadow-raised shadow-overlay")).toBe("shadow-overlay");
  });

  it("글자 크기 토큰끼리 겹치면 뒤의 것만 남긴다", () => {
    expect(cn("text-body-sm text-caption")).toBe("text-caption");
  });

  it("글자색 토큰끼리 겹치면 뒤의 것만 남긴다", () => {
    expect(cn("text-muted-foreground text-primary")).toBe("text-primary");
  });

  it("폭 토큰이 겹치면 뒤의 max-w-reading만 남긴다", () => {
    expect(cn("max-w-content max-w-reading")).toBe("max-w-reading");
  });

  it("정적 반경 유틸리티는 반경 토큰과 같은 분류로 덮어쓴다", () => {
    expect(cn("rounded-panel rounded-full")).toBe("rounded-full");
  });

  it("소비 측 className이 마지막에 와서 기본 클래스를 이긴다", () => {
    expect(cn("bg-card text-body rounded-control", "bg-accent")).toBe(
      "text-body rounded-control bg-accent",
    );
  });

  it("거짓 값과 조건부 클래스를 걸러 낸다", () => {
    const selected = false;
    expect(cn("font-medium", selected && "font-semibold", undefined, null, "")).toBe("font-medium");
  });
});
