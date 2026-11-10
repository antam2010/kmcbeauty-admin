import * as SelectPrimitive from "@radix-ui/react-select";
import { cva } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./cn";
import { useFieldControl } from "./field";
import { FOCUS_RING } from "./internal/class-names";

/** value는 빈 문자열일 수 없다(Radix Select는 빈 문자열을 '선택 없음'으로 쓴다). */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps
  extends Omit<
    ComponentProps<"button">,
    "value" | "defaultValue" | "onChange" | "type" | "children"
  > {
  value: string | undefined;
  onValueChange(value: string): void;
  options: Array<SelectOption | SelectGroup>;
  /** 값이 없을 때의 문구. 기본 "선택" */
  placeholder?: string;
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  /** Field 밖에서 쓸 때의 접근 이름 */
  "aria-label"?: string;
}

// 컨트롤 높이 sm·default·lg = 32·40·48px(system.md §5). 테두리는 input 토큰(D5).
const triggerVariants = cva(
  `inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-control border border-input bg-card text-body text-foreground transition-colors focus-visible:border-ring ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive data-[placeholder]:text-muted-foreground [&>span]:truncate`,
  {
    variants: {
      size: {
        sm: "h-8 px-3",
        default: "h-10 px-3",
        lg: "h-12 px-4",
      },
    },
    defaultVariants: { size: "default" },
  },
);

const isGroup = (entry: SelectOption | SelectGroup): entry is SelectGroup => "options" in entry;

function Item({ option }: { option: SelectOption }) {
  return (
    <SelectPrimitive.Item
      value={option.value}
      disabled={option.disabled}
      // 하이라이트된 옵션은 포커스를 받으므로 포커스 윤곽선으로 구분하고, 선택된 옵션은 체크 아이콘으로 구분한다(design.md §4.3).
      className={`relative flex h-8 cursor-default select-none items-center rounded-control ps-8 pe-2 text-body text-popover-foreground ${FOCUS_RING} data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`}
    >
      <span className="absolute start-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/**
 * 선택 전용 콤보박스(APG). 저장은 value, 표시는 label이다(REQ-UI-001-017).
 * 키보드는 Radix Select 2.4.1 기본 동작: 닫힘에서 Enter·Space·↓·↑로 열고, 열림에서 ↓↑ 이동·Enter·Space 선택·Esc 닫기·글자로 찾기.
 * 버튼형 트리거라 필수 여부는 aria-required로 붙는다(Radix가 Root의 required를 트리거의 aria-required로 옮긴다).
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = "선택",
  size,
  disabled,
  invalid,
  required,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: SelectProps) {
  const control = useFieldControl({ id, invalid, required, "aria-describedby": ariaDescribedBy });

  return (
    <SelectPrimitive.Root
      // 값이 없을 때 빈 문자열을 주면 제어 상태를 유지한 채 placeholder를 보인다.
      value={value ?? ""}
      onValueChange={onValueChange}
      disabled={disabled}
      required={control.required}
    >
      <SelectPrimitive.Trigger
        {...props}
        id={control.id}
        aria-describedby={control.describedBy}
        aria-invalid={control.invalid || undefined}
        className={cn(triggerVariants({ size }), className)}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          // 떠 있는 레이어 2단계: popover + border + shadow-raised, z 50(system.md §6·§7)
          className="relative z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-panel border border-border bg-popover text-popover-foreground shadow-raised motion-safe:data-[state=open]:animate-fade-in"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((entry) =>
              isGroup(entry) ? (
                <SelectPrimitive.Group key={entry.label}>
                  <SelectPrimitive.Label className="px-2 py-1.5 text-caption font-medium text-muted-foreground">
                    {entry.label}
                  </SelectPrimitive.Label>
                  {entry.options.map((option) => (
                    <Item key={option.value} option={option} />
                  ))}
                </SelectPrimitive.Group>
              ) : (
                <Item key={entry.value} option={entry} />
              ),
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
