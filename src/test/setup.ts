// 모든 테스트 파일이 먼저 불러오는 공통 설정이다.
// jest-dom 매처를 등록하고, 테스트마다 화면·저장소·<html> 클래스를 비우며,
// jsdom에 없는 브라우저 API는 없을 때만 대체한다(plan.md §B B-12).
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

const hasDom = typeof window !== "undefined";

function noop(): void {
  // 대체 구현은 아무 일도 하지 않는다.
}

if (hasDom) {
  if (typeof window.ResizeObserver === "undefined") {
    class ResizeObserverStub {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
    }
    window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = noop;
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = noop;
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = noop;
  }
  if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: noop,
      removeEventListener: noop,
      addListener: noop,
      removeListener: noop,
      dispatchEvent: () => false,
    });
  }
}

afterEach(() => {
  if (!hasDom) return;
  // 화면을 먼저 내리고(효과 정리), 테스트가 바꾼 저장소·matchMedia 대역을 되돌린 뒤 저장소를 비운다.
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  document.documentElement.className = "";
});
