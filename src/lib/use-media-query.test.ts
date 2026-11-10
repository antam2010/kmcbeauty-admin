// 화면 폭 조건 훅. jsdom에는 레이아웃이 없어 matchMedia 대역으로 폭을 정한다(acceptance.md §0 jsdom 한계).
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { installViewport } from "@/test/render-route";
import { useMediaQuery } from "./use-media-query";

describe("useMediaQuery", () => {
  it.each([
    [1024, true],
    [1023, false],
  ])("폭 %ipx에서 (min-width: 1024px)는 %s", (width, expected) => {
    installViewport(width);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(expected);
  });

  it("폭이 바뀌면 다시 그린다", () => {
    const viewport = installViewport(1280);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
    act(() => viewport.resize(375));
    expect(result.current).toBe(false);
    act(() => viewport.resize(768));
    expect(result.current).toBe(true);
  });
});
