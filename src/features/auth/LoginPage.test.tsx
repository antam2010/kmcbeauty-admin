// 로그인 화면(AC-UI-002-11). 문구는 acceptance.md §3.2(필드별 앱 문구·화면별 문구)를 그대로 옮겼다.
// 사용자 결정 F3(hint를 그리지 않음), 감사 결함 F4(비밀번호가 변경 캐시에 남지 않음), M2 일탈 8(access_token 없는 응답)도 여기서 본다.
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { getAccessToken } from "@/api/session";
import { shopFixture, TEST_API_ORIGIN } from "@/test/msw/fixtures";
import { loginBody, loginHandler } from "@/test/msw/handlers/auth";
import { selectedShopHandler } from "@/test/msw/handlers/shops";
import { expectLocation, renderRoute } from "@/test/render-route";

const PASSWORD = "pw-secret-7";
const MESSAGES = {
  emailRequired: "이메일을 입력해 주세요.",
  passwordRequired: "비밀번호를 입력해 주세요.",
  emailFormat: "이메일 형식을 확인해 주세요.",
  wrongCredentials: "이메일이나 비밀번호가 맞지 않아요.",
  tooMany: "로그인 시도가 많아요. 1분 뒤 다시 시도해 주세요.",
  network: "서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
  server: "서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
};

type Respond = () => Response | Promise<Response>;

async function openLogin(
  path: string,
  respond: Respond,
  shop: typeof shopFixture | null = shopFixture,
) {
  const user = userEvent.setup();
  const view = renderRoute(path, {
    session: "S0",
    handlers: [loginHandler(TEST_API_ORIGIN, respond), selectedShopHandler(TEST_API_ORIGIN, shop)],
  });
  await screen.findByRole("heading", { level: 1, name: "로그인" });
  const email = screen.getByLabelText(/^이메일/);
  const password = screen.getByLabelText(/^비밀번호/);
  const submit = screen.getByRole("button", { name: "로그인" });
  const fill = async (emailValue: string, passwordValue: string) => {
    if (emailValue) await user.type(email, emailValue);
    if (passwordValue) await user.type(password, passwordValue);
  };
  return { ...view, user, email, password, submit, fill };
}

const ok: Respond = () => HttpResponse.json(loginBody("access-1", "refresh-1"));
const status =
  (code: number, body?: unknown): Respond =>
  () =>
    body ? HttpResponse.json(body, { status: code }) : new HttpResponse(null, { status: code });

