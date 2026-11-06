import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import {
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "./cn";
import { useFieldControl } from "./field";
import { textFieldClasses } from "./input";
import { Loading } from "./loading";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  /** 로컬 거르기에서 라벨과 함께 찾는 낱말(전화번호 등) */
  keywords?: string[];
}

export interface ComboboxCreateAction {
  /** 목록 끝 항목의 문구. 앞뒤 공백을 지운 입력을 받는다 */
  label(text: string): string;
  onSelect(text: string): void;
}

export interface ComboboxProps
  extends Omit<
    ComponentProps<"input">,
    "value" | "defaultValue" | "onChange" | "size" | "type" | "children" | "role"
  > {
  value: string | null;
  onValueChange(value: string | null): void;
  options: ComboboxOption[];
  /** value가 options에 없을 때(원격 모드) 입력에 보일 라벨 */
  valueLabel?: string;
  /** 입력 글자를 제어할 때. 원격 검색 디바운스(300ms)는 소비 측의 몫이다 */
  inputValue?: string;
  onInputValueChange?(text: string): void;
  /** 기본 "local" */
  filtering?: "local" | "remote";
  loading?: boolean;
  /** 기본 "일치하는 항목이 없어요." */
  emptyText?: ReactNode;
  createAction?: ComboboxCreateAction;
  renderOption?(option: ComboboxOption): ReactNode;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
}

/** 라벨·키워드 부분 일치(대소문자 무시). 빈 검색어는 모두 보인다. */
function filterLocally(options: ComboboxOption[], text: string): ComboboxOption[] {
  const query = text.trim().toLocaleLowerCase();
  if (query === "") return options;
  return options.filter((option) =>
    [option.label, ...(option.keywords ?? [])].some((word) =>
      word.toLocaleLowerCase().includes(query),
    ),
  );
}

const optionClasses =
  "flex cursor-default select-none flex-col items-start gap-0.5 rounded-control px-2 py-1.5 text-body text-popover-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50";
// 하이라이트 옵션의 색 아닌 단서(고대비 모드, REQ-UI-001-025). 하이라이트된 항목에만 붙인다.
const highlightCue = "forced-colors:outline-2 forced-colors:-outline-offset-2";

// @MX:WARN: [AUTO] cmdk가 고정하는 ARIA를 피하려고 cmdk가 렌더링한 DOM 속성([cmdk-list]의 id, [cmdk-item]의 data-value·id)을 읽고, cmdk의 키 처리(Home/End 가로채기, Enter 기본 동작 막기)를 입력에서 끊는다.
// @MX:REASON: cmdk 1.1.1의 Command.Input은 aria-expanded=true·id·aria-controls를 덮어쓰고 Home/End를 막는다(research.md §6.3, m4-red-combobox-structure-probe.txt). cmdk 버전을 바꾸면 combobox.test.tsx로 이 가정들을 다시 확인해야 한다.
/**
 * 검색해서 고르는 편집형 콤보박스(APG 목록 자동완성, design.md §7.1 1순위 구조).
 * 입력은 직접 만든 <input>이고, cmdk는 목록·↓↑·Enter·하이라이트·IME 보호만 맡는다(shouldFilter=false, 제어형 하이라이트).
 */
