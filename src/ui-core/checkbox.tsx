import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "./cn";
import { useFieldControl } from "./field";
import { FOCUS_RING } from "./internal/class-names";

export interface CheckboxProps
  extends Omit<
    ComponentProps<"button">,
    "children" | "value" | "defaultValue" | "onChange" | "type"
  > {
  checked: boolean | "indeterminate";
  onCheckedChange(checked: boolean): void;
  label?: ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  id?: string;
}

/**
 * 켬·끔과 일부 선택(Minus)을 보이는 체크박스. Radix Checkbox 1.4.1이 Space로만 바꾸고 Enter는 막는다.
 * 버튼 요소에는 required가 유효하지 않으므로 필수 여부는 aria-required로 붙인다(REQ-UI-001-016).
 */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled,
  invalid,
  required,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const control = useFieldControl({ id, invalid, required, "aria-describedby": ariaDescribedBy });
  const checkboxId = control.id ?? generatedId;

  const box = (
    <CheckboxPrimitive.Root
      {...props}
      id={checkboxId}
      checked={checked}
      // 사용자의 누르기는 일부 선택 → 선택, 선택 ↔ 해제로만 바뀌므로 boolean으로 알린다.
      onCheckedChange={(next) => onCheckedChange(next === true)}
      disabled={disabled}
      required={control.required || undefined}
      aria-invalid={control.invalid || undefined}
      aria-describedby={control.describedBy}
      className={cn(
        // 20px 상자, 누를 수 있는 영역은 after로 32px까지 넓힌다(system.md §5).
        `peer relative inline-flex size-5 shrink-0 items-center justify-center rounded-chip border border-input bg-card text-primary-foreground transition-colors after:absolute after:-inset-1.5 ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary`,
        className,
      )}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {checked === "indeterminate" ? (
          <Minus className="size-3.5" />
        ) : (
          <Check className="size-3.5" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return box;

  return (
    <div className="flex items-center gap-2">
      {box}
      <label
        htmlFor={checkboxId}
        className="text-body text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {label}
      </label>
    </div>
  );
}
