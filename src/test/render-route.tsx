// 경로 시험 도우미(design.md §16): 앱과 같은 경로 함수(createRoutes)로 만든 메모리 라우터 + 새 QueryClient + MSW.
// 화면 폭은 matchMedia 대역으로 정한다(jsdom에는 레이아웃이 없다 — acceptance.md §0).
import { vi } from "vitest";

type Listener = (event: MediaQueryListEvent) => void;

/** `(min-width: Npx)`·`(max-width: Npx)` 조건을 모두 만족하면 true. 그 밖의 조건(색 구성 등)은 false. */
function evaluate(query: string, width: number): boolean {
  const conditions = [...query.matchAll(/\((min|max)-width:\s*(\d+)px\)/g)];
  if (conditions.length === 0) return false;
  return conditions.every(([, kind, value]) =>
    kind === "min" ? width >= Number(value) : width <= Number(value),
  );
}

/**
 * 폭을 정한 matchMedia 대역을 설치한다. setup.ts의 vi.restoreAllMocks가 시험 뒤 되돌린다.
 * resize(폭)는 바뀐 조건마다 change 이벤트를 보낸다.
 */
export function installViewport(initialWidth: number) {
  let width = initialWidth;
  const lists = new Set<{ query: string; listeners: Set<Listener>; last: boolean }>();
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const entry = { query, listeners: new Set<Listener>(), last: evaluate(query, width) };
    lists.add(entry);
    const list = {
      get matches() {
        return evaluate(query, width);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => entry.listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => entry.listeners.delete(listener),
      addListener: (listener: Listener) => entry.listeners.add(listener),
      removeListener: (listener: Listener) => entry.listeners.delete(listener),
      dispatchEvent: () => false,
    };
    return list as unknown as MediaQueryList;
  });
  return {
    resize(next: number) {
      width = next;
      for (const entry of lists) {
        const matches = evaluate(entry.query, width);
        if (matches === entry.last) continue;
        entry.last = matches;
        for (const listener of entry.listeners) {
          listener({ matches, media: entry.query } as MediaQueryListEvent);
        }
      }
    },
  };
}
