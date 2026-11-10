// ui-core 안에서만 쓰는 포커스 복귀 도우미(비공개 — index.ts가 내보내지 않는다).
// Radix Trigger 없이 여닫는 대화상자(Modal·ConfirmDialog·Drawer)가 함께 쓴다(SPEC-UI-002 후속 과제 9).
import { useRef } from "react";

// @MX:ANCHOR: [AUTO] Modal·ConfirmDialog·Drawer가 닫힐 때 연 버튼으로 포커스를 돌려주는 공용 규약이다.
// @MX:REASON: preventDefault를 빼면 Radix가 body로 포커스를 보내 키보드 사용자가 위치를 잃는다(AC-UI-001-11, EC-27). isConnected 확인을 빼면 사라진 버튼에 focus()를 부른다.
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
