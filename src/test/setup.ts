// 모든 테스트 파일이 먼저 불러오는 공통 설정이다.
// jest-dom 매처를 등록하고, 테스트마다 화면·저장소·<html> 클래스를 비우며,
// jsdom에 없는 브라우저 API는 없을 때만 대체한다(plan.md §B B-12).
// HTTP는 MSW 3이 대신 응답하고, 처리하지 않은 요청은 시험 실패로 보고한다(design.md §16).
import "@testing-library/jest-dom/vitest";
import { act, cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { resetConfirmStore } from "../ui-core/confirm-dialog";
import { resetToastStore } from "../ui-core/toast";
import { assertNoUnhandledRequests, listenStrict, server } from "./msw/server";

const hasDom = typeof window !== "undefined";

// jsdom·node에는 IndexedDB가 없다. 시험 파일이 앱 모듈을 가져오기 전에 호출을 셀 수 있는 대역을 둔다
// (acceptance.md §0 — 세션 저장소가 IndexedDB를 열지 않는지 판정한다).
const indexedDbOpen = vi.fn();
if (typeof globalThis.indexedDB === "undefined") {
  globalThis.indexedDB = { open: indexedDbOpen } as unknown as IDBFactory;
}

beforeAll(() => {
  listenStrict();
});

afterEach(() => {
  server.resetHandlers();
  indexedDbOpen.mockClear();
  assertNoUnhandledRequests();
});

afterAll(() => {
  server.close();
});

function hasCanvasPackage(): boolean {
  try {
    import.meta.resolve("canvas");
    return true;
  } catch {
    return false;
  }
}

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
  // jsdom의 getContext는 canvas 패키지가 없으면 "Not implemented" 메시지를 남기고 null을 돌려준다(axe-core가 부른다).
  // 같은 결과(null)를 메시지 없이 돌려주는 빈 구현으로 바꾼다. canvas가 없는 jsdom일 때만 바꾼다(SPEC-UI-002 후속 과제 12).
  if (typeof HTMLCanvasElement !== "undefined" && !hasCanvasPackage()) {
    HTMLCanvasElement.prototype.getContext = (() => null) as HTMLCanvasElement["getContext"];
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
  // ui-core 명령형 API(toast·showConfirm)의 모듈 수준 대기열을 비운다. 화면이 아직 붙어 있어
  // Toaster·ConfirmDialogHost가 다시 그려지므로 act 안에서 비운다(SPEC-UI-002 후속 과제 14, plan.md §B B-13).
  act(() => {
    resetToastStore();
    resetConfirmStore();
  });
  // 화면을 내리고(효과 정리), 테스트가 바꾼 저장소·matchMedia 대역을 되돌린 뒤 저장소를 비운다.
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  document.documentElement.className = "";
});
