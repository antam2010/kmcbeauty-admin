import { cva } from "class-variance-authority";
import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "./cn";
import { joinIds, useFieldControl } from "./field";

/**
 * Input·Textarea가 함께 쓰는 입력 면이다(design-direction.md §12.1·§12.3).
 * 테두리는 장식용 border가 아닌 input 토큰(D5), 포커스는 윤곽선과 ring 테두리, invalid는 destructive 테두리·윤곽선.
 */
export const textFieldClasses =
  "w-full min-w-0 rounded-control border border-input bg-card text-body text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring read-only:bg-muted disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:outline-destructive";

// 컨트롤 높이 sm·default·lg = 32·40·48px(system.md §5)
const inputVariants = cva(textFieldClasses, {
  variants: {
    size: {
      sm: "h-8 px-3",
      default: "h-10 px-3",
      lg: "h-12 px-4",
    },
  },
  defaultVariants: { size: "default" },
});

export interface InputProps extends Omit<ComponentProps<"input">, "size"> {
  size?: "sm" | "default" | "lg";
  invalid?: boolean;
  /** 앞뒤 부가 표시. 글자("원", "분")는 aria-describedby로 연결하고 아이콘 같은 그 밖의 표시는 숨긴다. */
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}

const isPresent = (node: ReactNode) => node != null && node !== false && node !== "";
const isText = (node: ReactNode) => typeof node === "string" || typeof node === "number";

function Adornment({
  side,
  id,
  children,
}: {
  side: "start" | "end";
  id: string | undefined;
  children: ReactNode;
}) {
  return (
    <span
      id={id}
      aria-hidden={id ? undefined : true}
      className={cn(
        "pointer-events-none absolute inset-y-0 flex items-center text-body text-muted-foreground [&_svg]:size-4",
        side === "start" ? "start-3" : "end-3",
      )}
    >
      {children}
    </span>
  );
}

/** 한 줄 입력. Field 안이면 라벨·설명·오류·필수 여부를 문맥으로 받는다(REQ-UI-001-016·017). */
export function Input({
  size,
  invalid,
  startAdornment,
  endAdornment,
  id,
  required,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputProps) {
  const adornmentId = useId();
  const hasStart = isPresent(startAdornment);
  const hasEnd = isPresent(endAdornment);
  const startId = hasStart && isText(startAdornment) ? `${adornmentId}-start` : undefined;
  const endId = hasEnd && isText(endAdornment) ? `${adornmentId}-end` : undefined;
  const control = useFieldControl({
    id,
    invalid,
    required,
    "aria-describedby": joinIds(ariaDescribedBy, startId, endId),
  });

  const input = (
    <input
      {...props}
      id={control.id}
      required={control.required}
      aria-invalid={control.invalid || undefined}
      aria-describedby={control.describedBy}
      className={cn(inputVariants({ size }), hasStart && "ps-9", hasEnd && "pe-9", className)}
    />
  );

  if (!hasStart && !hasEnd) return input;

  return (
    <div className="relative w-full">
      {hasStart ? (
        <Adornment side="start" id={startId}>
          {startAdornment}
        </Adornment>
      ) : null}
      {input}
      {hasEnd ? (
        <Adornment side="end" id={endId}>
          {endAdornment}
        </Adornment>
      ) : null}
    </div>
  );
}
