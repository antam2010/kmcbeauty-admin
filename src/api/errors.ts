// API 오류를 한 모양(ApiError)으로 맞추고 화면 문구를 정한다(design.md §6, acceptance.md §3.2).
// 문구 결정 순서: ① 앱 코드 표 → ② 백엔드 봉투의 detail.detail(해요체 규칙의 예외, C4) → ③ 상태 코드 문구.
// 422는 언제나 ③이다. 아래 문구는 acceptance.md §3.2와 같은 글자로 둔다(정본 순서: §3.2 → system.md §11 → 코드).

export type ApiErrorKind = "http" | "validation" | "network" | "aborted";

interface ApiErrorInit {
  status: number;
  kind: ApiErrorKind;
  message: string;
  code?: string;
  hint?: string;
  fieldErrors?: Record<string, string>;
}

/** 화면이 다루는 API 오류. status 0은 응답이 없었다는 뜻이다(네트워크·취소). */
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly code?: string;
  readonly hint?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.kind = init.kind;
    this.code = init.code;
    this.hint = init.hint;
    this.fieldErrors = init.fieldErrors;
  }
}

// ① 앱 코드 표(처음 값)
const APP_CODE_MESSAGES: Record<string, string> = {
  SHOP_NOT_SELECTED: "매장을 먼저 골라 주세요.",
};

// ③ 상태 코드 문구
const STATUS_MESSAGES: Record<number, string> = {
  400: "요청을 처리하지 못했어요. 입력을 확인해 주세요.",
  401: "로그인이 필요해요. 다시 로그인해 주세요.",
  403: "이 작업을 할 권한이 없어요.",
  404: "찾는 정보가 없어요.",
  409: "이미 있는 값이에요. 입력을 확인해 주세요.",
  422: "입력한 값을 확인해 주세요.",
  429: "요청이 많아요. 잠시 뒤 다시 시도해 주세요.",
};

export const SERVER_ERROR_MESSAGE = "서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.";
export const NETWORK_ERROR_MESSAGE =
  "서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.";

function statusMessage(status: number): string {
  // 표에 없는 4xx는 400 문구, 5xx는 서버 문구로 둔다
  return STATUS_MESSAGES[status] ?? (status >= 500 ? SERVER_ERROR_MESSAGE : STATUS_MESSAGES[400]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const nonEmptyString = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : undefined;

/** 422 `{"detail":[{loc,msg}]}` → `body`를 뺀 loc 조각을 "."으로 이은 경로가 키(EC-10: body가 아니면 접두사를 남김). */
function fieldErrorsOf(detail: unknown): Record<string, string> | undefined {
  if (!Array.isArray(detail)) return undefined;
  const result: Record<string, string> = {};
  for (const item of detail) {
    if (!isRecord(item) || !Array.isArray(item.loc) || typeof item.msg !== "string") continue;
    const path = item.loc[0] === "body" ? item.loc.slice(1) : item.loc;
    const key = path.join(".");
    if (!(key in result)) result[key] = item.msg;
  }
  return result;
}

function isAbortError(value: unknown): boolean {
  return isRecord(value) && value.name === "AbortError";
}

/**
 * 응답(+ 파싱한 본문) 또는 던져진 값을 ApiError로 바꾼다.
 * 본문이 JSON이 아니면(HTML·글자) 본문 없음으로 본다 — 봉투 모양이 아니면 상태 코드 문구가 된다.
 */
export function normalizeError(input: unknown, body?: unknown): ApiError {
  if (input instanceof ApiError) return input;
  if (!(input instanceof Response)) {
    return isAbortError(input)
      ? new ApiError({ status: 0, kind: "aborted", message: "" })
      : new ApiError({ status: 0, kind: "network", message: NETWORK_ERROR_MESSAGE });
  }
  const { status } = input;
  const detail = isRecord(body) ? body.detail : undefined;
  const envelope = isRecord(detail) && !Array.isArray(detail) ? detail : undefined;
  const code = nonEmptyString(envelope?.code);
  const hint = nonEmptyString(envelope?.hint);
  if (status === 422) {
    return new ApiError({
      status,
      kind: "validation",
      code,
      hint,
      message: statusMessage(422),
      fieldErrors: fieldErrorsOf(detail),
    });
  }
  const message =
    (code ? APP_CODE_MESSAGES[code] : undefined) ??
    nonEmptyString(envelope?.detail) ??
    statusMessage(status);
  return new ApiError({ status, kind: "http", code, hint, message });
}

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * openapi-fetch 호출 결과에서 데이터를 꺼낸다. 실패 응답과 던져진 오류(네트워크·취소)는 ApiError로 던진다.
 * 모든 쿼리·변경 함수가 이 함수를 거친다.
 */
export async function unwrap<T>(pending: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await pending;
  } catch (error) {
    throw normalizeError(error);
  }
  if (!result.response.ok) throw normalizeError(result.response, result.error);
  return result.data as T;
}