describe("AC-UI-002-11 로그인 — 처음 상태", () => {
  it("두 입력이 빈 값이고 자동 완성 속성이 username·current-password다", async () => {
    const { email, password } = await openLogin("/login", ok);
    expect(email).toHaveValue("");
    expect(password).toHaveValue("");
    expect(email).toHaveAttribute("autocomplete", "username");
    expect(password).toHaveAttribute("autocomplete", "current-password");
  });

  it("이용약관·개인정보처리방침 링크가 있다", async () => {
    await openLogin("/login", ok);
    expect(screen.getByRole("link", { name: "이용약관" })).toHaveAttribute(
      "href",
      "/terms-of-service",
    );
    expect(screen.getByRole("link", { name: "개인정보처리방침" })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
  });
});

describe("AC-UI-002-11 로그인 — 형식 검사(요청 없음)", () => {
  it("(가) 빈 제출: 요청 0회, 두 필드 오류, 포커스가 이메일", async () => {
    const { user, submit, email, log } = await openLogin("/login", ok);
    await user.click(submit);
    expect(screen.getByText(MESSAGES.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(MESSAGES.passwordRequired)).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(log.count("POST", "/auth/login")).toBe(0);
  });

  it("(나) 이메일 abc: 요청 0회, 형식 문구, 포커스가 이메일", async () => {
    const { user, submit, email, fill, log } = await openLogin("/login", ok);
    await fill("abc", PASSWORD);
    await user.click(submit);
    expect(screen.getByText(MESSAGES.emailFormat)).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(log.count("POST", "/auth/login")).toBe(0);
  });

  it("(나') a@b.co·x: 형식 오류 없이 로그인 요청 1회(form-urlencoded, grant_type=password, credentials include)", async () => {
    const { user, submit, fill, log } = await openLogin("/login", status(401));
    await fill("a@b.co", "x");
    await user.click(submit);
    await screen.findByText(MESSAGES.wrongCredentials);
    expect(screen.queryByText(MESSAGES.emailFormat)).toBeNull();
    const sent = log.requests.filter((r) => r.path === "/auth/login");
    expect(sent).toHaveLength(1);
    expect(sent[0].contentType).toContain("application/x-www-form-urlencoded");
    expect(sent[0].credentials).toBe("include");
    const body = new URLSearchParams(sent[0].body);
    expect(body.get("username")).toBe("a@b.co");
    expect(body.get("password")).toBe("x");
    expect(body.get("grant_type")).toBe("password");
  });

  it("앞뒤 공백을 자른 이메일로 형식을 보고 그 값으로 보낸다", async () => {
    const { user, submit, fill, log } = await openLogin("/login", status(401));
    await fill("  a@b.co ", "x");
    await user.click(submit);
    await screen.findByText(MESSAGES.wrongCredentials);
    const sent = log.requests.find((r) => r.path === "/auth/login");
    expect(new URLSearchParams(sent?.body).get("username")).toBe("a@b.co");
  });
});

describe("AC-UI-002-11 로그인 — 서버 오류 문구", () => {
  it.each([
    [
      "(다) 401",
      status(401, { detail: { code: "INVALID_CREDENTIALS", detail: "로그인 실패", hint: "놉" } }),
      MESSAGES.wrongCredentials,
    ],
    ["(라) 429", status(429), MESSAGES.tooMany],
    ["(마) 네트워크 오류", () => HttpResponse.error(), MESSAGES.network],
  ])(
    "%s → 그 문구, 제출 버튼이 loading에서 돌아오고 hint는 그리지 않는다",
    async (_name, respond, message) => {
      const { user, submit, fill } = await openLogin("/login", async () => {
        await delay(20);
        return respond();
      });
      await fill("owner@kmc.test", PASSWORD);
      await user.click(submit);
      expect(submit).toHaveAttribute("aria-busy", "true");
      await screen.findByText(message);
      await waitFor(() => expect(submit).not.toHaveAttribute("aria-busy"));
      expect(document.body.textContent).not.toContain("놉");
      expect(getAccessToken()).toBeNull();
    },
  );

  it("세 문구는 서로 다르다", () => {
    expect(new Set([MESSAGES.wrongCredentials, MESSAGES.tooMany, MESSAGES.network]).size).toBe(3);
  });

  it("응답에 access_token이 없으면(EC-04) 세션을 만들지 않고 정규화한 서버 문구를 보인다(M2 일탈 8 — status 502로 가르지 않음)", async () => {
    const { user, submit, fill, router } = await openLogin("/login", () =>
      HttpResponse.json({ refresh_token: "refresh-1" }),
    );
    await fill("owner@kmc.test", PASSWORD);
    await user.click(submit);
    await screen.findByText(MESSAGES.server);
    expect(getAccessToken()).toBeNull();
    expectLocation(router, "/login");
  });
});

describe("AC-UI-002-11 로그인 — 성공 뒤 이동", () => {
  it.each([
    [
      "(바) 매장 있음 + next=%2Fcustomers",
      "/login?next=%2Fcustomers",
      shopFixture,
      "/customers",
      "고객",
    ],
    ["(사) 매장 있음 + next 없음", "/login", shopFixture, "/reservations", "예약 캘린더"],
    [
      "(아) 매장 없음 + next=%2Fcustomers",
      "/login?next=%2Fcustomers",
      null,
      "/shops?next=%2Fcustomers",
      "매장 선택",
    ],
    ["(자) 매장 없음 + next 없음", "/login", null, "/shops", "매장 선택"],
  ])("%s → %s", async (_name, path, shop, destination, title) => {
    const { user, submit, fill, router } = await openLogin(path, ok, shop);
    await fill("owner@kmc.test", PASSWORD);
    await user.click(submit);
    await screen.findByRole("heading", { level: 1, name: title });
    expectLocation(router, destination);
    expect(getAccessToken()).toBe("access-1");
  });
});

describe("비밀번호가 변경 캐시에 남지 않는다(감사 결함 F4)", () => {
  const mutationStates = (view: Awaited<ReturnType<typeof openLogin>>) =>
    JSON.stringify(
      view.app.services.queryClient
        .getMutationCache()
        .getAll()
        .map((m) => m.state),
    );

  it("성공해 다른 화면으로 간 뒤 변경 캐시 상태에 비밀번호가 없다", async () => {
    const view = await openLogin("/login", ok);
    await view.fill("owner@kmc.test", PASSWORD);
    await view.user.click(view.submit);
    await screen.findByRole("heading", { level: 1, name: "예약 캘린더" });
    await waitFor(() => expect(mutationStates(view)).not.toContain(PASSWORD));
  });

  it("실패한 뒤 로그인 화면에 머무는 동안에도 변경 캐시 상태에 비밀번호가 없다", async () => {
    const view = await openLogin("/login", status(401));
    await view.fill("owner@kmc.test", PASSWORD);
    await view.user.click(view.submit);
    await screen.findByText(MESSAGES.wrongCredentials);
    await waitFor(() => expect(mutationStates(view)).not.toContain(PASSWORD));
  });
});
