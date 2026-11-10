// @vitest-environment node
// 앱 기준 주소(AC-UI-002-03 (나)). env 객체를 받는 순수 함수라 개발·운영을 함께 시험한다.
import { describe, expect, it } from "vitest";
import { API_BASE_URL, apiBaseUrl } from "./env";

describe("앱 기준 주소(AC-UI-002-03)", () => {
  it("개발 서버이면 /api다", () => {
    expect(apiBaseUrl({ DEV: true })).toBe("/api");
  });

  it("운영 빌드이면 VITE_API_BASE_URL이다", () => {
    expect(apiBaseUrl({ DEV: false, VITE_API_BASE_URL: "https://api.test" })).toBe(
      "https://api.test",
    );
  });

  it("운영 빌드에 값이 없으면 변수 이름을 담은 오류를 던진다", () => {
    expect(() => apiBaseUrl({ DEV: false })).toThrowError(/VITE_API_BASE_URL/);
  });

  it("시험 실행(개발 모드)의 기준 주소는 /api다", () => {
    expect(API_BASE_URL).toBe("/api");
  });
});
