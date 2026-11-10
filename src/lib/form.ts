// 작은 폼 훅(plan.md §B.5, design.md §8). 폼 라이브러리를 들이지 않는다 — 폼 다섯 개가 대부분 ui-core 제어 컴포넌트라
// 범용 라이브러리를 써도 연결 코드가 필요하고, 새 의존성(C5)보다 이 훅이 작다.
// 시점 규칙: 처음에는 오류를 숨기고, 필드를 떠나거나(blur) 한 번 제출하면 보이며, 그 뒤로는 값이 바뀔 때마다 다시 검사한다.
// 필드 이름은 경로 문자열(treatment_items.0.base_price)을 받는다 — 422 fieldErrors 키와 그대로 맞는다.
import { useCallback, useRef, useState } from "react";

/** 필드 이름(경로) → 오류 문구. 없으면 undefined. */
export type FormErrors = Partial<Record<string, string | undefined>>;

export interface UseFormOptions<V> {
  initialValues: V;
  validate?: (values: V) => FormErrors;
  /** 오류가 없을 때만 부른다. 실패 처리(서버 오류를 필드로 옮기기 등)는 이 함수 안에서 한다. */
  onSubmit: (values: V) => Promise<void> | void;
}

export interface RegisteredField {
  name: string;
  value: unknown;
  /** 입력 이벤트나 제어 컴포넌트의 값을 그대로 받는다. */
  onChange: (eventOrValue: unknown) => void;
  onBlur: () => void;
  ref: (element: HTMLElement | null) => void;
}

function getPath(source: unknown, name: string): unknown {
  return name
    .split(".")
    .reduce<unknown>(
      (current, key) =>
        typeof current === "object" && current !== null ? Reflect.get(current, key) : undefined,
      source,
    );
}

function setPath<V>(source: V, name: string, value: unknown): V {
  const [head, ...rest] = name.split(".");
  const container: Record<string, unknown> | unknown[] = Array.isArray(source)
    ? [...source]
    : { ...(source as Record<string, unknown>) };
  const next =
    rest.length === 0 ? value : setPath(Reflect.get(container, head), rest.join("."), value);
  Reflect.set(container, head, next);
  return container as V;
}

function inputValue(eventOrValue: unknown): unknown {
  if (typeof eventOrValue === "object" && eventOrValue !== null && "target" in eventOrValue) {
    const target = (eventOrValue as { target: unknown }).target;
    if (typeof target === "object" && target !== null && "value" in target) {
      return (target as { value: unknown }).value;
    }
  }
  return eventOrValue;
}

export function useForm<V>({ initialValues, validate, onSubmit }: UseFormOptions<V>) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrorState] = useState<Record<string, string>>({});
  // 등록 순서대로 필드 요소를 둔다(Map은 넣은 순서를 지킨다). 첫 오류 필드 포커스에 쓴다.
  const fields = useRef(new Map<string, HTMLElement | null>());

  const clientErrors = validate?.(values) ?? {};

  const focusFirst = (names: Set<string>): boolean => {
    for (const [name, element] of fields.current) {
      if (names.has(name)) {
        element?.focus();
        return true;
      }
    }
    return false;
  };

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((current) => setPath(current, name, value));
    // 값이 바뀌면 그 필드의 서버 오류는 낡은 판정이다 — 지우고 클라이언트 검사로 돌아간다
    setServerErrorState((current) => {
      if (!(name in current)) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const register = (name: string): RegisteredField => {
    if (!fields.current.has(name)) fields.current.set(name, null);
    return {
      name,
      value: getPath(values, name),
      onChange: (eventOrValue) => setValue(name, inputValue(eventOrValue)),
      onBlur: () =>
        setTouched((current) => (current[name] ? current : { ...current, [name]: true })),
      ref: (element) => {
        fields.current.set(name, element);
      },
    };
  };

  /** 지금 보여야 하는 오류. 떠났거나 제출한 필드만 보인다. 서버 오류가 클라이언트 오류보다 앞선다. */
  const error = (name: string): string | undefined =>
    touched[name] || submitted ? (serverErrors[name] ?? clientErrors[name]) : undefined;

  /**
   * 422 fieldErrors·409를 필드 오류로 옮긴다. 필드별 앱 문구(appMessage)가 있으면 그 문구, 없으면 받은 문구(백엔드 msg).
   * 등록한 필드 가운데 첫 오류 필드로 포커스하고, 맞는 필드가 하나라도 있으면 true(없으면 부르는 쪽이 Alert로 보인다).
   */
  const setServerErrors = (
    errors: Record<string, string>,
    appMessage?: (name: string, message: string) => string | undefined,
  ): boolean => {
    const mapped = Object.fromEntries(
      Object.entries(errors).map(([name, message]) => [
        name,
        appMessage?.(name, message) ?? message,
      ]),
    );
    setServerErrorState(mapped);
    setTouched((current) => ({
      ...current,
      ...Object.fromEntries(Object.keys(mapped).map((name) => [name, true])),
    }));
    return focusFirst(new Set(Object.keys(mapped)));
  };

  const handleSubmit = async (event?: { preventDefault(): void }): Promise<void> => {
    event?.preventDefault();
    setSubmitted(true);
    const invalid = new Set(Object.keys(clientErrors).filter((name) => clientErrors[name]));
    if (invalid.size > 0) {
      focusFirst(invalid);
      return;
    }
    setServerErrorState({});
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    submitted,
    submitting,
    dirty: JSON.stringify(values) !== JSON.stringify(initialValues),
    register,
    error,
    setValue,
    setServerErrors,
    handleSubmit,
  };
}
