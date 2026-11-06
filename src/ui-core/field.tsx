import { CircleAlert } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
} from "react";
import { cn } from "./cn";

interface FieldContextValue {
  controlId: string;
  /** 실제로 렌더링한 설명·오류의 id(설명 → 오류 순) */
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** 비어 있지 않은 id만 공백으로 잇는다. 하나도 없으면 undefined를 돌려줘 속성을 붙이지 않는다. */
export function joinIds(...ids: (string | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(" ");
  return joined === "" ? undefined : joined;
}

/** 컨트롤이 Field 밖에서 쓰일 때 스스로 받는 값 */
export interface FieldControlProps {
  id?: string;
  "aria-describedby"?: string;
  invalid?: boolean;
  required?: boolean;
}

/** 컨트롤이 자신의 대상 요소에 붙일 값 */
export interface FieldControl {
  id: string | undefined;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

// @MX:ANCHOR: [AUTO] Input·Textarea·Checkbox(M2)와 Select·Combobox·DateTimePicker(M3·M4)가 함께 쓰는 aria 연결 규약이다.
// @MX:REASON: id·aria-describedby(설명 → 오류 → 컨트롤 자신의 값)·aria-invalid·필수 여부의 계산이 여기 한곳에 있다. 바꾸면 Field로 감싼 모든 컨트롤의 라벨·설명 연결이 함께 바뀐다(AC-UI-001-16).
/**
 * Field 안이면 Field가 정한 id·설명·오류·필수 여부를, 밖이면 컨트롤 자신의 값을 돌려준다.
 * 필수 여부를 붙이는 방식은 컨트롤이 정한다: 네이티브 입력은 required, 버튼형 대상은 aria-required.
 */
export function useFieldControl(own: FieldControlProps = {}): FieldControl {
  const field = useContext(FieldContext);
  return {
    id: field?.controlId ?? own.id,
    describedBy: joinIds(field?.describedBy, own["aria-describedby"]),
    invalid: Boolean(own.invalid || field?.invalid),
    required: Boolean(own.required || field?.required),
  };
}

export interface FieldProps extends Omit<ComponentProps<"div">, "children"> {
  label: string;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  /** 컨트롤 하나. id·aria-describedby·aria-invalid·필수 여부를 문맥으로 받는다 */
  children: ReactElement;
}

/** 라벨·설명·오류를 자식 컨트롤과 연결한다(design.md §4.5, REQ-UI-001-016). */
export function Field({
  label,
  description,
  error,
  required = false,
  children,
  className,
  ...props
}: FieldProps) {
  const baseId = useId();
  // 소비 측이 컨트롤에 id를 주면 그 id를 쓰고, 없으면 만들어 라벨과 맞춘다.
  const childId =
    isValidElement<{ id?: unknown }>(children) && typeof children.props.id === "string"
      ? children.props.id
      : undefined;
  const controlId = childId ?? `${baseId}-control`;
  const descriptionId = description ? `${baseId}-description` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;

  const context: FieldContextValue = {
    controlId,
    describedBy: joinIds(descriptionId, errorId),
    invalid: Boolean(error),
    required,
  };

  return (
    <FieldContext value={context}>
      <div className={cn("flex flex-col gap-2", className)} {...props}>
        <label htmlFor={controlId} className="text-body font-medium text-foreground">
          {label}
          {required ? (
            <span aria-hidden="true" className="ms-0.5 text-destructive">
              *
            </span>
          ) : null}
        </label>
        <div className="flex flex-col gap-1.5">
          {children}
          {description ? (
            <div id={descriptionId} className="text-body-sm text-muted-foreground">
              {description}
            </div>
          ) : null}
          {error ? (
            <p id={errorId} className="flex items-start gap-1.5 text-body-sm text-destructive">
              <CircleAlert className="mt-0.75 size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </FieldContext>
  );
}
