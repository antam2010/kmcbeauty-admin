// 이용약관·개인정보처리방침(AC-UI-002-13 (라)). 문단은 acceptance.md §3.9 표를 그대로 옮겼다.
// 비교는 공백 문자 연속을 공백 하나로 줄이고 앞뒤를 자른 값으로 한다(§3.9).
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectLocation, renderRoute } from "@/test/render-route";

const TERMS = [
  "본 서비스는 무료로 제공되며, 누구나 이메일과 별명을 통해 회원 가입할 수 있습니다.",
  "운영자는 서비스의 일부 또는 전부를 사전 통보 없이 변경하거나 종료할 수 있으며, 서비스 종료 시 사용자의 데이터는 파기 또는 요청 시 반환됩니다.",
  "사용자는 언제든지 자신의 정보를 열람, 수정, 삭제할 수 있으며, 본 약관은 향후 필요에 따라 수정될 수 있습니다.",
];

const PRIVACY = [
  "본 서비스는 회원가입 시 이메일(아이디), 별명 정보를 수집하며, 샵 등록 시 샵명, 주소, 전화번호, 사업자등록번호를 입력받습니다. 수집된 정보는 서비스 제공 및 사용자 확인 외의 목적으로 사용되지 않으며, 열람/수정/삭제는 언제든 가능합니다.",
  "운영자는 서비스를 자유롭게 종료할 수 있으며, 종료 시 개인정보는 즉시 파기되거나 요청 시 반환됩니다. 쿠키는 인증용 리프레시 토큰에만 사용되며, 제3자 제공 및 위탁은 없습니다.",
];

const normalize = (text: string | null) => (text ?? "").replace(/\s+/g, " ").trim();

describe.each([
  ["/terms-of-service", "이용약관", TERMS],
  ["/privacy-policy", "개인정보처리방침", PRIVACY],
])("%s(S0)", (path, title, paragraphs) => {
  it(`로그인 화면으로 가지 않고 h1 "${title}" 아래에 §3.9 문단을 순서대로 같은 글자로 보인다`, async () => {
    const { router } = renderRoute(path, { session: "S0" });
    const h1 = await screen.findByRole("heading", { level: 1, name: title });
    expectLocation(router, path);
    const article = h1.closest("article");
    expect(article).not.toBeNull();
    const shown = [...(article?.querySelectorAll("p") ?? [])].map((p) => normalize(p.textContent));
    expect(shown).toEqual(paragraphs);
  });
});
