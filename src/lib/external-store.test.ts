// 작은 외부 저장소(useSyncExternalStore용). 앱은 ui-core 내부를 가져올 수 없어 같은 패턴을 따로 둔다(design.md §2).
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createExternalStore, useExternalStore } from "./external-store";

describe("createExternalStore", () => {
  it("getSnapshot은 읽기 함수의 현재 값을 돌려준다", () => {
    let value = 1;
    const store = createExternalStore(() => value);
    expect(store.getSnapshot()).toBe(1);
    value = 2;
    expect(store.getSnapshot()).toBe(2);
  });

  it("notify는 구독자 모두를 부르고, 구독을 풀면 더 부르지 않는다", () => {
    const store = createExternalStore(() => 0);
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribe = store.subscribe(first);
    store.subscribe(second);
    store.notify();
    unsubscribe();
    store.notify();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it("useExternalStore는 notify 뒤 새 값으로 다시 그린다", () => {
    let value = false;
    const store = createExternalStore(() => value);
    const { result } = renderHook(() => useExternalStore(store));
    expect(result.current).toBe(false);
    act(() => {
      value = true;
      store.notify();
    });
    expect(result.current).toBe(true);
  });
});
