// next 매개변수 검사(AC-UI-002-09 단위 부분, EC-05·EC-27~EC-30). 표본은 acceptance.md §3.3 `next` 표본 표를 그대로 옮겼다.
import { describe, expect, it } from "vitest";
import { nextDestination, safeNext } from "./safe-next";

const ORIGIN = "http://localhost:3000";

/** 쿼리 원문 뒤의 값을 URLSearchParams로 한 번 디코딩한다(§3.3 규칙 1). null이면 매개변수 없음. */
function decodedNext(raw: string | null): string | null {
  return raw === null ? null : new URLSearchParams(`next=${raw}`).get("next");
}

// [쿼리 원문, 한 번 디코딩한 값, 이동]
const SAMPLES: [string | null, string | null, string][] = [
  [null, null, "/reservations"],
  ["", "", "/reservations"],
  ["%2Fcustomers", "/customers", "/customers"],
  ["%2Fcustomers%3Fq%3D%EA%B9%80", "/customers?q=김", "/customers?q=김"],
  ["customers", "customers", "/reservations"],
  ["%2F%2Fevil.example", "//evil.example", "/reservations"],
  ["https%3A%2F%2Fevil.example", "https://evil.example", "/reservations"],
  ["javascript%3Aalert(1)", "javascript:alert(1)", "/reservations"],
  ["/\\evil.example", "/\\evil.example", "/reservations"],
  ["/%5Cevil.example", "/\\evil.example", "/reservations"],
  ["/%09/evil.example", "/\t/evil.example", "/reservations"],
  ["/%0A/evil.example", "/\n/evil.example", "/reservations"],
  ["/%20/evil.example", "/ /evil.example", "/reservations"],
  // M4 감사 F-1 표본 — 정본 §3.3 표 반영은 sync 단계. 점 세그먼트를 지우면 //로 시작하는 값
  ["%2F.%2F%2Fevil.example", "/.//evil.example", "/reservations"],
  ["%2Fa%2F..%2F%2Fevil.example", "/a/..//evil.example", "/reservations"],
  ["%2F%252e%2F%2Fevil.example", "/%2e//evil.example", "/reservations"],
  ["/reservations/..//evil.example/x", "/reservations/..//evil.example/x", "/reservations"],
];

describe("safeNext(§3.3 next 규칙)", () => {
  it.each(SAMPLES)("next=%s → 디코딩 %j → 이동 %s", (raw, decoded, destination) => {
    const value = decodedNext(raw);
    expect(value).toBe(decoded);
    expect(safeNext(value, ORIGIN) ?? "/reservations").toBe(destination);
  });

  it("허용한 값은 더 디코딩하지 않고 그대로 돌려준다", () => {
    expect(safeNext("/customers?q=%EA%B9%80", ORIGIN)).toBe("/customers?q=%EA%B9%80");
  });

  it("해석할 수 없는 출처를 받아도 예외 없이 null이다", () => {
    expect(safeNext("/customers", "not a url")).toBeNull();
  });

  it("C0 제어 문자(U+0000·U+001F)를 담으면 버린다", () => {
    expect(safeNext("/a\u0000b", ORIGIN)).toBeNull();
    expect(safeNext("/a\u001fb", ORIGIN)).toBeNull();
  });
});

describe("nextDestination(이동 주소로 직렬화)", () => {
  it("허용한 값의 한글은 퍼센트 인코딩하고(redirect의 Location 헤더), 이미 있는 %xx는 그대로 둔다", () => {
    expect(nextDestination("/customers?q=김", ORIGIN)).toBe("/customers?q=%EA%B9%80");
    expect(nextDestination("/customers?q=%EA%B9%80", ORIGIN)).toBe("/customers?q=%EA%B9%80");
  });

  it("거부한 값과 없는 값은 /reservations다", () => {
    expect(nextDestination("//evil.example", ORIGIN)).toBe("/reservations");
    expect(nextDestination(null, ORIGIN)).toBe("/reservations");
  });

  // M4 감사 F-1 표본 — 정본 §3.3 표 반영은 sync 단계
  it.each([
    "/.//evil.example",
    "/a/..//evil.example",
    "/%2e//evil.example",
    "/reservations/..//evil.example/x",
  ])("직렬화하면 //로 시작하는 값 %s는 /reservations다", (value) => {
    expect(nextDestination(value, ORIGIN)).toBe("/reservations");
  });

  it.each(SAMPLES)("next=%s의 이동 주소는 같은 규칙을 다시 통과하고 같은 출처다", (raw) => {
    const destination = nextDestination(decodedNext(raw), ORIGIN);
    // 검사한 값과 이동하는 값이 다른 규칙을 타면 안 된다(이동 주소를 다시 검사해도 그대로)
    expect(safeNext(destination, ORIGIN)).toBe(destination);
    expect(new URL(destination, ORIGIN).origin).toBe(ORIGIN);
  });
});
