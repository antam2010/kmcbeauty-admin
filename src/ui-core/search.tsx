import { Search as SearchIcon, X } from "lucide-react";
import { type ComponentProps, type Ref, useRef } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { Input } from "./input";

export interface SearchProps
  extends Omit<ComponentProps<"input">, "type" | "value" | "onChange" | "size"> {
  value: string;
  onValueChange(value: string): void;
  /** 필수. placeholder로 접근 이름을 대신하지 않는다(design-direction.md §12.3). */
  "aria-label": string;
  /** 기본 "검색어 지우기". 값이 있을 때만 보이고, 누르면 빈 값을 알리고 입력에 포커스를 둔다. */
  clearLabel?: string;
}

/** 내부 ref와 소비 측 ref에 같은 입력 요소를 넘긴다. */
function assignRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

/** 목록 검색어 입력. 입력할 때마다 바로 알리고, 디바운스는 소비 측이 맡는다(plan.md §A.7). */
export function Search({
  value,
  onValueChange,
  "aria-label": ariaLabel,
  clearLabel = "검색어 지우기",
  className,
  ref,
  ...props
}: SearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value !== "";

  return (
    <div className="relative w-full">
      <Input
        {...props}
        ref={assignRefs(inputRef, ref)}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label={ariaLabel}
        startAdornment={<SearchIcon />}
        // 브라우저 기본 지우기 단추 대신 아래의 지우기 버튼을 쓴다.
        className={cn(
          "[&::-webkit-search-cancel-button]:appearance-none",
          hasValue && "pe-10",
          className,
        )}
      />
      {hasValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={clearLabel}
          onClick={() => {
            onValueChange("");
            inputRef.current?.focus();
          }}
          className="absolute end-1 top-1/2 -translate-y-1/2"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