export function Combobox({
  value,
  onValueChange,
  options,
  valueLabel,
  inputValue,
  onInputValueChange,
  filtering = "local",
  loading = false,
  emptyText = "일치하는 항목이 없어요.",
  createAction,
  renderOption,
  invalid,
  required,
  disabled,
  id,
  className,
  onKeyDown,
  onBlur,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  ...props
}: ComboboxProps) {
  const control = useFieldControl({ id, invalid, required, "aria-describedby": ariaDescribedBy });
  const createValue = `${useId()}-create`;
  const anchorRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  // 목록은 포털 안에서 늦게 붙을 수 있어 콜백 ref로 받아 다시 렌더링한다.
  const [listNode, setListNode] = useState<HTMLDivElement | null>(null);

  const selectedLabel =
    value === null
      ? ""
      : (options.find((option) => option.value === value)?.label ?? valueLabel ?? "");

  const [open, setOpen] = useState(false);
  const [ownText, setOwnText] = useState(selectedLabel);
  const text = inputValue ?? ownText;
  const textRef = useRef(text);
  textRef.current = text;

  const setText = useCallback(
    (next: string) => {
      if (textRef.current === next) return;
      textRef.current = next;
      if (inputValue === undefined) setOwnText(next);
      onInputValueChange?.(next);
    },
    [inputValue, onInputValueChange],
  );

  const visibleFor = (query: string) =>
    loading ? [] : filtering === "remote" ? options : filterLocally(options, query);
  const trimmed = text.trim();
  const visible = visibleFor(text);
  const showCreate =
    createAction !== undefined &&
    !loading &&
    trimmed !== "" &&
    !options.some((option) => option.label === trimmed);
  const itemValues = [
    ...visible.map((option) => option.value),
    ...(showCreate ? [createValue] : []),
  ];

  // 하이라이트는 제어형이다. 목록이 바뀌어 하이라이트 항목이 사라지면 첫 항목으로 맞춘다.
  const [highlight, setHighlight] = useState("");
  const fallbackHighlight = itemValues[0] ?? "";
  if (open && !itemValues.includes(highlight) && highlight !== fallbackHighlight) {
    setHighlight(fallbackHighlight);
  }

  // 값 동기화: 닫혀 있는 동안 바뀐 value는 입력에 반영하고, 열려 있는 동안 바뀐 값은 닫힐 때 맞춘다(EC-23).
  const syncedLabel = useRef(selectedLabel);
  useEffect(() => {
    if (open || syncedLabel.current === selectedLabel) return;
    syncedLabel.current = selectedLabel;
    setText(selectedLabel);
  }, [open, selectedLabel, setText]);

  // cmdk가 정한 목록 id와 하이라이트 항목 id를 렌더링된 DOM에서 읽는다.
  const [ids, setIds] = useState<{ list?: string; active?: string }>({});
  useLayoutEffect(() => {
    const list = open ? listNode : null;
    const listId = list?.id || undefined;
    const active =
      list && highlight !== ""
        ? Array.from(list.querySelectorAll("[cmdk-item]")).find(
            (item) => item.getAttribute("data-value") === highlight.trim(),
          )
        : undefined;
    const activeId = active?.id || undefined;
    setIds((prev) =>
      prev.list === listId && prev.active === activeId ? prev : { list: listId, active: activeId },
    );
  });

  const openList = (query: string) => {
    if (disabled) return;
    setOpen(true);
    const firstVisible = visibleFor(query)[0]?.value;
    setHighlight(firstVisible ?? (showCreate ? createValue : ""));
  };

  const closeAndRevert = () => {
    setOpen(false);
    setText(selectedLabel);
  };

  const choose = (option: ComboboxOption) => {
    setOpen(false);
    setText(option.label);
    onValueChange(option.value);
  };

  const chooseCreate = () => {
    setOpen(false);
    createAction?.onSelect(trimmed);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setText(next);
    if (disabled) return;
    setOpen(true);
    // 글자가 바뀔 때마다 하이라이트를 첫 항목으로 되돌린다(cmdk 검색어를 쓰지 않으므로 직접 맞춘다).
    const nextTrimmed = next.trim();
    const nextCreate =
      createAction !== undefined &&
      !loading &&
      nextTrimmed !== "" &&
      !options.some((option) => option.label === nextTrimmed);
    setHighlight(visibleFor(next)[0]?.value ?? (nextCreate ? createValue : ""));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    const composing = event.nativeEvent.isComposing || event.keyCode === 229;

    // Home/End는 입력 커서 이동에 남긴다(cmdk 루트가 가로채지 못하게 전파를 끊는다, EC-12).
    if (event.key === "Home" || event.key === "End") {
      event.stopPropagation();
      return;
    }
    if (!open) {
      // 닫힌 상태의 키는 cmdk에 넘기지 않는다(Enter 기본 동작을 막아 폼 제출을 가로채지 않게).
      event.stopPropagation();
      if (composing) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openList(text);
      } else if (event.key === "Escape") {
        setText("");
        if (value !== null) onValueChange(null);
      }
      return;
    }
    if (event.key === "Escape" && !composing) {
      // 열린 상태의 Esc는 목록만 닫는다(값 그대로).
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
    // ↓↑·Enter는 cmdk 루트가 처리한다. 조합 중(isComposing·keyCode 229)이면 cmdk가 무시한다.
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    const next = event.relatedTarget;
    if (next instanceof Node && popupRef.current?.contains(next)) return;
    if (open || textRef.current !== selectedLabel) closeAndRevert();
  };

  const announcement =
    open && !loading ? (visible.length > 0 ? `결과 ${visible.length}개` : emptyText) : null;
  const listLabel = ariaLabel ? `${ariaLabel} 검색 결과` : "검색 결과";

  return (
    <Command
      shouldFilter={false}
      value={highlight}
      onValueChange={setHighlight}
      tabIndex={undefined}
      className="relative w-full"
    >
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) closeAndRevert();
        }}
      >
        <Popover.Anchor asChild>
          <input
            {...props}
            ref={anchorRef}
            type="text"
            role="combobox"
            id={control.id}
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={open ? ids.list : undefined}
            aria-activedescendant={open ? ids.active : undefined}
            aria-autocomplete="list"
            aria-describedby={control.describedBy}
            aria-invalid={control.invalid || undefined}
            required={control.required}
            disabled={disabled}
            autoComplete="off"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={cn(textFieldClasses, "h-10 px-3", className)}
          />
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            ref={popupRef}
            // 팝업의 의미는 listbox가 맡는다. Radix가 주는 role="dialog"를 덮어쓴다(research.md §6.6).
            role="presentation"
            data-combobox-popup=""
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (event.target instanceof Node && anchorRef.current?.contains(event.target)) {
                event.preventDefault();
              }
            }}
            // 떠 있는 레이어 2단계: popover + border + shadow-raised, z 50(system.md §6·§7)
            className="z-50 w-(--radix-popover-trigger-width) min-w-48 overflow-hidden rounded-panel border border-border bg-popover text-popover-foreground shadow-raised motion-safe:data-[state=open]:animate-fade-in"
          >
            {loading ? <Loading size="sm" className="px-3.5 py-2.5" /> : null}
            <Command.List
              ref={setListNode}
              label={listLabel}
              // 옵션을 눌러도 포커스가 입력에 머물게 한다.
              onMouseDown={(event) => event.preventDefault()}
              className="max-h-72 overflow-y-auto p-1.5 empty:hidden"
            >
              {visible.map((option) => (
                <Command.Item
                  key={option.value}
                  value={option.value}
                  onSelect={() => choose(option)}
                  className={cn(optionClasses, option.value === highlight && highlightCue)}
                >
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <>
                      <span>{option.label}</span>
                      {option.description ? (
                        <span className="text-caption text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </>
                  )}
                </Command.Item>
              ))}
              {showCreate && createAction ? (
                <Command.Item
                  value={createValue}
                  onSelect={chooseCreate}
                  className={cn(
                    optionClasses,
                    "text-primary",
                    createValue === highlight && highlightCue,
                  )}
                >
                  {createAction.label(trimmed)}
                </Command.Item>
              ) : null}
            </Command.List>
            {!loading && visible.length === 0 ? (
              <p className="px-3.5 pb-2.5 pt-1 text-body-sm text-muted-foreground first:pt-2.5">
                {emptyText}
              </p>
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </Command>
  );
}
