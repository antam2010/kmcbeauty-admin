// localStorage에 저장하는 상태 훅(사이드바 접힘). 저장소 예외는 테마 저장처럼 삼킨다(plan.md §B.13, EC-07).
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePersistedState } from "./use-persisted-state";

const KEY = "kmc-admin-sidebar";
const VALUES = ["expanded", "collapsed"] as const;

describe("usePersistedState", () => {
  it("저장값이 없으면 기본값으로 시작한다", () => {
    const { result } = renderHook(() => usePersistedState(KEY, "expanded", VALUES));
    expect(result.current[0]).toBe("expanded");
  });

  it("저장값이 허용 목록에 있으면 그 값으로 시작한다", () => {
    window.localStorage.setItem(KEY, "collapsed");
    const { result } = renderHook(() => usePersistedState(KEY, "expanded", VALUES));
    expect(result.current[0]).toBe("collapsed");
  });

  it("허용 목록 밖의 저장값은 버리고 기본값을 쓴다", () => {
    window.localStorage.setItem(KEY, "wide");
    const { result } = renderHook(() => usePersistedState(KEY, "expanded", VALUES));
    expect(result.current[0]).toBe("expanded");
  });

  it("값을 바꾸면 저장한다", () => {
    const { result } = renderHook(() => usePersistedState(KEY, "expanded", VALUES));
    act(() => result.current[1]("collapsed"));
    expect(result.current[0]).toBe("collapsed");
    expect(window.localStorage.getItem(KEY)).toBe("collapsed");
  });

  it("저장소 읽기·쓰기가 예외를 던져도 새지 않고 기본값·메모리 값으로 동작한다(EC-07)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    const { result } = renderHook(() => usePersistedState(KEY, "expanded", VALUES));
    expect(result.current[0]).toBe("expanded");
    expect(() => act(() => result.current[1]("collapsed"))).not.toThrow();
    expect(result.current[0]).toBe("collapsed");
  });
});
