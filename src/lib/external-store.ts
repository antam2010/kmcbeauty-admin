// useSyncExternalStore로 읽는 작은 외부 저장소. src/ui-core/toast.tsx·confirm-dialog.tsx와 같은 패턴이다.
// 앱은 ui-core 내부 파일을 가져올 수 없어(design-rules 가져오기 규칙) 여기에 따로 둔다 — 의도된 중복(design.md §2).
import { useSyncExternalStore } from "react";

export interface ExternalStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  /** 값이 바뀐 뒤 부른다. 구독자 모두에게 알린다. */
  notify: () => void;
}

/** read()가 돌려주는 값을 비추는 저장소. 상태 자체는 부르는 쪽 모듈이 갖는다. */
export function createExternalStore<T>(read: () => T): ExternalStore<T> {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: read,
    notify() {
      for (const listener of listeners) listener();
    },
  };
}

export function useExternalStore<T>(store: ExternalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
