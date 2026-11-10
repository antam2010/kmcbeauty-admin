import * as Dialog from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { ConfirmDialog } from "./confirm-dialog";
import { useRestoreFocus } from "./internal/use-restore-focus";

// 크기 sm·md·lg = 400·560·720px(system.md §10 오버레이, 폭 토큰 dialog-*)
const contentVariants = cva(
  "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-panel border border-border bg-popover p-6 text-popover-foreground shadow-overlay motion-safe:data-[state=open]:animate-dialog-in",
  {
    variants: {
      size: {
        sm: "max-w-dialog-sm",
        md: "max-w-dialog-md",
        lg: "max-w-dialog-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface ModalProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  /** 없으면 aria-describedby를 연결하지 않는다 */
  description?: string;
  size?: "sm" | "md" | "lg";
  /** 작성 중. closeDisabled가 아닐 때 닫기 버튼·Esc·스크림으로 닫으려 하면 확인한다 */
  dirty?: boolean;
  /** 제출 중. dirty보다 먼저 판정해 닫기 요청을 모두 무시하고 닫기 버튼은 aria-disabled */
  closeDisabled?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * 대화상자(APG). 머리 → 본문 → 바닥 순서이고 닫기 버튼은 DOM 맨 뒤에 둬, 열리면 본문의 첫 입력이 포커스를 받는다
 * (Radix FocusScope는 DOM 순서의 첫 포커스 가능 요소에 포커스를 둔다 — design.md §4.6).
 * 닫기 요청 세 경로(닫기 버튼·Esc·스크림)는 requestClose 한곳에서 판정한다(REQ-UI-001-021, plan.md §A.6-4).
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size,
  dirty = false,
  closeDisabled = false,
  children,
  footer,
  className,
}: ModalProps) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  // 부모가 밖에서 open=false로 닫으면 버리기 확인 상태를 버린다. 남겨 두면 다시 열자마자 확인이 뜬다(SPEC-UI-002 후속 과제 1).
  // 렌더 중 이전 값과 비교하는 방식이라 effect의 한 박자 늦은 깜빡임이 없다.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open && confirmingDiscard) setConfirmingDiscard(false);
  }
  // Radix Trigger 없이 여닫으므로, 열릴 때 포커스가 있던 요소(연 버튼)를 기억해 닫힐 때 돌려준다.
  const restoreFocus = useRestoreFocus();

  const requestClose = () => {
    if (closeDisabled) return;
    if (dirty) {
      setConfirmingDiscard(true);
      return;
    }
    onOpenChange(false);
  };

  return (
    <>
      {/* 닫기 요청은 아래 세 경로가 모두 가로채므로 Root에는 onOpenChange를 두지 않는다(제어형). */}
      <Dialog.Root open={open}>
        <Dialog.Portal>
          <Dialog.Overlay
            data-modal-overlay=""
            className="fixed inset-0 z-40 bg-overlay motion-safe:data-[state=open]:animate-fade-in"
          />
          <Dialog.Content
            // 설명이 없으면 Radix 기본 연결을 덮어써 aria-describedby를 두지 않는다(콘솔 경고 0, plan.md §B B-17).
            {...(description ? {} : { "aria-describedby": undefined })}
            onOpenAutoFocus={restoreFocus.onOpenAutoFocus}
            onCloseAutoFocus={restoreFocus.onCloseAutoFocus}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              requestClose();
            }}
            onPointerDownOutside={(event) => {
              event.preventDefault();
              // 왼쪽 버튼으로 스크림을 누를 때만 닫기 요청으로 본다.
              if (event.detail.originalEvent.button === 0) requestClose();
            }}
            className={cn(contentVariants({ size }), className)}
          >
            <div className="flex flex-col gap-2 pe-10">
              <Dialog.Title className="text-title font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-body text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <div className="flex flex-col gap-4">{children}</div>
            {footer ? (
              <div data-modal-footer="" className="flex flex-wrap justify-end gap-2">
                {footer}
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="닫기"
              aria-disabled={closeDisabled || undefined}
              onClick={requestClose}
              className="absolute top-4 end-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            >
              <X />
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ConfirmDialog
        open={open && confirmingDiscard}
        onOpenChange={setConfirmingDiscard}
        title="작성 중인 내용이 사라져요. 닫을까요?"
        description="닫으면 지금까지 입력한 내용은 저장되지 않아요."
        cancelLabel="계속 작성"
        confirmLabel="닫기"
        tone="destructive"
        onConfirm={async () => onOpenChange(false)}
      />
    </>
  );
}
