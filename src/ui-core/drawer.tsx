import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { useRestoreFocus } from "./internal/use-restore-focus";

export interface DrawerProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  /** 필수. 대화상자 이름이자 서랍 머리의 제목 */
  title: string;
  /** 지금은 왼쪽 시트만 있다(768px 미만 사이드바, system.md §8) */
  side: "left";
  children: ReactNode;
  /** 기본 "닫기" */
  closeLabel?: string;
  className?: string;
}

/**
 * 왼쪽에서 나오는 시트(Radix Dialog). 열리면 포커스가 안으로 들어와 갇히고, Esc·스크림·닫기 버튼으로 닫히며,
 * 닫히면 연 버튼으로 포커스가 돌아온다. 이동 애니메이션은 motion-safe: 아래에만 두어 감속 모드에서는 바로 보인다.
 * z 순서는 모바일 서랍 30(system.md §7)이고, 스크림은 같은 층에서 서랍보다 먼저 그려 서랍 아래에 깔린다.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  side: _side,
  children,
  closeLabel = "닫기",
  className,
}: DrawerProps) {
  // Radix Trigger 없이 여닫으므로 연 버튼을 기억해 닫힐 때 돌려준다(internal/use-restore-focus).
  const restoreFocus = useRestoreFocus();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-drawer-overlay=""
          className="fixed inset-0 z-30 bg-overlay motion-safe:data-[state=open]:animate-fade-in"
        />
        <Dialog.Content
          // 설명이 없으므로 Radix 기본 aria-describedby 연결을 끈다(콘솔 경고 0, Modal과 같은 방식).
          aria-describedby={undefined}
          onOpenAutoFocus={restoreFocus.onOpenAutoFocus}
          onCloseAutoFocus={restoreFocus.onCloseAutoFocus}
          // 면과 내용은 펼친 사이드바와 같다: card 면, 바깥쪽 border(system.md §8)
          className={cn(
            "fixed inset-y-0 start-0 z-30 flex w-(--sidebar-width) max-w-[calc(100%-3rem)] flex-col border-e border-border bg-card text-card-foreground shadow-overlay motion-safe:data-[state=open]:animate-slide-in-from-left",
            className,
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
            <Dialog.Title className="text-body font-semibold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label={closeLabel}>
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
