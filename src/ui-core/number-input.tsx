import { type ChangeEvent, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "./cn";
import { joinIds, useFieldControl } from "./field";
import { Input, type InputProps } from "./input";

export interface NumberInputProps
  extends Omit<
    InputProps,
    "value" | "defaultValue" | "onChange" | "type" | "inputMode" | "endAdornment" | "min" | "max"
  > {
  /** 0 이상의 정수. 비어 있으면 null */
  value: number | null;
  onValueChange(value: number | null): void;
  /** 범위 밖 값은 줄이지 않고 오류 문장과 aria-invalid로 알린다(EC-23) */
  min?: number;
  max?: number;
  /** 뒤 부가 표시 단위("원"·"분"). 설명으로 연결된다 */
  suffix?: string;
}

// 안전한 정수 범위(2^53) 안에 머물도록 자릿수를 자른다.
const MAX_DIGITS = 15;

const groupDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const formatNumber = (value: number | null) => (value === null ? "" : groupDigits(String(value)));

/** 표시 글자에서 앞의 숫자 count개가 끝나는 자리. 쉼표는 건너뛴다 */
function caretAfterDigits(display: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < display.length; index += 1) {
    if (/\d/.test(display[index])) seen += 1;
    if (seen === count) return index + 1;
  }
  return display.length;
}

function rangeMessage(value: number, min: number | undefined, max: number | undefined, unit = "") {
  const below = min !== undefined && value < min;
  const above = max !== undefined && value > max;
  if (!below && !above) return undefined;
  const minText = min === undefined ? "" : `${formatNumber(min)}${unit}`;
  const maxText = max === undefined ? "" : `${formatNumber(max)}${unit}`;
  if (min !== undefined && max !== undefined)
    return `${minText} 이상 ${maxText} 이하로 입력해 주세요.`;
  return min !== undefined ? `${minText} 이상 입력해 주세요.` : `${maxText} 이하로 입력해 주세요.`;
}

/**
 * 금액·시간 같은 0 이상의 정수 입력. 천 단위 쉼표로 보이고 숫자 값을 알린다.
 * 붙여넣기·입력에서 숫자만 남기고, 위·아래 화살표로 값을 바꾸지 않는다(숫자 스피너 없음, system.md §8).
 */
export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  suffix,
  invalid,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: NumberInputProps) {
  const errorId = useId();
  const field = useFieldControl({ invalid });
  const inputRef = useRef<HTMLInputElement>(null);
  // 바뀐 뒤 커서를 둘 자리: "앞에서 몇 번째 숫자 뒤"로 기억한다. 렌더마다 새 객체라 같은 값도 다시 맞춘다.
  const [caret, setCaret] = useState<{ digits: number } | null>(null);

  const display = formatNumber(value);
  const message = value === null ? undefined : rangeMessage(value, min, max, suffix);

  // @MX:NOTE: [AUTO] 커서 보존: 쉼표가 다시 붙으면 글자 위치가 바뀌므로, 바뀌기 전 커서 앞의 "숫자 개수"를 세어 두고
  // 새 표시에서 그 개수만큼의 숫자 뒤로 커서를 옮긴다(EC-24: 1,234|,567 + Backspace → 123|,567). 쉼표 위치는 세지 않는다.
  useLayoutEffect(() => {
    const node = inputRef.current;
    if (!caret || !node || document.activeElement !== node) return;
    const position = caretAfterDigits(node.value, caret.digits);
    node.setSelectionRange(position, position);
  }, [caret]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const cursor = event.target.selectionStart ?? raw.length;
    const digitsBefore = raw.slice(0, cursor).replace(/\D/g, "").length;
    const digits = raw.replace(/\D/g, "").slice(0, MAX_DIGITS);
    const next = digits === "" ? null : Number(digits);
    setCaret({ digits: Math.min(digitsBefore, digits.length) });
    if (next !== value) onValueChange(next);
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      <Input
        {...props}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        invalid={field.invalid || message !== undefined}
        aria-describedby={joinIds(ariaDescribedBy, message ? errorId : undefined)}
        endAdornment={suffix}
        className={cn("tabular-nums", className)}
      />
      {message ? (
        <p id={errorId} className="text-body-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
