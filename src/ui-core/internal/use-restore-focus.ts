// ui-core 안에서만 쓰는 포커스 복귀 도우미(비공개 — index.ts가 내보내지 않는다).
// Radix Trigger 없이 여닫는 대화상자(Modal·ConfirmDialog·Drawer)가 함께 쓴다(SPEC-UI-002 후속 과제 9).
import { useRef } from "react";

/**
 * 열릴 때 포커스가 있던 요소(연 버튼)를 기억해 두었다가 닫힐 때 돌려준다.
 * 돌려받은 두 처리기를 Radix Content의 onOpenAutoFocus·onCloseAutoFocus에 그대로 넘긴다.
 */
export function useRestoreFocus() {
  const openerRef = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      openerRef.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      if (openerRef.current?.isConnected) openerRef.current.focus();
    },
  };
}
