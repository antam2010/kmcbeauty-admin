// 오류 정규화(AC-UI-002-08). 기대값은 acceptance.md §3.2 응답 표를 그대로 옮긴다.
// 응답은 MSW 처리기가 주고, 미들웨어가 없는 openapi-fetch 클라이언트로 받아 unwrap()으로 정규화한다.
// 409 코드 이름은 §3.2 메모에 따라 백엔드 실제 이름(PHONEBOOK_CONFLICT — app/exceptions.py 기본 코드)으로 맞췄다.
import { HttpResponse, http } from "msw";
import createClient from "openapi-fetch";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { ApiError, normalizeError, unwrap } from "./errors";
import type { paths } from "./schema";

const BASE = "http://api.test";
// fetch는 부를 때 찾는다(MSW가 setup의 beforeAll에서 globalThis.fetch를 바꾸므로 모듈 적재 때 잡으면 안 된다).
const client = createClient<paths>({
  baseUrl: BASE,
  fetch: (request) => globalThis.fetch(request),
});

interface View {
  status: number;
  kind: ApiError["kind"];
  code?: string;
  message: string;
  hint?: string;
  fieldErrors?: Record<string, string>;
}

function view(error: ApiError): View {
  const { status, kind, code, message, hint, fieldErrors } = error;
  return { status, kind, code, message, hint, fieldErrors };
}

function expected(
  status: number,
  kind: ApiError["kind"],
  message: string,
  rest: Partial<View> = {},
) {
  return {
    status,
    kind,
    code: undefined,
    message,
    hint: undefined,
    fieldErrors: undefined,
    ...rest,
  };
}

const SERVER_MESSAGE = "서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.";

const TABLE: [string, () => Response, View][] = [
  [
    "404 봉투(앱 코드 표에 없는 코드 → detail.detail 그대로)",
    () =>
      HttpResponse.json(
        {
          detail: {
            code: "PHONEBOOK_NOT_FOUND",
            detail: "전화번호부를 찾을 수 없습니다.",
            hint: "목록을 새로고침해 주세요.",
          },
        },
        { status: 404 },
      ),
    expected(404, "http", "전화번호부를 찾을 수 없습니다.", {
      code: "PHONEBOOK_NOT_FOUND",
      hint: "목록을 새로고침해 주세요.",
    }),
  ],
  [
    "404 SHOP_NOT_SELECTED(앱 코드 표 문구가 먼저)",
    () =>
      HttpResponse.json(
        { detail: { code: "SHOP_NOT_SELECTED", detail: "상점을 먼저 선택해주세요.", hint: null } },
        { status: 404 },
      ),
    expected(404, "http", "매장을 먼저 골라 주세요.", { code: "SHOP_NOT_SELECTED" }),
  ],
  [
    "422 loc 배열 → fieldErrors",
    () =>
      HttpResponse.json(
        {
          detail: [
            {
              loc: ["body", "phone_number"],
              msg: "String should have at most 20 characters",
              type: "string_too_long",
            },
            {
              loc: ["body", "treatment_items", 0, "base_price"],
              msg: "Input should be greater than or equal to 0",
              type: "greater_than_equal",
            },
          ],
        },
        { status: 422 },
      ),
    expected(422, "validation", "입력한 값을 확인해 주세요.", {
      fieldErrors: {
        phone_number: "String should have at most 20 characters",
        "treatment_items.0.base_price": "Input should be greater than or equal to 0",
      },
    }),
  ],
  [
    "409 봉투",
    () =>
      HttpResponse.json(
        {
          detail: { code: "PHONEBOOK_CONFLICT", detail: "이미 등록된 전화번호입니다.", hint: null },
        },
        { status: 409 },
      ),
    expected(409, "http", "이미 등록된 전화번호입니다.", { code: "PHONEBOOK_CONFLICT" }),
  ],
  [
    "409 봉투 없음",
    () => HttpResponse.json({ error: "x" }, { status: 409 }),
    expected(409, "http", "이미 있는 값이에요. 입력을 확인해 주세요."),
  ],
  [
    "400 본문 없음",
    () => new HttpResponse(null, { status: 400 }),
    expected(400, "http", "요청을 처리하지 못했어요. 입력을 확인해 주세요."),
  ],
  [
    "401 봉투 없음",
    () => HttpResponse.json({ detail: "Not authenticated" }, { status: 401 }),
    expected(401, "http", "로그인이 필요해요. 다시 로그인해 주세요."),
  ],
  [
    "403 본문 없음",
    () => new HttpResponse(null, { status: 403 }),
    expected(403, "http", "이 작업을 할 권한이 없어요."),
  ],
  [
    "404 봉투 없음(EC-09)",
    () => HttpResponse.json({ error: "x" }, { status: 404 }),
    expected(404, "http", "찾는 정보가 없어요."),
  ],
  [
    "429 JSON 아닌 본문",
    () => new HttpResponse("Too Many Requests", { status: 429 }),
    expected(429, "http", "요청이 많아요. 잠시 뒤 다시 시도해 주세요."),
  ],
  [
    "500 HTML 본문",
    () =>
      new HttpResponse("<html><body>Internal Server Error</body></html>", {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }),
    expected(500, "http", SERVER_MESSAGE),
  ],
  [
    "502 본문 없음",
    () => new HttpResponse(null, { status: 502 }),
    expected(502, "http", SERVER_MESSAGE),
  ],
  [
    "503 본문 없음",
    () => new HttpResponse(null, { status: 503 }),
    expected(503, "http", SERVER_MESSAGE),
  ],
  [
    "504 본문 없음",
    () => new HttpResponse(null, { status: 504 }),
    expected(504, "http", SERVER_MESSAGE),
  ],
  [
    "네트워크 오류",
    () => HttpResponse.error(),
    expected(0, "network", "서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요."),
  ],
];

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("오류가 나야 한다");
}

