// ui-core 안에서만 쓰는 작은 외부 저장소(비공개 — index.ts가 내보내지 않는다).
// toast·confirm-dialog의 명령형 API가 같은 모양으로 복사해 쓰던 것을 모았다(SPEC-UI-002 후속 과제 9).
// 앱 계층의 src/lib/external-store.ts와 비슷하지만, ui-core는 앱 코드를 가져올 수 없어 따로 둔다.
import { useSyncExternalStore } from "react";

export interface ExternalStore<T> {
  get(): T;
  /** 값을 바꾸고 구독자 모두에게 알린다 */
  set(next: T): void;
  subscribe(listener: () => void): () => void;
}

// @MX:WARN: [AUTO] 이 함수로 만든 저장소는 모듈 수준 가변 상태(값·구독자)다. toast.tsx의 알림 대기열과 confirm-dialog.tsx의 확인 요청 대기열이 쓴다.
// @MX:REASON: Toaster·ConfirmDialogHost는 앱 루트(src/main.tsx)에 하나씩만 둔다. 둘이면 같은 알림·요청이 두 번 그려지고 F8 단축키가 겹친다. 시험은 src/test/setup.ts가 매번 resetToastStore()·resetConfirmStore()로 비워야 다음 시험으로 상태가 새지 않는다(plan.md §B B-13, design.md §5.1).
export function createExternalStore<T>(initial: T): ExternalStore<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next) {
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** 저장소 값을 읽고, 바뀌면 다시 그린다 */
export function useExternalStore<T>(store: ExternalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
