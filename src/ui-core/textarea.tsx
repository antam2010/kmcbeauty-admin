import type { ComponentProps } from "react";
import { cn } from "./cn";
import { useFieldControl } from "./field";
import { textFieldClasses } from "./input";

export interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

/** 여러 줄 입력. 최소 높이 96px, 세로로만 크기를 바꾼다(design-direction.md §12.3). */
export function Textarea({
  invalid,
  id,
  required,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: TextareaProps) {
  const control = useFieldControl({ id, invalid, required, "aria-describedby": ariaDescribedBy });
  return (
    <textarea
      {...props}
      id={control.id}
      required={control.required}
      aria-invalid={control.invalid || undefined}
      aria-describedby={control.describedBy}
      className={cn(textFieldClasses, "min-h-24 resize-y px-3 py-2", className)}
    />
  );
}
