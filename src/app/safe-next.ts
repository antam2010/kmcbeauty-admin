// 로그인·매장 선택 뒤 돌아갈 next 매개변수 검사(acceptance.md §3.3 `next` 규칙, design.md §3.2).
// WHATWG URL은 `\`를 `/`처럼 다루고 TAB·LF·CR을 지우므로, `/\evil.example`·`/%09/evil.example` 같은 값이
// 외부 주소가 될 수 있다. 그래서 글자 검사를 먼저 하고, 출처 비교와 앞머리 검사를 함께 한다(열린 리디렉트 방지).

// biome-ignore lint/suspicious/noControlCharactersInRegex: C0 제어 문자를 찾는 것이 이 정규식의 목적이다
const FORBIDDEN_CHARACTERS = /[\\\u0000-\u001f\s]/;

// @MX:ANCHOR: [AUTO] 로그인 화면 loader·로그인 제출·매장 선택 세 곳이 같은 이 함수로 next를 거른다.
// @MX:REASON: 세 사용처가 다른 규칙을 쓰면 한 곳이 열린 리디렉트가 된다. 규칙을 바꿀 때는 acceptance.md §3.3 표본 표와 safe-next.test.ts를 함께 바꾼다.
/**
 * 입력은 URLSearchParams가 한 번 디코딩한 값이다(더 디코딩하지 않는다).
 * 앱 안의 경로면 그대로, 아니면 null(부르는 쪽이 /reservations로 보낸다).
 */
export function safeNext(value: string | null, origin: string): string | null {
  if (!value || FORBIDDEN_CHARACTERS.test(value)) return null;
  let resolved: URL;
  try {
    resolved = new URL(value, origin);
  } catch {
    return null;
  }
  if (resolved.origin !== origin) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