describe("§3.2 응답 표 정규화", () => {
  it.each(TABLE)("%s", async (_name, respond, want) => {
    server.use(http.get(`${BASE}/phonebooks`, respond));
    const error = await failure(unwrap(client.GET("/phonebooks")));
    expect(view(error)).toEqual(want);
  });

  it("요청 취소(AbortError)는 kind aborted, status 0, 빈 문구다", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await failure(unwrap(client.GET("/phonebooks", { signal: controller.signal })));
    expect(view(error)).toEqual(expected(0, "aborted", ""));
  });
});

describe("unwrap 성공", () => {
  it("2xx면 본문 데이터를 그대로 돌려준다", async () => {
    server.use(
      http.get(`${BASE}/phonebooks`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 20, pages: 0 }),
      ),
    );
    await expect(unwrap(client.GET("/phonebooks"))).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      size: 20,
      pages: 0,
    });
  });

  it("204면 undefined를 돌려준다", async () => {
    server.use(http.post(`${BASE}/shops/selected`, () => new HttpResponse(null, { status: 204 })));
    await expect(
      unwrap(client.POST("/shops/selected", { body: { shop_id: 7 } })),
    ).resolves.toBeUndefined();
  });
});

describe("normalizeError 단위", () => {
  it("422 loc이 body가 아니면 접두사를 남긴다(EC-10)", () => {
    const response = new Response(null, { status: 422 });
    const error = normalizeError(response, {
      detail: [
        { loc: ["query", "page"], msg: "Input should be a valid integer", type: "int_parsing" },
      ],
    });
    expect(error.fieldErrors).toEqual({ "query.page": "Input should be a valid integer" });
    expect(error.kind).toBe("validation");
  });

  it("422 본문이 loc 배열이 아니면 fieldErrors가 없고 문구는 422 문구다", () => {
    const error = normalizeError(new Response(null, { status: 422 }), { detail: "bad" });
    expect(view(error)).toEqual(expected(422, "validation", "입력한 값을 확인해 주세요."));
  });

  it("422는 봉투의 detail.detail이 있어도 422 문구를 쓴다", () => {
    const error = normalizeError(new Response(null, { status: 422 }), {
      detail: { code: "X_INVALID", detail: "백엔드 문구", hint: null },
    });
    expect(error.message).toBe("입력한 값을 확인해 주세요.");
    expect(error.code).toBe("X_INVALID");
  });

  it("표에 없는 4xx는 400 문구, 표에 없는 5xx는 서버 문구다", () => {
    expect(normalizeError(new Response(null, { status: 418 })).message).toBe(
      "요청을 처리하지 못했어요. 입력을 확인해 주세요.",
    );
    expect(normalizeError(new Response(null, { status: 507 })).message).toBe(SERVER_MESSAGE);
  });

  it("봉투의 detail.detail이 빈 문자열이면 상태 코드 문구로 간다", () => {
    const error = normalizeError(new Response(null, { status: 404 }), {
      detail: { code: "X_NOT_FOUND", detail: "", hint: "" },
    });
    expect(view(error)).toEqual(
      expected(404, "http", "찾는 정보가 없어요.", { code: "X_NOT_FOUND" }),
    );
  });

  it("ApiError는 그대로 돌려준다", () => {
    const original = new ApiError({ status: 429, kind: "http", message: "m" });
    expect(normalizeError(original)).toBe(original);
  });

  it("이름이 AbortError인 오류는 aborted, 그 밖의 던진 값은 network다", () => {
    expect(normalizeError(new DOMException("x", "AbortError")).kind).toBe("aborted");
    expect(normalizeError(new TypeError("Failed to fetch")).kind).toBe("network");
    expect(normalizeError("이상한 값").kind).toBe("network");
  });

  it("ApiError는 Error이고 이름이 ApiError다", () => {
    const error = new ApiError({ status: 0, kind: "network", message: "m" });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
  });
});
