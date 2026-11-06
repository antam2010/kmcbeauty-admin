import * as ToastPrimitive from "@radix-ui/react-toast";
import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "./button";
import { cn } from "./cn";

export interface ToastOptions {
  description?: string;
  /** 동작은 하나까지. 누르면 onClick을 부른 뒤 알림을 닫는다 */
  action?: { label: string; onClick(): void };
}

type ToastTone = "success" | "info" | "warning" | "destructive";

interface ToastItem extends ToastOptions {
  id: string;
  tone: ToastTone;
  message: string;
}

// 표시 시간(plan.md §A.6-3). destructive는 Infinity라 Radix가 타이머를 시작하지 않는다(닫을 때까지 유지).
const DURATION: Record<ToastTone, number> = {
  success: 5000,
  info: 5000,
  warning: 7000,
  destructive: Number.POSITIVE_INFINITY,
};

// tone별 아이콘은 장식이다(lucide가 aria-hidden을 붙인다).
const TONE_ICON: Record<ToastTone, { icon: LucideIcon; className: string }> = {
  success: { icon: CircleCheck, className: "text-success" },
  info: { icon: Info, className: "text-info" },
  warning: { icon: TriangleAlert, className: "text-warning" },
  destructive: { icon: CircleAlert, className: "text-destructive" },
};

// 한 번에 보이는 알림 수. 나머지는 대기열에서 기다린다.
const MAX_VISIBLE = 3;

// @MX:WARN: [AUTO] 모듈 수준 가변 상태(알림 대기열·구독자·id 순번)다.
// @MX:REASON: Toaster는 앱 루트(src/main.tsx)에 하나만 둔다. 둘이면 같은 알림이 두 번 보이고 F8 단축키가 겹친다. 테스트는 매번 resetToastStore()로 비워야 다음 테스트로 알림이 새지 않는다(plan.md §B B-13, design.md §5.1).
let items: readonly ToastItem[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function setItems(next: readonly ToastItem[]) {
  items = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => items;

function push(tone: ToastTone, message: string, options: ToastOptions = {}): string {
  nextId += 1;
  const id = `toast-${nextId}`;
  setItems([...items, { id, tone, message, ...options }]);
  return id;
}

/** 알림을 띄우고 id를 돌려준다. 앱에 <Toaster />가 하나 있어야 보인다(design.md §5.2). */
export const toast = {
  success: (message: string, options?: ToastOptions) => push("success", message, options),
  info: (message: string, options?: ToastOptions) => push("info", message, options),
  warning: (message: string, options?: ToastOptions) => push("warning", message, options),
  /** tone destructive, 닫을 때까지 유지 */
  error: (message: string, options?: ToastOptions) => push("destructive", message, options),
  /** 없는 id는 무시한다 */
  dismiss: (id: string) => {
    if (items.some((item) => item.id === id)) {
      setItems(items.filter((item) => item.id !== id));
    }
  },
};

/** 테스트 전용: 대기열을 비운다(index.ts에 내보내지 않는다). */
export function resetToastStore() {
  setItems([]);
}

function ToastCard({ item }: { item: ToastItem }) {
  const { icon: Icon, className: iconClass } = TONE_ICON[item.tone];
  return (
    <ToastPrimitive.Root
      duration={DURATION[item.tone]}
      // destructive는 foreground(assertive), 나머지는 background(polite)로 알린다.
      type={item.tone === "destructive" ? "foreground" : "background"}
      // 열린 채로 마운트되는 비제어 Root라 Radix는 닫힘(시간 끝·닫기·Esc·스와이프·동작)만 알린다.
      onOpenChange={() => toast.dismiss(item.id)}
      // 대화상자 3단계 면: popover + border + shadow-overlay(system.md §6)
      className="pointer-events-auto flex w-full items-start gap-3 rounded-panel border border-border bg-popover p-4 text-popover-foreground shadow-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) motion-safe:data-[state=open]:animate-toast-in"
    >
      <Icon className={cn("mt-0.75 size-4 shrink-0", iconClass)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <ToastPrimitive.Title data-toast-title="" className="text-body font-medium">
          {item.message}
        </ToastPrimitive.Title>
        {item.description ? (
          <ToastPrimitive.Description className="text-body-sm text-muted-foreground">
            {item.description}
          </ToastPrimitive.Description>
        ) : null}
      </div>
      {item.action ? (
        <ToastPrimitive.Action altText={item.action.label} asChild>
          <Button variant="outline" size="sm" onClick={item.action.onClick}>
            {item.action.label}
          </Button>
        </ToastPrimitive.Action>
      ) : null}
      <ToastPrimitive.Close asChild>
        <Button variant="ghost" size="icon-sm" aria-label="알림 닫기">
          <X />
        </Button>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

/**
 * 알림 영역. props 없음, 앱 루트에 하나. 앞에서부터 세 개만 보이고 나머지는 대기한다.
 * 이름 "알림 (F8)", F8로 들어가고, 포인터·포커스가 영역에 있으면 멈춘다(Radix Toast 1.3.1 기본, WCAG 2.2.1).
 * 위치는 768px 이상 오른쪽 아래, 그보다 좁으면 가운데 아래, z 60(system.md §7).
 */
export function Toaster() {
  const queue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return (
    // label은 화면 낭독기가 알림을 읽을 때 앞에 붙이는 이름이다(Radix 기본값은 영어 "Notification").
    <ToastPrimitive.Provider label="알림" swipeDirection="right" swipeThreshold={50}>
      {queue.slice(0, MAX_VISIBLE).map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
      <ToastPrimitive.Viewport
        label="알림 ({hotkey})"
        className="fixed inset-x-0 bottom-0 z-60 mx-auto flex w-full max-w-dialog-sm flex-col gap-2 p-4 md:start-auto md:end-0 md:mx-0"
      />
    </ToastPrimitive.Provider>
  );
}
