import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useRef, useState, useSyncExternalStore } from "react";
import { Alert } from "./alert";
import { Button } from "./button";

export interface ConfirmOptions {
  /** 해요체 질문 */
  title: string;
  /** 누르면 무슨 일이 생기는지 */
  description: string;
  /** 구체 동사("삭제", "예약 취소") */
  confirmLabel: string;
  /** 기본 "취소". 취소 동작을 묻는 대화상자는 "닫기" */
  cancelLabel?: string;
  tone?: "default" | "destructive";
  /** 있으면 확인 버튼이 loading이 된 채 기다리고, 실패하면 대화상자 안에 오류를 보인다 */
  onConfirm?(): Promise<void>;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onOpenChange(open: boolean): void;
}

// 대화상자 안 오류 문구(해요체). 다시 확인하거나 취소할 수 있다.
const FAILURE_MESSAGE = "요청을 처리하지 못했어요. 다시 시도해 주세요.";

interface DialogViewProps {
  open: boolean;
  options: ConfirmOptions;
  /** 확인(true) 또는 취소·Esc(false)로 끝났을 때 */
  onSettle(result: boolean): void;
}

interface DialogBodyProps extends Omit<DialogViewProps, "open"> {
  onOpenAutoFocus(): void;
  onCloseAutoFocus(event: Event): void;
}

/** 열려 있는 동안만 마운트되는 본문. 닫히면 처리 중·실패 상태도 함께 사라진다. */
function DialogBody({ options, onSettle, onOpenAutoFocus, onCloseAutoFocus }: DialogBodyProps) {
  const { title, description, confirmLabel, cancelLabel = "취소", tone = "default" } = options;
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  // 처리 중 다시 누르기는 Button의 loading이 막는다(aria-disabled, 클릭 무시).
  const confirm = async () => {
    if (!options.onConfirm) {
      onSettle(true);
      return;
    }
    setPending(true);
    setFailed(false);
    try {
      await options.onConfirm();
    } catch {
      setPending(false);
      setFailed(true);
      return;
    }
    onSettle(true);
  };

  return (
    <AlertDialog.Content
      onOpenAutoFocus={onOpenAutoFocus}
      onCloseAutoFocus={onCloseAutoFocus}
      // 처리 중에는 Esc로 닫지 않는다(결과가 정해지기 전에 false로 끝나지 않게).
      onEscapeKeyDown={(event) => {
        if (pending) event.preventDefault();
      }}
      // 대화상자 3단계: popover + border + shadow-overlay, z 50(system.md §6·§7)
      className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-dialog-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-panel border border-border bg-popover p-6 text-popover-foreground shadow-overlay motion-safe:data-[state=open]:animate-dialog-in"
    >
      <div className="flex flex-col gap-2">
        <AlertDialog.Title className="text-title font-semibold">{title}</AlertDialog.Title>
        <AlertDialog.Description className="text-body text-muted-foreground">
          {description}
        </AlertDialog.Description>
      </div>
      {failed ? (
        <Alert tone="destructive" live>
          {FAILURE_MESSAGE}
        </Alert>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        {/* Radix AlertDialog 1.2.1은 열릴 때 취소 버튼에 포커스를 둔다(위험 동작의 처음 포커스). */}
        <AlertDialog.Cancel
          asChild
          onClick={(event) => {
            if (pending) event.preventDefault();
          }}
        >
          <Button variant="outline" aria-disabled={pending || undefined}>
            {cancelLabel}
          </Button>
        </AlertDialog.Cancel>
        <Button
          variant={tone === "destructive" ? "destructive" : "default"}
          loading={pending}
          onClick={() => void confirm()}
        >
          {confirmLabel}
        </Button>
      </div>
    </AlertDialog.Content>
  );
}

function DialogView({ open, options, onSettle }: DialogViewProps) {
  // Radix Trigger 없이 여닫으므로, 열릴 때 포커스가 있던 요소(연 버튼)를 기억해 닫힐 때 돌려준다.
  const openerRef = useRef<HTMLElement | null>(null);
  return (
    <AlertDialog.Root
      open={open}
      // Trigger가 없으므로 Radix는 닫힘(취소·Esc)만 알린다.
      onOpenChange={() => onSettle(false)}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-overlay motion-safe:data-[state=open]:animate-fade-in" />
        <DialogBody
          options={options}
          onSettle={onSettle}
          onOpenAutoFocus={() => {
            openerRef.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (openerRef.current?.isConnected) openerRef.current.focus();
          }}
        />
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/**
 * 선언형 확인 대화상자(APG 경고 대화상자). 확인은 onConfirm이 끝난 뒤, 취소·Esc는 바로 onOpenChange(false)를 부른다.
 * 처음 포커스는 취소 버튼이다(REQ-UI-001-021, design.md §5.3).
 */
export function ConfirmDialog({ open, onOpenChange, ...options }: ConfirmDialogProps) {
  return <DialogView open={open} options={options} onSettle={() => onOpenChange(false)} />;
}

// ── 명령형 API ────────────────────────────────────────────────────────────────────────

interface ConfirmRequest {
  id: number;
  options: ConfirmOptions;
  resolve(result: boolean): void;
}

// @MX:WARN: [AUTO] 모듈 수준 가변 상태(요청 대기열·구독자)와 비동기 onConfirm 실패 처리가 있다.
// @MX:REASON: ConfirmDialogHost는 앱 루트(src/main.tsx)에 하나만 둔다. 둘이면 같은 요청이 두 번 그려진다. 테스트는 매번 resetConfirmStore()로 비워야 다음 테스트로 요청이 새지 않는다(plan.md §B B-13, design.md §5.1).
let queue: readonly ConfirmRequest[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function setQueue(next: readonly ConfirmRequest[]) {
  queue = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => queue;

function settle(id: number, result: boolean) {
  const request = queue.find((candidate) => candidate.id === id);
  if (!request) return;
  setQueue(queue.filter((candidate) => candidate.id !== id));
  request.resolve(result);
}

/**
 * 확인 대화상자를 띄우고 확인이면 true, 취소·Esc면 false로 끝난다. 여러 번 부르면 부른 순서대로 하나씩 연다.
 * 앱에 <ConfirmDialogHost />가 하나 있어야 보인다. 전역 window.confirm과 헷갈리지 않게 이름을 showConfirm으로 했다(plan.md §A.5).
 */
export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    nextId += 1;
    setQueue([...queue, { id: nextId, options, resolve }]);
  });
}

/** 테스트 전용: 남은 요청을 false로 끝내고 대기열을 비운다(index.ts에 내보내지 않는다). */
export function resetConfirmStore() {
  const pending = queue;
  setQueue([]);
  for (const request of pending) request.resolve(false);
}

/** 대기열의 맨 앞 요청 하나를 그린다. props 없음, 앱 루트에 하나. */
export function ConfirmDialogHost() {
  const requests = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const current = requests[0];
  if (!current) return null;
  return (
    <DialogView
      key={current.id}
      open
      options={current.options}
      onSettle={(result) => settle(current.id, result)}
    />
  );
}
