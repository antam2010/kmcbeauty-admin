import { describe, expect, it } from "vitest";
import { parseErrorMessage } from "./parseErrorMessage";

describe("parseErrorMessage", () => {
  it("400 응답이면 잘못된 요청 메시지를 돌려준다", () => {
    expect(parseErrorMessage({ response: { status: 400 } })).toBe("잘못된 요청입니다.");
  });

  it("409 응답이면 중복 등록 메시지를 돌려준다", () => {
    expect(parseErrorMessage({ response: { status: 409 } })).toBe("이미 등록된 정보입니다.");
  });

  it("그 밖의 응답 코드는 상태 코드를 담은 서버 오류 메시지를 돌려준다", () => {
    expect(parseErrorMessage({ response: { status: 500 } })).toBe("서버 오류 (500)");
  });

  it("응답이 없는 Error는 Error의 메시지를 그대로 돌려준다", () => {
    expect(parseErrorMessage(new Error("네트워크 연결 실패"))).toBe("네트워크 연결 실패");
  });

  it("알 수 없는 값이면 기본 메시지를 돌려준다", () => {
    expect(parseErrorMessage("문자열 오류")).toBe("알 수 없는 오류가 발생했습니다.");
    expect(parseErrorMessage(null)).toBe("알 수 없는 오류가 발생했습니다.");
  });
});
